# Chess Hawk - Multi-stage Docker build
# Supports development, testing, and production environments

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application (use working production build)
RUN npm run build:production

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Install development dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose development port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Testing stage - optimized for faster CI builds
FROM node:18-alpine AS testing

WORKDIR /app

# Install all dependencies including dev dependencies
COPY package*.json ./
RUN npm ci

# Copy only necessary source files for testing
COPY src/ ./src/
COPY tests/ ./tests/
COPY tsconfig.json ./
COPY vitest.config.ts ./
COPY vite.config.ts ./

# Install additional tools for testing (if needed)
RUN npm install -g serve

# Expose test UI port
EXPOSE 51737

# Default command runs tests in headless mode for CI
CMD ["npm", "run", "test:run"]

# Production stage
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]