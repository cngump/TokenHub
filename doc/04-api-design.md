# TokenHub API 文档

TokenHub 对外暴露两类 API：

| 分组 | 前缀 | 使用对象 | 认证方式 |
| --- | --- | --- | --- |
| AI 模型接口 | `/v1` | 内部业务应用、OpenAI SDK、AI 应用服务 | 项目 API Key |
| 后台管理接口 | `/api/admin` | TokenHub 管理后台、运维工具、企业集成系统 | 管理员会话 Token |

本文件描述当前产品主线接口。未列入本文档的 OpenAI 扩展接口，如 Images、Audio、Files、Batches，属于增强方向。

## 通用约定

### Base URL

本地开发：

```text
http://localhost:8080
```

生产部署示例：

```text
https://tokenhub.example.com
```

### Content-Type

除 CSV 下载和 SQLite 备份下载外，请求体均使用 JSON：

```http
Content-Type: application/json
```

### 错误格式

TokenHub 使用接近 OpenAI 的错误结构，便于 SDK 和业务系统统一处理。

```json
{
  "error": {
    "message": "Model is not allowed for this API key",
    "type": "model_not_allowed",
    "param": "",
    "code": "model_not_allowed"
  },
  "request_id": "req_xxx"
}
```

常见错误码：

| HTTP | code | 说明 |
| --- | --- | --- |
| 400 | `invalid_request` | 请求体无法解析或字段不合法 |
| 400 | `missing_model` | 缺少模型名 |
| 401 | `invalid_api_key` | AI 模型接口 API Key 无效 |
| 401 | `invalid_admin_token` | 后台管理接口 Token 无效或已过期 |
| 403 | `api_key_disabled` | API Key 被禁用 |
| 403 | `api_key_expired` | API Key 已过期 |
| 403 | `model_not_allowed` | API Key 不允许调用该模型 |
| 403 | `admin_forbidden` | 当前管理员无权限执行该操作 |
| 429 | `rate_limit_exceeded` | 请求频率或并发超过限制 |
| 429 | `quota_exceeded` | Key、项目、用户或团队额度耗尽 |
| 502 | `provider_error` | 上游 Provider 返回错误 |
| 503 | `provider_unavailable` | 没有可用 Provider 路由 |
| 504 | `provider_timeout` | 上游 Provider 超时 |

## AI 模型接口

AI 模型接口面向企业内部应用，整体兼容 OpenAI API 的核心调用方式。业务应用可以把 OpenAI SDK 的 `baseURL` 指向 TokenHub，并使用 TokenHub 发放的项目 API Key。

### 认证

```http
Authorization: Bearer thk_xxx
```

API Key 由后台管理接口或管理后台创建。明文只返回一次，TokenHub 数据库只保存哈希、前缀和后缀。

### 路由与治理行为

每次模型调用会经过以下治理链路：

1. 校验 API Key、过期时间、状态、IP 白名单和并发。
2. 校验项目状态、模型白名单、日/月请求额度、Token 额度和成本额度。
3. 按统一模型名查询启用的路由规则。
4. 按 `priority`、`weight`、`strategy` 和健康状态选择 Provider。
5. 调用上游 Provider Adapter。
6. 记录请求日志、路由尝试、Token 用量和成本归因。

### 响应头

模型调用成功时会返回路由诊断头：

| Header | 说明 |
| --- | --- |
| `x-request-id` | TokenHub 请求 ID |
| `x-tokenhub-project-id` | 项目 ID |
| `x-tokenhub-provider` | 命中的 Provider ID |
| `x-tokenhub-provider-resource-id` | 命中的 Provider 资源 ID，未启用资源池时可为空 |
| `x-tokenhub-model` | 实际 Provider 模型名 |
| `x-tokenhub-route-id` | 命中的路由规则 ID |
| `x-tokenhub-route-attempts` | 本次请求尝试过的路由次数 |

### 接口列表

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/v1/models` | 获取当前 API Key 可访问的模型列表 |
| POST | `/v1/chat/completions` | Chat Completions，兼容 OpenAI 核心字段 |
| POST | `/v1/responses` | Responses API 常用字段 |
| POST | `/v1/embeddings` | Embeddings |

### 获取模型列表

```http
GET /v1/models
Authorization: Bearer thk_xxx
```

响应示例：

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4.1-mini",
      "object": "model",
      "owned_by": "tokenhub"
    },
    {
      "id": "deepseek-chat",
      "object": "model",
      "owned_by": "tokenhub"
    }
  ]
}
```

