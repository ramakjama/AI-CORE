#!/bin/bash

# AIT-CORE Docker Helper Script
# Provides convenient commands for managing the Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_info "Please edit .env file with your configuration"
        exit 1
    fi
}

# Main commands
case "$1" in
    start)
        print_info "Starting AIT-CORE services..."
        check_env
        docker compose up -d
        print_success "Services started successfully"
        print_info "Run '$0 status' to check service health"
        ;;

    stop)
        print_info "Stopping AIT-CORE services..."
        docker compose down
        print_success "Services stopped successfully"
        ;;

    restart)
        print_info "Restarting AIT-CORE services..."
        docker compose restart
        print_success "Services restarted successfully"
        ;;

    status)
        print_info "Checking service status..."
        docker compose ps
        ;;

    logs)
        if [ -z "$2" ]; then
            docker compose logs -f
        else
            docker compose logs -f "$2"
        fi
        ;;

    health)
        print_info "Running health checks..."
        echo ""

        services=(
            "http://localhost:8000/health:Auth Service"
            "http://localhost:8001/health:Storage Service"
            "http://localhost:8002/health:Documents Service"
            "http://localhost:8020/health:Gateway Service"
            "http://localhost:3002/api/health:API Gateway"
            "http://localhost:3001/health:PGC Engine"
            "http://localhost:9200:Elasticsearch"
            "http://localhost:9000/minio/health/live:MinIO"
        )

        for service in "${services[@]}"; do
            IFS=':' read -r url name <<< "$service"
            if curl -sf "$url" > /dev/null 2>&1; then
                print_success "$name"
            else
                print_error "$name (unreachable)"
            fi
        done
        ;;

    clean)
        print_warning "This will remove all containers, volumes, and images!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            print_info "Cleaning up Docker environment..."
            docker compose down -v
            docker system prune -af --volumes
            print_success "Cleanup completed"
        else
            print_info "Cleanup cancelled"
        fi
        ;;

    backup)
        print_info "Starting backup process..."
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"

        print_info "Backing up PostgreSQL..."
        docker exec ait-postgres pg_dumpall -U aitcore | gzip > "$BACKUP_DIR/postgres.sql.gz"

        print_info "Backing up Redis..."
        docker exec ait-redis redis-cli BGSAVE
        sleep 2
        docker cp ait-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

        print_success "Backup completed: $BACKUP_DIR"
        ;;

    rebuild)
        service="${2:-all}"
        if [ "$service" = "all" ]; then
            print_info "Rebuilding all services..."
            docker compose build --no-cache
            docker compose up -d
        else
            print_info "Rebuilding $service..."
            docker compose build --no-cache "$service"
            docker compose up -d "$service"
        fi
        print_success "Rebuild completed"
        ;;

    update)
        print_info "Pulling latest images..."
        docker compose pull
        print_info "Restarting services..."
        docker compose up -d
        print_success "Update completed"
        ;;

    shell)
        if [ -z "$2" ]; then
            print_error "Usage: $0 shell <service-name>"
            exit 1
        fi
        docker compose exec "$2" /bin/bash || docker compose exec "$2" /bin/sh
        ;;

    psql)
        print_info "Connecting to PostgreSQL..."
        docker exec -it ait-postgres psql -U aitcore -d soriano_core
        ;;

    redis-cli)
        print_info "Connecting to Redis..."
        docker exec -it ait-redis redis-cli -a "${REDIS_PASSWORD:-aitcore2024}"
        ;;

    prod-start)
        print_info "Starting AIT-CORE in PRODUCTION mode..."
        check_env
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        print_success "Production services started successfully"
        ;;

    prod-stop)
        print_info "Stopping production services..."
        docker compose -f docker-compose.yml -f docker-compose.prod.yml down
        print_success "Production services stopped"
        ;;

    scale)
        if [ -z "$2" ] || [ -z "$3" ]; then
            print_error "Usage: $0 scale <service-name> <replicas>"
            exit 1
        fi
        print_info "Scaling $2 to $3 replicas..."
        docker compose up -d --scale "$2=$3"
        print_success "Scaled $2 to $3 replicas"
        ;;

    stats)
        print_info "Docker resource usage:"
        docker stats --no-stream
        ;;

    version)
        echo "AIT-CORE Docker Helper v1.0.0"
        echo ""
        docker --version
        docker compose version
        ;;

    help|*)
        echo "AIT-CORE Docker Helper"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  start           Start all services"
        echo "  stop            Stop all services"
        echo "  restart         Restart all services"
        echo "  status          Show service status"
        echo "  logs [service]  Show logs (optionally for specific service)"
        echo "  health          Run health checks on all services"
        echo "  clean           Remove all containers, volumes, and images"
        echo "  backup          Backup databases"
        echo "  rebuild [svc]   Rebuild service(s) from scratch"
        echo "  update          Pull latest images and restart"
        echo "  shell <service> Open shell in service container"
        echo "  psql            Connect to PostgreSQL"
        echo "  redis-cli       Connect to Redis"
        echo "  prod-start      Start in production mode"
        echo "  prod-stop       Stop production mode"
        echo "  scale <svc> <n> Scale service to N replicas"
        echo "  stats           Show resource usage"
        echo "  version         Show version information"
        echo "  help            Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 start                    # Start all services"
        echo "  $0 logs auth-service        # View auth service logs"
        echo "  $0 shell api-gateway        # Open shell in API gateway"
        echo "  $0 scale gateway-service 3  # Scale gateway to 3 replicas"
        echo ""
        ;;
esac
