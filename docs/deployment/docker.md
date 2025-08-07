# Docker Deployment Guide

## Overview

Deploy LabFlow using Docker for consistent, scalable deployment across environments.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 20GB disk space

## Quick Start

```bash
# Clone repository
git clone https://github.com/labflow/labflow.git
cd labflow

# Copy environment file
cp .env.example .env

# Build and run
docker-compose up -d
```

## Docker Images

### Web Application

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Building Images

```bash
# Build web image
docker build -t labflow/web:latest .

# Build with specific tag
docker build -t labflow/web:v1.2.3 .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -t labflow/web:latest .
```

## Docker Compose Configuration

### Production Setup

```yaml
version: '3.8'

services:
  web:
    image: labflow/web:latest
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### Development Setup

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      target: development
    ports:
      - "5173:5173"
    volumes:
      - ./src:/app/src
      - ./public:/app/public
    environment:
      - NODE_ENV=development
    command: yarn dev --host

  firebase-emulator:
    image: andreysenov/firebase-tools
    ports:
      - "4000:4000"
      - "9099:9099"
    volumes:
      - ./firebase.json:/home/node/firebase.json
    command: firebase emulators:start
```

## Container Management

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View logs
docker logs -f labflow-web

# Execute commands
docker exec -it labflow-web sh
```

### Resource Limits

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## Networking

### Custom Network

```yaml
networks:
  labflow-net:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Discovery

```yaml
services:
  web:
    networks:
      - labflow-net
    aliases:
      - labflow-web
```

## Volume Management

### Persistent Data

```yaml
volumes:
  app-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/labflow
```

### Backup Strategy

```bash
# Backup volumes
docker run --rm -v labflow_app-data:/data -v $(pwd):/backup alpine tar czf /backup/labflow-backup.tar.gz -C /data .

# Restore volumes
docker run --rm -v labflow_app-data:/data -v $(pwd):/backup alpine tar xzf /backup/labflow-backup.tar.gz -C /data
```

## Security Considerations

1. **Non-root User**: Run containers as non-root
2. **Read-only Filesystem**: Use read-only where possible
3. **Secrets Management**: Use Docker secrets
4. **Network Isolation**: Use custom networks
5. **Image Scanning**: Scan for vulnerabilities

## Monitoring

### Prometheus Integration

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

### Logging

```yaml
services:
  web:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **Permission Issues**
   ```bash
   docker exec -it labflow-web chown -R nginx:nginx /var/www
   ```

3. **Memory Issues**
   ```bash
   docker system prune -a
   ```

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates in place
- [ ] Health checks configured
- [ ] Resource limits set
- [ ] Logging configured
- [ ] Backup strategy implemented
- [ ] Monitoring enabled
- [ ] Security scanning enabled