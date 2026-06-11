# TokenHub 产品规划总览

本文档目录用于规划 TokenHub 的产品、架构、MVP、数据模型、管理后台、安全合规和部署运维。

## 产品一句话

TokenHub 是面向企业私有化部署的 AI API Gateway 与 Token 治理平台，统一管理多模型接入、内部 API Key、额度分配、调用审计、成本分析和模型路由，为企业构建安全、可控、可追踪的 AI 使用入口。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [01-product-positioning.md](01-product-positioning.md) | 产品定位、目标客户、核心场景、非目标、合规边界 |
| [02-architecture.md](02-architecture.md) | Go + Next.js 总体架构、后端模块、前端模块、请求链路 |
| [03-mvp-roadmap.md](03-mvp-roadmap.md) | MVP 范围、版本路线图、验收标准 |
| [04-api-design.md](04-api-design.md) | OpenAI-Compatible API、管理 API、错误格式、流式响应 |
| [05-data-model.md](05-data-model.md) | 核心实体、关系、表设计方向、统计与审计数据 |
| [06-admin-console.md](06-admin-console.md) | 管理后台信息架构、页面、关键工作流 |
| [07-deployment-ops.md](07-deployment-ops.md) | Docker、Helm、离线部署、观测、备份、升级 |
| [08-security-compliance.md](08-security-compliance.md) | 认证授权、密钥安全、审计、脱敏、企业集成 |
| [09-mvp-implementation.md](09-mvp-implementation.md) | 当前 MVP 实现记录、运行方式、验证结果、已知限制 |

## 设计原则

1. 企业治理优先
   - 产品价值来自权限、成本、审计、稳定性和私有化能力，而不是非授权转售或订阅分发。

2. API 兼容优先
   - 首先兼容 OpenAI API 的核心路径，降低内部应用迁移成本。

3. Provider 解耦
   - 网关内部使用统一请求模型，Provider Adapter 负责协议转换和差异屏蔽。

4. 策略可解释
   - 额度、路由、降级、重试、告警都应可配置、可审计、可回放。

5. 私有化友好
   - 默认支持内网部署、离线部署、企业身份源和可观测性集成。

## 参考说明

公开网关类项目可以作为产品形态参考，例如统一入口、Key 分发、用量统计、调度、限流和后台管理等方向。但 TokenHub 应保持独立设计与实现，不复制第三方项目的代码、数据库结构、接口实现、前端组件或配置结构，并且产品定位始终是“企业 AI 访问与成本治理”。

## 建议交付顺序

1. 确认产品定位、MVP 与合规边界。
2. 搭建 Go 后端基础工程：配置、日志、数据库迁移、健康检查。
3. 搭建 Next.js 管理后台基础工程：登录、布局、权限壳。
4. 实现 OpenAI-Compatible Gateway 的最小调用链。
5. 接入首批 Provider Adapter。
6. 完成 Project、API Key、Quota、Usage、Audit 的闭环。
7. 增加 Docker Compose 与 Helm 部署。
8. 做企业集成、策略引擎、告警、报表和高可用增强。
