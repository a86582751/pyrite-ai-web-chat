import { Database } from 'bun:sqlite'
import { v4 as uuidv4 } from 'uuid'

interface Message {
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

interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface ModelConfig {
  id?: string
  provider: string
  name: string
  apiKey: string
  baseUrl?: string
  enabled: boolean
}

export class DatabaseManager {
  private db: any

  constructor() {
    this.db = new Database(':memory:')
  }
}

console.log('OK')
