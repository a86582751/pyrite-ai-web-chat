import { useState, useEffect } from 'react'
import { Login } from './components/Login'
import { ChatLayout } from './components/ChatLayout'
import { useAuthStore } from './store/auth'

function App() {
  const { token, setToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token
    const stored = localStorage.getItem('chat_token')
    if (stored) {
      setToken(stored)
    }
    setIsLoading(false)
  }, [setToken])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!token) {
    return <Login />
  }

  return <ChatLayout />
}

export default App
