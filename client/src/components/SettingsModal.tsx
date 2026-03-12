import { useState, useMemo } from 'react'
import { X, Plus, Trash2, Save, AlertCircle, RefreshCw, Server, Search, Edit2 } from 'lucide-react'
import { useMcpStore } from '../store/mcp'
import { useModelConfigStore } from '../store/modelConfigs'
import type { McpServer } from '../store/mcp'
import type { ModelConfig } from '../store/modelConfigs'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Protocol types with their endpoints
const PROTOCOLS = {
  openai: {
    name: 'OpenAI 兼容',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
  },
  anthropic: {
    name: 'Anthropic',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    modelsEndpoint: null,
  },
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsEndpoint: null,
  },
  azure: {
    name: 'Azure OpenAI',
    defaultBaseUrl: '',
    modelsEndpoint: '/models',
  },
  custom: {
    name: '自定义',
    defaultBaseUrl: '',
    modelsEndpoint: null,
  },
}

type ProtocolKey = keyof typeof PROTOCOLS

interface Provider {
  id: string
  name: string
  protocol: ProtocolKey
  baseUrl: string
  apiKey: string
  models: string[]
  enabled: boolean
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { servers, addServer, removeServer } = useMcpStore()
  const { configs: modelConfigs, addConfig, removeConfig } = useModelConfigStore()
  const [activeTab, setActiveTab] = useState<'providers' | 'mcp'>('providers')

