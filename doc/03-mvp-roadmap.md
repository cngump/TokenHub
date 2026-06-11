# MVP 与路线图

## MVP 目标

MVP 的目标不是做完整平台，而是做出企业愿意试点的最小闭环：

- 内部应用可以使用 OpenAI SDK 调用 TokenHub。
- 管理员可以配置 Provider、项目、API Key、模型白名单和额度。
- 每次调用都能记录项目、Key、模型、Token、成本、状态、延迟和路由结果。
- 超额、禁用、无权限、Provider 不可用时有清晰错误。
- 管理后台可以查看用量、成本、审计和告警。

## MVP 功能清单

### 1. OpenAI-Compatible Gateway

| 功能 | 范围 |
| --- | --- |
| `/v1/chat/completions` | 支持 JSON 与流式响应 |
| `/v1/responses` | 支持基础文本生成，先覆盖常用字段 |
| `/v1/embeddings` | 支持文本向量 |
| `/v1/models` | 返回项目可用模型列表 |
| 标准错误 | 兼容 OpenAI 风格错误结构 |
| Request ID | 每次请求返回唯一追踪 ID |

### 2. Provider Adapter

| Provider | MVP 支持方式 |
| --- | --- |
| OpenAI | 原生 Chat、Responses、Embeddings |
| Azure OpenAI | 通过 deployment 映射模型 |
| Anthropic Claude | Chat 请求转换为 Messages API |
| Google Gemini | Chat 请求转换为 Gemini Generate Content |
| DeepSeek | OpenAI-Compatible |
| Qwen | OpenAI-Compatible 或 DashScope 适配 |
| vLLM/Ollama | OpenAI-Compatible 或本地 Adapter |

### 3. Project + API Key

| 功能 | 范围 |
| --- | --- |
| 项目管理 | 创建、编辑、禁用、归属团队 |
| Key 管理 | 创建、启停、吊销、过期时间 |
| Key 安全 | 明文只展示一次，数据库只存哈希 |
| 模型白名单 | Key 或项目维度限制可用模型 |
| 并发限制 | Key 或项目维度限制并发请求 |

### 4. 额度与用量

| 功能 | 范围 |
| --- | --- |
| 日额度 | 请求数、Token、成本 |
| 月额度 | 请求数、Token、成本 |
| 实时检查 | Redis 计数，超额拒绝 |
| 统计聚合 | 按小时、天、月聚合 |
| 成本计算 | 按模型单价估算输入、输出和总成本 |

### 5. 审计与告警

| 功能 | 范围 |
| --- | --- |
| 请求审计 | 记录元信息、项目、Key、模型、Provider、状态 |
| 管理审计 | 记录后台配置变更 |
| 脱敏 | 默认不持久化完整 Prompt，可配置摘要或哈希 |
| 告警 | 额度耗尽、错误率升高、Provider 不可用、成本突增 |
| 通知 | MVP 支持 Webhook，后续支持飞书、钉钉、企业微信 |

## 版本路线图

### v0.1 文档与工程基础

- 完成产品规划文档。
- 初始化 Go 后端工程。
- 初始化 Next.js 前端工程。
- 配置 Docker Compose：PostgreSQL、Redis、Backend、Frontend。
- 建立基础 CI：lint、test、build。

### v0.2 网关最小链路

- API Key 鉴权。
- `/v1/chat/completions` 非流式转发。
- OpenAI Provider Adapter。
- 请求日志和基础用量记录。
- 健康检查接口。

### v0.3 MVP 核心闭环

- 支持流式响应。
- 支持 Azure OpenAI、DeepSeek、Qwen、vLLM/Ollama。
- Project、API Key、模型白名单、额度管理。
- Usage 统计聚合。
- 管理后台基础页面。

### v0.4 企业试点版本

- 支持 Anthropic Claude、Google Gemini。
- 路由策略、失败重试、Provider 健康检查。
- 审计日志、告警规则、Webhook 通知。
- Docker Compose 部署文档。
- 基础 Helm Chart。

### v0.5 企业增强版本

- OIDC、LDAP、SSO。
- 团队、部门、RBAC。
- 成本报表、预算周期、导出。
- 脱敏策略、敏感词策略。
- 多租户隔离增强。

### v1.0 商业可用版本

- 高可用部署。
- 离线部署包。
- 审计报表。
- 完整 Helm Chart。
- 备份恢复。
- 版本升级与数据库迁移策略。
- 企业集成：飞书、钉钉、企业微信。

## MVP 验收标准

| 能力 | 验收标准 |
| --- | --- |
| SDK 接入 | OpenAI SDK 修改 `baseURL` 和 `apiKey` 后可调用 |
| 流式响应 | Chat Completions stream 模式可稳定返回 SSE |
| 鉴权 | 无效、禁用、过期 Key 被拒绝 |
| 权限 | Key 访问未授权模型时被拒绝 |
| 额度 | 达到日/月额度后被拒绝并返回明确错误 |
| 统计 | 请求完成后可查询 Token、成本、延迟、状态 |
| 审计 | 可以按项目、Key、模型、时间查询调用记录 |
| 后台 | 管理员可完成 Provider、Project、Key、Quota 的基本配置 |
| 部署 | Docker Compose 一条命令启动可用环境 |

## 暂缓能力

这些功能不进入 MVP：

- 支付系统和自助充值。
- 非授权账号账号池。
- 复杂代理池和账号风控。
- 模型质量自动评分。
- 多区域跨集群调度。
- 完整工单系统。
- 面向个人用户的 SaaS 化套餐体系。

