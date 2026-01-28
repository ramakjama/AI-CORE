# AIT-NERVE Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Production Configuration](#production-configuration)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup & Recovery](#backup--recovery)

## Prerequisites

### Required Software
- Node.js 20+ LTS
- npm or pnpm
- Docker 24+ (for containerized deployment)
- Docker Compose 2.20+ (for multi-container setup)
- Kubernetes 1.28+ (for K8s deployment)
- Redis 7+ (for distributed coordination)

### System Requirements

**Minimum**
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB
- Network: 100Mbps

**Recommended**
- CPU: 4+ cores
- RAM: 8GB+
- Disk: 50GB+ SSD
- Network: 1Gbps

## Local Development

### 1. Install Dependencies

```bash
cd ait-nerve
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration
nano .env.local
```

### 3. Start Redis (Optional)

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/v1/docs
- WebSocket: ws://localhost:3000/nerve

## Docker Deployment

### Single Container

```bash
# Build image
docker build -t ait-nerve:latest .

# Run container
docker run -d \
  --name ait-nerve \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e REDIS_HOST=redis \
  --restart unless-stopped \
  ait-nerve:latest
```

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Scale service
docker-compose up -d --scale ait-nerve=3
```

### Docker Compose with Monitoring Stack

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  ait-nerve:
    image: ait-nerve:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## Kubernetes Deployment

### 1. Create Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ait-core
  labels:
    name: ait-core
    environment: production
```

### 2. ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ait-nerve-config
  namespace: ait-core
data:
  NODE_ENV: "production"
  API_PREFIX: "/api/v1"
  METRICS_ENABLED: "true"
  FAILOVER_ENABLED: "true"
  LOG_LEVEL: "info"
```

### 3. Secret

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ait-nerve-secrets
  namespace: ait-core
type: Opaque
data:
  # Base64 encoded values
  REDIS_PASSWORD: ""
  JWT_SECRET: ""
  API_KEY: ""
```

### 4. Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ait-nerve
  namespace: ait-core
  labels:
    app: ait-nerve
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ait-nerve
  template:
    metadata:
      labels:
        app: ait-nerve
        version: v1
    spec:
      containers:
      - name: ait-nerve
        image: ait-nerve:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: ait-nerve-config
              key: NODE_ENV
        - name: REDIS_HOST
          value: redis-service
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ait-nerve-secrets
              key: REDIS_PASSWORD
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/v1/nerve/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/v1/nerve/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
```

### 5. Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ait-nerve-service
  namespace: ait-core
  labels:
    app: ait-nerve
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ait-nerve
```

### 6. Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ait-nerve-ingress
  namespace: ait-core
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - nerve.ait-core.com
    secretName: ait-nerve-tls
  rules:
  - host: nerve.ait-core.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ait-nerve-service
            port:
              number: 80
```

### 7. HorizontalPodAutoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ait-nerve-hpa
  namespace: ait-core
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ait-nerve
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets and config
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n ait-core
kubectl get svc -n ait-core
kubectl get ingress -n ait-core

# View logs
kubectl logs -f deployment/ait-nerve -n ait-core

# Scale manually
kubectl scale deployment ait-nerve --replicas=5 -n ait-core
```

## Production Configuration

### Environment Variables

```bash
# Production .env
NODE_ENV=production
API_PORT=3000
API_PREFIX=/api/v1

# Redis
REDIS_HOST=redis-cluster.internal
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# Security
JWT_SECRET=<random-secret-min-32-chars>
API_KEY=<random-api-key>
ENABLE_AUTH=true

# Performance
MAX_CONCURRENT_REQUESTS=5000
REQUEST_TIMEOUT=120000

# Monitoring
METRICS_ENABLED=true
PROMETHEUS_ENABLED=true
ALERTING_ENABLED=true

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/ait-nerve
upstream ait_nerve {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name nerve.ait-core.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name nerve.ait-core.com;

    ssl_certificate /etc/ssl/certs/ait-nerve.crt;
    ssl_certificate_key /etc/ssl/private/ait-nerve.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
        proxy_pass http://ait_nerve;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /nerve/ {
        proxy_pass http://ait_nerve;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ait-nerve',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      API_PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '2G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 10000
  }]
};

// Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ait-nerve'
    static_configs:
      - targets: ['ait-nerve:3000']
    metrics_path: '/api/v1/nerve/metrics/prometheus'
```

### Grafana Dashboard

Import the provided Grafana dashboard:
- Dashboard ID: `ait-nerve-dashboard.json`
- Metrics: Engine health, request rates, error rates, response times

### Alert Rules

```yaml
# alerts.yml
groups:
  - name: ait-nerve-alerts
    interval: 30s
    rules:
      - alert: EngineDown
        expr: nerve_engine_health_status == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Engine {{ $labels.engine_id }} is down"

      - alert: HighErrorRate
        expr: rate(nerve_engine_requests_total{status="error"}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on {{ $labels.engine_id }}"

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(nerve_engine_request_duration_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow responses on {{ $labels.engine_id }}"
```

## Backup & Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/ait-nerve"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup configuration
cp .env "${BACKUP_DIR}/env_${DATE}"
cp -r config "${BACKUP_DIR}/config_${DATE}"

# Backup Redis data (if using)
docker exec redis redis-cli SAVE
docker cp redis:/data/dump.rdb "${BACKUP_DIR}/redis_${DATE}.rdb"

# Compress
tar -czf "${BACKUP_DIR}/backup_${DATE}.tar.gz" \
  "${BACKUP_DIR}/env_${DATE}" \
  "${BACKUP_DIR}/config_${DATE}" \
  "${BACKUP_DIR}/redis_${DATE}.rdb"

# Cleanup old backups (keep 30 days)
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery

```bash
# 1. Restore from backup
tar -xzf backup_20240128.tar.gz

# 2. Restore environment
cp env_20240128 .env

# 3. Restore configuration
cp -r config_20240128 config/

# 4. Restore Redis data
docker cp redis_20240128.rdb redis:/data/dump.rdb
docker restart redis

# 5. Restart AIT-NERVE
docker-compose down
docker-compose up -d
```

## Health Checks

### Startup Verification

```bash
# Check if service is running
curl http://localhost:3000/api/v1/nerve/health

# Check all engines
curl http://localhost:3000/api/v1/nerve/engines

# Check metrics
curl http://localhost:3000/api/v1/nerve/metrics/summary
```

### Continuous Monitoring

```bash
# Monitor logs
docker-compose logs -f ait-nerve

# Watch metrics
watch -n 5 'curl -s http://localhost:3000/api/v1/nerve/metrics/summary | jq .'

# Check circuit breakers
curl http://localhost:3000/api/v1/nerve/circuit-breakers | jq .
```

## Troubleshooting

See main README.md for common issues and solutions.

## Security Hardening

1. Use secrets management (Vault, AWS Secrets Manager)
2. Enable HTTPS/TLS everywhere
3. Implement rate limiting
4. Use network policies in Kubernetes
5. Regular security updates
6. Audit logging
7. IP whitelisting
8. API key rotation

---

For support: support@ait-core.com
