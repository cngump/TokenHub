# TokenHub

Language: [English](README.md) | 简体中文 | [日本語](README.ja.md)

TokenHub 是一个面向私有化部署的开源 AI 网关。它为团队提供统一的 OpenAI-Compatible 模型入口，并集中管理 Provider 路由、API Key、额度、请求日志、用量统计、成本治理和告警。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

## 产品截图

| 网关概览 | 模型目录 |
| --- | --- |
| ![Gateway Overview](docs/assets/screenshots/overview-en.png) | ![Model Catalog](docs/assets/screenshots/models-en.png) |
| 路由策略 | 系统设置 |
| ![Routing Policies](docs/assets/screenshots/routes-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## 核心能力

- OpenAI-Compatible 模型 API：`/v1/chat/completions`、`/v1/responses`、`/v1/embeddings`。
- Provider 渠道：OpenAI-Compatible、Azure OpenAI、Anthropic、Gemini、DeepSeek、Qwen、本地 vLLM/Ollama 和自定义上游。
- 模型目录、路由优先级、路由权重和失败回退顺序。
- API Key、项目、团队、模型白名单、额度和并发限制。
- 请求日志、用量统计、成本账单、审批、健康检测、告警和通知渠道。
- SQLite-first 私有化部署，内置 Docker Compose 一键部署。
- 管理后台支持中文、英文、日文切换。

## 快速开始

```bash
cp deploy/.env.example deploy/.env
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

访问地址：

- 管理后台：`http://localhost:3000`
- 后端 API：`http://localhost:8080`
- 健康检查：`http://localhost:8080/healthz`

默认管理员账号：

- 用户名：`admin`
- 密码：`admin123456`

对外开放前，请修改默认密码，并在 `deploy/.env` 中替换默认密钥。

## 本地开发

后端：

```bash
cd backend
go run ./cmd/tokenhub
```

前端：

```bash
cd frontend
npm install
npm run dev
```

使用 SDK 示例测试模型 API 链路：

```bash
cd sdk
npm install
npm run test:deepseek
```

## 文档

- [文档首页](docs/zh-CN/README.md)
- [快速开始](docs/zh-CN/quick-start.md)
- [模型 API](docs/zh-CN/model-api.md)
- [管理后台](docs/zh-CN/admin-console.md)
- [模型目录](docs/zh-CN/model-catalog.md)
- [部署](docs/zh-CN/deployment.md)
- [安全](docs/zh-CN/security.md)

## License

TokenHub 采用 [Apache License 2.0](LICENSE) 协议。
