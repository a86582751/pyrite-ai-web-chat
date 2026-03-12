import { useState } from 'react'
import { X, Plus, Trash2, Save, AlertCircle, Key, ChevronRight } from 'lucide-react'
import { useMcpStore } from '../store/mcp'
import { useModelConfigStore } from '../store/modelConfigs'
import type { McpServer } from '../store/mcp'
import type { ModelConfig } from '../store/modelConfigs'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Provider definitions with their specific configurations
const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-pro', 'gemini-pro-vision'],
  },
  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
  },
  moonshot: {
    name: 'Moonshot',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  },
  dashscope: {
    name: '阿里云 DashScope',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo'],
  },
  zhipu: {
    name: '智谱 AI',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ['glm-4', 'glm-3-turbo'],
  },
  custom: {
    name: '自定义',
    defaultBaseUrl: '',
    models: [],
  },
}

type ProviderKey = keyof typeof PROVIDERS

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { servers, addServer, removeServer } = useMcpStore()
  const { configs: modelConfigs, addConfig: addModelConfig, removeConfig: removeModelConfig } = useModelConfigStore()
  const [activeTab, setActiveTab] = useState<'providers' | 'mcp'>('providers')

  if (!isOpen) return null

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
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'providers'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            模型服务商
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
          {activeTab === 'providers' && (
            <ProviderConfigsTab
              configs={modelConfigs}
              onAdd={addModelConfig}
              onDelete={removeModelConfig}
            />
          )}
          
          {activeTab === 'mcp' && (
            <McpServersTab
              servers={servers}
              onAdd={addServer}
              onDelete={removeServer}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Provider Configs Tab
interface ProviderConfigsTabProps {
  configs: ModelConfig[]
  onAdd: (config: Omit<ModelConfig, 'id'>) => void
  onDelete: (id: string) => void
}

function ProviderConfigsTab({ configs, onAdd, onDelete }: ProviderConfigsTabProps) {
  const [step, setStep] = useState<'list' | 'select' | 'configure'>('list')
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null)
  const [formData, setFormData] = useState({
    apiKey: '',
    baseUrl: '',
    models: [] as string[],
    customModel: '',
  })

  const resetForm = () => {
    setFormData({ apiKey: '', baseUrl: '', models: [], customModel: '' })
    setSelectedProvider(null)
    setStep('list')
  }

  const handleProviderSelect = (provider: ProviderKey) => {
    setSelectedProvider(provider)
    setFormData(prev => ({
      ...prev,
      baseUrl: PROVIDERS[provider].defaultBaseUrl,
      models: [...PROVIDERS[provider].models],
    }))
    setStep('configure')
  }

  const handleSave = () => {
    if (!selectedProvider || !formData.apiKey) return

    const provider = PROVIDERS[selectedProvider]
    const modelsToAdd = selectedProvider === 'custom' && formData.customModel
      ? [formData.customModel]
      : formData.models.filter(m => m)

    modelsToAdd.forEach(modelName => {
      onAdd({
        provider: selectedProvider,
        name: modelName || 'custom-model',
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || provider.defaultBaseUrl,
        enabled: true,
      })
    })

    resetForm()
  }

  // List View
  if (step === 'list') {
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.provider]) acc[config.provider] = []
      acc[config.provider].push(config)
      return acc
    }, {} as Record<string, ModelConfig[]>)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">已配置的服务商</h3>
          <button
            onClick={() => setStep('select')}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加服务商
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无模型配置</p>
            <p className="text-sm mt-1">点击上方按钮添加服务商</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedConfigs).map(([provider, providerConfigs]) => (
              <div key={provider} className="bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {PROVIDERS[provider as ProviderKey]?.name || provider}
                    </span>
                    <span className="text-xs text-slate-400">({providerConfigs.length} 个模型)</span>
                  </div>
                  <button
                    onClick={() => providerConfigs.forEach(c => onDelete(c.id))}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-4 py-2 space-y-1">
                  {providerConfigs.map(config => (
                    <div key={config.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-300">{config.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        config.enabled ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {config.enabled ? '启用' : '禁用'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Select Provider View
  if (step === 'select') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setStep('list')}
            className="text-slate-400 hover:text-white"
          >
            ← 返回
          </button>
          <h3 className="text-sm font-medium text-slate-300">选择服务商</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(PROVIDERS) as ProviderKey[]).map(key => (
            <button
              key={key}
              onClick={() => handleProviderSelect(key)}
              className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition-all text-left"
            >
              <div>
                <div className="font-medium text-white">{PROVIDERS[key].name}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {PROVIDERS[key].models.length > 0 
                    ? `${PROVIDERS[key].models.length} 个预设模型` 
                    : '自定义配置'}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Configure View
  if (step === 'configure' && selectedProvider) {
    const provider = PROVIDERS[selectedProvider]
    const isCustom = selectedProvider === 'custom'

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setStep('select')}
            className="text-slate-400 hover:text-white"
          >
            ← 返回
          </button>
          <h3 className="text-sm font-medium text-slate-300">配置 {provider.name}</h3>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">API Key *</label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              Base URL {provider.defaultBaseUrl && '(可选)'}
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder={provider.defaultBaseUrl || 'https://api.example.com/v1'}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            {provider.defaultBaseUrl && (
              <p className="text-xs text-slate-500 mt-1">默认: {provider.defaultBaseUrl}</p>
            )}
          </div>

          {/* Models */}
          {isCustom ? (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">模型名称 *</label>
              <input
                type="text"
                value={formData.customModel}
                onChange={(e) => setFormData({ ...formData, customModel: e.target.value })}
                placeholder="例如：gpt-4"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">选择模型</label>
              <div className="space-y-2">
                {provider.models.map(model => (
                  <label
                    key={model}
                    className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={formData.models.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, models: [...formData.models, model] })
                        } else {
                          setFormData({ ...formData, models: formData.models.filter(m => m !== model) })
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600"
                    />
                    <span className="text-sm text-slate-300">{model}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={!formData.apiKey || (!isCustom && formData.models.length === 0) || (isCustom && !formData.customModel)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={resetForm}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return null
}

// MCP Servers Tab
interface McpServersTabProps {
  servers: McpServer[]
  onAdd: (server: Omit<McpServer, 'id' | 'createdAt'>) => void
  onDelete: (id: string) => void
}

function McpServersTab({ servers, onAdd, onDelete }: McpServersTabProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  })

  const handleSave = () => {
    if (!formData.name || !formData.url) return
    onAdd({
      name: formData.name,
      url: formData.url,
      type: 'sse',
      enabled: true,
    })
    setFormData({ name: '', url: '' })
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      {!isAdding ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">已配置的 MCP 服务器</h3>
            <button
              onClick={() => setIsAdding(true)}
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
                  className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{server.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        server.enabled ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {server.enabled ? '启用' : '禁用'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-1">{server.url}</p>
                  </div>
                  <button
                    onClick={() => onDelete(server.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">添加 MCP 服务器</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：我的搜索服务"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">SSE URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="例如：https://example.com/mcp/sse"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!formData.name || !formData.url}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setFormData({ name: '', url: '' })
              }}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
