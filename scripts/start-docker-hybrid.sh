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

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  error "Docker is not running. Please start Docker first."
fi

# Detect docker-compose command
if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  error "docker-compose command not found"
fi

log "Using Docker Compose command: $COMPOSE_CMD"

# Check .env file
if [ ! -f "$DEPLOY_DIR/.env" ]; then
  log ".env not found in deploy/, copying from .env.example"
  cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
fi

# Start PostgreSQL container
log "Starting PostgreSQL database..."
cd "$DEPLOY_DIR"
$COMPOSE_CMD --env-file .env -f docker-compose.postgres.yml up -d postgres

# Wait for PostgreSQL
log "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker exec tokenhub-postgres pg_isready -U tokenhub >/dev/null 2>&1; then
    log "PostgreSQL is ready"
    break
  fi
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    error "PostgreSQL startup timeout"
  fi
  sleep 1
done

# Read PostgreSQL connection info
source "$DEPLOY_DIR/.env"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-tokenhub}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-tokenhub_dev_password}"
POSTGRES_DB="${POSTGRES_DB:-tokenhub}"

# Export backend environment variables
export TOKENHUB_HTTP_ADDR="${TOKENHUB_HTTP_ADDR:-:8080}"
export TOKENHUB_PUBLIC_BASE_URL="${TOKENHUB_PUBLIC_BASE_URL:-http://localhost:8080}"
export TOKENHUB_ADMIN_TOKEN="${TOKENHUB_ADMIN_TOKEN:-dev_admin_token}"
export TOKENHUB_SECRET_KEY="${TOKENHUB_SECRET_KEY:-dev_secret_key_change_in_production}"
export TOKENHUB_DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=disable"
export TOKENHUB_MODEL_CATALOG_FILE="${TOKENHUB_MODEL_CATALOG_FILE:-../data/model-catalog.yaml}"

# Start backend
log "Building and starting backend service..."
cd "$BACKEND_DIR"
if [ ! -f "./cmd/tokenhub/main.go" ]; then
  error "Backend entry file cmd/tokenhub/main.go not found"
fi

go build -o "$ROOT_DIR/.tmp/tokenhub-backend" ./cmd/tokenhub

log "Starting backend: $TOKENHUB_HTTP_ADDR"
"$ROOT_DIR/.tmp/tokenhub-backend" > "$ROOT_DIR/.tmp/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$ROOT_DIR/.tmp/backend.pid"

# Wait for backend
log "Waiting for backend service to be ready..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:8080/healthz >/dev/null 2>&1; then
    log "Backend service is ready"
    break
  fi
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    error "Backend service startup timeout"
  fi
  sleep 1
done

# Start frontend
log "Starting frontend service..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  log "Installing frontend dependencies..."
  npm install
fi

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$TOKENHUB_PUBLIC_BASE_URL}"
export NEXT_PUBLIC_ADMIN_TOKEN="${NEXT_PUBLIC_ADMIN_TOKEN:-$TOKENHUB_ADMIN_TOKEN}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"

npm run dev -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT" > "$ROOT_DIR/.tmp/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$ROOT_DIR/.tmp/frontend.pid"

# Wait for frontend
log "Waiting for frontend service to be ready..."
sleep 5

cat <<EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Docker + PostgreSQL) Started             │
├─────────────────────────────────────────────────────┤
│  🗄️  PostgreSQL:  localhost:${POSTGRES_PORT}                   │
│  🔧 Backend API:  $TOKENHUB_PUBLIC_BASE_URL              │
│  🌐 Frontend:     http://localhost:${FRONTEND_PORT}           │
│  🔑 Admin Token:  $TOKENHUB_ADMIN_TOKEN    │
├─────────────────────────────────────────────────────┤
│  Default login:                                     │
│    Username: admin                                  │
│    Password: admin123456                            │
├─────────────────────────────────────────────────────┤
│  Log files:                                         │
│    Backend: .tmp/backend.log                        │
│    Frontend: .tmp/frontend.log                      │
├─────────────────────────────────────────────────────┤
│  Stop services: ./scripts/stop-docker.sh            │
└─────────────────────────────────────────────────────┘

EOF

log "Services started. Press Ctrl-C to exit (services will continue running in background)."
log "Use ./scripts/stop-docker.sh to stop all services."
