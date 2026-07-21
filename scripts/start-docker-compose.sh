#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Compose] %s\n' "$*"
}

error() {
  printf '[TokenHub Compose] ERROR: %s\n' "$*" >&2
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
  log "⚠️  请编辑 deploy/.env 修改默认密码和密钥"
fi

cd "$DEPLOY_DIR"

# 构建并启动所有服务
log "构建并启动 TokenHub 服务（PostgreSQL + 后端 + 前端）..."
$COMPOSE_CMD --env-file .env -f docker-compose.postgres.yml up -d --build

log "等待服务启动..."
sleep 5

# 检查服务状态
log "检查服务状态..."
$COMPOSE_CMD -f docker-compose.postgres.yml ps

# 读取配置
source .env
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
TOKENHUB_BACKEND_PORT="${TOKENHUB_BACKEND_PORT:-8080}"
TOKENHUB_FRONTEND_PORT="${TOKENHUB_FRONTEND_PORT:-3000}"
TOKENHUB_ADMIN_TOKEN="${TOKENHUB_ADMIN_TOKEN:-change-me-tokenhub-admin-token}"

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Full Docker Compose) 已启动              │
├─────────────────────────────────────────────────────┤
│  🗄️  PostgreSQL:  localhost:${POSTGRES_PORT}                   │
│  🔧 后端 API:     http://localhost:${TOKENHUB_BACKEND_PORT}             │
│  🌐 前端控制台:   http://localhost:${TOKENHUB_FRONTEND_PORT}           │
│  🔑 Admin Token:  ${TOKENHUB_ADMIN_TOKEN:0:20}...    │
├─────────────────────────────────────────────────────┤
│  默认登录:                                          │
│    用户名: admin                                    │
│    密码:   admin123456                              │
├─────────────────────────────────────────────────────┤
│  常用命令:                                          │
│    查看日志:   $COMPOSE_CMD -f deploy/docker-compose.postgres.yml logs -f  │
│    查看状态:   $COMPOSE_CMD -f deploy/docker-compose.postgres.yml ps       │
│    重启服务:   $COMPOSE_CMD -f deploy/docker-compose.postgres.yml restart  │
│    停止服务:   ./scripts/stop-docker-compose.sh    │
└─────────────────────────────────────────────────────┘

EOF

log "✅ 所有服务已启动"
log "访问 http://localhost:${TOKENHUB_FRONTEND_PORT} 开始使用 TokenHub"
