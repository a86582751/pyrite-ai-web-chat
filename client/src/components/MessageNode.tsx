// MessageNode component
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { RotateCcw, User, Bot, FileText } from 'lucide-react'
import type { Message } from '../types'

interface MessageNodeProps {
  message: Message
  depth: number
  streamingContent?: string
  onRegenerate: (messageId: string) => void
}

export function MessageNode({
  message,
  depth,
  streamingContent,
  onRegenerate,
}: MessageNodeProps) {
  const isUser = message.role === 'user'
  const displayContent = streamingContent || message.content
  const hasSiblings = (message.branchIndex || 0) > 0 || (message.children && message.children.length > 0)

  // Calculate branch indicator (e.g., "2/3")
  const currentBranch = (message.branchIndex || 0) + 1
  const totalBranches = message.parentId 
    ? (message.children?.length || 0) + 1 
    : 1

  return (
    <div
      className="py-2"
      style={{ paddingLeft: `${depth * 24}px` }}
    >
      <div
        className={`
          group relative rounded-xl p-4 transition-all
          ${isUser 
            ? 'bg-blue-600/10 border border-blue-600/20 ml-auto max-w-[85%]' 
            : 'bg-slate-800/50 border border-slate-700/50 max-w-[85%]'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`
            w-6 h-6 rounded-full flex items-center justify-center
            ${isUser ? 'bg-blue-600' : 'bg-purple-600'}
          `}>
            {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
          </div>
          <span className="text-xs font-medium text-slate-400">
            {isUser ? 'You' : (message.model || 'Assistant')}
          </span>
          
          {/* Branch indicator */}
          {hasSiblings && (
            <span className="branch-indicator">
              {currentBranch}/{totalBranches}
            </span>
          )}
          
          {/* Regenerate button for assistant messages */}
          {!isUser && (
            <button
              onClick={() => onRegenerate(message.id)}
              className="opacity-0 group-hover:opacity-100 ml-auto p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title="重新生成"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.attachments.map((url, idx) => (
              <AttachmentPreview key={idx} url={url} />
            ))}
          </div>
        )}

        {/* Content */}
        <div className={`
          prose prose-sm max-w-none
          ${isUser ? 'prose-invert prose-blue' : 'prose-invert'}
        `}>
          {displayContent ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-75" />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-150" />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-2 text-xs text-slate-500">
          {new Date(message.createdAt).toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  )
}

function AttachmentPreview({ url }: { url: string }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  const filename = url.split('/').pop() || 'file'

  if (isImage) {
    return (
      <div className="relative group">
        <img
          src={url}
          alt={filename}
          className="h-20 w-auto rounded-lg border border-slate-700 object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white text-xs hover:underline"
          >
            查看
          </a>
        </div>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors text-sm text-slate-300"
    >
      <FileText className="w-4 h-4" />
      <span className="truncate max-w-[150px]">{filename}</span>
    </a>
  )
}
