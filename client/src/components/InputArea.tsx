import { useState, useRef, useCallback } from 'react'
import { Send, Square, Paperclip, ChevronDown, Settings, Plus } from 'lucide-react'
import { useModelStore } from '../store/models'
import { useMcpStore } from '../store/mcp'
import { uploadApi } from '../utils/api'
import { SettingsModal } from './SettingsModal'

interface InputAreaProps {
  onSend: (message: string, attachments?: string[]) => void
  onStop: () => void
  isStreaming: boolean
  selectedModel: string
  onModelChange: (model: string) => void
}

export function InputArea({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onModelChange,
}: InputAreaProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showMcpSelect, setShowMcpSelect] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { models } = useModelStore()
  const { servers, enabledServers, toggleServer } = useMcpStore()

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [])

  const handleSend = () => {
    if (!input.trim() && attachments.length === 0) return
    onSend(input, attachments)
    setInput('')
    setAttachments([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const result = await uploadApi.upload(file)
        if (result.url) {
          setAttachments(prev => [...prev, result.url])
        }
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a !== url))
  }

  // Group models by provider
  const groupedModels = Object.entries(models).reduce((acc, [provider, modelList]) => {
    acc[provider] = modelList.filter(m => m.configured !== false)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="border-t border-slate-800 bg-slate-900/50 p-4">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {attachments.map((url, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-sm"
            >
              <span className="truncate max-w-[150px] text-slate-300">
                {url.split('/').pop()}
              </span>
              <button
                onClick={() => removeAttachment(url)}
                className="text-slate-500 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelSelect(!showModelSelect)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <span className="truncate max-w-[100px] sm:max-w-[150px]">{selectedModel}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showModelSelect && (
            <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 max-h-80 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
              {Object.entries(groupedModels).map(([provider, modelList]) => (
                modelList.length > 0 && (
                  <div key={provider}>
                    <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">
                      {provider}
                    </div>
                    {modelList.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          onModelChange(model.id)
                          setShowModelSelect(false)
                        }}
                        className={`
                          w-full px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors
                          ${selectedModel === model.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300'}
                        `}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* MCP selector */}
        <div className="relative">
          <button
            onClick={() => setShowMcpSelect(!showMcpSelect)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
              ${enabledServers.length > 0 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }
            `}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">MCP ({enabledServers.length})</span>
            <span className="sm:hidden">({enabledServers.length})</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showMcpSelect && (
            <div className="absolute bottom-full left-0 mb-2 w-56 sm:w-64 max-h-80 overflow-y-auto bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
              <div className="p-2 border-b border-slate-700">
                <button
                  onClick={() => {
                    setShowMcpSelect(false)
                    setShowSettings(true)
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 rounded"
                >
                  <Plus className="w-4 h-4" />
                  管理 MCP 服务器
                </button>
              </div>
              {servers.length === 0 ? (
                <div className="px-3 py-4 text-sm text-slate-500 text-center">
                  暂无 MCP 服务器
                </div>
              ) : (
                servers.map((server) => (
                  <label
                    key={server.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabledServers.includes(server.id)}
                      onChange={() => toggleServer(server.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-300 truncate">{server.name}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Settings button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="设置"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>

      {/* Input area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            adjustHeight()
          }}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          disabled={isStreaming}
          className="w-full px-4 py-3 pr-12 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none min-h-[56px] max-h-[200px]"
          rows={1}
        />
        
        <button
          onClick={isStreaming ? onStop : handleSend}
          disabled={!isStreaming && !input.trim() && attachments.length === 0}
          className={`
            absolute right-2 bottom-2 p-2 rounded-lg transition-all
            ${isStreaming
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }
          `}
        >
          {isStreaming ? (
            <Square className="w-4 h-4" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Click outside to close dropdowns */}
      {(showModelSelect || showMcpSelect) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowModelSelect(false)
            setShowMcpSelect(false)
          }}
        />
      )}
    </div>
  )
}
