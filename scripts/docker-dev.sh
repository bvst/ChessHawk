#!/bin/bash

# Chess Hawk Docker Development Helper Script
# Provides convenient commands for Docker-based development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Show usage
show_usage() {
    cat << EOF
🐳 Chess Hawk Docker Development Helper

Usage: $0 [COMMAND]

COMMANDS:
    dev         Start development environment
    test        Start test environment with UI
    test-run    Run tests headlessly
    prod        Start production environment
    prod-full   Start full production stack (with monitoring)
    build       Build all images
    clean       Clean up containers and images
    logs        Show logs for running containers
    status      Show status of all containers
    stop        Stop all containers
    restart     Restart containers
    deploy      Deploy to production environment

EXAMPLES:
    $0 dev          # Start development server
    $0 test         # Start test UI server
    $0 test-run     # Run tests and exit
    $0 prod         # Start production server
    $0 prod-full    # Start production with monitoring
    $0 deploy       # Deploy to production
    $0 clean        # Clean up everything

EOF
}

# Development environment
start_dev() {
    log_info "Starting Chess Hawk development environment..."
    docker-compose --profile dev up -d
    log_success "Development server started at http://localhost:5173"
    log_info "Use 'docker-compose --profile dev logs -f' to view logs"
}

# Test environment
start_test() {
    log_info "Starting Chess Hawk test environment..."
    docker-compose --profile test up -d
    log_success "Test UI available at http://localhost:51737"
    log_success "Preview server available at http://localhost:4173"
    log_info "Use 'docker-compose --profile test logs -f' to view logs"
}

# Run tests headlessly
run_tests() {
    log_info "Running Chess Hawk tests..."
    docker-compose --profile test-ci up --abort-on-container-exit
    if [ $? -eq 0 ]; then
        log_success "All tests passed!"
    else
        log_error "Some tests failed. Check the output above."
        exit 1
    fi
}

# Production environment
start_prod() {
    log_info "Starting Chess Hawk production environment..."
    docker-compose --profile prod up -d
    log_success "Production server started at http://localhost:8090"
    log_info "Health check available at http://localhost:8090/health"
    log_info "Use 'docker-compose --profile prod logs -f' to view logs"
}

# Full production stack with monitoring
start_prod_full() {
    log_info "Starting full Chess Hawk production stack with monitoring..."
    docker-compose -f docker-compose.production.yml --profile monitoring up -d
    log_success "Production stack started!"
    log_success "Application: http://localhost:80"
    log_success "Monitoring: http://localhost:9090 (Prometheus)"
    log_success "Dashboards: http://localhost:3000 (Grafana)"
    log_info "Use 'docker-compose -f docker-compose.production.yml logs -f' to view logs"
}

# Deploy to production environment
deploy_prod() {
    log_info "Deploying Chess Hawk to production environment..."
    
    # Build production images
    log_info "Building production images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Stop existing containers
    log_info "Stopping existing production containers..."
    docker-compose -f docker-compose.production.yml down || true
    
    # Start production stack
    log_info "Starting production deployment..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for health check
    log_info "Waiting for application to start..."
    sleep 30
    
    # Health check
    if curl -f -s "http://localhost/" > /dev/null 2>&1; then
        log_success "Production deployment successful!"
        log_success "Application available at: http://localhost/"
        log_info "Monitor logs with: docker-compose -f docker-compose.production.yml logs -f"
    else
        log_error "Production deployment failed health check"
        log_info "Check logs with: docker-compose -f docker-compose.production.yml logs"
        exit 1
    fi
}

# Build all images
build_images() {
    log_info "Building Chess Hawk Docker images..."
    docker-compose build --parallel
    log_success "All images built successfully!"
}

# Clean up
clean_up() {
    log_warning "Cleaning up Chess Hawk containers and images..."
    docker-compose --profile dev --profile test --profile prod down --remove-orphans
    docker-compose --profile dev --profile test --profile prod down --rmi local --volumes
    docker system prune -f
    log_success "Cleanup completed!"
}

# Show logs
show_logs() {
    log_info "Showing logs for running containers..."
    docker-compose logs --tail=50 -f
}

# Show status
show_status() {
    log_info "Chess Hawk Container Status:"
    echo
    docker-compose ps
    echo
    log_info "Docker System Status:"
    docker system df
}

# Stop all containers
stop_containers() {
    log_info "Stopping all Chess Hawk containers..."
    docker-compose --profile dev --profile test --profile prod down
    log_success "All containers stopped!"
}

# Restart containers
restart_containers() {
    log_info "Restarting Chess Hawk containers..."
    docker-compose --profile dev --profile test --profile prod restart
    log_success "Containers restarted!"
}

# Main script logic
main() {
    check_docker

    case "${1:-}" in
        "dev")
            start_dev
            ;;
        "test")
            start_test
            ;;
        "test-run")
            run_tests
            ;;
        "prod")
            start_prod
            ;;
        "prod-full")
            start_prod_full
            ;;
        "deploy")
            deploy_prod
            ;;
        "build")
            build_images
            ;;
        "clean")
            clean_up
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop_containers
            ;;
        "restart")
            restart_containers
            ;;
        "help"|"-h"|"--help")
            show_usage
            ;;
        "")
            log_error "No command specified."
            show_usage
            exit 1
            ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"