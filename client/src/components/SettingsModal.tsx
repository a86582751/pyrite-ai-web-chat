import { useState } from 'react'
import { X, Plus, Trash2, Save, AlertCircle, Key } from 'lucide-react'
import { useMcpStore } from '../store/mcp'
import { useModelConfigStore } from '../store/modelConfigs'
import type { McpServer } from '../store/mcp'
import type { ModelConfig } from '../store/modelConfigs'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { servers, addServer, removeServer, updateServer } = useMcpStore()
  const { configs: modelConfigs, addConfig: addModelConfig, removeConfig: removeModelConfig, updateConfig: updateModelConfig } = useModelConfigStore()
  const [activeTab, setActiveTab] = useState<'models' | 'mcp'>('models')
  const [editingServer, setEditingServer] = useState<Partial<McpServer> | null>(null)
  const [editingModel, setEditingModel] = useState<Partial<ModelConfig> | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isAddingModel, setIsAddingModel] = useState(false)

  if (!isOpen) return null

  const handleSaveServer = () => {
    if (!editingServer?.name || !editingServer?.url) return
    
    if (isAdding) {
      addServer({
        name: editingServer.name,
        url: editingServer.url,
        type: 'sse',
        enabled: true,
        config: editingServer.config
      })
    } else if (editingServer.id) {
      updateServer(editingServer.id, editingServer)
    }
    
    setEditingServer(null)
    setIsAdding(false)
  }

  const handleAddNew = () => {
    setEditingServer({
      name: '',
      url: '',
      type: 'sse',
      enabled: true,
      config: { headers: {} }
    })
    setIsAdding(true)
  }

  const handleEdit = (server: McpServer) => {
    setEditingServer({ ...server })
    setIsAdding(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">设置</h2>
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
            onClick={() => setActiveTab('models')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'models'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            模型配置
          </button>
          <button
            onClick={() => setActiveTab('mcp')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mcp'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            MCP 服务器
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'models' && (
            <ModelConfigTab
              configs={modelConfigs}
              onAdd={() => {
                setEditingModel({
                  provider: 'openai',
                  name: '',
                  apiKey: '',
                  baseUrl: '',
                  enabled: true,
                })
                setIsAddingModel(true)
              }}
              onEdit={(config) => {
                setEditingModel({ ...config })
                setIsAddingModel(false)
              }}
              onSave={(config) => {
                if (isAddingModel && config.name && config.apiKey) {
                  addModelConfig(config as Omit<ModelConfig, 'id'>)
                } else if (config.id) {
                  updateModelConfig(config.id, config)
                }
                setEditingModel(null)
                setIsAddingModel(false)
              }}
              onDelete={removeModelConfig}
              editingModel={editingModel}
              isAdding={isAddingModel}
              onCancel={() => {
                setEditingModel(null)
                setIsAddingModel(false)
              }}
            />
          )}
          
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              {/* Server List */}
              {!editingServer && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-300">已配置的 MCP 服务器</h3>
                    <button
                      onClick={handleAddNew}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      添加
                    </button>
                  </div>

                  {servers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无 MCP 服务器</p>
                      <p className="text-sm mt-1">点击上方按钮添加</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {servers.map((server) => (
                        <div
                          key={server.id}
                          className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{server.name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                server.enabled
                                  ? 'bg-green-600/20 text-green-400'
                                  : 'bg-slate-700 text-slate-400'
                              }`}>
                                {server.enabled ? '启用' : '禁用'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 truncate mt-1">{server.url}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(server)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => removeServer(server.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Edit Form */}
              {editingServer && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-300">
                    {isAdding ? '添加 MCP 服务器' : '编辑 MCP 服务器'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">名称</label>
                      <input
                        type="text"
                        value={editingServer.name || ''}
                        onChange={(e) => setEditingServer({ ...editingServer, name: e.target.value })}
                        placeholder="例如：我的搜索服务"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">SSE URL</label>
                      <input
                        type="text"
                        value={editingServer.url || ''}
                        onChange={(e) => setEditingServer({ ...editingServer, url: e.target.value })}
                        placeholder="例如：https://example.com/mcp/sse"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingServer.enabled}
                        onChange={(e) => setEditingServer({ ...editingServer, enabled: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600"
                      />
                      <span className="text-sm text-slate-300">启用此服务器</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSaveServer}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingServer(null)
                        setIsAdding(false)
                      }}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Model Config Tab Component
interface ModelConfigTabProps {
  configs: ModelConfig[]
  onAdd: () => void
  onEdit: (config: ModelConfig) => void
  onSave: (config: Partial<ModelConfig>) => void
  onDelete: (id: string) => void
  editingModel: Partial<ModelConfig> | null
  isAdding: boolean
  onCancel: () => void
}

function ModelConfigTab({
  configs,
  onAdd,
  onEdit,
  onSave,
  onDelete,
  editingModel,
  isAdding,
  onCancel,
}: ModelConfigTabProps) {
  const providers = ['openai', 'anthropic', 'gemini', 'deepseek', 'moonshot', 'dashscope', 'zhipu', 'custom']

  if (editingModel) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-slate-300">
          {isAdding ? '添加模型配置' : '编辑模型配置'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">提供商</label>
            <select
              value={editingModel.provider || 'openai'}
              onChange={(e) => onSave({ ...editingModel, provider: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {providers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">模型名称</label>
            <input
              type="text"
              value={editingModel.name || ''}
              onChange={(e) => onSave({ ...editingModel, name: e.target.value })}
              placeholder="例如：gpt-4"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">API Key</label>
            <input
              type="password"
              value={editingModel.apiKey || ''}
              onChange={(e) => onSave({ ...editingModel, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Base URL（可选）</label>
            <input
              type="text"
              value={editingModel.baseUrl || ''}
              onChange={(e) => onSave({ ...editingModel, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editingModel.enabled}
              onChange={(e) => onSave({ ...editingModel, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600"
            />
            <span className="text-sm text-slate-300">启用此配置</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => onSave(editingModel)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">已配置的模型</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无模型配置</p>
          <p className="text-sm mt-1">点击上方按钮添加 API Key</p>
        </div>
      ) : (
        <div className="space-y-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{config.name}</span>
                  <span className="text-xs text-slate-400">({config.provider})</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    config.enabled
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {config.enabled ? '启用' : '禁用'}
                  </span>
                </div>
                {config.baseUrl && (
                  <p className="text-sm text-slate-400 truncate mt-1">{config.baseUrl}</p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEdit(config)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => onDelete(config.id)}
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
  )
}
