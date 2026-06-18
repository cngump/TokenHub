# TokenHub 文档

Language: [English](../README.md) | 简体中文 | [日本語](../ja/README.md)

这里是 TokenHub 的公开用户文档，面向部署者、管理员和业务开发者，重点说明如何运行、配置和调用 TokenHub。

## 内容

| 文档 | 说明 |
| --- | --- |
| [快速开始](quick-start.md) | 本地启动后端和管理后台，并运行一次链路测试 |
| [模型 API](model-api.md) | 通过 OpenAI-Compatible 接口调用 TokenHub |
| [管理后台](admin-console.md) | 配置 Provider、模型路由、API Key、用量、日志和告警 |
| [模型目录](model-catalog.md) | 通过 YAML 维护平台统一模型目录 |
| [部署](deployment.md) | 环境变量、Docker Compose、数据目录和备份 |
| [安全](security.md) | API Key、管理访问、RBAC、审计日志和凭证建议 |

## 推荐阅读顺序

1. 先看 [快速开始](quick-start.md)。
2. 管理员阅读 [管理后台](admin-console.md)，理解配置流程。
3. 业务开发者阅读 [模型 API](model-api.md)，接入应用或 SDK。
4. 上生产前阅读 [部署](deployment.md) 和 [安全](security.md)。
