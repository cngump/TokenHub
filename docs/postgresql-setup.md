# PostgreSQL 设置指南

TokenHub 支持 PostgreSQL 作为生产数据库。本指南介绍如何配置和部署 PostgreSQL 版本。

## 为什么选择 PostgreSQL？

- **生产环境** - PostgreSQL 是企业级关系数据库，适合高并发场景
- **数据完整性** - 更强的事务支持和并发控制
- **扩展性** - 支持水平扩展和主从复制
- **备份恢复** - 成熟的备份工具生态系统

SQLite 仍然是默认选择，适合：
- 开发和测试环境
- 小规模部署（<1000 用户）
- 简单部署需求

## 快速开始

### 使用 Docker Compose

1. **复制环境变量配置**

```bash
cp deploy/.env.example deploy/.env
```

2. **编辑 .env 文件设置 PostgreSQL 密码**

```bash
POSTGRES_PASSWORD=your-secure-password
TOKENHUB_SECRET_KEY=your-secret-key
TOKENHUB_ADMIN_TOKEN=your-admin-token
```

3. **启动服务**

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.postgres.yml up -d
```

4. **访问应用**

- 前端：http://localhost:3000
- 后端 API：http://localhost:8080
- 健康检查：http://localhost:8080/healthz

默认管理员账号：
- 用户名：`admin`
- 密码：`admin123456`

**⚠️ 立即修改默认密码！**

### 手动安装 PostgreSQL

1. **安装 PostgreSQL**

macOS:
```bash
brew install postgresql@16
brew services start postgresql@16
```

Ubuntu/Debian:
```bash
sudo apt install postgresql-16
sudo systemctl start postgresql
```

2. **创建数据库和用户**

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE tokenhub;
CREATE USER tokenhub WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE tokenhub TO tokenhub;
\q
```

3. **配置环境变量**

在 `backend/.env` 中设置：

```bash
TOKENHUB_DATABASE_URL=postgresql://tokenhub:your-password@localhost:5432/tokenhub?sslmode=disable
TOKENHUB_DB_MAX_OPEN_CONNS=25
TOKENHUB_DB_MAX_IDLE_CONNS=5
TOKENHUB_DB_CONN_MAX_LIFETIME_MINUTES=30
```

4. **启动后端**

```bash
cd backend
go run ./cmd/tokenhub
```

## 连接池配置

PostgreSQL 支持连接池配置，根据负载调整：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `TOKENHUB_DB_MAX_OPEN_CONNS` | 25 | 最大打开连接数 |
| `TOKENHUB_DB_MAX_IDLE_CONNS` | 5 | 最大空闲连接数 |
| `TOKENHUB_DB_CONN_MAX_LIFETIME_MINUTES` | 30 | 连接最大生命周期（分钟） |

**推荐配置：**

- **小规模（<100 用户）**：MaxOpenConns=10, MaxIdleConns=2
- **中等规模（100-1000 用户）**：MaxOpenConns=25, MaxIdleConns=5（默认）
- **大规模（>1000 用户）**：MaxOpenConns=50, MaxIdleConns=10

## 数据库连接字符串格式

```
postgresql://[user[:password]@][host][:port][/dbname][?param1=value1&...]
```

示例：

```bash
# 本地开发
postgresql://tokenhub:password@localhost:5432/tokenhub?sslmode=disable

# 生产环境（启用 SSL）
postgresql://tokenhub:password@db.example.com:5432/tokenhub?sslmode=require

# 连接池参数
postgresql://user:pass@host:5432/db?pool_max_conns=25&pool_min_conns=5
```

## 备份和恢复

TokenHub 的内置备份功能仅支持 SQLite。对于 PostgreSQL，请使用 `pg_dump` 和 `pg_restore`。

### 备份数据库

```bash
pg_dump -h localhost -U tokenhub -d tokenhub -F c -f tokenhub_backup_$(date +%Y%m%d).dump
```

### 恢复数据库

```bash
pg_restore -h localhost -U tokenhub -d tokenhub -c tokenhub_backup_20260721.dump
```

### 自动化备份（Cron）

创建备份脚本 `/usr/local/bin/backup-tokenhub.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/tokenhub"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U tokenhub -d tokenhub -F c -f $BACKUP_DIR/tokenhub_$DATE.dump

# 保留最近 7 天的备份
find $BACKUP_DIR -name "tokenhub_*.dump" -mtime +7 -delete
```

添加到 crontab（每天凌晨 2 点备份）：

```bash
0 2 * * * /usr/local/bin/backup-tokenhub.sh
```

## 从 SQLite 迁移到 PostgreSQL

TokenHub 当前版本不包含自动迁移工具。迁移步骤：

1. **导出 SQLite 数据为 SQL**

```bash
sqlite3 data/tokenhub.db .dump > tokenhub_sqlite.sql
```

2. **转换 SQL 语法**

手动编辑 `tokenhub_sqlite.sql`，调整 SQLite 特定语法为 PostgreSQL 兼容语法。

3. **导入到 PostgreSQL**

```bash
psql -h localhost -U tokenhub -d tokenhub -f tokenhub_sqlite.sql
```

**注意**：数据迁移工具计划在未来版本中提供。

## 性能优化

### 索引优化

TokenHub 会自动创建必要的索引，但你可以根据查询模式添加额外索引：

```sql
-- 如果经常按 cost_center 查询项目
CREATE INDEX idx_projects_cost_center ON projects(cost_center);

-- 如果经常查询特定时间范围的使用记录
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at);
```

### 查询性能监控

启用 PostgreSQL 慢查询日志：

```sql
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 记录超过 1 秒的查询
SELECT pg_reload_conf();
```

查看慢查询：

```bash
tail -f /var/log/postgresql/postgresql-16-main.log | grep "duration:"
```

## 故障排查

### 连接失败

1. **检查 PostgreSQL 是否运行**

```bash
pg_isready -h localhost -U tokenhub
```

2. **检查防火墙**

```bash
sudo ufw allow 5432/tcp
```

3. **检查 pg_hba.conf**

确保允许来自应用的连接：

```
# IPv4 local connections:
host    tokenhub    tokenhub    127.0.0.1/32    md5
```

### 连接池耗尽

如果看到 "too many connections" 错误，减少连接池大小：

```bash
TOKENHUB_DB_MAX_OPEN_CONNS=10
```

### 性能问题

1. **运行 VACUUM**

```sql
VACUUM ANALYZE;
```

2. **检查表膨胀**

```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 参考资源

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [GORM PostgreSQL 驱动](https://github.com/go-gorm/postgres)
- [pgx 驱动文档](https://github.com/jackc/pgx)
