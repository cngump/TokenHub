# 快速开始

Language: [English](../quick-start.md) | 简体中文 | [日本語](../ja/quick-start.md)

本文说明如何在本地启动 TokenHub，并验证模型 API 链路。

## 使用 Docker Compose 启动

```bash
docker compose -f deploy/docker-compose/docker-compose.yml up --build
```

默认地址：

- 管理后台：`http://localhost:3000`
- 后端 API：`http://localhost:8080`
- 健康检查：`http://localhost:8080/healthz`

## 本地启动

启动后端：

```bash
cd backend
cp .env.example .env
go run ./cmd/tokenhub
```

另开一个终端启动前端：

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。

## 首次配置

1. 登录管理后台。
2. 在 `Provider 渠道` 中新增或启用 Provider。
3. 从 Provider 模板中选择上游模型，或手动创建路由。
4. 打开 `路由策略`，确认统一模型指向正确的上游 Provider 模型。
5. 在 `API Key` 中创建一个项目 Key。

## 使用 AI SDK 测试

```bash
cd sdk
npm install
cp .env.example .env
```

编辑 `sdk/.env`：

```bash
TOKENHUB_BASE_URL=http://localhost:8080/v1
TOKENHUB_API_KEY=thk_xxx
TOKENHUB_MODEL=deepseek-chat
```

运行：

```bash
npm run test:deepseek
```

脚本会先请求 `GET /v1/models`，再通过 AI SDK 发送一次聊天请求。
