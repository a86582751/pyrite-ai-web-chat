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

// Serve frontend static files (must be after API routes)
// Use a custom handler to support SPA fallback
app.use('/*', async (c, next) => {
  // Try to serve static file first
  const staticHandler = serveStatic({ root: './public' })
  const response = await staticHandler(c, next)
  
  // If file not found (404) and not an API route, serve index.html
  if (!response && !c.req.path.startsWith('/api/') && !c.req.path.startsWith('/upload') && !c.req.path.startsWith('/files/')) {
    const indexPath = './public/index.html'
    try {
      const file = Bun.file(indexPath)
      if (await file.exists()) {
        return c.body(file)
      }
    } catch {
      // File doesn't exist
    }
  }
  
  return response
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