### Chat Completions

```http
POST /v1/chat/completions
Authorization: Bearer thk_xxx
Content-Type: application/json
```

请求字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | TokenHub 对外统一模型名 |
| `messages` | array | 是 | OpenAI Chat Message 格式 |
| `stream` | boolean | 否 | 是否使用 SSE 流式响应 |
| `max_tokens` | number | 否 | 最大输出 Token |
| `temperature` | number | 否 | 采样温度 |
| `metadata` | object | 否 | 业务自定义元数据 |

请求示例：

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "system",
      "content": "你是企业内部知识助手。"
    },
    {
      "role": "user",
      "content": "用三句话说明 TokenHub 的价值。"
    }
  ],
  "temperature": 0.2,
  "stream": false
}
```

响应由实际 Provider Adapter 归一化返回。OpenAI-Compatible Provider 会透传 OpenAI 风格响应：

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1760000000,
  "model": "gpt-4.1-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "TokenHub 为企业提供统一的 AI 调用入口..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 32,
    "completion_tokens": 64,
    "total_tokens": 96
  }
}
```

流式请求：

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "写一个发布说明。"
    }
  ],
  "stream": true
}
```

响应：

```http
Content-Type: text/event-stream
```

说明：当前版本非流式请求支持在 429、502、503、504 或 5xx 上游错误时尝试下一条候选路由。流式响应一旦开始写入 SSE，就不会切换 Provider。

### Responses

```http
POST /v1/responses
Authorization: Bearer thk_xxx
Content-Type: application/json
```

请求字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | TokenHub 对外统一模型名 |
| `input` | string/object/array | 是 | Responses 输入内容 |
| `stream` | boolean | 否 | 当前按非流式处理 |
| `max_output_tokens` | number | 否 | 最大输出 Token |
| `temperature` | number | 否 | 采样温度 |

请求示例：

```json
{
  "model": "gpt-4.1-mini",
  "input": "把这段话改写成正式的企业公告。",
  "max_output_tokens": 800
}
```

说明：OpenAI-Compatible Provider 调用 `/responses`；Anthropic 和 Gemini Adapter 会将该请求转换为对话式调用。

### Embeddings

```http
POST /v1/embeddings
Authorization: Bearer thk_xxx
Content-Type: application/json
```

请求字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | string | 是 | Embedding 模型名 |
| `input` | string/array | 是 | 待向量化文本 |

请求示例：

```json
{
  "model": "text-embedding-3-small",
  "input": [
    "TokenHub 是企业 AI Gateway。",
    "它提供模型路由、额度治理和审计。"
  ]
}
```

响应示例：

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0123, -0.0456]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 18,
    "total_tokens": 18
  }
}
```

### SDK 接入示例

Node.js：

```ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.TOKENHUB_API_KEY,
  baseURL: "http://localhost:8080/v1",
});

const completion = await client.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [{ role: "user", content: "hello" }],
});
```

Python：

```python
from openai import OpenAI

client = OpenAI(
    api_key="thk_xxx",
    base_url="http://localhost:8080/v1",
)

resp = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "hello"}],
)
```

## 后台管理接口

后台管理接口服务于 Next.js 管理后台和企业自动化系统，用于管理用户、项目、API Key、Provider、模型目录、路由策略、用量统计、审计、告警、审批、账单和备份。

### 认证

登录后获取管理员会话 Token：

```http
POST /api/admin/auth/login
Content-Type: application/json
```

```json
{
  "identity": "admin",
  "password": "admin123456"
}
```

响应：

```json
{
  "token": "tha_session_xxx",
  "expires_at": "2026-06-15T12:00:00Z",
  "user": {
    "id": "usr_admin",
    "username": "admin",
    "name": "平台管理员",
    "role": "admin",
    "status": "active"
  }
}
```

后续请求使用：

```http
Authorization: Bearer tha_session_xxx
```

开发环境也可使用 `TOKENHUB_ADMIN_TOKEN` 指定的静态管理 Token。

### 权限说明

后台接口会按资源域做权限校验。当前常见权限域包括：

