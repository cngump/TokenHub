#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Docker] %s\n' "$*"
}

# 检查 docker-compose 命令
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  log "未找到 docker-compose 命令，跳过容器清理"
  COMPOSE_CMD=""
fi

# 停止后端服务
if [ -f "$ROOT_DIR/.tmp/backend.pid" ]; then
  BACKEND_PID=$(cat "$ROOT_DIR/.tmp/backend.pid")
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "停止后端服务 (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    sleep 1
    # 强制终止如果还在运行
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$ROOT_DIR/.tmp/backend.pid"
  log "后端服务已停止"
else
  log "未找到后端 PID 文件"
fi

# 停止前端服务
if [ -f "$ROOT_DIR/.tmp/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$ROOT_DIR/.tmp/frontend.pid")
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "停止前端服务 (PID: $FRONTEND_PID)..."
    # 终止前端及其子进程
    pkill -P "$FRONTEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    sleep 1
    # 强制终止如果还在运行
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
      kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$ROOT_DIR/.tmp/frontend.pid"
  log "前端服务已停止"
else
  log "未找到前端 PID 文件"
fi

# 额外清理：确保端口被释放
log "清理端口占用..."
lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# 停止 PostgreSQL 容器
if [ -n "$COMPOSE_CMD" ]; then
  log "停止 PostgreSQL 容器..."
  cd "$DEPLOY_DIR"
  if [ -f "docker-compose.postgres.yml" ]; then
    $COMPOSE_CMD -f docker-compose.postgres.yml down 2>/dev/null || true
    log "PostgreSQL 容器已停止"
  else
    log "未找到 docker-compose.postgres.yml"
  fi
fi

# 清理日志文件（可选）
if [ "${CLEAN_LOGS:-false}" = "true" ]; then
  log "清理日志文件..."
  rm -f "$ROOT_DIR/.tmp/backend.log"
  rm -f "$ROOT_DIR/.tmp/frontend.log"
fi

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub 已停止                                    │
├─────────────────────────────────────────────────────┤
│  ✅ 后端服务已停止                                  │
│  ✅ 前端服务已停止                                  │
│  ✅ PostgreSQL 容器已停止                           │
├─────────────────────────────────────────────────────┤
│  提示:                                              │
│  • 重新启动: ./scripts/start-docker.sh              │
│  • 查看日志: tail -f .tmp/backend.log               │
│  • 清理日志: CLEAN_LOGS=true ./scripts/stop-docker.sh │
└─────────────────────────────────────────────────────┘

EOF
