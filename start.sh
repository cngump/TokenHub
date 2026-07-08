#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

TOKENHUB_HTTP_ADDR="${TOKENHUB_HTTP_ADDR:-:8080}"
TOKENHUB_PUBLIC_BASE_URL="${TOKENHUB_PUBLIC_BASE_URL:-http://localhost:8080}"
TOKENHUB_ADMIN_TOKEN="${TOKENHUB_ADMIN_TOKEN:-dev_admin_token}"
TOKENHUB_DATABASE_URL="${TOKENHUB_DATABASE_URL:-sqlite://$BACKEND_DIR/data/tokenhub.db}"
NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$TOKENHUB_PUBLIC_BASE_URL}"
NEXT_PUBLIC_ADMIN_TOKEN="${NEXT_PUBLIC_ADMIN_TOKEN:-$TOKENHUB_ADMIN_TOKEN}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
BACKEND_BIN="$ROOT_DIR/.tmp/tokenhub-backend"
NEXT_BIN="$FRONTEND_DIR/node_modules/.bin/next"

BACKEND_PID=""
FRONTEND_PID=""

log() {
  printf '[TokenHub] %s\n' "$*"
}

find_go() {
  if [ -n "${GO_BIN:-}" ]; then
    printf '%s\n' "$GO_BIN"
    return
  fi

  if command -v go >/dev/null 2>&1; then
    command -v go
    return
  fi

  if [ -x "/tmp/tokenhub-go126/go/bin/go" ]; then
    printf '%s\n' "/tmp/tokenhub-go126/go/bin/go"
    return
  fi

  log "未找到 Go。请安装 Go，或通过 GO_BIN=/path/to/go 指定。"
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "未找到命令：$1"
    exit 1
  fi
}

kill_tree() {
  local pid="$1"
  local children child

  children="$(pgrep -P "$pid" 2>/dev/null || true)"
  for child in $children; do
    kill_tree "$child"
  done

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill -TERM "$pid" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  local code=$?

  trap - INT TERM EXIT

  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    log "停止前端服务 PID=$FRONTEND_PID"
    kill_tree "$FRONTEND_PID"
  fi

  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "停止后端服务 PID=$BACKEND_PID"
    kill_tree "$BACKEND_PID"
  fi

  wait "$FRONTEND_PID" >/dev/null 2>&1 || true
  wait "$BACKEND_PID" >/dev/null 2>&1 || true

  exit "$code"
}

trap cleanup INT TERM EXIT

GO_CMD="$(find_go)"
require_command npm

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log "前端依赖不存在，执行 npm install"
  (cd "$FRONTEND_DIR" && npm install)
fi

mkdir -p "$(dirname "$BACKEND_BIN")"

log "编译后端二进制"
(cd "$BACKEND_DIR" && "$GO_CMD" build -o "$BACKEND_BIN" ./cmd/tokenhub)

log "启动后端: $TOKENHUB_HTTP_ADDR"
(
  cd "$BACKEND_DIR"
  exec env \
    TOKENHUB_HTTP_ADDR="$TOKENHUB_HTTP_ADDR" \
    TOKENHUB_PUBLIC_BASE_URL="$TOKENHUB_PUBLIC_BASE_URL" \
    TOKENHUB_ADMIN_TOKEN="$TOKENHUB_ADMIN_TOKEN" \
    TOKENHUB_DATABASE_URL="$TOKENHUB_DATABASE_URL" \
    "$BACKEND_BIN"
) &
BACKEND_PID=$!

log "启动前端: http://localhost:$FRONTEND_PORT"
(
  cd "$FRONTEND_DIR"
  exec env \
    NEXT_PUBLIC_API_BASE_URL="$NEXT_PUBLIC_API_BASE_URL" \
    NEXT_PUBLIC_ADMIN_TOKEN="$NEXT_PUBLIC_ADMIN_TOKEN" \
    "$NEXT_BIN" dev --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

cat <<EOF

TokenHub 已启动：
  后端 API:  $TOKENHUB_PUBLIC_BASE_URL
  前端后台: http://localhost:$FRONTEND_PORT
  Admin Token: $TOKENHUB_ADMIN_TOKEN

按 Ctrl-C 同时停止前后端。
EOF

while true; do
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "后端服务已退出"
    wait "$BACKEND_PID" || exit $?
    exit 0
  fi

  if ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    log "前端服务已退出"
    wait "$FRONTEND_PID" || exit $?
    exit 0
  fi

  sleep 1
done