| 权限域 | 说明 |
| --- | --- |
| `overview` | 总览与控制台数据 |
| `identity` | 后台用户与角色 |
| `project` | 项目空间 |
| `api_key` | API Key |
| `provider` | Provider 与 Provider 模板 |
| `model` | 标准模型目录 |
| `routing` | 路由策略与演练场 |
| `usage` | 用量、成本、账单、导出 |
| `audit` | 请求审计、管理审计 |
| `alert` | 告警事件和通知 |
| `approval` | 审批流和审批记录 |
| `backup` | SQLite 备份和恢复 |

### 后台接口总览

#### 认证与总览

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/admin/auth/login` | 管理员登录 |
| POST | `/api/admin/auth/logout` | 退出登录 |
| GET | `/api/admin/auth/me` | 获取当前管理员 |
| GET | `/api/admin/overview` | 控制台总览数据 |
| POST | `/api/admin/playground/chat` | 管理员模型演练场调用 |

#### 项目空间

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/projects` | 项目列表 |
| POST | `/api/admin/projects` | 创建项目 |
| PATCH | `/api/admin/projects/{project_id}` | 更新项目 |
| DELETE | `/api/admin/projects/{project_id}` | 删除项目 |
| GET | `/api/admin/projects/{project_id}/keys` | 获取项目下 API Key |
| POST | `/api/admin/projects/{project_id}/keys` | 在项目下创建 API Key |
| POST | `/api/admin/projects/{project_id}/quota-increase` | 提交项目额度提升申请 |

#### API Key

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/api-keys` | 全部 API Key 列表 |
| PATCH | `/api/admin/api-keys/{key_id}` | 更新 Key 策略 |
| DELETE | `/api/admin/api-keys/{key_id}` | 删除或吊销 Key |
| POST | `/api/admin/api-keys/{key_id}/rotate` | 轮换 Key |

#### 后台用户

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/users` | 后台用户列表 |
| POST | `/api/admin/users` | 创建后台用户 |
| PATCH | `/api/admin/users/{user_id}` | 更新后台用户 |
| DELETE | `/api/admin/users/{user_id}` | 删除后台用户 |

#### Provider 渠道与模板

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/provider-catalog` | Provider 模板列表 |
| GET | `/api/admin/provider-catalog/{catalog_id}` | Provider 模板详情和模型列表 |
| GET | `/api/admin/providers` | Provider 列表 |
| POST | `/api/admin/providers` | 创建 Provider，可从模板生成路由 |
| PATCH | `/api/admin/providers/{provider_id}` | 更新 Provider，可追加模型路由 |
| DELETE | `/api/admin/providers/{provider_id}` | 删除 Provider |
| POST | `/api/admin/providers/{provider_id}/test` | 测试 Provider 连接 |
| POST | `/api/admin/providers/{provider_id}/health` | 手动设置 Provider 健康状态 |

#### Provider 资源池

Provider 资源池是高级扩展能力，用于同一个 Provider 下管理多区域、多 Key 或多本地集群。默认产品主流程推荐直接用多个 Provider 表达多上游备份。

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/provider-resources` | Provider 资源列表 |
| POST | `/api/admin/provider-resources` | 创建 Provider 资源 |
| PATCH | `/api/admin/provider-resources/{resource_id}` | 更新 Provider 资源 |
| DELETE | `/api/admin/provider-resources/{resource_id}` | 删除 Provider 资源 |
| POST | `/api/admin/provider-resources/{resource_id}/test` | 测试资源连接 |
| POST | `/api/admin/provider-resources/{resource_id}/health` | 设置资源健康状态 |
| POST | `/api/admin/provider-resources/bulk` | 批量启用、禁用、删除等操作 |
| POST | `/api/admin/provider-resources/import` | 批量导入资源 |

#### 模型目录与路由策略

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/models` | 标准模型目录 |
| POST | `/api/admin/models` | 创建标准模型，可附带路由 |
| PATCH | `/api/admin/models/{model_name}` | 更新标准模型 |
| DELETE | `/api/admin/models/{model_name}` | 删除标准模型 |
| GET | `/api/admin/routing-rules` | 路由规则列表 |
| POST | `/api/admin/routing-rules` | 创建路由规则 |
| PATCH | `/api/admin/routing-rules/{route_id}` | 更新路由规则 |
| DELETE | `/api/admin/routing-rules/{route_id}` | 删除路由规则 |
| GET | `/api/admin/routing-rules/{route_id}/explain?model={model}` | 查看某个模型的候选路由排序 |

#### 企业治理资源

通用资源接口用于团队、项目额度、成本中心、报表、通知渠道、安全策略等后台配置。资源类型通过 `{kind}` 区分。

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/resources/{kind}` | 获取某类资源列表 |
| POST | `/api/admin/resources/{kind}` | 创建资源 |
| PATCH | `/api/admin/resources/{kind}/{id}` | 更新资源 |
| DELETE | `/api/admin/resources/{kind}/{id}` | 删除资源 |
| POST | `/api/admin/resources/monitors/{id}/run` | 手动运行健康监控 |

