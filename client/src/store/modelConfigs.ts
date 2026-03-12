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
  addConfig: (config: Omit<ModelConfig, 'id'>) => void
  removeConfig: (id: string) => void
  updateConfig: (id: string, updates: Partial<ModelConfig>) => void
  getEnabledConfigs: () => ModelConfig[]
}

export const useModelConfigStore = create<ModelConfigState>()(
  persist(
    (set, get) => ({
      configs: [],
      
      addConfig: (config) => {
        const newConfig: ModelConfig = {
          ...config,
          id: crypto.randomUUID(),
        }
        set({ configs: [...get().configs, newConfig] })
      },
      
      removeConfig: (id) => {
        set({ configs: get().configs.filter(c => c.id !== id) })
      },
      
      updateConfig: (id, updates) => {
        set({
          configs: get().configs.map(c =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },
      
      getEnabledConfigs: () => {
        return get().configs.filter(c => c.enabled)
      },
    }),
    {
      name: 'chat-tree-model-configs',
    }
  )
)
