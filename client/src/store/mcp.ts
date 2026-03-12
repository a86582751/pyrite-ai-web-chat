import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface McpServer {
  id: string
  name: string
  url: string
  type: 'sse'
  enabled: boolean
  config?: {
    headers?: Record<string, string>
  }
  createdAt: number
}

interface McpState {
  servers: McpServer[]
  enabledServers: string[]
  isLoaded: boolean
  addServer: (server: Omit<McpServer, 'id' | 'createdAt'>) => Promise<void>
  removeServer: (id: string) => Promise<void>
  updateServer: (id: string, updates: Partial<McpServer>) => Promise<void>
  toggleServer: (id: string) => void
  loadServers: () => Promise<void>
}

// API functions
const fetchServers = async (): Promise<McpServer[]> => {
  const token = localStorage.getItem('chat_token')
  const response = await fetch('/api/mcp/servers', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error('Failed to fetch servers')
  return response.json()
}

const saveServerApi = async (server: Omit<McpServer, 'id' | 'createdAt'>): Promise<string> => {
  const token = localStorage.getItem('chat_token')
  const response = await fetch('/api/mcp/servers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(server),
  })
  if (!response.ok) throw new Error('Failed to save server')
  const data = await response.json()
  return data.id
}

const deleteServerApi = async (id: string): Promise<void> => {
  const token = localStorage.getItem('chat_token')
  await fetch(`/api/mcp/servers/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
}

export const useMcpStore = create<McpState>()(
  persist(
    (set, get) => ({
      servers: [],
      enabledServers: [],
      isLoaded: false,
      
      loadServers: async () => {
        try {
          const servers = await fetchServers()
          set({ 
            servers, 
            enabledServers: servers.filter(s => s.enabled).map(s => s.id),
            isLoaded: true 
          })
        } catch (error) {
          console.error('Failed to load servers:', error)
          set({ isLoaded: true })
        }
      },
      
      addServer: async (server) => {
        const id = await saveServerApi(server)
        const newServer: McpServer = { 
          ...server, 
          id, 
          createdAt: Date.now(),
        }
        set({ 
          servers: [...get().servers, newServer],
          enabledServers: server.enabled ? [...get().enabledServers, id] : get().enabledServers,
        })
      },
      
      removeServer: async (id) => {
        await deleteServerApi(id)
        set({
          servers: get().servers.filter(s => s.id !== id),
          enabledServers: get().enabledServers.filter(sid => sid !== id),
        })
      },
      
      updateServer: async (id, updates) => {
        const server = get().servers.find(s => s.id === id)
        if (server) {
          const updated = { ...server, ...updates }
          await saveServerApi(updated)
          set({
            servers: get().servers.map(s =>
              s.id === id ? updated : s
            ),
          })
        }
      },
      
      toggleServer: (id) => {
        const { enabledServers } = get()
        if (enabledServers.includes(id)) {
          set({ enabledServers: enabledServers.filter(sid => sid !== id) })
        } else {
          set({ enabledServers: [...enabledServers, id] })
        }
      },
    }),
    {
      name: 'chat-tree-mcp',
      // Only persist enabledServers and isLoaded, not servers (loaded from server)
      partialize: (state) => ({ enabledServers: state.enabledServers, isLoaded: state.isLoaded }),
    }
  )
)
