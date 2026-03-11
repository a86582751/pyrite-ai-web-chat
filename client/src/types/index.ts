export interface Message {
  id: string
  sessionId: string
  parentId?: string | null
  content: string
  role: 'user' | 'assistant'
  model?: string
  branchIndex: number
  attachments?: string[]
  createdAt: number
  children?: Message[]
}

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface Model {
  id: string
  name: string
  group: string
  configured?: boolean
}

export interface ModelGroup {
  [provider: string]: Model[]
}

export interface ChatRequest {
  message: string
  sessionId?: string
  parentId?: string
  model: string
  attachments?: string[]
}
