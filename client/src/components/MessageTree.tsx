import { useRef, useEffect, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MessageNode } from './MessageNode'
import type { Message } from '../types'

interface MessageTreeProps {
  messages: Message[]
  streamingContent: Record<string, string>
  onRegenerate: (messageId: string) => void
  isStreaming: boolean
}

export function MessageTree({ messages, streamingContent, onRegenerate, isStreaming }: MessageTreeProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [flatMessages, setFlatMessages] = useState<Array<{ message: Message; depth: number; path: number[] }>>([])

  // Flatten tree for virtual scrolling
  useEffect(() => {
    const flattened: Array<{ message: Message; depth: number; path: number[] }> = []
    
    const traverse = (msgs: Message[], depth: number, path: number[]) => {
      msgs.forEach((msg, index) => {
        const currentPath = [...path, index]
        flattened.push({ message: msg, depth, path: currentPath })
        if (msg.children && msg.children.length > 0) {
          traverse(msg.children, depth + 1, currentPath)
        }
      })
    }
    
    traverse(messages, 0, [])
    setFlatMessages(flattened)
  }, [messages])

  const virtualizer = useVirtualizer({
    count: flatMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatMessages.length > 0 && parentRef.current) {
      const scrollElement = parentRef.current
      const isNearBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100
      if (isNearBottom || isStreaming) {
        virtualizer.scrollToIndex(flatMessages.length - 1, { align: 'end' })
      }
    }
  }, [flatMessages.length, isStreaming, virtualizer])

  if (flatMessages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p>发送消息开始对话</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto overflow-x-hidden p-4"
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const { message, depth, path } = flatMessages[virtualItem.index]
          const isLast = virtualItem.index === flatMessages.length - 1
          
          return (
            <div
              key={message.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <MessageNode
                message={message}
                depth={depth}
                path={path}
                streamingContent={streamingContent[message.id]}
                onRegenerate={onRegenerate}
                isLast={isLast}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
