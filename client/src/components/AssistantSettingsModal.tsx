import { useState } from 'react'
import { X, Plus, Trash2, Save, Bot } from 'lucide-react'
import { useAssistantStore, type Assistant } from '../store/assistants'
import { useModelConfigStore } from '../store/modelConfigs'

interface AssistantSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentAssistantId?: string | null
  onSelectAssistant?: (id: string) => void
}

export function AssistantSettingsModal({ 
  isOpen, 
  onClose, 
  currentAssistantId,
  onSelectAssistant 
}: AssistantSettingsModalProps) {
  const { assistants, addAssistant, removeAssistant, updateAssistant } = useAssistantStore()
  const { configs: modelConfigs } = useModelConfigStore()
  const [editingAssistant, setEditingAssistant] = useState<Partial<Assistant> | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setEditingAssistant(null)
    setIsAdding(false)
  }

  const handleSave = () => {
    if (!editingAssistant?.name) return

    if (isAdding) {
      addAssistant({
        name: editingAssistant.name,
        systemPrompt: editingAssistant.systemPrompt || '',
        defaultModel: editingAssistant.defaultModel || 'gpt-4',
        defaultProvider: editingAssistant.defaultProvider || 'openai',
        streamEnabled: editingAssistant.streamEnabled ?? true,
        contextLength: editingAssistant.contextLength ?? null,
        temperature: editingAssistant.temperature ?? 0.7,
        maxOutputTokens: editingAssistant.maxOutputTokens ?? 4096,
      })
    } else if (editingAssistant.id) {
      updateAssistant(editingAssistant.id, editingAssistant)
    }

    resetForm()
  }

  const handleAddNew = () => {
    setEditingAssistant({
      name: '',
      systemPrompt: '',
      defaultModel: 'gpt-4',
      defaultProvider: 'openai',
      streamEnabled: true,
      contextLength: null,
      temperature: 0.7,
      maxOutputTokens: 4096,
    })
    setIsAdding(true)
  }

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant({ ...assistant })
    setIsAdding(false)
  }

  // Group models by provider
  const modelsByProvider = modelConfigs.reduce((acc, config) => {
    if (!acc[config.provider]) acc[config.provider] = []
    acc[config.provider].push(config.name)
    return acc
  }, {} as Record<string, string[]>)

  // List View
  if (!editingAssistant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">助手</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-300">已配置的助手</h3>
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加助手
                </button>
              </div>

              {assistants.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无助手</p>
                  <p className="text-sm mt-1">点击上方按钮创建</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                        currentAssistantId === assistant.id
                          ? 'bg-blue-600/10 border-blue-600/30'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{assistant.name}</span>
                          {currentAssistantId === assistant.id && (
                            <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded">
                              当前
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          模型: {assistant.defaultModel} · 温度: {assistant.temperature}
                        </div>
                        {assistant.systemPrompt && (
                          <p className="text-sm text-slate-500 truncate mt-1">
                            {assistant.systemPrompt.slice(0, 50)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {onSelectAssistant && currentAssistantId !== assistant.id && (
                          <button
                            onClick={() => {
                              onSelectAssistant(assistant.id)
                              onClose()
                            }}
                            className="px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors"
                          >
                            切换
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(assistant)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => removeAssistant(assistant.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Edit/Add Form
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">
            {isAdding ? '添加助手' : '编辑助手'}
          </h2>
          <button
            onClick={resetForm}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">助手名称 *</label>
            <input
              type="text"
              value={editingAssistant.name}
              onChange={(e) => setEditingAssistant({ ...editingAssistant, name: e.target.value })}
              placeholder="例如：Pyrite"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">系统提示词</label>
            <textarea
              value={editingAssistant.systemPrompt}
              onChange={(e) => setEditingAssistant({ ...editingAssistant, systemPrompt: e.target.value })}
              placeholder="你是 Pyrite，一个有帮助的 AI 助手。"
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Default Model */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">默认模型</label>
            <select
              value={`${editingAssistant.defaultProvider}/${editingAssistant.defaultModel}`}
              onChange={(e) => {
                const [provider, model] = e.target.value.split('/')
                setEditingAssistant({ 
                  ...editingAssistant, 
                  defaultProvider: provider,
                  defaultModel: model
                })
              }}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">选择模型</option>
              {Object.entries(modelsByProvider).map(([provider, models]) => (
                <optgroup key={provider} label={provider}>
                  {models.map(model => (
                    <option key={`${provider}/${model}`} value={`${provider}/${model}`}>
                      {model}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Stream Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-white">流式传输</div>
              <div className="text-xs text-slate-400">逐字显示生成内容</div>
            </div>
            <button
              onClick={() => setEditingAssistant({ ...editingAssistant, streamEnabled: !editingAssistant.streamEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editingAssistant.streamEnabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editingAssistant.streamEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Context Length */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              上下文携带条数（留空不限制）
            </label>
            <input
              type="number"
              value={editingAssistant.contextLength || ''}
              onChange={(e) => setEditingAssistant({ 
                ...editingAssistant, 
                contextLength: e.target.value ? parseInt(e.target.value) : null 
              })}
              placeholder="例如：10"
              min={1}
              max={100}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              随机性 (Temperature): {editingAssistant.temperature}
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={editingAssistant.temperature}
              onChange={(e) => setEditingAssistant({ 
                ...editingAssistant, 
                temperature: parseFloat(e.target.value) 
              })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>精确 (0)</span>
              <span>平衡 (1)</span>
              <span>创意 (2)</span>
            </div>
          </div>

          {/* Max Output Tokens */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              最大输出 Token 数
            </label>
            <input
              type="number"
              value={editingAssistant.maxOutputTokens}
              onChange={(e) => setEditingAssistant({ 
                ...editingAssistant, 
                maxOutputTokens: parseInt(e.target.value) || 4096 
              })}
              min={1}
              max={128000}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!editingAssistant.name}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
