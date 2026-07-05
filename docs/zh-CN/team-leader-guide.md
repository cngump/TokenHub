# 团队负责人大模型 API 接入指南

Language: [English](../team-leader-guide.md) | 简体中文 | [日本語](../ja/team-leader-guide.md)

本指南面向帮助业务应用通过项目级 TokenHub API Key 调用已批准大语言模型的团队负责人。

## 团队负责人职责

| 范围 | 要管理什么 |
| --- | --- |
| Project | 成员、Key、额度和成本归因边界 |
| Members | 在项目详情侧边栏添加应用负责人或开发者 |
| API Keys | 在承担用量和成本的项目下发放 Key |
| Models | 验证 Key 能看到预期模型列表 |
| Reports | 按成员、项目、模型和成本中心复盘用量 |

## 发放项目 Key

1. 在 **项目空间** 中创建或选择项目。
2. 点击项目，在右侧成员面板添加应用负责人。
3. 打开 **Key 管理**，在该项目下创建 Key。
4. 将 Key 限制到应用实际需要的模型和额度。
5. 用 `GET /v1/models` 验证 Key 的模型范围。
6. 通过内部密钥流程把 Key 交给应用负责人。

## 验证可用模型

```bash
curl --request GET \
  --url "http://localhost:8080/v1/models" \
  --header "Authorization: Bearer PROJECT_API_KEY" \
  --header "Content-Type: application/json"
```

返回的 `data[].id` 就是应用可以使用的模型 ID。

## 验证聊天调用

```bash
curl --request POST \
  --url "http://localhost:8080/v1/chat/completions" \
  --header "Authorization: Bearer PROJECT_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "gpt-4.1-mini",
    "messages": [
      {"role": "user", "content": "Write a concise project onboarding checklist."}
    ],
    "stream": false
  }'
```

## 治理检查

| 检查项 | 为什么重要 |
| --- | --- |
| 项目 Owner | 用量和成本需要明确归属 |
| 成员角色 | 只有可信项目成员可以发放或轮换 Key |
| 模型范围 | Key 只应该暴露应用需要的模型 |
| 额度 | 额度和并发要匹配预期流量 |
| 日志 | 失败请求必须能通过 `request_id` 追踪 |

## 常见错误

| 状态 | 团队负责人处理方式 |
| --- | --- |
| 401 | 确认应用使用的是启用状态的项目 Key |
| 403 | 检查项目成员和 Key 允许模型范围 |
| 429 | 检查额度、并发和 Key/项目限制 |
| 503 | 请管理员检查路由和 Provider 健康状态 |
| 500 | 在请求日志中用 `request_id` 查看上游错误 |

## 截图

![Gateway documentation](../assets/screenshots/gateway-en.png)
