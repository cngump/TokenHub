# Model API

Language: English | [简体中文](zh-CN/model-api.md) | [日本語](ja/model-api.md)

TokenHub exposes OpenAI-compatible model endpoints. Applications can point an OpenAI-compatible SDK to TokenHub and use an API key issued by TokenHub.

## Base URL

```text
http://localhost:8080/v1
```

Production deployments should use your own HTTPS domain.

## Authentication

Send the TokenHub API key as a Bearer token:

```http
Authorization: Bearer thk_xxx
```

API keys are scoped by project, status, expiration time, model allowlist, quota, and concurrency settings.

## List Models

```bash
curl http://localhost:8080/v1/models \
  -H "Authorization: Bearer thk_xxx"
```

The response only includes models visible to the current key.

## Chat Completions

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "user", "content": "Say hello in one sentence."}
    ]
  }'
```

The `model` field is the unified model name exposed by TokenHub. TokenHub routes it to the configured upstream Provider model.

## Responses API

```bash
curl http://localhost:8080/v1/responses \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1-mini",
    "input": "Summarize TokenHub in one sentence."
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

## Routing Concepts

- Unified model: the model name used by applications when calling TokenHub.
- Upstream model: the model or deployment name accepted by the Provider.
- Route: the mapping from one unified model to one Provider and upstream model.
- Priority and weight: controls Provider order and distribution when multiple routes exist.

## Errors

Errors use a JSON body with `error.code`, `error.message`, and `error.type`. Responses also include a `request_id` that can be used in request logs.

Common errors:

| Code | Meaning |
| --- | --- |
| `invalid_api_key` | The key is missing or invalid |
| `api_key_disabled` | The key or project is disabled |
| `model_not_allowed` | The key cannot access the requested model |
| `quota_exceeded` | Request, token, cost, or concurrency quota was exceeded |
| `provider_missing` | No healthy route is available for the model |
| `provider_error` | The selected upstream Provider returned an error |
