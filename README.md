# Pyrite AI Web Chat

消息树结构的 AI 对话应用，支持多模型并行和自定义 MCP 服务器。

## Features

- 🌳 **消息树结构** - 支持分支对话，随时回溯和重新生成
- 🤖 **多模型支持** - OpenAI, Claude, Gemini, DeepSeek, Qwen 等 20+ 提供商
- 🔧 **自定义 MCP** - 支持添加 SSE 协议的 MCP 服务器
- 📎 **文件上传** - 支持图片和文档上传（最大 10MB）
- 🔒 **密码保护** - 简单的密码鉴权机制

## Quick Start

### 使用 Release 包

1. 下载最新 release: https://github.com/a86582751/pyrite-ai-web-chat/releases
2. 解压到服务器
3. 设置环境变量并运行

```bash
export CHAT_PASSWORD="your-password"
bun run src/index.ts
```

### 开发模式

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev
```

## Configuration

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CHAT_PASSWORD` | 登录密码 | `a86582751` |
| `PORT` | 服务端口 | `3333` |
| `OPENAI_API_KEY` | OpenAI API Key | - |
| `OPENAI_BASE_URL` | OpenAI 兼容端点 | - |

### 添加 MCP 服务器

1. 在设置中添加 MCP 服务器 URL
2. 支持 SSE 协议的 MCP 服务器
3. 可选择性启用/禁用

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Bun API   │────▶│   SQLite    │
│  (Client)   │     │  (Server)   │     │   (Data)    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  MCP Servers│
                    │  (Optional) │
                    └─────────────┘
```

## License

MIT
