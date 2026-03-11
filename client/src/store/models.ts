import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Model {
  id: string
  name: string
  group: string
  configured?: boolean
}

interface ModelState {
  models: Record<string, Model[]>
  selectedModels: string[]
  setModels: (models: Record<string, Model[]>) => void
  toggleModel: (modelId: string) => void
  selectModel: (modelId: string) => void
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: {},
      selectedModels: ['gpt-5'],
      
      setModels: (models) => set({ models }),
      
      toggleModel: (modelId) => {
        const { selectedModels } = get()
        if (selectedModels.includes(modelId)) {
          set({ selectedModels: selectedModels.filter(id => id !== modelId) })
        } else {
          set({ selectedModels: [...selectedModels, modelId] })
        }
      },
      
      selectModel: (modelId) => {
        set({ selectedModels: [modelId] })
      },
    }),
    {
      name: 'chat-tree-models',
    }
  )
)
