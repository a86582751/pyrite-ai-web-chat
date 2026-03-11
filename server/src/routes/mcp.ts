import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { DatabaseManager } from '../db'

const db = new DatabaseManager()
export const mcpRoutes = new Hono()

// Get all MCP servers
mcpRoutes.get('/servers', (c) => {
  const servers = db.getMcpServers()
  return c.json(servers)
})

// Create MCP server
mcpRoutes.post('/servers', async (c) => {
  const server = await c.req.json()
  const created = db.createMcpServer(server)
  return c.json(created)
})

// Update MCP server
mcpRoutes.patch('/servers/:id', async (c) => {
  const id = c.req.param('id')
  const updates = await c.req.json()
  db.updateMcpServer(id, updates)
  return c.json({ success: true })
})

// Delete MCP server
mcpRoutes.delete('/servers/:id', (c) => {
  const id = c.req.param('id')
  db.deleteMcpServer(id)
  return c.json({ success: true })
})

// SSE endpoint for a specific MCP server
mcpRoutes.get('/sse/:id', async (c) => {
  const id = c.req.param('id')
  const server = db.getMcpServer(id)
  
  if (!server || !server.enabled) {
    return c.json({ error: 'Server not found or disabled' }, 404)
  }

  return streamSSE(c, async (stream) => {
    // Connect to upstream MCP server
    try {
      const upstreamRes = await fetch(server.url)
      if (!upstreamRes.ok) {
        await stream.writeSSE({
          event: 'error',
          data: 'Failed to connect to upstream server'
        })
        return
      }

      // Forward SSE events from upstream
      const reader = upstreamRes.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        await stream.writeSSE({ data: chunk })
      }
    } catch (error) {
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ error: 'Connection failed' })
      })
    }
  })
})

// Message endpoint for MCP
mcpRoutes.post('/message/:id', async (c) => {
  const id = c.req.param('id')
  const server = db.getMcpServer(id)
  
  if (!server || !server.enabled) {
    return c.json({ error: 'Server not found or disabled' }, 404)
  }

  const body = await c.req.json()
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...server.config?.headers
    }
    
    const response = await fetch(`${server.url}/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    
    const result = await response.json()
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to forward message' }, 502)
  }
})

// Built-in web_search MCP (fallback)
mcpRoutes.get('/builtin/sse', (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      event: 'endpoint',
      data: '/mcp/builtin/message'
    })
    
    while (true) {
      await stream.writeSSE({
        event: 'ping',
        data: ''
      })
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
  })
})

mcpRoutes.post('/builtin/message', async (c) => {
  const body = await c.req.json()
  
  if (body.method === 'initialize') {
    return c.json({
      jsonrpc: '2.0',
      id: body.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'chat-tree-builtin',
          version: '1.0.0'
        }
      }
    })
  }
  
  if (body.method === 'tools/list') {
    return c.json({
      jsonrpc: '2.0',
      id: body.id,
      result: {
        tools: [
          {
            name: 'web_search',
            description: 'Search the web using SearXNG',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' }
              },
              required: ['query']
            }
          }
        ]
      }
    })
  }
  
  if (body.method === 'tools/call') {
    const { name, arguments: args } = body.params
    
    if (name === 'web_search') {
      try {
        const response = await fetch(`http://localhost:8080/search?q=${encodeURIComponent(args.query)}&format=json`)
        const data = await response.json()
        
        const results = data.results?.slice(0, 5).map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content
        })) || []
        
        return c.json({
          jsonrpc: '2.0',
          id: body.id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
          }
        })
      } catch (error) {
        return c.json({
          jsonrpc: '2.0',
          id: body.id,
          error: { code: -32603, message: 'Search failed' }
        })
      }
    }
  }
  
  return c.json({
    jsonrpc: '2.0',
    id: body.id,
    error: { code: -32601, message: 'Method not found' }
  })
})
