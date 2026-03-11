import { useAuthStore } from '../store/auth'

const API_BASE = '' // Uses Vite proxy

export function getHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options?.headers,
    },
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

export async function login(password: string): Promise<{ token: string }> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  
  if (!response.ok) {
    throw new Error('Invalid password')
  }
  
  return response.json()
}

// Sessions
export const sessionsApi = {
  list: () => fetchApi<Session[]>('/api/chat/sessions'),
  create: (title?: string) => fetchApi<Session>('/api/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ title }),
  }),
  getMessages: (id: string) => fetchApi<any[]>(`/api/chat/sessions/${id}/messages`),
  update: (id: string, title: string) => fetchApi<void>(`/api/chat/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  }),
  delete: (id: string) => fetchApi<void>(`/api/chat/sessions/${id}`, {
    method: 'DELETE',
  }),
}

// Chat
export const chatApi = {
  send: (data: {
    message: string
    sessionId?: string
    parentId?: string
    model: string
    attachments?: string[]
  }) => {
    return fetch(`${API_BASE}/api/chat/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    })
  },
  regenerate: (messageId: string, model: string) => {
    return fetch(`${API_BASE}/api/chat/regenerate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ messageId, model }),
    })
  },
}

// Models
export const modelsApi = {
  list: () => fetchApi<Record<string, any[]>>('/api/models'),
  configs: () => fetchApi<any[]>('/api/models/configs'),
  saveConfig: (config: any) => fetchApi<{ id: string }>('/api/models/configs', {
    method: 'POST',
    body: JSON.stringify(config),
  }),
}

// Upload
export const uploadApi = {
  upload: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    return response.json()
  },
}

import type { Session } from '../types'
