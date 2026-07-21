#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

log() {
  printf '[TokenHub Compose] %s\n' "$*"
}

# Detect docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  log "docker-compose command not found"
  exit 1
fi

cd "$DEPLOY_DIR"

# Check if volumes should be removed
if [ "${REMOVE_VOLUMES:-false}" = "true" ]; then
  log "Stopping services and removing volumes..."
  $COMPOSE_CMD -f docker-compose.postgres.yml down -v
  log "⚠️  PostgreSQL data volumes removed"
else
  log "Stopping services (keeping volumes)..."
  $COMPOSE_CMD -f docker-compose.postgres.yml down
fi

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Docker Compose) Stopped                  │
├─────────────────────────────────────────────────────┤
│  ✅ All containers stopped                          │
│  📦 Data volumes preserved (data persists on restart)│
├─────────────────────────────────────────────────────┤
│  Tips:                                              │
│  • Restart:     ./scripts/start-docker-compose.sh   │
│  • View logs:   $COMPOSE_CMD -f deploy/docker-compose.postgres.yml logs     │
│  • Remove data: REMOVE_VOLUMES=true ./scripts/stop-docker-compose.sh │
└─────────────────────────────────────────────────────┘

EOF
