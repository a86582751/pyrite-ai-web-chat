import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GlobalSettingsState {
  // Default assistant for new chats
  defaultAssistantId: string | null
  
  // Auto title generation
  autoTitleEnabled: boolean
  
  // Auto scroll to bottom on new message
  autoScrollEnabled: boolean
  
  // Auto expand reasoning content
  autoExpandReasoning: boolean
  
  // Show message outline in sidebar
  showMessageOutline: boolean
  
  // Update methods
  setDefaultAssistantId: (id: string | null) => void
  setAutoTitleEnabled: (enabled: boolean) => void
  setAutoScrollEnabled: (enabled: boolean) => void
  setAutoExpandReasoning: (enabled: boolean) => void
  setShowMessageOutline: (enabled: boolean) => void
}

export const useGlobalSettingsStore = create<GlobalSettingsState>()(
  persist(
    (set) => ({
      defaultAssistantId: null,
      autoTitleEnabled: true,
      autoScrollEnabled: true,
      autoExpandReasoning: false,
      showMessageOutline: false,
      
      setDefaultAssistantId: (id) => set({ defaultAssistantId: id }),
      setAutoTitleEnabled: (enabled) => set({ autoTitleEnabled: enabled }),
      setAutoScrollEnabled: (enabled) => set({ autoScrollEnabled: enabled }),
      setAutoExpandReasoning: (enabled) => set({ autoExpandReasoning: enabled }),
      setShowMessageOutline: (enabled) => set({ showMessageOutline: enabled }),
    }),
    {
      name: 'chat-tree-global-settings',
    }
  )
)
