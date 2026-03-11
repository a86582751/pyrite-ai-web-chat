import type { MiddlewareHandler } from 'hono'

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  // Skip auth for login and health
  if (c.req.path === '/login' || c.req.path === '/health') {
    return await next()
  }

  const auth = c.req.header('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = auth.replace('Bearer ', '')
  const password = process.env.CHAT_PASSWORD || 'a86582751'
  
  if (token !== password) {
    return c.json({ error: 'Invalid token' }, 401)
  }

  await next()
}