常用 `kind`：

| kind | 页面/能力 |
| --- | --- |
| `teams` | 团队分组 |
| `quota-policies` | 项目额度配置 |
| `cost-centers` | 成本中心 |
| `reports` | 导出报表 |
| `notification-channels` | 通知渠道 |
| `monitors` | 健康监控 |
| `security-policies` | 安全策略 |
| `proxies` | 代理出口 |
| `announcements` | 公告通知 |
| `settings` | 系统设置 |
| `role-configs` | 角色配置 |
| `identity-providers` | 身份源配置 |

#### 用量、成本与导出

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/usage/summary` | 用量汇总 |
| GET | `/api/admin/usage/breakdown` | 按项目、模型、Provider、成本中心聚合 |
| GET | `/api/admin/usage/timeseries` | 最近 31 天用量趋势 |
| GET | `/api/admin/export/{kind}` | 导出 CSV |

常见导出 `kind`：`requests`、`usage`、`cost-centers`、`approvals`、`audit-events`、`alert-deliveries`。

#### 审计与告警

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/audit/requests` | 请求日志列表 |
| GET | `/api/admin/audit/requests/{request_id}` | 请求详情和路由尝试 |
| GET | `/api/admin/audit/events` | 管理操作审计 |
| GET | `/api/admin/alerts` | 告警事件列表 |
| POST | `/api/admin/alerts/{alert_id}/deliver` | 手动发送告警通知 |
| GET | `/api/admin/alert-deliveries` | 告警通知记录 |

#### 审批

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/approvals` | 审批记录列表 |
| POST | `/api/admin/approvals/{approval_id}/approve` | 通过审批并应用变更 |
| POST | `/api/admin/approvals/{approval_id}/reject` | 驳回审批 |

#### SQLite 数据备份

| Method | Path | 说明 |
| --- | --- | --- |
| GET | `/api/admin/sqlite/backups` | 备份列表 |
| POST | `/api/admin/sqlite/backups` | 创建备份 |
| GET | `/api/admin/sqlite/backups/{backup_id}` | 备份详情 |
| DELETE | `/api/admin/sqlite/backups/{backup_id}` | 删除备份 |
| GET | `/api/admin/sqlite/backups/{backup_id}/download` | 下载备份文件 |
| POST | `/api/admin/sqlite/backups/{backup_id}/restore` | 恢复备份 |

恢复备份需要确认短语：

```json
{
  "confirmation": "RESTORE backup_xxx"
}
```

### 核心接口示例

#### 创建项目

```http
POST /api/admin/projects
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "id": "prj_sales_ai",
  "name": "销售 AI 应用",
  "team_id": "team_sales",
  "owner_user_id": "usr_admin",
  "cost_center": "SALES-AI",
  "status": "active"
}
```

#### 创建项目 API Key

```http
POST /api/admin/projects/prj_sales_ai/keys
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "name": "sales-production",
  "group": "production",
  "allowed_models": ["gpt-4.1-mini", "deepseek-chat"],
  "ip_allowlist": ["10.0.0.0/8"],
  "limits": {
    "daily_requests": 10000,
    "monthly_requests": 300000,
    "daily_tokens": 1000000,
    "monthly_tokens": 20000000,
    "daily_cost_usd": 100,
    "monthly_cost_usd": 2000,
    "max_concurrency": 20
  },
  "expires_at": "2026-12-31T23:59:59Z"
}
```

成功响应：

```json
{
  "id": "key_xxx",
  "api_key": "thk_live_xxx",
  "name": "sales-production",
  "project_id": "prj_sales_ai",
  "plain_text_visible_once": true
}
```

#### 创建 Provider 并生成标准模型路由

```http
POST /api/admin/providers
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "catalog_id": "openai",
  "name": "OpenAI 企业账号",
  "type": "openai",
  "base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxx",
  "status": "active",
  "healthy": true,
  "priority": 10,
  "model_category": "openai",
  "create_routes": true,
  "selected_models": ["gpt-4.1-mini", "gpt-5"]
}
```

响应：

```json
{
  "provider": {
    "id": "prv_openai",
    "name": "OpenAI 企业账号",
    "type": "openai",
    "base_url": "https://api.openai.com/v1",
    "status": "active",
    "healthy": true,
    "priority": 10
  },
  "created_routes": 2,
  "model_names": ["gpt-4.1-mini", "gpt-5"],
  "route_ids": ["route_xxx"],
  "catalog_source": "public-provider-conf"
}
```

说明：编辑 Provider 时如果 `api_key` 为空，表示不修改现有 Key；只有传入新值才会覆盖。

#### 创建路由策略

```http
POST /api/admin/routing-rules
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "model_name": "gpt-4.1-mini",
  "provider_id": "prv_openai",
  "provider_model": "gpt-4.1-mini",
  "priority": 1,
  "weight": 100,
  "strategy": "priority_weighted",
  "sticky_session": false,
  "status": "active"
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `model_name` | 企业内部对外暴露的统一模型名 |
| `provider_id` | 上游 Provider ID |
| `provider_model` | 实际上游模型名或 Azure deployment |
| `priority` | 优先级，数字越小越优先 |
| `weight` | 同优先级下的权重 |
| `strategy` | `priority_weighted` 或 `priority_only` |
| `sticky_session` | 是否按 Key/项目做稳定粘滞路由 |
| `status` | `active` 或 `disabled` |

