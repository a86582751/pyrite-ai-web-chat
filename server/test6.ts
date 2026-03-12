import { Database } from 'bun:sqlite'
import { v4 as uuidv4 } from 'uuid'
import type { Message, Session, ModelConfig } from './src/types'

interface McpServer {
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

export class DatabaseManager {
  private db: any

  constructor() {
    this.db = new Database(':memory:')
  }
  
  createMcpServer(server: Omit<McpServer, 'id' | 'createdAt'>): McpServer {
    return { ...server, id: 'test', createdAt: Date.now() }
  }
}

console.log('OK')
