#!/bin/bash

# TokenHub service stop script
# Used to stop backend, frontend and database services

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}TokenHub Service Stop Script${NC}"
echo "================================"

# Get project root directory (parent of script directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Function: stop process
stop_process() {
    local process_name=$1
    local pid_file=$2

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $process_name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1

            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}Force killing $process_name...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi

            rm -f "$pid_file"
            echo -e "${GREEN}✓ $process_name stopped${NC}"
        else
            echo -e "${YELLOW}$process_name not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}$process_name PID file not found, trying to find by name...${NC}"

        # Try to find and stop by process name
        case "$process_name" in
            "Backend service")
                pkill -f "tokenhub" 2>/dev/null || echo -e "${YELLOW}No running backend process found${NC}"
                ;;
            "Frontend service")
                pkill -f "next dev" 2>/dev/null || echo -e "${YELLOW}No running frontend process found${NC}"
                ;;
        esac
    fi
}

# Stop backend service
echo ""
echo "Stopping backend service..."
stop_process "Backend service" "backend/tokenhub.pid"

# Stop frontend service
echo ""
echo "Stopping frontend service..."
stop_process "Frontend service" "frontend/nextjs.pid"

# Stop Docker Compose services
echo ""
echo "Checking Docker Compose services..."

if [ -f "deploy/.env" ]; then
    # Check SQLite version
    if docker compose -f deploy/docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}Stopping Docker Compose (SQLite)...${NC}"
        docker compose --env-file deploy/.env -f deploy/docker-compose.yml down
        echo -e "${GREEN}✓ Docker Compose (SQLite) stopped${NC}"
    fi

    # Check PostgreSQL version
    if docker compose -f deploy/docker-compose.postgres.yml ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}Stopping Docker Compose (PostgreSQL)...${NC}"
        docker compose --env-file deploy/.env -f deploy/docker-compose.postgres.yml down
        echo -e "${GREEN}✓ Docker Compose (PostgreSQL) stopped${NC}"
    fi
else
    echo -e "${YELLOW}deploy/.env not found, skipping Docker Compose stop${NC}"
fi

# Clean up port usage (optional)
echo ""
echo "Checking port usage..."

check_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Port $port is still in use (PID: $pid)${NC}"
        read -p "Kill this process? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 "$pid" 2>/dev/null || true
            echo -e "${GREEN}✓ Process killed${NC}"
        fi
    fi
}

check_port 8080  # Backend port
check_port 3000  # Frontend port
check_port 5432  # PostgreSQL port

echo ""
echo "================================"
echo -e "${GREEN}All services stopped${NC}"
