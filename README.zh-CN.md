# TokenHub

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react&logoColor=111111)
![SQLite](https://img.shields.io/badge/SQLite-first-003B57?logo=sqlite&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![OpenAI Compatible](https://img.shields.io/badge/OpenAI-Compatible-10A37F)
![i18n](https://img.shields.io/badge/i18n-ZH%20%7C%20EN%20%7C%20JA-6f42c1)

Language: [English](README.md) | 简体中文 | [日本語](README.ja.md)

TokenHub 是一个面向私有化部署的开源 AI 网关。它为团队提供统一的 OpenAI-Compatible 模型入口，并集中管理 Provider 路由、API Key、额度、请求日志、用量统计、成本治理和告警，同时提供简洁的企业控制台用于运维管理和领导报表。

## 产品截图

| 登录控制台 | 网关概览 |
| --- | --- |
| ![Login Console](docs/assets/screenshots/login-en.png) | ![Gateway Overview](docs/assets/screenshots/overview-en.png) |
| 接口文档 | Provider 渠道 |
| ![API Documentation](docs/assets/screenshots/gateway-en.png) | ![Provider Channels](docs/assets/screenshots/providers-en.png) |
| 模型目录 | 路由策略 |
| ![Model Catalog](docs/assets/screenshots/models-en.png) | ![Routing Policies](docs/assets/screenshots/routes-en.png) |
| 用量统计 | 系统设置 |
| ![Usage Analytics](docs/assets/screenshots/usage-en.png) | ![System Settings](docs/assets/screenshots/settings-en.png) |

## 核心能力

- OpenAI-Compatible 模型 API：`/v1/chat/completions`、`/v1/responses`、`/v1/embeddings`。
- Provider 渠道：OpenAI-Compatible、Azure OpenAI、Anthropic、Gemini、DeepSeek、Qwen、本地 vLLM/Ollama 和自定义上游。
- 模型目录、路由优先级、路由权重和失败回退顺序。
- API Key、项目、团队、模型白名单、额度和并发限制。
- 请求日志、用量统计、成本账单、审批、健康检测、告警和通知渠道。
- 领导视角用量看板：部门排行、个人排行、Token 消耗对比和 Provider 成本占比。
- 简洁控制台：紧凑导航、全局搜索、黑白主题，以及左侧 API 导航 + 右侧详情的接口文档。
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
