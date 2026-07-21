#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}[TokenHub Compose]${NC} Restarting services..."

cd "$PROJECT_ROOT"

# Detect docker-compose command
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${YELLOW}⚠️  docker-compose or docker compose command not found${NC}"
    exit 1
fi

# Restart services
$COMPOSE_CMD -f deploy/docker-compose.postgres.yml restart

echo -e "${BLUE}[TokenHub Compose]${NC} Waiting for services to start..."
sleep 3

# Check service status
echo -e "${BLUE}[TokenHub Compose]${NC} Checking service status..."
$COMPOSE_CMD -f deploy/docker-compose.postgres.yml ps

# Read admin token from docker-compose config
ADMIN_TOKEN=$(grep -A 5 "TOKENHUB_ADMIN_TOKEN:" deploy/docker-compose.postgres.yml | grep -oP '(?<=TOKENHUB_ADMIN_TOKEN:\s).*' | head -1 || echo "")
if [ -z "$ADMIN_TOKEN" ]; then
    ADMIN_TOKEN="change-me-tokenhub-admin-token-secret"
fi
ADMIN_TOKEN_DISPLAY="${ADMIN_TOKEN:0:30}..."

cat << EOF

┌─────────────────────────────────────────────────────┐
│  TokenHub (Docker Compose) Restarted                │
├─────────────────────────────────────────────────────┤
│  🗄️  PostgreSQL:  localhost:5432                   │
│  🔧 Backend API:  http://localhost:8080             │
│  🌐 Frontend:     http://localhost:3000             │
│  🔑 Admin Token:  ${ADMIN_TOKEN_DISPLAY}    │
├─────────────────────────────────────────────────────┤
│  Default login:                                     │
│    Username: admin                                  │
│    Password: admin123456                            │
├─────────────────────────────────────────────────────┤
│  Common commands:                                   │
│    View logs:   docker-compose -f deploy/docker-compose.postgres.yml logs -f  │
│    Check status: docker-compose -f deploy/docker-compose.postgres.yml ps      │
│    Stop:        ./scripts/stop-docker-compose.sh    │
│    Full restart: ./scripts/stop-docker-compose.sh && ./scripts/start-docker-compose.sh │
└─────────────────────────────────────────────────────┘

EOF

echo -e "${GREEN}[TokenHub Compose]${NC} ✅ All services restarted"
echo -e "${BLUE}[TokenHub Compose]${NC} Visit http://localhost:3000 to use TokenHub"
