import { useState, useRef, useEffect } from 'react'
import { MessageTree } from './MessageTree'
import { InputArea } from './InputArea'
import { chatApi, sessionsApi } from '../utils/api'
import type { Session, Message } from '../types'

interface ChatAreaProps {
  session: Session | null
  messages: Message[]
  onMessagesUpdate: (messages: Message[]) => void
  onToggleSidebar: () => void
}

export function ChatArea({ session, messages, onMessagesUpdate, onToggleSidebar }: ChatAreaProps) {
  const [selectedModel, setSelectedModel] = useState('gpt-5')
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleSend = async (content: string, attachments?: string[]) => {
    if (!content.trim() || isStreaming) return

    setIsStreaming(true)
    setStreamingContent({})

    // Find the last user message to use as parent
    const lastMessage = messages.length > 0 
      ? findLastLeaf(messages[0]) 
      : null

    try {
      abortControllerRef.current = new AbortController()
      
      const response = await chatApi.send({
        message: content,
        sessionId: session?.id,
        parentId: lastMessage?.id,
        model: selectedModel,
        attachments,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let currentMessageId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }

              if (data.messageId) {
                currentMessageId = data.messageId
              }

              if (data.content && currentMessageId) {
                setStreamingContent(prev => ({
                  ...prev,
                  [currentMessageId!]: (prev[currentMessageId!] || '') + data.content
                }))
              }

              if (data.done) {
                // Refresh messages to get the complete tree
                if (data.sessionId) {
                  const updatedMessages = await sessionsApi.getMessages(data.sessionId)
                  onMessagesUpdate(updatedMessages)
                }
                setStreamingContent({})
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleRegenerate = async (messageId: string) => {
    if (isStreaming) return

    setIsStreaming(true)
    setStreamingContent({})

    try {
      abortControllerRef.current = new AbortController()
      
      const response = await chatApi.regenerate(messageId, selectedModel)

      if (!response.ok) {
        throw new Error('Failed to regenerate')
      }

      const reader = response.body?.getReader()
      if (!reader) return

      const decoder = new TextDecoder()
      let currentMessageId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.error)
              }

              if (data.messageId) {
                currentMessageId = data.messageId
              }

              if (data.content && currentMessageId) {
                setStreamingContent(prev => ({
                  ...prev,
                  [currentMessageId!]: (prev[currentMessageId!] || '') + data.content
                }))
              }

              if (data.done && session) {
                const updatedMessages = await sessionsApi.getMessages(session.id)
                onMessagesUpdate(updatedMessages)
                setStreamingContent({})
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Regenerate error:', error)
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="text-center px-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🌳</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Chat Tree</h2>
          <p className="text-slate-400">选择一个对话或创建新对话</p>
          <button
            onClick={onToggleSidebar}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg lg:hidden"
          >
            打开侧边栏
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 min-h-0">
      {/* Header */}
      <div className="h-14 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="font-medium text-white truncate text-sm sm:text-base">{session.title}</h2>
        </div>
        <div className="text-xs sm:text-sm text-slate-400 shrink-0">
          {messages.length > 0 ? countMessages(messages[0]) : 0} 条
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0">
        <MessageTree
          messages={messages}
          streamingContent={streamingContent}
          onRegenerate={handleRegenerate}
          isStreaming={isStreaming}
        />
      </div>

      {/* Input */}
      <InputArea
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  )
}

// Helper to find the last leaf node in the tree
function findLastLeaf(node: Message): Message {
  if (!node.children || node.children.length === 0) {
    return node
  }
  return findLastLeaf(node.children[node.children.length - 1])
}

// Helper to count all messages in the tree
function countMessages(node: Message): number {
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countMessages(child)
    }
  }
  return count
}
