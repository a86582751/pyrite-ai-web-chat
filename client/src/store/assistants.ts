import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Assistant {
  id: string
  name: string
  systemPrompt: string
  defaultModel: string
  defaultProvider: string
  streamEnabled: boolean
  contextLength: number | null // null = unlimited
  temperature: number
  maxOutputTokens: number
  createdAt: number
}

interface AssistantState {
  assistants: Assistant[]
  defaultAssistantId: string | null
  addAssistant: (assistant: Omit<Assistant, 'id' | 'createdAt'>) => void
  removeAssistant: (id: string) => void
  updateAssistant: (id: string, updates: Partial<Assistant>) => void
  setDefaultAssistant: (id: string | null) => void
  getDefaultAssistant: () => Assistant | null
}

// Default assistant template

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: [],
      defaultAssistantId: null,
      
      addAssistant: (assistant) => {
        const newAssistant: Assistant = {
          ...assistant,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }
        set({ assistants: [...get().assistants, newAssistant] })
        // If first assistant, set as default
        if (get().assistants.length === 0) {
          set({ defaultAssistantId: newAssistant.id })
        }
      },
      
      removeAssistant: (id) => {
        const { assistants, defaultAssistantId } = get()
        const filtered = assistants.filter(a => a.id !== id)
        set({ 
          assistants: filtered,
          defaultAssistantId: defaultAssistantId === id 
            ? (filtered[0]?.id || null) 
            : defaultAssistantId
        })
      },
      
      updateAssistant: (id, updates) => {
        set({
          assistants: get().assistants.map(a =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })
      },
      
      setDefaultAssistant: (id) => {
        set({ defaultAssistantId: id })
      },
      
      getDefaultAssistant: () => {
        const { assistants, defaultAssistantId } = get()
        if (defaultAssistantId) {
          return assistants.find(a => a.id === defaultAssistantId) || assistants[0] || null
        }
        return assistants[0] || null
      },
    }),
    {
      name: 'chat-tree-assistants',
    }
  )
)
