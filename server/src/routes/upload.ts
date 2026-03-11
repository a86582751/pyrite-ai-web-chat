import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { lookup } from 'mime-types'

const UPLOAD_DIR = './uploads'

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

export const uploadRoutes = new Hono()

// Upload file
uploadRoutes.post('/', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return c.json({ error: 'File too large (max 10MB)' }, 413)
  }
  
  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin'
  const filename = `${uuidv4()}.${ext}`
  const filepath = `${UPLOAD_DIR}/${filename}`
  
  // Save file
  const buffer = await file.arrayBuffer()
  await Bun.write(filepath, buffer)
  
  const mimeType = lookup(file.name) || 'application/octet-stream'
  
  return c.json({
    success: true,
    filename: file.name,
    url: `/files/${filename}`,
    mimeType,
    size: file.size
  })
})

// Get file info
uploadRoutes.get('/info/:filename', (c) => {
  const filename = c.req.param('filename')
  const mimeType = lookup(filename) || 'application/octet-stream'
  
  return c.json({
    filename,
    mimeType
  })
})
