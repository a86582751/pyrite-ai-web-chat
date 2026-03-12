import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { DatabaseManager } from './db'
import { authMiddleware } from './middleware/auth'
import { chatRoutes } from './routes/chat'
import { mcpRoutes } from './routes/mcp'
import { uploadRoutes } from './routes/upload'
import { modelRoutes } from './routes/models'

const app = new Hono()

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

// Static files (uploaded files)
app.use('/files/*', serveStatic({ root: './uploads' }))

// Auth middleware for API routes
app.use('/api/*', authMiddleware)

// Routes
app.route('/api/chat', chatRoutes)
app.route('/api/models', modelRoutes)
app.route('/api/mcp', mcpRoutes)
app.route('/upload', uploadRoutes)

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// Login endpoint (no auth required)
app.post('/login', async (c) => {
  const { password } = await c.req.json()
  if (password === process.env.CHAT_PASSWORD || password === 'a86582751') {
    return c.json({ token: 'a86582751', success: true })
  }
  return c.json({ error: 'Invalid password' }, 401)
})

// Initialize database
const db = new DatabaseManager()
db.init()

const PORT = process.env.PORT || 3333

console.log(`🚀 Server running on http://localhost:${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch
}
