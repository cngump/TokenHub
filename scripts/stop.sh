#!/bin/bash

# TokenHub 停止服务脚本
# 用于停止后端、前端和数据库服务

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}TokenHub 服务停止脚本${NC}"
echo "================================"

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 函数：停止进程
stop_process() {
    local process_name=$1
    local pid_file=$2

    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}停止 $process_name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1

            # 如果进程仍在运行，强制终止
            if ps -p "$pid" > /dev/null 2>&1; then
                echo -e "${YELLOW}强制终止 $process_name...${NC}"
                kill -9 "$pid" 2>/dev/null || true
            fi

            rm -f "$pid_file"
            echo -e "${GREEN}✓ $process_name 已停止${NC}"
        else
            echo -e "${YELLOW}$process_name 未运行${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}$process_name PID 文件不存在，尝试按名称查找...${NC}"

        # 尝试按进程名查找并停止
        case "$process_name" in
            "后端服务")
                pkill -f "tokenhub" 2>/dev/null || echo -e "${YELLOW}未找到运行中的后端进程${NC}"
                ;;
            "前端服务")
                pkill -f "next dev" 2>/dev/null || echo -e "${YELLOW}未找到运行中的前端进程${NC}"
                ;;
        esac
    fi
}

# 停止后端服务
echo ""
echo "停止后端服务..."
stop_process "后端服务" "backend/tokenhub.pid"

# 停止前端服务
echo ""
echo "停止前端服务..."
stop_process "前端服务" "frontend/nextjs.pid"

# 停止 Docker Compose 服务
echo ""
echo "检查 Docker Compose 服务..."

if [ -f "deploy/.env" ]; then
    # 检查 SQLite 版本
    if docker compose -f deploy/docker-compose.yml ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}停止 Docker Compose (SQLite)...${NC}"
        docker compose --env-file deploy/.env -f deploy/docker-compose.yml down
        echo -e "${GREEN}✓ Docker Compose (SQLite) 已停止${NC}"
    fi

    # 检查 PostgreSQL 版本
    if docker compose -f deploy/docker-compose.postgres.yml ps 2>/dev/null | grep -q "Up"; then
        echo -e "${YELLOW}停止 Docker Compose (PostgreSQL)...${NC}"
        docker compose --env-file deploy/.env -f deploy/docker-compose.postgres.yml down
        echo -e "${GREEN}✓ Docker Compose (PostgreSQL) 已停止${NC}"
    fi
else
    echo -e "${YELLOW}deploy/.env 不存在，跳过 Docker Compose 停止${NC}"
fi

# 清理端口占用（可选）
echo ""
echo "检查端口占用..."

check_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}端口 $port 仍被占用 (PID: $pid)${NC}"
        read -p "是否终止该进程？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 "$pid" 2>/dev/null || true
            echo -e "${GREEN}✓ 进程已终止${NC}"
        fi
    fi
}

check_port 8080  # 后端端口
check_port 3000  # 前端端口
check_port 5432  # PostgreSQL 端口

echo ""
echo "================================"
echo -e "${GREEN}所有服务已停止${NC}"
