import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { sessionsApi } from '../utils/api'
import type { Session, Message } from '../types'

export function ChatLayout() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load sessions
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await sessionsApi.list()
      setSessions(data)
      if (data.length > 0 && !currentSession) {
        setCurrentSession(data[0])
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  // Load messages when session changes
  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession.id)
    }
  }, [currentSession])

  const loadMessages = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const data = await sessionsApi.getMessages(sessionId)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewSession = async () => {
    try {
      const session = await sessionsApi.create()
      setSessions(prev => [session, ...prev])
      setCurrentSession(session)
      setMessages([])
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleDeleteSession = async (id: string) => {
    try {
      await sessionsApi.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentSession?.id === id) {
        setCurrentSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleMessagesUpdate = (newMessages: Message[]) => {
    setMessages(newMessages)
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onSelectSession={setCurrentSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
      <ChatArea
        session={currentSession}
        messages={messages}
        isLoading={isLoading}
        onMessagesUpdate={handleMessagesUpdate}
      />
    </div>
  )
}