  // Group configs by provider name
  const providers = useMemo(() => {
    return modelConfigs.reduce((acc, config) => {
      const key = config.provider
      if (!acc[key]) {
        acc[key] = {
          id: key,
          name: config.provider,
          protocol: 'openai' as ProtocolKey,
          baseUrl: config.baseUrl || '',
          apiKey: config.apiKey,
          models: [],
          enabled: true,
        }
      }
      acc[key].models.push(config.name)
      return acc
    }, {} as Record<string, Provider>)
  }, [modelConfigs])

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
            <ProvidersTab
              providers={Object.values(providers)}
              configs={modelConfigs}
              onAdd={addConfig}
              onDelete={removeConfig}
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

// Providers Tab
interface ProvidersTabProps {
  providers: Provider[]
  configs: ModelConfig[]
  onAdd: (config: Omit<ModelConfig, 'id'>) => void
  onDelete: (id: string) => void
}

function ProvidersTab({ providers, configs, onAdd, onDelete }: ProvidersTabProps) {
  const [step, setStep] = useState<'list' | 'configure'>('list')
  const [editingProvider, setEditingProvider] = useState<Partial<Provider> & { 
    customModels?: string
    isEditing?: boolean
    originalName?: string
  }>({
    name: '',
    protocol: 'openai',
    baseUrl: '',
    apiKey: '',
    models: [],
    customModels: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [fetchedModels, setFetchedModels] = useState<string[]>([])

  const resetForm = () => {
    setEditingProvider({
      name: '',
      protocol: 'openai',
      baseUrl: '',
      apiKey: '',
      models: [],
      customModels: '',
    })
    setFetchedModels([])
    setModelSearch('')
    setFetchError('')
    setStep('list')
  }

  const fetchModels = async () => {
    if (!editingProvider.apiKey) {
      setFetchError('请先输入 API Key')
      return
    }

    setIsLoading(true)
    setFetchError('')

    try {
      const baseUrl = editingProvider.baseUrl || PROTOCOLS[editingProvider.protocol as ProtocolKey]?.defaultBaseUrl
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${editingProvider.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      const models = data.data?.map((m: any) => m.id) || []
      
      setFetchedModels(models)
      setEditingProvider(prev => ({
        ...prev,
        models: models.slice(0, 1000),
      }))
    } catch (error) {
      setFetchError('获取模型列表失败，请手动输入')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    if (!editingProvider.name || !editingProvider.apiKey) return

    const modelsFromFetch = editingProvider.models || []
    const modelsFromManual = editingProvider.customModels?.split('\n').filter(m => m.trim()) || []
    const modelsToSave = modelsFromFetch.length > 0 ? modelsFromFetch : modelsFromManual

    if (modelsToSave.length === 0) {
      setFetchError('请至少添加一个模型')
      return
    }

    // If editing, delete old configs first
    if (editingProvider.isEditing && editingProvider.originalName) {
      const oldConfigs = configs.filter(c => c.provider === editingProvider.originalName)
      oldConfigs.forEach(c => onDelete(c.id))
    }

    modelsToSave.forEach(modelName => {
      onAdd({
        provider: editingProvider.name!,
        name: modelName.trim(),
        apiKey: editingProvider.apiKey!,
        baseUrl: editingProvider.baseUrl || PROTOCOLS[editingProvider.protocol as ProtocolKey]?.defaultBaseUrl,
        enabled: true,
      })
    })

    resetForm()
  }

  const handleEdit = (provider: Provider) => {
    setEditingProvider({
      name: provider.name,
      protocol: provider.protocol,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      models: provider.models,
      customModels: '',
      isEditing: true,
      originalName: provider.name,
    })
    setFetchedModels(provider.models)
    setStep('configure')
  }

  const filteredModels = useMemo(() => {
    if (!modelSearch) return fetchedModels
    return fetchedModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()))
  }, [fetchedModels, modelSearch])

  // List View
  if (step === 'list') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-300">已配置的服务商</h3>
          <button
            onClick={() => setStep('configure')}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加服务商
          </button>
        </div>

        {providers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无模型服务商</p>
            <p className="text-sm mt-1">点击上方按钮添加中转站</p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div key={provider.name} className="bg-slate-800/50 border border-slate-700 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                  <div>
                    <div className="font-medium text-white">{provider.name}</div>
                    <div className="text-xs text-slate-400">
                      {PROTOCOLS[provider.protocol]?.name || provider.protocol} · {provider.models.length} 个模型
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(provider)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const providerConfigs = configs.filter(c => c.provider === provider.name)
                        providerConfigs.forEach(c => onDelete(c.id))
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-2">
                  <div className="flex flex-wrap gap-2">
                    {provider.models.slice(0, 5).map(model => (
                      <span key={model} className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded">
                        {model}
                      </span>
                    ))}
                    {provider.models.length > 5 && (
                      <span className="text-xs px-2 py-1 text-slate-500">
                        +{provider.models.length - 5} 更多
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Configure View
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={resetForm}
          className="text-slate-400 hover:text-white"
        >
          ← 返回
        </button>
        <h3 className="text-sm font-medium text-slate-300">
          {editingProvider.isEditing ? '编辑服务商' : '添加服务商'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Provider Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">服务商名称 *</label>
          <input
            type="text"
            value={editingProvider.name}
            onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
            placeholder="例如：小鲸鱼 AI"
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Protocol */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">协议类型 *</label>
          <select
            value={editingProvider.protocol}
            onChange={(e) => setEditingProvider({ 
              ...editingProvider, 
              protocol: e.target.value as ProtocolKey,
              baseUrl: PROTOCOLS[e.target.value as ProtocolKey]?.defaultBaseUrl || ''
            })}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {Object.entries(PROTOCOLS).map(([key, p]) => (
              <option key={key} value={key}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">Base URL *</label>
          <input
            type="text"
            value={editingProvider.baseUrl}
            onChange={(e) => setEditingProvider({ ...editingProvider, baseUrl: e.target.value })}
            placeholder={PROTOCOLS[editingProvider.protocol as ProtocolKey]?.defaultBaseUrl || 'https://api.example.com/v1'}
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5">API Key *</label>
          <input
            type="password"
            value={editingProvider.apiKey}
            onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Fetch Models Button */}
        {PROTOCOLS[editingProvider.protocol as ProtocolKey]?.modelsEndpoint && (
          <div>
            <button
              onClick={fetchModels}
              disabled={isLoading || !editingProvider.apiKey}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              自动获取模型列表
            </button>
            {fetchError && (
              <p className="text-sm text-amber-400 mt-2">{fetchError}</p>
            )}
          </div>
        )}

        {/* Models Selection with Search */}
        {fetchedModels.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-slate-400">
                选择要添加的模型 ({editingProvider.models?.length || 0}/{fetchedModels.length})
              </label>
              <div className="flex items-center gap-2">
                {/* Select All / None buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingProvider(prev => ({ ...prev, models: [...fetchedModels] }))}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    全选
                  </button>
                  <button
                    onClick={() => setEditingProvider(prev => ({ ...prev, models: [] }))}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    全不选
                  </button>
                  <button
                    onClick={() => {
                      const current = editingProvider.models || []
                      const inverted = fetchedModels.filter(m => !current.includes(m))
                      setEditingProvider(prev => ({ ...prev, models: inverted }))
                    }}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                  >
                    反选
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="搜索模型..."
                    className="pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700 rounded-lg p-2">
              {filteredModels.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">未找到匹配的模型</p>
              ) : (
                filteredModels.map(model => (
                  <label key={model} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingProvider.models?.includes(model)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingProvider(prev => ({
                            ...prev,
                            models: [...(prev.models || []), model]
                          }))
                        } else {
                          setEditingProvider(prev => ({
                            ...prev,
                            models: (prev.models || []).filter(m => m !== model)
                          }))
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600" 
                    />
                    <span className="text-sm text-slate-300">{model}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {/* Manual Models Input */}
        {(fetchedModels.length === 0 || editingProvider.customModels !== undefined) && (
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">
              手动输入模型（每行一个）
            </label>
            <textarea
              value={editingProvider.customModels}
              onChange={(e) => setEditingProvider({ ...editingProvider, customModels: e.target.value })}
              placeholder="gpt-4&#10;gpt-3.5-turbo&#10;claude-3-opus"
              rows={4}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={!editingProvider.name || !editingProvider.apiKey}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {editingProvider.isEditing ? '保存修改' : '保存配置'}
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

// MCP Servers Tab
interface McpServersTabProps {
  servers: McpServer[]
  onAdd: (server: Omit<McpServer, 'id' | 'createdAt'>) => void
  onDelete: (id: string) => void
}

function McpServersTab({ servers, onAdd, onDelete }: McpServersTabProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState('')
  const [parsedConfig, setParsedConfig] = useState<{
    name: string
    url: string
    headers?: Record<string, string>
  } | null>(null)

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    setParseError('')
    setParsedConfig(null)

    if (!value.trim()) return

    try {
      const parsed = JSON.parse(value)
      
      // Validate required fields
      if (!parsed.name || !parsed.url) {
        setParseError('JSON 必须包含 name 和 url 字段')
        return
      }

      // Extract config
      const config = {
        name: parsed.name,
        url: parsed.url,
        headers: parsed.headers || {},
      }

      setParsedConfig(config)
    } catch (e) {
      setParseError('无效的 JSON 格式')
    }
  }

  const handleSave = () => {
    if (!parsedConfig) return
    
    onAdd({
      name: parsedConfig.name,
      url: parsedConfig.url,
      type: 'sse',
      enabled: true,
      config: parsedConfig.headers ? { headers: parsedConfig.headers } : undefined,
    })
    
    // Reset
    setJsonInput('')
    setParsedConfig(null)
    setParseError('')
    setIsAdding(false)
  }

  const exampleJson = `{
  "name": "web-search",
  "url": "https://example.com/mcp/sse",
  "headers": {
    "Authorization": "Bearer sk-your-api-key"
  }
}`

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
                    {server.config?.headers && Object.keys(server.config.headers).length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Headers: {Object.keys(server.config.headers).join(', ')}
                      </p>
                    )}
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300">添加 MCP 服务器</h3>
            <button
              onClick={() => {
                setIsAdding(false)
                setJsonInput('')
                setParsedConfig(null)
                setParseError('')
              }}
              className="text-slate-400 hover:text-white text-sm"
            >
              ← 返回
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">粘贴 MCP JSON 配置</label>
                <button
                  onClick={() => setJsonInput(exampleJson)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  查看示例
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={`{
  "name": "web-search",
  "url": "https://example.com/mcp/sse",
  "headers": {
    "Authorization": "Bearer sk-your-api-key"
  }
}`}
                rows={8}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
              />
              {parseError && (
                <p className="text-sm text-red-400 mt-2">{parseError}</p>
              )}
            </div>

            {/* Parsed Config Preview */}
            {parsedConfig && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-slate-300">配置预览</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex">
                    <span className="text-slate-500 w-16">名称:</span>
                    <span className="text-white">{parsedConfig.name}</span>
                  </div>
                  <div className="flex">
                    <span className="text-slate-500 w-16">URL:</span>
                    <span className="text-white truncate">{parsedConfig.url}</span>
                  </div>
                  {parsedConfig.headers && Object.keys(parsedConfig.headers).length > 0 && (
                    <div className="flex">
                      <span className="text-slate-500 w-16">Headers:</span>
                      <span className="text-white">{Object.keys(parsedConfig.headers).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!parsedConfig}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setJsonInput('')
                setParsedConfig(null)
                setParseError('')
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
