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
}

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

export interface ModelConfig {
  id?: string
  provider: string
  name: string
  apiKey: string
  baseUrl?: string
  enabled: boolean
}

export interface ChatRequest {
  message: string
  sessionId?: string
  parentId?: string
  model: string
  attachments?: string[]
}

export interface StreamChunk {
  content: string
  done: boolean
}
