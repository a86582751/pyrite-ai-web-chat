import { Database } from 'bun:sqlite'
import { v4 as uuidv4 } from 'uuid'
import type { Message, Session, ModelConfig } from './src/types'

export class DatabaseManager {
  private db: any

  constructor() {
    this.db = new Database(':memory:')
  }
}

console.log('OK')
