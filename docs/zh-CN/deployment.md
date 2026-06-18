# 部署

Language: [English](../deployment.md) | 简体中文 | [日本語](../ja/deployment.md)

TokenHub 面向私有化部署，由 Go 后端、Next.js 管理后台和 SQLite 持久化组成。

## Docker Compose

```bash
docker compose -f deploy/docker-compose/docker-compose.yml up --build
```

Compose 会启动：

- 后端：`http://localhost:8080`
- 前端：`http://localhost:3000`
- SQLite 数据卷：挂载到 `/app/data`

## 后端环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `TOKENHUB_ENV` | `dev` | 运行环境标识 |
| `TOKENHUB_HTTP_ADDR` | `:8080` | 后端监听地址 |
| `TOKENHUB_PUBLIC_BASE_URL` | `http://localhost:8080` | 展示给用户的后端地址 |
| `TOKENHUB_ADMIN_TOKEN` | `dev_admin_token` | Admin API 启动访问 Token |
| `TOKENHUB_DATABASE_URL` | `sqlite://data/tokenhub.db` | SQLite 数据库路径 |
| `TOKENHUB_SQLITE_BACKUP_DIR` | `data/backups` | 备份目录 |
| `TOKENHUB_MODEL_CATALOG_FILE` | `data/model-catalog.yaml` | 标准模型目录文件 |
| `TOKENHUB_SEED_DEMO` | `false` | 是否写入演示数据 |
| `TOKENHUB_LOG_LEVEL` | `info` | 日志级别 |

## 前端环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | 后端 Admin API 地址 |
| `NEXT_PUBLIC_ADMIN_TOKEN` | `dev_admin_token` | 开发环境 Admin Token |
| `NEXT_PUBLIC_APP_NAME` | `TokenHub` | 页面展示名称 |

## 数据和备份

SQLite 是项目、Key、Provider、路由、用户、请求日志、用量、告警、审批、会话和备份记录的持久化来源。

生产建议：

- 将 SQLite 数据库放在持久化磁盘上。
- 将备份保存到应用容器外部。
- 按保留策略清理旧备份。
- 将 Provider 凭证和 Admin Token 放在密钥管理系统或受保护的环境变量中。

## 反向代理

生产环境建议使用 HTTPS，并转发：

- 管理后台流量到前端服务。
- `/v1/*` 和 `/api/admin/*` 流量到后端服务。

长文本生成和流式响应可能耗时较长，请合理设置请求体大小和超时时间。
