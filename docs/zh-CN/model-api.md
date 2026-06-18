# 模型 API

Language: [English](../model-api.md) | 简体中文 | [日本語](../ja/model-api.md)

TokenHub 提供 OpenAI-Compatible 的模型接口。业务应用可以把 OpenAI 兼容 SDK 的 `baseURL` 指向 TokenHub，并使用 TokenHub 发放的 API Key。

## Base URL

```text
http://localhost:8080/v1
```

生产环境请使用自己的 HTTPS 域名。

## 认证

使用 Bearer Token 传入 TokenHub API Key：

```http
Authorization: Bearer thk_xxx
```

API Key 会受到项目、状态、过期时间、模型白名单、额度和并发限制影响。

## 查询模型

```bash
curl http://localhost:8080/v1/models \
  -H "Authorization: Bearer thk_xxx"
```

返回结果只包含当前 Key 可见的模型。

## Chat Completions

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "user", "content": "用一句话介绍 TokenHub。"}
    ]
  }'
```

这里的 `model` 是 TokenHub 对外暴露的统一模型名。TokenHub 会按路由策略转发到配置好的上游 Provider 模型。

## Responses API

```bash
curl http://localhost:8080/v1/responses \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1-mini",
    "input": "用一句话总结 TokenHub。"
  }'
```

## Embeddings

```bash
curl http://localhost:8080/v1/embeddings \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "TokenHub"
  }'
```

## 路由概念

- 统一模型：业务应用调用 TokenHub 时使用的模型名。
- 上游模型：Provider 真正接受的模型名或部署名。
- 路由：统一模型到 Provider 和上游模型的映射。
- 优先级和权重：多个 Provider 路由同时存在时，用于控制调用顺序和分配比例。

## 错误

错误响应包含 `error.code`、`error.message`、`error.type`。响应体还会包含 `request_id`，可用于在请求日志中排查问题。

常见错误：

| Code | 含义 |
| --- | --- |
| `invalid_api_key` | Key 缺失或无效 |
| `api_key_disabled` | Key 或项目已禁用 |
| `model_not_allowed` | 当前 Key 不能调用该模型 |
| `quota_exceeded` | 请求、Token、成本或并发额度超限 |
| `provider_missing` | 该模型没有可用健康路由 |
| `provider_error` | 上游 Provider 返回错误 |
