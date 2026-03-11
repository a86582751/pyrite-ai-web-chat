import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { Message, Session, ModelConfig } from '../types'

export class DatabaseManager {
  private db: Database.Database

  constructor() {
    this.db = new Database('./data/chat.db')
    this.db.pragma('journal_mode = WAL')
  }

  init() {
    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_at INTEGER DEFAULT (unixepoch() * 1000),
        updated_at INTEGER DEFAULT (unixepoch() * 1000)
      )
    `)

    // Messages table (tree structure with parent_id)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        parent_id TEXT,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        model TEXT,
        branch_index INTEGER DEFAULT 0,
        attachments TEXT, -- JSON array of file paths
        created_at INTEGER DEFAULT (unixepoch() * 1000),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `)

    // Model configs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS model_configs (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        api_key TEXT,
        base_url TEXT,
        enabled INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (unixepoch() * 1000)
      )
    `)

    // MCP servers table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mcp_servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT DEFAULT 'sse',
        enabled INTEGER DEFAULT 1,
        config TEXT, -- JSON
        created_at INTEGER DEFAULT (unixepoch() * 1000)
      )
    `)

    // Create indexes
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)')
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id)')

    console.log('✅ Database initialized')
  }

  // Sessions
  createSession(title?: string): Session {
    const id = uuidv4()
    const now = Date.now()
    this.db.prepare('INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .run(id, title || 'New Chat', now, now)
    return { id, title: title || 'New Chat', createdAt: now, updatedAt: now }
  }

  getSessions(): Session[] {
    return this.db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all() as Session[]
  }

  getSession(id: string): Session | null {
    return this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | null
  }

  updateSession(id: string, title: string) {
    this.db.prepare('UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?')
      .run(title, Date.now(), id)
  }

  deleteSession(id: string) {
    this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
  }

  // Messages
  createMessage(data: Omit<Message, 'id' | 'createdAt'>): Message {
    const id = uuidv4()
    const now = Date.now()
    const attachments = data.attachments ? JSON.stringify(data.attachments) : null
    
    this.db.prepare(`
      INSERT INTO messages (id, session_id, parent_id, content, role, model, branch_index, attachments, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.sessionId, data.parentId || null, data.content, data.role, data.model || null, data.branchIndex || 0, attachments, now)

    // Update session timestamp
    this.db.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').run(now, data.sessionId)

    return { ...data, id, createdAt: now }
  }

  getMessagesBySession(sessionId: string): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as any[]
    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      parentId: row.parent_id,
      content: row.content,
      role: row.role,
      model: row.model,
      branchIndex: row.branch_index,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      createdAt: row.created_at
    }))
  }

  getMessage(id: string): Message | null {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      sessionId: row.session_id,
      parentId: row.parent_id,
      content: row.content,
      role: row.role,
      model: row.model,
      branchIndex: row.branch_index,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      createdAt: row.created_at
    }
  }

  getChildren(parentId: string): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE parent_id = ? ORDER BY branch_index ASC').all(parentId) as any[]
    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      parentId: row.parent_id,
      content: row.content,
      role: row.role,
      model: row.model,
      branchIndex: row.branch_index,
      attachments: row.attachments ? JSON.parse(row.attachments) : undefined,
      createdAt: row.created_at
    }))
  }

  getNextBranchIndex(parentId: string): number {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM messages WHERE parent_id = ?').get(parentId) as any
    return result.count
  }

  updateMessage(id: string, content: string) {
    this.db.prepare('UPDATE messages SET content = ? WHERE id = ?').run(content, id)
  }

  deleteMessage(id: string) {
    this.db.prepare('DELETE FROM messages WHERE id = ?').run(id)
  }

  // Model configs
  saveModelConfig(config: ModelConfig) {
    const id = config.id || uuidv4()
    this.db.prepare(`
      INSERT OR REPLACE INTO model_configs (id, provider, name, api_key, base_url, enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, config.provider, config.name, config.apiKey, config.baseUrl, config.enabled ? 1 : 0)
    return id
  }

  getModelConfigs(): ModelConfig[] {
    const rows = this.db.prepare('SELECT * FROM model_configs WHERE enabled = 1').all() as any[]
    return rows.map(row => ({
      id: row.id,
      provider: row.provider,
      name: row.name,
      apiKey: row.api_key,
      baseUrl: row.base_url,
      enabled: row.enabled === 1
    }))
  }

  getModelConfig(id: string): ModelConfig | null {
    const row = this.db.prepare('SELECT * FROM model_configs WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      provider: row.provider,
      name: row.name,
      apiKey: row.api_key,
      baseUrl: row.base_url,
      enabled: row.enabled === 1
    }
  }

  // MCP Servers
  createMcpServer(server: Omit<McpServer, 'id' | 'createdAt'>): McpServer {
    const id = uuidv4()
    const now = Date.now()
    const config = server.config ? JSON.stringify(server.config) : null
    
    this.db.prepare(`
      INSERT INTO mcp_servers (id, name, url, type, enabled, config, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, server.name, server.url, server.type || 'sse', server.enabled ? 1 : 0, config, now)

    return { ...server, id, createdAt: now }
  }

  getMcpServers(): McpServer[] {
    const rows = this.db.prepare('SELECT * FROM mcp_servers ORDER BY created_at DESC').all() as any[]
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      url: row.url,
      type: row.type,
      enabled: row.enabled === 1,
      config: row.config ? JSON.parse(row.config) : undefined,
      createdAt: row.created_at
    }))
  }

  getMcpServer(id: string): McpServer | null {
    const row = this.db.prepare('SELECT * FROM mcp_servers WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      type: row.type,
      enabled: row.enabled === 1,
      config: row.config ? JSON.parse(row.config) : undefined,
      createdAt: row.created_at
    }
  }

  updateMcpServer(id: string, updates: Partial<McpServer>) {
    const sets: string[] = []
    const values: any[] = []
    
    if (updates.name !== undefined) {
      sets.push('name = ?')
      values.push(updates.name)
    }
    if (updates.url !== undefined) {
      sets.push('url = ?')
      values.push(updates.url)
    }
    if (updates.enabled !== undefined) {
      sets.push('enabled = ?')
      values.push(updates.enabled ? 1 : 0)
    }
    if (updates.config !== undefined) {
      sets.push('config = ?')
      values.push(JSON.stringify(updates.config))
    }
    
    if (sets.length === 0) return
    
    values.push(id)
    this.db.prepare(`UPDATE mcp_servers SET ${sets.join(', ')} WHERE id = ?`).run(...values)
  }

  deleteMcpServer(id: string) {
    this.db.prepare('DELETE FROM mcp_servers WHERE id = ?').run(id)
  }
}

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
