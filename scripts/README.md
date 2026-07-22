# TokenHub 启动脚本说明

本目录包含多种启动 TokenHub 的脚本，根据不同的部署需求选择使用。

## 脚本概览

| 脚本 | 用途 | PostgreSQL | 前端 | 后端 | 适用场景 |
|------|------|-----------|------|------|---------|
| `start-docker-compose.sh` | 全容器化部署 | ✅ Docker 容器 | ✅ Docker 容器 | ✅ Docker 容器 | **推荐**：生产环境、完整测试 |
| `start-docker-hybrid.sh` | 混合部署 | ✅ Docker 容器 | ⚙️ 本地进程 | ⚙️ 本地进程 | 开发调试（可直接修改代码） |
| `../start.sh` | 纯本地开发 | ⚙️ 本地 PostgreSQL/SQLite | ⚙️ 本地进程 | ⚙️ 本地进程 | 轻量级开发（需本地装 PostgreSQL） |

## 详细说明

### 1. start-docker-compose.sh（推荐）

**全容器化部署** - 所有服务都运行在 Docker 容器中。

```bash
./scripts/start-docker-compose.sh
```

**特点：**
- ✅ 所有服务容器化，环境一致性最好
- ✅ 使用 Docker 内置的 PostgreSQL 容器
- ✅ 容器间通过 Docker 网络通信
- ✅ 数据持久化在 Docker volume 中
- ✅ 适合生产环境和完整测试

**停止服务：**
```bash
./scripts/stop-docker-compose.sh

# 停止并删除数据（谨慎使用）
REMOVE_VOLUMES=true ./scripts/stop-docker-compose.sh
```

**查看日志：**
```bash
docker compose -f deploy/docker-compose.postgres.yml logs -f
```

**访问地址：**
- 前端：http://localhost:3000
- 后端：http://localhost:8080
- PostgreSQL：localhost:5432

---

### 2. start-docker-hybrid.sh

**混合部署** - PostgreSQL 在容器，前后端在本地进程。

```bash
./scripts/start-docker-hybrid.sh
```

**特点：**
- 🐘 PostgreSQL 运行在 Docker 容器中
- ⚙️ 前后端以本地进程运行（方便调试和热重载）
- 🔄 适合开发时需要频繁修改代码
- 📝 日志输出到 `.tmp/backend.log` 和 `.tmp/frontend.log`

**停止服务：**
```bash
./scripts/stop-docker-hybrid.sh

# 停止并清理日志
CLEAN_LOGS=true ./scripts/stop-docker-hybrid.sh
```

**查看日志：**
```bash
tail -f .tmp/backend.log
tail -f .tmp/frontend.log
```

---

### 3. ../start.sh

**纯本地开发** - 所有服务都在本地运行。

```bash
./start.sh
```

**特点：**
- 💾 默认使用 SQLite（`backend/data/tokenhub.db`）
- 🐘 支持本地 PostgreSQL（需在 `backend/.env` 配置）
- ⚡ 最轻量级，适合快速开发
- 📦 不依赖 Docker

**配置 PostgreSQL：**

创建 `backend/.env`：
```bash
TOKENHUB_DATABASE_URL=postgresql://user:password@localhost:5432/tokenhub?sslmode=disable
```

**停止服务：**
```bash
./scripts/local-stop.sh
```

---

## 配置文件

### deploy/.env

所有 Docker 相关脚本都使用 `deploy/.env` 配置：

```bash
# 从示例复制
cp deploy/.env.example deploy/.env

# 编辑配置
vim deploy/.env
```

**重要配置项：**
```bash
# PostgreSQL
POSTGRES_USER=tokenhub
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=tokenhub
POSTGRES_PORT=5432

# TokenHub
TOKENHUB_ADMIN_TOKEN=your-admin-token
TOKENHUB_SECRET_KEY=your-secret-key

# 端口
TOKENHUB_BACKEND_PORT=8080
TOKENHUB_FRONTEND_PORT=3000
```

⚠️ **生产环境请务必修改默认密码和密钥！**

---

## 常见问题

### Q: 端口被占用怎么办？

```bash
# 查看占用进程
lsof -i :8080
lsof -i :3000
lsof -i :5432

# 停止占用进程
./scripts/stop-docker-compose.sh
./scripts/stop-docker-hybrid.sh
```

### Q: 如何切换数据库？

**SQLite → PostgreSQL (Docker):**
```bash
# 使用 Docker Compose 方式启动
./scripts/start-docker-compose.sh
```

**PostgreSQL (Docker) → 本地 PostgreSQL:**
```bash
# 配置 backend/.env
echo "TOKENHUB_DATABASE_URL=postgresql://user:pass@localhost:5432/tokenhub" > backend/.env

# 使用本地启动方式
./start.sh
```

### Q: 如何重置数据库？

**Docker Compose 方式：**
```bash
# 停止并删除数据卷
REMOVE_VOLUMES=true ./scripts/stop-docker-compose.sh

# 重新启动（会创建新的空数据库）
./scripts/start-docker-compose.sh
```

**本地 SQLite：**
```bash
rm backend/data/tokenhub.db
./start.sh
```

### Q: 如何查看数据库数据？

**Docker PostgreSQL：**
```bash
docker exec -it tokenhub-postgres psql -U tokenhub -d tokenhub

# 列出所有表
\dt

# 查询示例
SELECT * FROM projects;
```

**本地 SQLite：**
```bash
sqlite3 backend/data/tokenhub.db

# 列出所有表
.tables

# 查询示例
SELECT * FROM projects;
```

---

## 推荐工作流

### 开发阶段
```bash
# 使用混合模式，方便调试
./scripts/start-docker-hybrid.sh

# 修改代码后自动重新编译（Go）或热重载（Next.js）
```

### 测试阶段
```bash
# 使用完整容器化，模拟生产环境
./scripts/start-docker-compose.sh
```

### 生产部署
```bash
# 使用 Docker Compose，配置外部 PostgreSQL
vim deploy/.env  # 配置生产数据库
./scripts/start-docker-compose.sh
```

---

## 技术细节

### 数据持久化

**Docker Compose 模式：**
- PostgreSQL 数据：`tokenhub-postgres-data` volume
- 位置：`/var/lib/docker/volumes/tokenhub-postgres-data`

**混合模式：**
- PostgreSQL 数据：`tokenhub-postgres-data` volume
- 后端日志：`.tmp/backend.log`
- 前端日志：`.tmp/frontend.log`

**本地模式：**
- SQLite 数据：`backend/data/tokenhub.db`
- PostgreSQL 数据：取决于本地 PostgreSQL 配置

### 网络架构

**Docker Compose 模式：**
```
tokenhub 网络 (Docker bridge)
├── tokenhub-postgres (postgres:5432)
├── tokenhub-backend (内部8080 → 外部8080)
└── tokenhub-frontend (内部3000 → 外部3000)
```

**混合模式：**
```
localhost
├── tokenhub-postgres 容器 (localhost:5432)
├── 后端进程 (localhost:8080)
└── 前端进程 (localhost:3000)
```
