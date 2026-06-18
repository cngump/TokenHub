# 部署

Language: [English](../deployment.md) | 简体中文 | [日本語](../ja/deployment.md)

TokenHub 面向私有化部署，由 Go 后端、Next.js 管理后台和 SQLite 持久化组成。

## Docker Compose

创建部署环境变量文件：

```bash
cp deploy/.env.example deploy/.env
```

启动前请编辑 `deploy/.env`：

- `TOKENHUB_ADMIN_TOKEN`：Admin API 启动 Token，请使用强随机值。
- `TOKENHUB_SECRET_KEY`：后端密钥，请使用强随机值并保持稳定。
- `TOKENHUB_PUBLIC_BASE_URL`：展示给用户的后端访问地址。
- `NEXT_PUBLIC_API_BASE_URL`：浏览器管理后台访问后端的地址。
- `TOKENHUB_BACKEND_PORT`：后端宿主机端口，默认 `8080`。
- `TOKENHUB_FRONTEND_PORT`：管理后台宿主机端口，默认 `3000`。

在仓库根目录启动：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build
```

Compose 会启动：

- 后端：`http://localhost:8080`
- 前端：`http://localhost:3000`
- SQLite 数据：保存在 Docker named volume `tokenhub-data`
- 模型目录：从 `data/model-catalog.yaml` 挂载

查看状态：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

首次登录后台：

- 用户名：`admin`
- 密码：`admin123456`

对外开放前，请修改默认密码或创建新的管理员账号。

查看日志：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml logs -f
```

停止服务：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml down
```

停止并删除 SQLite 数据卷：

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml down -v
```

只有在你明确要删除本地数据时，才使用 `down -v`。

## 后端环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `TOKENHUB_ENV` | `prod` | 运行环境标识 |
| `TOKENHUB_HTTP_ADDR` | `:8080` | 后端监听地址 |
| `TOKENHUB_PUBLIC_BASE_URL` | `http://localhost:8080` | 展示给用户的后端地址 |
| `TOKENHUB_ADMIN_TOKEN` | `change-me-tokenhub-admin-token` | Admin API 启动访问 Token |
| `TOKENHUB_SECRET_KEY` | `change-me-tokenhub-secret-key` | 后端密钥 |
| `TOKENHUB_DATABASE_URL` | `sqlite:///app/data/tokenhub.db` | 容器内 SQLite 数据库路径 |
| `TOKENHUB_SQLITE_BACKUP_DIR` | `/app/data/backups` | 备份目录 |
| `TOKENHUB_MODEL_CATALOG_FILE` | `/app/catalog/model-catalog.yaml` | 标准模型目录文件 |
| `TOKENHUB_SEED_DEMO` | `false` | 是否写入演示数据 |
| `TOKENHUB_LOG_LEVEL` | `info` | 日志级别 |
| `TOKENHUB_RESOURCE_FAILURE_THRESHOLD` | `3` | Provider 资源进入冷却前的失败阈值 |
| `TOKENHUB_RESOURCE_COOLDOWN_SECONDS` | `300` | Provider 资源冷却秒数 |

## 前端环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080` | 后端 Admin API 地址 |
| `NEXT_PUBLIC_APP_NAME` | `TokenHub` | 页面展示名称 |

## 数据和备份

SQLite 是项目、Key、Provider、路由、用户、请求日志、用量、告警、审批、会话和备份记录的持久化来源。

在一键 compose 部署中：

- 容器内数据库路径：`/app/data/tokenhub.db`
- 容器内备份路径：`/app/data/backups`
- Docker volume 名称：`tokenhub-data`

生产建议：

- 将 SQLite 数据库放在持久化磁盘上。
- 将备份保存到应用容器外部。
- 按保留策略清理旧备份。
- 将 Provider 凭证和 Admin Token 放在密钥管理系统或受保护的环境变量中。

## 模型目录

部署文件会把仓库里的 `data/model-catalog.yaml` 挂载到后端容器的 `/app/catalog/model-catalog.yaml`。

更新标准模型目录：

1. 编辑 `data/model-catalog.yaml`。
2. 重启后端容器。
3. 打开管理后台的 `模型目录` 确认结果。

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml restart tokenhub-backend
```

## 反向代理

生产环境建议使用 HTTPS，并转发：

- 管理后台流量到前端服务。
- `/v1/*` 和 `/api/admin/*` 流量到后端服务。

长文本生成和流式响应可能耗时较长，请合理设置请求体大小和超时时间。
