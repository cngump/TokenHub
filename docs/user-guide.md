# User Guide

Language: English | [简体中文](zh-CN/user-guide.md) | [日本語](ja/user-guide.md)

This guide is for employees and application developers who consume approved AI models through TokenHub.

## What You Can Access

| Area | Purpose |
| --- | --- |
| Overview | See your visible projects, keys, and recent activity |
| API Documentation | Copy the Base URL, review model API examples, and search role-based guidance |
| Model Playground | Test prompts against models that your account can call |
| Available Models | Review models backed by enabled routing rules |
| Key Management | Create or copy API keys under projects assigned to you |
| Usage Analytics | Review requests, tokens, and cost visible to your account |
| Request Logs | Debug failed calls with request IDs |

## Daily Workflow

1. Open **Available Models** or **Model Playground** to confirm which models are callable.
2. Open **Key Management** and choose an assigned project such as `Payments Assistant`.
3. Create an API key only when you need one for an application. Copy the new key immediately because TokenHub shows it once.
4. Configure your application with the TokenHub Base URL and project API key.
5. Use **Usage Analytics** and **Request Logs** to review your own traffic.

## Call the Model API

Use a project API key for model traffic. Console login tokens are not accepted by the model API.

```bash
curl -X POST "http://localhost:8080/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_TOKENHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [
      {"role": "system", "content": "You are an internal enterprise AI assistant."},
      {"role": "user", "content": "Summarize today'\''s support tickets for the Payments project."}
    ],
    "temperature": 0.7,
    "stream": false
  }'
```

## Troubleshooting

| Status | Meaning | What to do |
| --- | --- | --- |
| 401 | Invalid or missing API key | Check the `Authorization` header and make sure the key is active |
| 403 | Project or model is not allowed | Ask your team leader to confirm project membership and model access |
| 429 | Quota or concurrency limit reached | Wait for the quota window to reset or request a quota increase |
| 503 | No healthy route is available | Ask an administrator to check routing rules and provider health |

## Screenshot

![Gateway documentation](assets/screenshots/gateway-en.png)