#### 路由解释

```http
GET /api/admin/routing-rules/route_xxx/explain?model=gpt-4.1-mini&project_id=prj_sales_ai&api_key_id=key_xxx
Authorization: Bearer tha_session_xxx
```

响应：

```json
{
  "data": [
    {
      "route_id": "route_xxx",
      "provider_id": "prv_openai",
      "resource_id": "",
      "provider_model": "gpt-4.1-mini",
      "priority": 1,
      "resource_priority": 0,
      "weight": 100,
      "strategy": "priority_weighted",
      "status": "candidate"
    }
  ]
}
```

#### 模型演练场

```http
POST /api/admin/playground/chat
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "model": "gpt-4.1-mini",
  "messages": [
    {
      "role": "user",
      "content": "测试当前路由是否可用。"
    }
  ],
  "stream": false
}
```

响应会额外返回命中的路由和尝试记录：

```json
{
  "response": {},
  "route": {
    "route_id": "route_xxx",
    "provider_id": "prv_openai",
    "provider_name": "OpenAI 企业账号",
    "provider_model": "gpt-4.1-mini",
    "priority": 1,
    "weight": 100,
    "strategy": "priority_weighted"
  },
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 40,
    "total_tokens": 60,
    "estimated_cost_usd": 0.00012
  },
  "attempts": [],
  "request_id": "pg_xxx"
}
```

#### 用量汇总

```http
GET /api/admin/usage/summary
Authorization: Bearer tha_session_xxx
```

响应：

```json
{
  "request_count": 1200,
  "input_tokens": 300000,
  "output_tokens": 120000,
  "total_tokens": 420000,
  "estimated_cost_usd": 12.34,
  "errors": 3
}
```

#### 创建 SQLite 备份

```http
POST /api/admin/sqlite/backups
Authorization: Bearer tha_session_xxx
Content-Type: application/json
```

```json
{
  "expire_days": 30
}
```

## API 版本策略

- AI 模型接口沿用 OpenAI 风格路径，以 `/v1` 暴露。
- 后台管理接口当前使用 `/api/admin`，后续如出现破坏性变更，可增加 `/api/admin/v2`。
- Provider Adapter 是内部实现，不对外承诺稳定协议。

## 增强方向

| 能力 | 计划说明 |
| --- | --- |
| Images API | 支持 `/v1/images/generations` 并纳入模型目录的 image 类模型 |
| Audio API | 支持语音转写、TTS、实时语音 |
| Files/Batches | 支持离线任务和批处理 |
| OpenAPI 导出 | 生成 `openapi.json`，可导入 Apifox、Swagger、Postman |
| 企业 SSO | OIDC、LDAP、SAML、飞书、钉钉、企业微信 |
