import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { ChatArea } from './ChatArea'
import { SettingsModal } from './SettingsModal'
import { sessionsApi } from '../utils/api'
import type { Session, Message } from '../types'

export function ChatLayout() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

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
    try {
      const data = await sessionsApi.getMessages(sessionId)
      setMessages(data)
    } catch (error) {
      console.error('Failed to load messages:', error)
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

  const [showSidebar, setShowSidebar] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-950 overflow-hidden">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar
          sessions={sessions}
          currentSession={currentSession}
          onSelectSession={(session) => {
            setCurrentSession(session)
            setShowSidebar(false)
          }}
          onNewSession={() => {
            handleNewSession()
            setShowSidebar(false)
          }}
          onDeleteSession={handleDeleteSession}
          onClose={() => setShowSidebar(false)}
          onOpenSettings={() => {
            setShowSettings(true)
            setShowSidebar(false)
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          session={currentSession}
          messages={messages}
          onMessagesUpdate={handleMessagesUpdate}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
        />
      </div>
    </div>
  )
}
