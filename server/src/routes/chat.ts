import { Hono } from 'hono'
import { DatabaseManager } from '../db'
import { streamSSE } from 'hono/streaming'

const db = new DatabaseManager()
export const chatRoutes = new Hono()

// Get all sessions
chatRoutes.get('/sessions', (c) => {
  const sessions = db.getSessions()
  return c.json(sessions)
})

// Create new session
chatRoutes.post('/sessions', async (c) => {
  const { title } = await c.req.json()
  const session = db.createSession(title)
  return c.json(session)
})

// Get session messages (tree structure)
chatRoutes.get('/sessions/:id/messages', (c) => {
  const sessionId = c.req.param('id')
  const messages = db.getMessagesBySession(sessionId)
  
  // Build tree structure
  const messageMap = new Map()
  const roots: any[] = []
  
  messages.forEach(msg => {
    messageMap.set(msg.id, { ...msg, children: [] })
  })
  
  messages.forEach(msg => {
    const node = messageMap.get(msg.id)
    if (msg.parentId && messageMap.has(msg.parentId)) {
      const parent = messageMap.get(msg.parentId)
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })
  
  return c.json(roots)
})

// Update session title
chatRoutes.patch('/sessions/:id', async (c) => {
  const sessionId = c.req.param('id')
  const { title } = await c.req.json()
  db.updateSession(sessionId, title)
  return c.json({ success: true })
})

// Delete session
chatRoutes.delete('/sessions/:id', (c) => {
  const sessionId = c.req.param('id')
  db.deleteSession(sessionId)
  return c.json({ success: true })
})

// Send message and stream response
chatRoutes.post('/send', async (c) => {
  const { message, sessionId, parentId, model, attachments } = await c.req.json()
  
  // Create or use session
  let session = sessionId ? db.getSession(sessionId) : null
  if (!session) {
    session = db.createSession(message.slice(0, 50))
  }
  
  // Save user message
  const userMsg = db.createMessage({
    sessionId: session.id,
    parentId,
    content: message,
    role: 'user',
    branchIndex: parentId ? db.getNextBranchIndex(parentId) : 0,
    attachments
  })
  
  // Get conversation history for context
  const history = buildConversationHistory(parentId || null, session.id)
  
  return streamSSE(c, async (stream) => {
    // Create placeholder assistant message
    const branchIndex = db.getNextBranchIndex(userMsg.id)
    const assistantMsg = db.createMessage({
      sessionId: session!.id,
      parentId: userMsg.id,
      content: '',
      role: 'assistant',
      model,
      branchIndex
    })
    
    let fullContent = ''
    
    try {
      // Call LLM API
      const response = await callLLM(model, message, history, attachments)
      
      for await (const chunk of response) {
        fullContent += chunk
        await stream.writeSSE({
          data: JSON.stringify({ 
            content: chunk, 
            done: false,
            messageId: assistantMsg.id 
          })
        })
      }
      
      // Update message with full content
      db.updateMessage(assistantMsg.id, fullContent)
      
      await stream.writeSSE({
        data: JSON.stringify({ 
          content: '', 
          done: true,
          messageId: assistantMsg.id,
          sessionId: session!.id,
          userMessageId: userMsg.id
        })
      })
    } catch (error) {
      console.error('LLM error:', error)
      await stream.writeSSE({
        data: JSON.stringify({ 
          error: 'Failed to get response',
          done: true 
        })
      })
    }
  })
})

// Regenerate message (create new branch)
chatRoutes.post('/regenerate', async (c) => {
  const { messageId, model } = await c.req.json()
  
  const originalMsg = db.getMessage(messageId)
  if (!originalMsg) {
    return c.json({ error: 'Message not found' }, 404)
  }
  
  // Get parent (user message)
  const parentMsg = originalMsg.parentId ? db.getMessage(originalMsg.parentId) : null
  if (!parentMsg) {
    return c.json({ error: 'Cannot regenerate root message' }, 400)
  }
  
  const branchIndex = db.getNextBranchIndex(parentMsg.id)
  
  return streamSSE(c, async (stream) => {
    const assistantMsg = db.createMessage({
      sessionId: originalMsg.sessionId,
      parentId: parentMsg.id,
      content: '',
      role: 'assistant',
      model,
      branchIndex
    })
    
    const history = buildConversationHistory(parentMsg.parentId || null, originalMsg.sessionId)
    let fullContent = ''
    
    try {
      const response = await callLLM(model, parentMsg.content, history, parentMsg.attachments)
      
      for await (const chunk of response) {
        fullContent += chunk
        await stream.writeSSE({
          data: JSON.stringify({ 
            content: chunk, 
            done: false,
            messageId: assistantMsg.id 
          })
        })
      }
      
      db.updateMessage(assistantMsg.id, fullContent)
      
      await stream.writeSSE({
        data: JSON.stringify({ 
          content: '', 
          done: true,
          messageId: assistantMsg.id,
          branchIndex
        })
      })
    } catch (error) {
      console.error('LLM error:', error)
      await stream.writeSSE({
        data: JSON.stringify({ 
          error: 'Failed to get response',
          done: true 
        })
      })
    }
  })
})

// Build conversation history from tree
function buildConversationHistory(fromMessageId: string | null, sessionId: string): any[] {
  const messages = db.getMessagesBySession(sessionId)
  const history: any[] = []
  
  // Build parent chain
  const messageMap = new Map(messages.map(m => [m.id, m]))
  let currentId: string | null = fromMessageId
  const chain: any[] = []
  
  while (currentId) {
    const msg = messageMap.get(currentId)
    if (!msg) break
    chain.unshift(msg)
    currentId = msg.parentId || null
  }
  
  return chain.map(m => ({
    role: m.role,
    content: m.content
  }))
}

// Call LLM API
async function* callLLM(model: string, message: string, history: any[], attachments?: string[]): AsyncGenerator<string> {
  // Get model config
  const modelConfigs = db.getModelConfigs()
  const modelConfig = modelConfigs.find(m => m.name === model)
  
  if (!modelConfig) {
    // Try to use default OpenAI-compatible endpoint
    const apiKey = process.env.OPENAI_API_KEY
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    
    const messages = [
      ...history,
      { role: 'user', content: message }
    ]
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  } else {
    // Use configured model
    const messages = [
      ...history,
      { role: 'user', content: message }
    ]
    
    const response = await fetch(`${modelConfig.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${modelConfig.apiKey}`
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages,
        stream: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              yield content
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}
