# API 设计

## API 分层

TokenHub 暴露两类 API：

| API | 面向对象 | 说明 |
| --- | --- | --- |
| Gateway API | 内部应用、OpenAI SDK、业务服务 | 兼容 OpenAI API 的模型调用入口 |
| Admin API | 管理后台、企业集成、运维系统 | 管理 Provider、Project、Key、Quota、Usage、Audit |

## Gateway API

MVP 优先实现 OpenAI-Compatible API。

### Base URL

```text
https://tokenhub.example.com/v1
```

### 认证

```http
Authorization: Bearer thk_xxx
```

API Key 由 TokenHub 管理后台创建。明文只展示一次，后端数据库只保存哈希。

### 核心端点

| Method | Path | MVP | 说明 |
| --- | --- | --- | --- |
| GET | `/v1/models` | 是 | 返回当前 Key 可访问模型 |
| POST | `/v1/chat/completions` | 是 | Chat Completions |
| POST | `/v1/responses` | 是 | Responses API 常用字段 |
| POST | `/v1/embeddings` | 是 | Embeddings |
| POST | `/v1/images/generations` | 否 | 后续版本 |
| POST | `/v1/audio/transcriptions` | 否 | 后续版本 |

### Chat Completions 示例

```http
POST /v1/chat/completions
Authorization: Bearer thk_project_key
Content-Type: application/json
```

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "用三句话解释企业 AI Gateway 的价值"
    }
  ],
  "stream": false
}
```

### 响应头

| Header | 说明 |
| --- | --- |
| `x-request-id` | TokenHub 请求 ID |
| `x-tokenhub-project-id` | 项目 ID |
| `x-tokenhub-provider` | 实际路由到的 Provider |
| `x-tokenhub-model` | 实际调用的 Provider 模型 |
| `x-tokenhub-route-id` | 实际命中的路由规则 |
| `x-tokenhub-route-attempts` | 本次请求尝试过的路由次数 |
| `x-tokenhub-quota-remaining-tokens` | 可选，剩余 Token 额度 |

### 错误格式

兼容 OpenAI 风格，同时增加 TokenHub 可诊断字段。

```json
{
  "error": {
    "message": "Project monthly token quota exceeded",
    "type": "quota_exceeded",
    "param": "model",
    "code": "project_monthly_token_quota_exceeded"
  },
  "request_id": "req_01hxx..."
}
```

### 错误码

| HTTP | code | 说明 |
| --- | --- | --- |
| 401 | `invalid_api_key` | Key 不存在或格式无效 |
| 403 | `api_key_disabled` | Key 被禁用或吊销 |
| 403 | `model_not_allowed` | 模型不在白名单 |
| 429 | `rate_limit_exceeded` | 请求频率或并发超过限制 |
| 429 | `quota_exceeded` | 日/月额度耗尽 |
| 502 | `provider_error` | 上游 Provider 返回错误 |
| 503 | `provider_unavailable` | 无可用 Provider |
| 504 | `provider_timeout` | 上游超时 |

## Provider 适配

### 模型别名

内部应用看到的是统一模型名：

```text
gpt-4.1-mini
claude-sonnet
gemini-flash
qwen-plus
deepseek-chat
local-coder
```

后台可配置映射：

| 统一模型 | Provider | Provider 模型/部署 |
| --- | --- | --- |
| `gpt-4.1-mini` | OpenAI | `gpt-4.1-mini` |
| `gpt-4.1-mini` | Azure OpenAI | deployment `gpt-4-1-mini-prod` |
| `claude-sonnet` | Anthropic | `claude-sonnet-4-5` |
| `gemini-flash` | Gemini | `gemini-2.5-flash` |
| `local-coder` | vLLM | `qwen2.5-coder` |

### 路由调度

MVP 当前已支持一个统一模型对应多个候选路由：

- 先按 `priority` 从小到大分层。
- 默认策略 `priority_weighted`：同一优先级内按 `weight` 做加权选择，未命中的同级候选作为后续 failover 候选。
- 可选策略 `priority_only`：同一优先级内按权重和创建顺序稳定排序，不做加权选择。
- Provider 必须是 `active` 且健康状态为 healthy。
- 非流式请求遇到 429、502、503、504 或 5xx 会尝试下一个候选路由。
- 流式请求在 SSE 开始写入后不会切换 Provider，后续版本可实现首字节前 failover。

### Adapter 职责

Adapter 只处理以下工作：

- 请求字段转换。
- 响应字段转换。
- 流式协议转换。
- Provider 错误归一化。
- Token 用量提取。
- Provider 特有认证。

Adapter 不处理：

- API Key 鉴权。
- 项目权限。
- 额度判断。
- 成本归属。
- 审计落库。

## Admin API

### 认证

MVP 可以先使用管理员账号密码 + Session/JWT。企业版本支持 OIDC、LDAP、SAML 或企业微信/飞书/钉钉 SSO。

### 端点规划

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/admin/auth/login` | 管理员登录 |
| POST | `/api/admin/auth/logout` | 登出 |
| GET | `/api/admin/me` | 当前用户 |
| GET | `/api/admin/projects` | 项目列表 |
| POST | `/api/admin/projects` | 创建项目 |
| GET | `/api/admin/projects/{id}` | 项目详情 |
| PATCH | `/api/admin/projects/{id}` | 更新项目 |
| GET | `/api/admin/projects/{id}/keys` | 项目 Key 列表 |
| POST | `/api/admin/projects/{id}/keys` | 创建项目 Key |
| PATCH | `/api/admin/keys/{id}` | 更新 Key 策略 |
| POST | `/api/admin/keys/{id}/rotate` | 轮换 Key |
| POST | `/api/admin/keys/{id}/revoke` | 吊销 Key |
| GET | `/api/admin/providers` | Provider 列表 |
| POST | `/api/admin/providers` | 创建 Provider |
| PATCH | `/api/admin/providers/{id}` | 更新 Provider |
| POST | `/api/admin/providers/{id}/test` | 测试 Provider 连接 |
| GET | `/api/admin/models` | 统一模型列表 |
| POST | `/api/admin/models` | 创建统一模型 |
| GET | `/api/admin/routing-rules` | 路由规则列表 |
| POST | `/api/admin/routing-rules` | 创建路由规则 |
| GET | `/api/admin/usage/summary` | 用量汇总 |
| GET | `/api/admin/usage/timeseries` | 用量趋势 |
| GET | `/api/admin/audit/requests` | 请求审计 |
| GET | `/api/admin/audit/events` | 管理审计 |
| GET | `/api/admin/alerts` | 告警列表 |
| POST | `/api/admin/alerts/rules` | 创建告警规则 |

### 创建 Key 示例

```json
{
  "name": "production-app",
  "expires_at": "2026-12-31T23:59:59Z",
  "allowed_models": ["gpt-4.1-mini", "claude-sonnet"],
  "limits": {
    "daily_tokens": 1000000,
    "monthly_tokens": 20000000,
    "daily_cost_usd": 100,
    "monthly_cost_usd": 2000,
    "max_concurrency": 20
  }
}
```

创建成功响应：

```json
{
  "id": "key_01hxx...",
  "api_key": "thk_xxx",
  "name": "production-app",
  "plain_text_visible_once": true
}
```

## API 版本策略

- Gateway API 跟随 OpenAI 路径，以 `/v1` 暴露。
- Admin API 使用 `/api/admin`，后续如有破坏性变更可增加 `/api/admin/v2`。
- Provider Adapter 内部接口不对外承诺稳定。

## 兼容性要求

MVP 至少验证：

- OpenAI 官方 SDK 设置 `baseURL` 后可调用。
- 支持 stream 与非 stream。
- 错误结构对常见 SDK 友好。
- `model` 字段可以使用 TokenHub 的统一模型别名。
