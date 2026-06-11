# 部署与运维规划

## 部署形态

| 形态 | 用途 |
| --- | --- |
| Docker Compose | 本地开发、POC、单机试点 |
| Helm Chart | 企业 Kubernetes 部署 |
| 离线部署包 | 无公网内网环境 |
| 二进制部署 | 小规模服务器部署，后续可选 |

## Docker Compose 组件

MVP 建议包含：

```text
postgres
redis
tokenhub-backend
tokenhub-frontend
```

后续增强：

```text
prometheus
grafana
loki
otel-collector
```

## 环境变量规划

### 后端

| 变量 | 说明 |
| --- | --- |
| `TOKENHUB_ENV` | dev、staging、prod |
| `TOKENHUB_HTTP_ADDR` | 后端监听地址 |
| `TOKENHUB_PUBLIC_BASE_URL` | 对外访问地址 |
| `TOKENHUB_DATABASE_URL` | 数据库连接，当前默认 `sqlite://data/tokenhub.db` |
| `TOKENHUB_REDIS_URL` | Redis 连接 |
| `TOKENHUB_SECRET_KEY` | 本地加密主密钥，生产建议接 KMS |
| `TOKENHUB_JWT_SECRET` | 管理后台认证密钥 |
| `TOKENHUB_LOG_LEVEL` | 日志级别 |
| `TOKENHUB_OTEL_ENDPOINT` | OpenTelemetry Collector |

### 前端

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Admin API 地址 |
| `NEXT_PUBLIC_APP_NAME` | 应用名称 |
| `NEXT_PUBLIC_ENABLE_SSO` | 是否显示 SSO 登录入口 |

## 配置管理

配置分三类：

| 类型 | 存储 | 示例 |
| --- | --- | --- |
| 启动配置 | 环境变量、配置文件 | 数据库连接、监听端口 |
| 业务配置 | PostgreSQL | Provider、模型、路由、额度 |
| 高频状态 | Redis | 额度计数、并发、Provider 健康 |

生产环境不建议把 Provider API Key 写入静态配置文件，应该通过后台加密保存或接入企业密钥管理系统。

## 数据库迁移

建议后端内置 migration 命令：

```text
tokenhub migrate up
tokenhub migrate down
tokenhub migrate status
```

迁移要求：

- 所有 schema 变更可追踪。
- 生产变更避免长时间锁表。
- 大表变更分阶段执行。
- 版本升级前输出迁移计划。

## 可观测性

### Metrics

| 指标 | 标签 |
| --- | --- |
| `tokenhub_gateway_requests_total` | project、model、provider、status |
| `tokenhub_gateway_latency_ms` | project、model、provider |
| `tokenhub_tokens_total` | project、model、provider、type |
| `tokenhub_cost_usd_total` | project、model、provider |
| `tokenhub_provider_errors_total` | provider、error_code |
| `tokenhub_quota_rejections_total` | scope、reason |

### Logs

日志要求：

- JSON 格式。
- 包含 request_id。
- 默认不打印原始 Prompt、Response、Provider Secret。
- 错误日志包含 provider、model、project、route，但不包含敏感内容。

### Traces

关键 span：

- gateway.request
- auth.validate_key
- quota.check
- routing.select
- provider.call
- usage.record
- audit.record

## 备份与恢复

| 数据 | 策略 |
| --- | --- |
| PostgreSQL | 每日全量 + WAL 增量 |
| Redis | 可选持久化，关键配置不以 Redis 为唯一来源 |
| Provider 资源凭证 | 随数据库备份，但依赖主密钥或 KMS 恢复 |
| 配置文件 | 版本化管理 |

恢复演练要求：

- 能在新环境恢复数据库。
- 能验证 Provider 资源凭证可解密。
- 能恢复管理后台登录。
- 能恢复最近聚合用量。

## 高可用部署

企业版本建议：

- Backend 多副本。
- Frontend 多副本或静态化部署。
- PostgreSQL 主从或托管高可用。
- Redis Sentinel 或 Redis Cluster。
- Ingress/Nginx/网关层超时支持流式响应。
- Provider 调用超时、重试、熔断和限流。

## Helm Chart 规划

Chart values 建议包含：

```yaml
backend:
  image:
    repository: tokenhub/backend
    tag: latest
  replicas: 2
  env: {}

frontend:
  image:
    repository: tokenhub/frontend
    tag: latest
  replicas: 2

postgresql:
  enabled: true

redis:
  enabled: true

ingress:
  enabled: true
  hosts: []

observability:
  serviceMonitor:
    enabled: false
```

## 离线部署

离线部署包应包含：

- 后端镜像。
- 前端镜像。
- PostgreSQL 和 Redis 镜像，或兼容版本说明。
- Helm Chart。
- Docker Compose 文件。
- 数据库迁移文件。
- 默认配置模板。
- 安装脚本和校验清单。

离线安装流程：

1. 在有网环境下载离线包。
2. 校验 SHA256。
3. 导入镜像到内网镜像仓库。
4. 修改 values 或 `.env`。
5. 执行数据库迁移。
6. 启动服务。
7. 创建管理员账号。
8. 配置首个 Provider 和项目 Key。

## 升级策略

- 语义化版本。
- 每个版本附带迁移说明。
- 后端启动前检查数据库版本。
- 支持只读维护模式。
- 关键版本支持回滚说明。
- 前后端 API 兼容至少一个小版本。
