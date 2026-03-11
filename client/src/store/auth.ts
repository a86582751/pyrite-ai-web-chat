import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  setToken: (token) => {
    localStorage.setItem('chat_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('chat_token')
    set({ token: null })
  },
}))
