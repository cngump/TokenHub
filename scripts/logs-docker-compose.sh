#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Parse arguments
SERVICE=""
FOLLOW="-f"
TAIL="100"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-follow|-n)
            FOLLOW=""
            shift
            ;;
        --tail)
            TAIL="$2"
            shift 2
            ;;
        --all)
            TAIL="all"
            shift
            ;;
        backend|frontend|postgres|tokenhub-backend|tokenhub-frontend|tokenhub-postgres)
            SERVICE="$1"
            shift
            ;;
        *)
            echo -e "${YELLOW}Unknown parameter: $1${NC}"
            echo "Usage: $0 [backend|frontend|postgres] [--no-follow] [--tail N] [--all]"
            exit 1
            ;;
    esac
done

# Normalize service name
case $SERVICE in
    backend)
        SERVICE="tokenhub-backend"
        ;;
    frontend)
        SERVICE="tokenhub-frontend"
        ;;
    postgres)
        SERVICE="tokenhub-postgres"
        ;;
esac

# Build log command
LOG_CMD="$COMPOSE_CMD -f deploy/docker-compose.postgres.yml logs"

if [ -n "$FOLLOW" ]; then
    LOG_CMD="$LOG_CMD -f"
fi

if [ "$TAIL" != "all" ]; then
    LOG_CMD="$LOG_CMD --tail=$TAIL"
fi

if [ -n "$SERVICE" ]; then
    LOG_CMD="$LOG_CMD $SERVICE"
    echo -e "${BLUE}[TokenHub Compose]${NC} Viewing ${GREEN}$SERVICE${NC} logs..."
else
    echo -e "${BLUE}[TokenHub Compose]${NC} Viewing all service logs..."
fi

if [ -n "$FOLLOW" ]; then
    echo -e "${BLUE}[TokenHub Compose]${NC} Follow mode (press Ctrl+C to exit)"
fi

echo ""

# Execute log command
exec $LOG_CMD
