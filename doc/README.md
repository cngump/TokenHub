# TokenHub 产品规划总览

本文档目录用于说明 TokenHub 的产品定位、当前功能地图、系统架构、接口、数据模型、管理后台、安全合规和部署运维。

## 产品一句话

TokenHub 是面向企业私有化部署的 AI API Gateway 与 Token 治理平台，统一管理多模型接入、内部 API Key、额度分配、调用审计、成本分析和模型路由，为企业构建安全、可控、可追踪的 AI 使用入口。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [01-product-positioning.md](01-product-positioning.md) | 产品定位、目标客户、核心场景、非目标、合规边界 |
| [02-architecture.md](02-architecture.md) | Go + Next.js 总体架构、后端模块、前端模块、请求链路 |
| [03-capabilities-roadmap.md](03-capabilities-roadmap.md) | 产品能力、版本路线图、验收标准 |
| [04-api-design.md](04-api-design.md) | OpenAI-Compatible API、管理 API、错误格式、流式响应 |
| [05-data-model.md](05-data-model.md) | 核心实体、关系、表设计方向、统计与审计数据 |
| [06-admin-console.md](06-admin-console.md) | 管理后台信息架构、页面、关键工作流 |
| [07-deployment-ops.md](07-deployment-ops.md) | Docker、Helm、离线部署、观测、备份、升级 |
| [08-security-compliance.md](08-security-compliance.md) | 认证授权、密钥安全、审计、脱敏、企业集成 |
| [09-implementation-status.md](09-implementation-status.md) | 当前实现记录、运行方式、验证结果、已知限制 |
| [10-feature-map.md](10-feature-map.md) | 当前后台菜单、功能闭环、角色范围和后续优先级 |

## 设计原则

1. 企业治理优先
   - 产品价值来自权限、成本、审计、稳定性和私有化能力，而不是非授权转售或非授权分发。

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

1. 先保证模型 API、Provider、模型目录、路由策略和请求日志闭环稳定。
2. 完成项目空间、API Key、项目额度、团队、用户和审批记录的治理闭环。
3. 打磨用量统计、成本账单、成本中心和导出报表。
4. 完善健康检测、告警规则、告警事件、通知渠道和通知记录。
5. 补齐安全策略、代理出口、数据备份、公告通知和系统设置。
6. 做生产化增强：RBAC 数据范围、SSO、凭证加密、定时备份、OpenAPI、Helm 和观测。
