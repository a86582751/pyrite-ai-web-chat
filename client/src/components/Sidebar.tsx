import { useState } from 'react'
import { Plus, Trash2, MessageSquare, Settings, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { GlobalSettingsModal } from './GlobalSettingsModal'
import type { Session } from '../types'

interface SidebarProps {
  sessions: Session[]
  currentSession: Session | null
  onSelectSession: (session: Session) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onClose?: () => void
  onOpenSettings?: () => void
}

export function Sidebar({
  sessions,
  currentSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose,
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showGlobalSettings, setShowGlobalSettings] = useState(false)
  const { logout } = useAuthStore()

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDelete = (id: string) => {
    if (deleteConfirm === id) {
      onDeleteSession(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          onClick={onNewSession}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          新对话
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session)}
            className={`
              group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all
              ${currentSession?.id === session.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }
            `}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {session.title}
              </div>
              <div className="text-xs text-slate-500">
                {formatDate(session.updatedAt)}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(session.id)
              }}
              className={`
                opacity-0 group-hover:opacity-100 transition-opacity
                p-1.5 rounded hover:bg-red-500/20 hover:text-red-400
                ${deleteConfirm === session.id ? 'opacity-100 text-red-400' : ''}
              `}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            还没有对话
          </div>
        )}
      </div>

      <GlobalSettingsModal isOpen={showGlobalSettings} onClose={() => setShowGlobalSettings(false)} />
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => setShowGlobalSettings(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          设置
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>
    </div>
  )
}
