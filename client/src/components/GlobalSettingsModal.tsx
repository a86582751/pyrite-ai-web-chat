import { useState } from 'react'
import { X } from 'lucide-react'
import { useGlobalSettingsStore } from '../store/globalSettings'
import { useAssistantStore } from '../store/assistants'

interface GlobalSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
  const { 
    defaultAssistantId, 
    autoTitleEnabled, 
    autoScrollEnabled, 
    autoExpandReasoning, 
    showMessageOutline,
    setDefaultAssistantId,
    setAutoTitleEnabled,
    setAutoScrollEnabled,
    setAutoExpandReasoning,
    setShowMessageOutline,
  } = useGlobalSettingsStore()
  
  const { assistants } = useAssistantStore()
  const [activeTab, setActiveTab] = useState<'general' | 'display'>('general')

  if (!isOpen) return null

  const Toggle = ({ 
    label, 
    description, 
    checked, 
    onChange 
  }: { 
    label: string
    description?: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div className="flex items-start justify-between py-3">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">全局设置</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            通用
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'display'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            显示
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Default Assistant */}
              <div className="pb-4 border-b border-slate-800">
                <label className="block text-sm font-medium text-white mb-2">
                  新建对话默认助手
                </label>
                <select
                  value={defaultAssistantId || ''}
                  onChange={(e) => setDefaultAssistantId(e.target.value || null)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">系统默认</option>
                  {assistants.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  新建对话时将自动使用此助手
                </p>
              </div>

              <Toggle
                label="自动生成对话标题"
                description="第一轮对话结束后自动总结标题"
                checked={autoTitleEnabled}
                onChange={setAutoTitleEnabled}
              />

              <Toggle
                label="自动滚动到底部"
                description="新消息生成时自动跳转到底部"
                checked={autoScrollEnabled}
                onChange={setAutoScrollEnabled}
              />
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-4">
              <Toggle
                label="自动展开思考内容"
                description="自动显示模型的推理过程"
                checked={autoExpandReasoning}
                onChange={setAutoExpandReasoning}
              />

              <Toggle
                label="显示消息目录"
                description="在空间足够时于消息旁显示内容大纲"
                checked={showMessageOutline}
                onChange={setShowMessageOutline}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
