import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ModelConfig {
  id: string
  provider: string
  name: string
  apiKey: string
  baseUrl?: string
  enabled: boolean
}

interface ModelConfigState {
  configs: ModelConfig[]
  isLoaded: boolean
  addConfig: (config: Omit<ModelConfig, 'id'>) => Promise<void>
  removeConfig: (id: string) => Promise<void>
  updateConfig: (id: string, updates: Partial<ModelConfig>) => Promise<void>
  loadConfigs: () => Promise<void>
  getEnabledConfigs: () => ModelConfig[]
}

// API functions
const fetchConfigs = async (): Promise<ModelConfig[]> => {
  const token = localStorage.getItem('chat_token')
  const response = await fetch('/api/models/configs', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!response.ok) throw new Error('Failed to fetch configs')
  return response.json()
}

const saveConfigApi = async (config: Omit<ModelConfig, 'id'>): Promise<string> => {
  const token = localStorage.getItem('chat_token')
  const response = await fetch('/api/models/configs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  })
  if (!response.ok) throw new Error('Failed to save config')
  const data = await response.json()
  return data.id
}

const deleteConfigApi = async (id: string): Promise<void> => {
  const token = localStorage.getItem('chat_token')
  await fetch(`/api/models/configs/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
}

export const useModelConfigStore = create<ModelConfigState>()(
  persist(
    (set, get) => ({
      configs: [],
      isLoaded: false,
      
      loadConfigs: async () => {
        try {
          const configs = await fetchConfigs()
          set({ configs, isLoaded: true })
        } catch (error) {
          console.error('Failed to load configs:', error)
          set({ isLoaded: true })
        }
      },
      
      addConfig: async (config) => {
        const id = await saveConfigApi(config)
        const newConfig: ModelConfig = { ...config, id }
        set({ configs: [...get().configs, newConfig] })
      },
      
      removeConfig: async (id) => {
        await deleteConfigApi(id)
        set({ configs: get().configs.filter(c => c.id !== id) })
      },
      
      updateConfig: async (id, updates) => {
        const config = get().configs.find(c => c.id === id)
        if (config) {
          const updated = { ...config, ...updates }
          await saveConfigApi(updated)
          set({
            configs: get().configs.map(c =>
              c.id === id ? updated : c
            ),
          })
        }
      },
      
      getEnabledConfigs: () => {
        return get().configs.filter(c => c.enabled)
      },
    }),
    {
      name: 'chat-tree-model-configs',
      // Only persist isLoaded, not configs (loaded from server)
      partialize: (state) => ({ isLoaded: state.isLoaded }),
    }
  )
)
