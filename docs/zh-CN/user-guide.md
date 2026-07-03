# 普通用户指南

Language: [English](../user-guide.md) | 简体中文 | [日本語](../ja/user-guide.md)

本指南面向通过 TokenHub 消费企业已批准 AI 模型的员工和应用开发者。

## 你可以访问什么

| 区域 | 用途 |
| --- | --- |
| Overview | 查看可见项目、Key 和最近活动 |
| API Documentation | 复制 Base URL，查看模型 API 示例，搜索角色指南 |
| Model Playground | 使用账号可调用模型测试提示词 |
| Available Models | 查看已经配置启用路由的模型 |
| Key Management | 在被分配的项目下创建或复制 API Key |
| Usage Analytics | 查看当前账号可见的请求、Token 和成本 |
| Request Logs | 使用 request ID 排查失败调用 |

## 日常流程

1. 打开 **Available Models** 或 **Model Playground**，确认哪些模型可以调用。
2. 打开 **Key Management**，选择被分配的项目，例如 `Payments Assistant`。
3. 只有应用需要时才创建 API Key。新 Key 只展示一次，请立即复制。
4. 在应用里配置 TokenHub Base URL 和项目 API Key。
5. 使用 **Usage Analytics** 和 **Request Logs** 查看自己的调用流量。

## 调用模型 API

模型流量使用项目 API Key。控制台登录 Token 不能用于模型 API。

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

## 排查问题

| 状态 | 含义 | 处理方式 |
| --- | --- | --- |
| 401 | API Key 无效或缺失 | 检查 `Authorization` header，确认 Key 处于启用状态 |
| 403 | Project 或模型不允许访问 | 请团队负责人确认项目成员和模型权限 |
| 429 | 额度或并发限制触发 | 等待额度窗口恢复，或申请提升额度 |
| 503 | 没有健康路由 | 请管理员检查路由策略和 Provider 健康状态 |

## 截图

![Gateway documentation](../assets/screenshots/gateway-en.png)
