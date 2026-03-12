import { Hono } from 'hono'
import { DatabaseManager } from '../db'

const db = new DatabaseManager()
export const modelRoutes = new Hono()

// Import model definitions from Cherry Studio
const SYSTEM_MODELS = {
  openai: [
    { id: 'gpt-5.4', name: 'GPT 5.4', group: 'GPT 5.4' },
    { id: 'gpt-5.4-pro', name: 'GPT 5.4 Pro', group: 'GPT 5.4' },
    { id: 'gpt-5.2', name: 'GPT 5.2', group: 'GPT 5.2' },
    { id: 'gpt-5.2-pro', name: 'GPT 5.2 Pro', group: 'GPT 5.2' },
    { id: 'gpt-5.1', name: 'GPT 5.1', group: 'GPT 5.1' },
    { id: 'gpt-5', name: 'GPT 5', group: 'GPT 5' },
    { id: 'gpt-5-pro', name: 'GPT 5 Pro', group: 'GPT 5' },
    { id: 'gpt-5-chat', name: 'GPT 5 Chat', group: 'GPT 5' },
    { id: 'gpt-image-1', name: 'GPT Image 1', group: 'GPT Image' }
  ],
  anthropic: [
    { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', group: 'Claude 4.6' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', group: 'Claude 4.6' },
    { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5', group: 'Claude 4.5' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5', group: 'Claude 4.5' },
    { id: 'claude-opus-4-5', name: 'Claude Opus 4.5', group: 'Claude 4.5' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', group: 'Gemini 2.5' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', group: 'Gemini 2.5' },
    { id: 'gemini-2.5-flash-image-preview', name: 'Gemini 2.5 Flash Image', group: 'Gemini 2.5' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro Image Preview', group: 'Gemini 3' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', group: 'Gemini 3' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', group: 'Gemini 3' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', group: 'DeepSeek' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', group: 'DeepSeek' }
  ],
  moonshot: [
    { id: 'kimi-k2.5', name: 'Kimi K2.5', group: 'Kimi K2.5' },
    { id: 'kimi-k2-0711-preview', name: 'Kimi K2 0711 Preview', group: 'Kimi K2' },
    { id: 'kimi-k2-thinking', name: 'Kimi K2 Thinking', group: 'Kimi K2 Thinking' }
  ],
  dashscope: [
    { id: 'qwen3.5-plus', name: 'Qwen 3.5 Plus', group: 'Qwen' },
    { id: 'qwen3-max', name: 'Qwen 3 Max', group: 'Qwen' },
    { id: 'qwen-plus', name: 'Qwen Plus', group: 'Qwen' },
    { id: 'qwen-max', name: 'Qwen Max', group: 'Qwen' }
  ],
  zhipu: [
    { id: 'glm-5', name: 'GLM-5', group: 'GLM-5' },
    { id: 'glm-4.7', name: 'GLM-4.7', group: 'GLM-4.7' },
    { id: 'glm-4.5-flash', name: 'GLM-4.5 Flash', group: 'GLM-4.5' },
    { id: 'glm-4.6', name: 'GLM-4.6', group: 'GLM-4.6' }
  ],
  grok: [
    { id: 'grok-4', name: 'Grok 4', group: 'Grok' },
    { id: 'grok-3', name: 'Grok 3', group: 'Grok' },
    { id: 'grok-3-fast', name: 'Grok 3 Fast', group: 'Grok' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', group: 'Grok' }
  ],
  minimax: [
    { id: 'MiniMax-M2.5', name: 'MiniMax M2.5', group: 'M2.5' },
    { id: 'MiniMax-M2.1', name: 'MiniMax M2.1', group: 'M2.1' }
  ],
  baichuan: [
    { id: 'Baichuan4', name: 'Baichuan 4', group: 'Baichuan 4' },
    { id: 'Baichuan4-Turbo', name: 'Baichuan 4 Turbo', group: 'Baichuan 4' },
    { id: 'Baichuan3-Turbo', name: 'Baichuan 3 Turbo', group: 'Baichuan 3' }
  ],
  yi: [
    { id: 'yi-lightning', name: 'Yi Lightning', group: 'Yi' },
    { id: 'yi-vision-v2', name: 'Yi Vision v2', group: 'Yi' }
  ],
  doubao: [
    { id: 'doubao-1-5-pro-32k-250115', name: 'Doubao 1.5 Pro 32k', group: 'Doubao' },
    { id: 'doubao-pro-32k-241215', name: 'Doubao Pro 32k', group: 'Doubao' },
    { id: 'deepseek-r1-250120', name: 'DeepSeek R1', group: 'DeepSeek' },
    { id: 'deepseek-v3-250324', name: 'DeepSeek V3', group: 'DeepSeek' }
  ],
  silicon: [
    { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2', group: 'DeepSeek' },
    { id: 'Qwen/Qwen3-8B', name: 'Qwen 3 8B', group: 'Qwen' }
  ],
  ppio: [
    { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', group: 'DeepSeek' },
    { id: 'minimax/minimax-m2', name: 'MiniMax M2', group: 'MiniMax' },
    { id: 'qwen/qwen3-235b-a22b-instruct-2507', name: 'Qwen3 235B', group: 'Qwen' }
  ],
  together: [
    { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo', name: 'Llama 3.2 11B Vision', group: 'Llama 3.2' },
    { id: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo', name: 'Llama 3.2 90B Vision', group: 'Llama 3.2' }
  ],
  mistral: [
    { id: 'mistral-large-latest', name: 'Mistral Large', group: 'Mistral' },
    { id: 'pixtral-large-latest', name: 'Pixtral Large', group: 'Pixtral' }
  ],
  perplexity: [
    { id: 'sonar-reasoning-pro', name: 'Sonar Reasoning Pro', group: 'Sonar' },
    { id: 'sonar-pro', name: 'Sonar Pro', group: 'Sonar' },
    { id: 'sonar-deep-research', name: 'Sonar Deep Research', group: 'Sonar' }
  ]
}

// Get user's model configs
modelRoutes.get('/configs', (c) => {
  const configs = db.getModelConfigs()
  return c.json(configs)
})

// Save model config
modelRoutes.post('/configs', async (c) => {
  const config = await c.req.json()
  const id = db.saveModelConfig(config)
  return c.json({ id, success: true })
})

// Delete model config
modelRoutes.delete('/configs/:id', (c) => {
  const id = c.req.param('id')
  // Soft delete by disabling
  const config = db.getModelConfig(id)
  if (config) {
    config.enabled = false
    db.saveModelConfig(config)
  }
  return c.json({ success: true })
})

// Get all available models (system + configured)
modelRoutes.get('/', (c) => {
  const configs = db.getModelConfigs()
  const configuredProviders = new Set(configs.map(c => c.provider))
  
  // Merge system models with custom configs
  const result: Record<string, any[]> = {}
  
  for (const [provider, models] of Object.entries(SYSTEM_MODELS)) {
    result[provider] = models.map(m => ({
      ...m,
      configured: configuredProviders.has(provider)
    }))
  }
  
  // Add custom configs
  configs.forEach(config => {
    if (!result[config.provider]) {
      result[config.provider] = []
    }
    if (!result[config.provider].find(m => m.id === config.name)) {
      result[config.provider].push({
        id: config.name,
        name: config.name,
        group: 'Custom',
        configured: true
      })
    }
  })
  
  return c.json(result)
})

// Get model configs
modelRoutes.get('/configs', (c) => {
  const configs = db.getModelConfigs()
  return c.json(configs)
})

// Save model config
modelRoutes.post('/configs', async (c) => {
  const config = await c.req.json()
  const id = db.saveModelConfig(config)
  return c.json({ id, success: true })
})

// Delete model config
modelRoutes.delete('/configs/:id', (c) => {
  const id = c.req.param('id')
  // Soft delete by disabling
  const config = db.getModelConfig(id)
  if (config) {
    config.enabled = false
    db.saveModelConfig(config)
  }
  return c.json({ success: true })
})
