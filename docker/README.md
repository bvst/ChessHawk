# 🐳 Chess Hawk Docker Setup

This directory contains Docker configuration files for running Chess Hawk in different environments.

## 🚀 Quick Start

### Development Environment
```bash
# Start development server with hot reload
docker-compose --profile dev up

# Access at: http://localhost:5173
```

### Testing Environment
```bash
# Start test environment with Vitest UI
docker-compose --profile test up

# Access test UI at: http://localhost:51737
# Access preview server at: http://localhost:4173
```

### Production Environment
```bash
# Build and start production server
docker-compose --profile prod up

# Access at: http://localhost:8080
```

## 📋 Available Profiles

| Profile | Purpose | Ports | Services |
|---------|---------|-------|----------|
| `dev` | Development with hot reload | 5173 | chess-hawk-dev |
| `test` | Testing with Vitest UI | 51737, 4173 | chess-hawk-test |
| `prod` | Production deployment | 8080 | chess-hawk-prod |
| `test-ci` | Headless testing for CI/CD | - | chess-hawk-test-runner |
| `db` | PostgreSQL database | 5432 | chess-hawk-db |
| `cache` | Redis cache | 6379 | chess-hawk-cache |

## 🔧 Common Commands

### Development Workflow
```bash
# Start development environment
docker-compose --profile dev up -d

# View logs
docker-compose --profile dev logs -f

# Stop development environment
docker-compose --profile dev down

# Rebuild after changes
docker-compose --profile dev up --build
```

### Testing Workflow
```bash
# Start test environment with UI
docker-compose --profile test up -d

# Run headless tests (CI/CD)
docker-compose --profile test-ci up --abort-on-container-exit

# Run tests with coverage
docker-compose --profile test-ci run --rm chess-hawk-test-runner npm run test:coverage

# View test results
docker-compose --profile test logs chess-hawk-test
```

### Production Workflow
```bash
# Build and start production
docker-compose --profile prod up -d

# Check health status
docker-compose --profile prod ps

# View production logs
docker-compose --profile prod logs -f

# Scale production (if needed)
docker-compose --profile prod up -d --scale chess-hawk-prod=3
```

## 🏗️ Multi-Stage Build

The Dockerfile uses multi-stage builds with these targets:

1. **builder** - Compiles TypeScript and builds production assets
2. **development** - Hot reload development environment
3. **testing** - Test runner with Vitest UI
4. **production** - Optimized Nginx-served production build

## 🔍 Build Specific Targets

```bash
# Build development image only
docker build --target development -t chess-hawk:dev .

# Build testing image only
docker build --target testing -t chess-hawk:test .

# Build production image only
docker build --target production -t chess-hawk:prod .
```

## 📱 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `POSTGRES_DB` | Database name | chesshawk |
| `POSTGRES_USER` | Database user | chesshawk |
| `POSTGRES_PASSWORD` | Database password | chesshawk_password |

## 🏥 Health Checks

Production containers include health checks:
- **HTTP Check**: `GET /health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

## 📊 Monitoring

### Container Status
```bash
# Check all containers
docker-compose ps

# Check specific profile
docker-compose --profile prod ps

# View resource usage
docker stats
```

### Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs chess-hawk-prod

# Follow logs
docker-compose logs -f --tail=100
```

## 🔧 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using port 5173
lsof -i :5173

# Use different ports
docker-compose --profile dev up -p "3000:5173"
```

**Build failures:**
```bash
# Clear Docker cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache
```

**Permission issues:**
```bash
# Fix file permissions
docker run --rm -v $(pwd):/app -w /app node:18-alpine chown -R $(id -u):$(id -g) .
```

### Development Issues

**Hot reload not working:**
- Ensure volumes are properly mounted
- Check file watchers: `docker-compose --profile dev logs`

**Tests not running:**
- Verify test files exist: `docker-compose --profile test exec chess-hawk-test ls src/`
- Check test command: `docker-compose --profile test exec chess-hawk-test npm run test`

### Production Issues

**Static files not loading:**
- Check nginx configuration
- Verify build output: `docker-compose --profile prod exec chess-hawk-prod ls /usr/share/nginx/html`

**Health check failing:**
- Test manually: `docker-compose --profile prod exec chess-hawk-prod wget -qO- http://localhost/health`

## 🚢 Deployment

### Local Deployment
```bash
# Production-like environment
docker-compose --profile prod up -d

# With database and cache
docker-compose --profile prod --profile db --profile cache up -d
```

### CI/CD Integration
```bash
# Build and test pipeline
docker-compose --profile test-ci up --abort-on-container-exit

# Production deployment
docker-compose --profile prod up -d
```

## 🔐 Security Considerations

- Production containers run as non-root user
- Security headers configured in nginx
- Minimal base images used (Alpine Linux)
- No sensitive data in environment variables
- Health checks prevent deployment of broken containers

## 📈 Performance

### Optimization Features
- Multi-stage builds reduce image size
- Nginx gzip compression enabled
- Static asset caching configured
- Volume mounts for development efficiency

### Resource Limits
Add to docker-compose.yml if needed:
```yaml
services:
  chess-hawk-prod:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```