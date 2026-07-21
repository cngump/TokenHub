#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Docker] %s\n' "$*"
}

error() {
  printf '[TokenHub Docker] ERROR: %s\n' "$*" >&2
  exit 1
}

# 检查 Docker 是否运行
if ! docker info >/dev/null 2>&1; then
  error "Docker 未运行。请先启动 Docker。"
fi

# 检查 docker-compose 命令
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  error "未找到 docker-compose 命令"
fi

log "使用 Docker Compose 命令: $COMPOSE_CMD"

# 检查 .env 文件
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  log "未找到 deploy/.env，从 .env.example 复制"
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
fi

# 启动 PostgreSQL 容器
log "启动 PostgreSQL 数据库..."
cd "$DEPLOY_DIR"
$COMPOSE_CMD --env-file .env -f docker-compose.postgres.yml up -d postgres

# 等待 PostgreSQL 启动
log "等待 PostgreSQL 就绪..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec tokenhub-postgres pg_isready -U tokenhub >/dev/null 2>&1; then
    log "PostgreSQL 已就绪"
    break
  fi
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    error "PostgreSQL 启动超时"
  fi
  sleep 1
done

# 读取 PostgreSQL 连接信息
source "$DEPLOY_DIR/.env"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-tokenhub}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-tokenhub_dev_password}"
POSTGRES_DB="${POSTGRES_DB:-tokenhub}"

# 导出后端环境变量
export TOKENHUB_HTTP_ADDR="${TOKENHUB_HTTP_ADDR:-:8080}"
export TOKENHUB_PUBLIC_BASE_URL="${TOKENHUB_PUBLIC_BASE_URL:-http://localhost:8080}"
export TOKENHUB_ADMIN_TOKEN="${TOKENHUB_ADMIN_TOKEN:-dev_admin_token}"
export TOKENHUB_SECRET_KEY="${TOKENHUB_SECRET_KEY:-dev_secret_key_change_in_production}"
export TOKENHUB_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=disable"
export TOKENHUB_MODEL_CATALOG_FILE="${TOKENHUB_MODEL_CATALOG_FILE:-../data/model-catalog.yaml}"

# 启动后端
log "编译并启动后端服务..."
cd "$BACKEND_DIR"
if [ ! -f "./cmd/tokenhub/main.go" ]; then
  error "未找到后端入口文件 cmd/tokenhub/main.go"
fi

go build -o "$ROOT_DIR/.tmp/tokenhub-backend" ./cmd/tokenhub

log "启动后端: $TOKENHUB_HTTP_ADDR"
"$ROOT_DIR/.tmp/tokenhub-backend" > "$ROOT_DIR/.tmp/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT_DIR/.tmp/backend.pid"

# 等待后端就绪
log "等待后端服务就绪..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:8080/healthz >/dev/null 2>&1; then
    log "后端服务已就绪"
    break
  fi
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    error "后端服务启动超时"
  fi
  sleep 1
done

# 启动前端
log "启动前端服务..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  log "安装前端依赖..."
  npm install
fi

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$TOKENHUB_PUBLIC_BASE_URL}"
export NEXT_PUBLIC_ADMIN_TOKEN="${NEXT_PUBLIC_ADMIN_TOKEN:-$TOKENHUB_ADMIN_TOKEN}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"

npm run dev -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT" > "$ROOT_DIR/.tmp/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT_DIR/.tmp/frontend.pid"

# 等待前端就绪
log "等待前端服务就绪..."
sleep 5

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Docker + PostgreSQL) 已启动              │
├─────────────────────────────────────────────────────┤
│  🗄️  PostgreSQL:  localhost:${POSTGRES_PORT}                   │
│  🔧 后端 API:     $TOKENHUB_PUBLIC_BASE_URL              │
│  🌐 前端控制台:   http://localhost:${FRONTEND_PORT}           │
│  🔑 Admin Token:  $TOKENHUB_ADMIN_TOKEN    │
├─────────────────────────────────────────────────────┤
│  默认登录:                                          │
│    用户名: admin                                    │
│    密码:   admin123456                              │
├─────────────────────────────────────────────────────┤
│  日志文件:                                          │
│    后端: .tmp/backend.log                           │
│    前端: .tmp/frontend.log                          │
├─────────────────────────────────────────────────────┤
│  停止服务: ./scripts/stop-docker.sh                 │
└─────────────────────────────────────────────────────┘

EOF

log "服务已启动。按 Ctrl-C 退出（服务将继续在后台运行）。"
log "使用 ./scripts/stop-docker.sh 停止所有服务。"
