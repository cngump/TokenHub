# MVP 实现记录

本文件记录当前仓库中已经落地的 MVP 功能、运行方式、验证结果和已知限制。

## 已实现范围

### Go 后端

目录：`backend/`

已实现：

- HTTP 服务入口：`cmd/tokenhub/main.go`
- 健康检查：`GET /healthz`
- OpenAI-Compatible Gateway：
  - `GET /v1/models`
  - `POST /v1/chat/completions`
  - `POST /v1/responses`
  - `POST /v1/embeddings`
- Gateway 能力：
  - Bearer API Key 鉴权
  - Project 绑定
  - 模型白名单
  - 请求额度
  - 并发限制
  - 多候选模型路由
  - Provider 资源池路由与资源实例命中审计
  - 非流式 Provider 失败切换
  - 优先级 + 权重调度策略
  - 流式 SSE 响应
  - OpenAI 风格错误格式
  - Request ID
- Provider：
  - Mock Provider，可离线验证完整链路
  - OpenAI-Compatible Adapter
  - Azure OpenAI Adapter
  - Anthropic Adapter
  - Gemini Adapter
- 治理能力：
  - Token 估算
  - 成本估算
  - 用量记录
  - 请求审计
  - 额度告警事件
- Admin API：
  - 所有 `/api/admin/*` 需要 `Authorization: Bearer <admin-token>`
  - `GET /api/admin/overview`
  - `GET|POST /api/admin/projects`
  - `GET|POST /api/admin/projects/{id}/keys`
  - `GET|POST /api/admin/providers`
  - `GET|POST /api/admin/provider-resources`
  - `GET|POST /api/admin/models`
  - `GET /api/admin/usage/summary`
  - `GET /api/admin/usage/breakdown`
  - `GET /api/admin/usage/timeseries`
  - `GET /api/admin/audit/requests`
  - `GET /api/admin/alerts`

### Next.js 前端

目录：`frontend/`

已实现：

- 管理后台首页。
- 参考用量分析类企业后台风格重构的浅色 UI。
- 登录页与管理员会话。
- 总览指标：请求量、Token、成本、错误数、Provider 数。
- 用量柱状图：日粒度 Token 趋势。
- 项目表。
- Provider 表。
- Provider 资源池表。
- 模型表。
- 请求审计表。
- 成本归因表：按项目、模型、Provider 展示 Token 与成本。
- 告警列表。
- 创建项目表单。
- 发放 API Key 表单。
- 新 Key 明文一次性展示。

### 部署与配置

已实现：

- `.env.example`
- 后端 Dockerfile
- 前端 Dockerfile
- Docker Compose 骨架
- `.gitignore`
- README 本地运行说明

## Demo 数据

后端启动时会加载内存 Demo 数据：

- Project：`prj_demo`
- API Key：`thk_demo_local`
- Admin Token：`dev_admin_token`
- Provider：`Mock Provider`
- Provider 资源实例：`rsrc_mock_primary`
- Chat 模型：`gpt-4.1-mini`
- Embedding 模型：`text-embedding-3-small`

## 验证命令

后端：

```bash
cd backend
go test ./...
```

前端：

```bash
cd frontend
npm run typecheck
npm run build
```

Smoke test：

```bash
curl http://localhost:8080/healthz

curl http://localhost:8080/v1/models \
  -H "Authorization: Bearer thk_demo_local"

curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer thk_demo_local" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4.1-mini","messages":[{"role":"user","content":"smoke test"}]}'

curl http://localhost:8080/api/admin/overview \
  -H "Authorization: Bearer dev_admin_token"
```

## 本次验证结果

已通过：

- `go test ./...`
- `npm run typecheck`
- `npm run build`
- `curl /healthz`
- `curl /v1/models`
- `curl /v1/chat/completions`
- `curl /v1/chat/completions` stream 模式
- `curl /api/admin/usage/summary`
- `curl /api/admin/usage/timeseries`
- Admin API 无 Token 返回 `401 invalid_admin_token`
- 浏览器打开 `http://localhost:3000`
- 管理台成功连接 `http://localhost:8080`
- 管理台创建项目
- 管理台发放 API Key

浏览器验证截图：

![TokenHub Admin Screenshot](../frontend-tokenhub-admin-redesign.png)

## 已知限制

当前实现是 MVP 第一阶段，不是生产版本：

- 默认使用 SQLite 持久化；当前尚未支持多节点共享数据库和外部缓存。
- 管理后台已接入本地管理员登录；RBAC、OIDC、LDAP 仍待生产化补齐。
- Provider 资源凭证暂未接入加密存储和 KMS。
- Token 统计是估算，真实 Provider 以响应 usage 为准。
- 流式上游 Provider 的 usage 可能无法从 SSE 中提取，当前会记录为 0 或估算值。
- 流式请求暂不做响应开始后的 Provider failover，避免污染 SSE 协议；后续可实现首字节前 failover。
- CORS 当前为开发友好配置，生产需要改为明确 Origin。
- 告警已落库，但尚未接入通知渠道。
- Docker Compose 默认使用 SQLite volume 持久化；PostgreSQL/Redis 仍是后续生产化部署方向。

## 下一步建议

1. 增加 PostgreSQL 配置：在 GORM 存储层上支持生产主库。
2. 接入 Redis：Key 缓存、额度计数、并发计数、Provider 健康状态。
3. 增加 RBAC、OIDC、LDAP 与企业 SSO。
4. 深化 Provider 资源池，支持资源级粘性会话、运行时熔断、冷却和限流。
5. 完善 Provider 配置后台，包括资源凭证加密、健康检查、模型映射。
6. 增加 OpenAPI 文档和跨端类型生成。
7. 增加真实 Provider 的 contract tests。
8. 增加 Helm Chart 与生产配置模板。
