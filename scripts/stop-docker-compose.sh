#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Compose] %s\n' "$*"
}

# 检查 docker-compose 命令
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  log "未找到 docker-compose 命令"
  exit 1
fi

cd "$DEPLOY_DIR"

# 检查是否需要删除数据卷
if [ "${REMOVE_VOLUMES:-false}" = "true" ]; then
  log "停止服务并删除数据卷..."
  $COMPOSE_CMD -f docker-compose.postgres.yml down -v
  log "⚠️  PostgreSQL 数据卷已删除"
else
  log "停止服务（保留数据卷）..."
  $COMPOSE_CMD -f docker-compose.postgres.yml down
fi

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Docker Compose) 已停止                   │
├─────────────────────────────────────────────────────┤
│  ✅ 所有容器已停止                                  │
│  📦 数据卷已保留（重启后数据仍在）                  │
├─────────────────────────────────────────────────────┤
│  提示:                                              │
│  • 重新启动: ./scripts/start-docker-compose.sh      │
│  • 查看日志: $COMPOSE_CMD -f deploy/docker-compose.postgres.yml logs     │
│  • 删除数据: REMOVE_VOLUMES=true ./scripts/stop-docker-compose.sh │
└─────────────────────────────────────────────────────┘

EOF
