#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Docker] %s\n' "$*"
}

# Detect docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  log "docker-compose command not found, skipping container cleanup"
  COMPOSE_CMD=""
fi

# Stop backend service
if [ -f "$ROOT_DIR/.tmp/backend.pid" ]; then
  BACKEND_PID=$(cat "$ROOT_DIR/.tmp/backend.pid")
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    log "Stopping backend service (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$ROOT_DIR/.tmp/backend.pid"
  log "Backend service stopped"
else
  log "Backend PID file not found"
fi

# Stop frontend service
if [ -f "$ROOT_DIR/.tmp/frontend.pid" ]; then
  FRONTEND_PID=$(cat "$ROOT_DIR/.tmp/frontend.pid")
  if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log "Stopping frontend service (PID: $FRONTEND_PID)..."
    # Kill frontend and its child processes
    pkill -P "$FRONTEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
      kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$ROOT_DIR/.tmp/frontend.pid"
  log "Frontend service stopped"
else
  log "Frontend PID file not found"
fi

# Optional extra cleanup: force-release ports 8080/3000.
# Disabled by default because it can kill unrelated processes on a dev machine.
# Enable with FORCE_KILL_PORTS=true when you are sure nothing else uses these ports.
if [ "${FORCE_KILL_PORTS:-false}" = "true" ]; then
  log "FORCE_KILL_PORTS enabled: releasing ports 8080/3000..."
  lsof -ti:8080 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
fi

# Stop PostgreSQL container
if [ -n "$COMPOSE_CMD" ]; then
  log "Stopping PostgreSQL container..."
  cd "$DEPLOY_DIR"
  if [ -f "docker-compose.postgres.yml" ]; then
    $COMPOSE_CMD -f docker-compose.postgres.yml down 2>/dev/null || true
    log "PostgreSQL container stopped"
  else
    log "docker-compose.postgres.yml not found"
  fi
fi

# Clean log files (optional)
if [ "${CLEAN_LOGS:-false}" = "true" ]; then
  log "Cleaning log files..."
  rm -f "$ROOT_DIR/.tmp/backend.log"
  rm -f "$ROOT_DIR/.tmp/frontend.log"
fi

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub Stopped                                   │
├─────────────────────────────────────────────────────┤
│  ✅ Backend service stopped                         │
│  ✅ Frontend service stopped                        │
│  ✅ PostgreSQL container stopped                    │
├─────────────────────────────────────────────────────┤
│  Tips:                                                    │
│  • Restart:    ./scripts/start-docker-hybrid.sh           │
│  • View logs:  tail -f .tmp/backend.log                   │
│  • Clean logs: CLEAN_LOGS=true ./scripts/stop-docker-hybrid.sh │
└───────────────────────────────────────────────────────────┘

EOF
