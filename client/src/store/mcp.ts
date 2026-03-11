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
  addServer: (server: Omit<McpServer, 'id' | 'createdAt'>) => void
  removeServer: (id: string) => void
  updateServer: (id: string, updates: Partial<McpServer>) => void
  toggleServer: (id: string) => void
  setServers: (servers: McpServer[]) => void
}

export const useMcpStore = create<McpState>()(
  persist(
    (set, get) => ({
      servers: [],
      enabledServers: [],
      
      addServer: (server) => {
        const newServer: McpServer = {
          ...server,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }
        set({ servers: [...get().servers, newServer] })
      },
      
      removeServer: (id) => {
        set({
          servers: get().servers.filter(s => s.id !== id),
          enabledServers: get().enabledServers.filter(sid => sid !== id),
        })
      },
      
      updateServer: (id, updates) => {
        set({
          servers: get().servers.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })
      },
      
      toggleServer: (id) => {
        const { enabledServers } = get()
        if (enabledServers.includes(id)) {
          set({ enabledServers: enabledServers.filter(sid => sid !== id) })
        } else {
          set({ enabledServers: [...enabledServers, id] })
        }
      },
      
      setServers: (servers) => set({ servers }),
    }),
    {
      name: 'chat-tree-mcp',
    }
  )
)
