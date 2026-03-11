import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
      '/mcp': 'http://localhost:3333',
      '/upload': 'http://localhost:3333',
      '/files': 'http://localhost:3333'
    }
  },
  build: {
    outDir: '../server/public'
  }
})
