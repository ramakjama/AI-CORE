# AIT-CORE Production Deployment Guide

**Version 1.0.0** | **Last Updated:** January 28, 2026

---

## Table of Contents

1. [Production Overview](#1-production-overview)
2. [Server Requirements](#2-server-requirements)
3. [Docker Deployment](#3-docker-deployment)
4. [Kubernetes Deployment](#4-kubernetes-deployment)
5. [SSL/TLS Setup](#5-ssltls-setup)
6. [Environment Configuration](#6-environment-configuration)
7. [Database Setup](#7-database-setup)
8. [Monitoring Setup](#8-monitoring-setup)
9. [Backup Strategy](#9-backup-strategy)
10. [Disaster Recovery](#10-disaster-recovery)
11. [Security Hardening](#11-security-hardening)
12. [Performance Optimization](#12-performance-optimization)
13. [Scaling Strategy](#13-scaling-strategy)
14. [Maintenance Procedures](#14-maintenance-procedures)

---

## 1. Production Overview

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         INTERNET                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                    CLOUDFLARE CDN + WAF                           │
│              (DDoS Protection, Rate Limiting)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                  AWS Application Load Balancer                    │
│            (SSL Termination, Health Checks)                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                 KUBERNETES CLUSTER (EKS)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    APPLICATION LAYER                         ││
│  │                                                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   ││
│  │  │API Server│  │ Web App  │  │  Admin   │  │  Suite   │   ││
│  │  │(5 pods)  │  │(3 pods)  │  │(2 pods)  │  │(3 pods)  │   ││
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   ││
│  │                                                              ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 ││
│  │  │ Modules  │  │ AI Agents│  │ Engines  │                 ││
│  │  │(57 pods) │  │(16 pods) │  │(2 pods)  │                 ││
│  │  └──────────┘  └──────────┘  └──────────┘                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                     │
│  ┌─────────────────────────┴─────────────────────────────────┐  │
│  │                   INFRASTRUCTURE LAYER                     │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Ingress │  │  Cache   │  │   Queue  │  │  Service │ │  │
│  │  │  NGINX   │  │  Redis   │  │  Kafka   │  │   Mesh   │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────────────┐
│                      DATA LAYER (AWS)                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │RDS PostgreSQL│  │ElastiCache   │  │Elasticsearch │           │
│  │(Multi-AZ)    │  │Redis (Clstr) │  │Service       │           │
│  │Primary+2 Read│  │3 nodes       │  │3 nodes       │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │MSK Kafka     │  │    S3        │  │  Secrets     │           │
│  │3 brokers     │  │(Documents)   │  │  Manager     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    MONITORING & OBSERVABILITY                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Prometheus   │  │   Grafana    │  │  ELK Stack   │           │
│  │ (Metrics)    │  │ (Dashboards) │  │   (Logs)     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Jaeger     │  │    Sentry    │  │ CloudWatch   │           │
│  │  (Tracing)   │  │   (Errors)   │  │   (AWS)      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
```

### Deployment Targets

| Environment | Purpose | Resources |
|------------|---------|-----------|
| **Development** | Local development | Docker Compose, 4GB RAM |
| **Staging** | Pre-production testing | K8s, 3 nodes, 16GB each |
| **Production** | Live system | K8s, 10+ nodes, 32GB each |

---

## 2. Server Requirements

### Production Minimum Requirements

**Kubernetes Cluster:**
- 10 nodes minimum (for HA)
- Instance type: t3.xlarge (AWS) or equivalent
- 4 vCPUs per node
- 16 GB RAM per node
- 100 GB SSD storage per node
- Network: 10 Gbps

**Database Server:**
- RDS PostgreSQL 15
- Instance type: db.r6g.2xlarge
- 8 vCPUs
- 64 GB RAM
- 1 TB SSD storage
- Multi-AZ deployment
- 2 read replicas

**Cache Server:**
- ElastiCache Redis 7.0
- Instance type: cache.r6g.xlarge
- 4 vCPUs
- 26 GB RAM
- Cluster mode enabled (3 nodes)

**Message Queue:**
- Amazon MSK (Kafka)
- kafka.m5.large
- 3 brokers (Multi-AZ)
- 2 TB storage per broker

**Search:**
- Elasticsearch Service 8.x
- Instance type: r6g.large.elasticsearch
- 3 nodes (Multi-AZ)
- 500 GB storage per node

**Object Storage:**
- Amazon S3
- Standard storage class
- Versioning enabled
- Lifecycle policies configured

### Network Requirements

**Bandwidth:**
- External: 1 Gbps minimum
- Internal: 10 Gbps
- CDN: Cloudflare Pro or higher

**Ports:**
- 80 (HTTP) - Redirects to 443
- 443 (HTTPS) - Main application
- 22 (SSH) - Bastion host only
- 5432 (PostgreSQL) - Internal only
- 6379 (Redis) - Internal only
- 9092 (Kafka) - Internal only
- 9200 (Elasticsearch) - Internal only

---

## 3. Docker Deployment

### Building Docker Images

**1. Build Multi-Stage Dockerfile:**

```dockerfile
# C:\Users\rsori\codex\ait-core-soriano\Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && \
    pnpm run build && \
    pnpm prune --prod

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

**2. Build Images:**

```bash
# Build API image
docker build -t ait-core-api:1.0.0 \
  --target runner \
  --build-arg APP=api \
  -f apps/api/Dockerfile .

# Build Web App image
docker build -t ait-core-web:1.0.0 \
  --target runner \
  --build-arg APP=web \
  -f apps/web/Dockerfile .

# Build Admin image
docker build -t ait-core-admin:1.0.0 \
  --target runner \
  --build-arg APP=admin \
  -f apps/admin/Dockerfile .
```

**3. Tag for Registry:**

```bash
# AWS ECR
docker tag ait-core-api:1.0.0 123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-api:1.0.0
docker tag ait-core-web:1.0.0 123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-web:1.0.0

# Push to registry
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
docker push 123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-api:1.0.0
docker push 123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-web:1.0.0
```

### Docker Compose (Development Only)

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  api:
    image: ait-core-api:1.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    image: ait-core-web:1.0.0
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${API_URL}
    depends_on:
      - api
    restart: unless-stopped

  admin:
    image: ait-core-admin:1.0.0
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${API_URL}
    depends_on:
      - api
    restart: unless-stopped
```

---

## 4. Kubernetes Deployment

### Prerequisites

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Configure kubectl for EKS
aws eks update-kubeconfig --region eu-west-1 --name ait-core-production
```

### Create Namespace

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

```bash
kubectl apply -f k8s/namespace.yaml
```

### Secrets Management

**Using AWS Secrets Manager:**

```bash
# Create secret in AWS Secrets Manager
aws secretsmanager create-secret \
  --name ait-core/production/database \
  --secret-string '{"username":"postgres","password":"SecurePassword123!"}'

# Install Secrets Store CSI Driver
helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
helm install csi-secrets-store secrets-store-csi-driver/secrets-store-csi-driver --namespace kube-system

# Install AWS Provider
kubectl apply -f https://raw.githubusercontent.com/aws/secrets-store-csi-driver-provider-aws/main/deployment/aws-provider-installer.yaml
```

**Create Kubernetes Secrets:**

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ait-core-secrets
  namespace: ait-core
type: Opaque
stringData:
  DATABASE_URL: postgresql://user:pass@rds-endpoint:5432/aitcore
  REDIS_URL: redis://elasticache-endpoint:6379
  JWT_SECRET: your-super-secret-jwt-key
  CLAUDE_API_KEY: sk-ant-api-key
  SENTRY_DSN: https://your-sentry-dsn
```

```bash
kubectl apply -f k8s/secrets.yaml
```

### ConfigMaps

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ait-core-config
  namespace: ait-core
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  CORS_ORIGIN: "https://sorianomediadores.es"
  API_VERSION: "v1"
```

### Deployment: API Server

```yaml
# k8s/deployments/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ait-core-api
  namespace: ait-core
  labels:
    app: ait-core-api
    tier: backend
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: ait-core-api
  template:
    metadata:
      labels:
        app: ait-core-api
        version: "1.0.0"
    spec:
      serviceAccountName: ait-core-api
      containers:
      - name: api
        image: 123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-api:1.0.0
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: ait-core-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: ait-core-secrets
              key: DATABASE_URL
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: ait-core-secrets
              key: REDIS_URL
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - ait-core-api
              topologyKey: kubernetes.io/hostname
```

### Service

```yaml
# k8s/services/api.yaml
apiVersion: v1
kind: Service
metadata:
  name: ait-core-api
  namespace: ait-core
  labels:
    app: ait-core-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: ait-core-api
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ait-core-ingress
  namespace: ait-core
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - api.sorianomediadores.es
    - app.sorianomediadores.es
    - admin.sorianomediadores.es
    secretName: ait-core-tls
  rules:
  - host: api.sorianomediadores.es
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ait-core-api
            port:
              number: 80
  - host: app.sorianomediadores.es
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ait-core-web
            port:
              number: 80
  - host: admin.sorianomediadores.es
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ait-core-admin
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ait-core-api-hpa
  namespace: ait-core
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ait-core-api
  minReplicas: 5
  maxReplicas: 20
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### Deploy All Resources

```bash
# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n ait-core
kubectl get services -n ait-core
kubectl get ingress -n ait-core

# Check logs
kubectl logs -f deployment/ait-core-api -n ait-core

# Check pod details
kubectl describe pod <pod-name> -n ait-core
```

---

## 5. SSL/TLS Setup

### Using Cert-Manager with Let's Encrypt

**1. Install Cert-Manager:**

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

**2. Create ClusterIssuer:**

```yaml
# k8s/cert-manager/cluster-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@sorianomediadores.es
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

```bash
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml
```

**3. Certificate will be automatically generated** based on Ingress annotations.

### Using AWS Certificate Manager (ACM)

**1. Request Certificate:**

```bash
aws acm request-certificate \
  --domain-name sorianomediadores.es \
  --subject-alternative-names *.sorianomediadores.es \
  --validation-method DNS \
  --region eu-west-1
```

**2. Validate via DNS:**
- Add CNAME records provided by ACM to your DNS

**3. Use in Load Balancer:**

```yaml
# k8s/ingress-alb.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ait-core-ingress
  namespace: ait-core
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:eu-west-1:123456789012:certificate/abc-123
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
```

### SSL Best Practices

**nginx.conf SSL Configuration:**

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;

# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## 6. Environment Configuration

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/aitcore
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=50
DATABASE_SSL=true

# Redis
REDIS_URL=redis://elasticache-endpoint:6379
REDIS_TLS=true
REDIS_PASSWORD=SecureRedisPassword

# Kafka
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092
KAFKA_CLIENT_ID=ait-core-production
KAFKA_SSL=true

# Elasticsearch
ELASTICSEARCH_URL=https://es-endpoint:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=SecureElasticPassword

# API Keys
CLAUDE_API_KEY=sk-ant-api-key
OPENAI_API_KEY=sk-openai-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
SESSION_SECRET=your-session-secret

# OAuth
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
OAUTH_GOOGLE_CALLBACK_URL=https://api.sorianomediadores.es/auth/google/callback

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@sorianomediadores.es

# AWS
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=ait-core-documents
S3_REGION=eu-west-1

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PORT=9090
GRAFANA_URL=https://grafana.sorianomediadores.es

# Application
NODE_ENV=production
PORT=3000
API_VERSION=v1
LOG_LEVEL=info
CORS_ORIGIN=https://sorianomediadores.es,https://app.sorianomediadores.es
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=3600000

# Feature Flags
ENABLE_AI_AGENTS=true
ENABLE_ANALYTICS=true
ENABLE_WEBHOOKS=true
MAINTENANCE_MODE=false
```

### Managing Secrets

**Using AWS Systems Manager Parameter Store:**

```bash
# Store secret
aws ssm put-parameter \
  --name "/ait-core/production/database-url" \
  --value "postgresql://..." \
  --type SecureString \
  --key-id alias/aws/ssm

# Retrieve secret
aws ssm get-parameter \
  --name "/ait-core/production/database-url" \
  --with-decryption \
  --query Parameter.Value \
  --output text
```

---

## 7. Database Setup

### PostgreSQL Production Setup

**1. Create RDS Instance:**

```bash
aws rds create-db-instance \
  --db-instance-identifier ait-core-production \
  --db-instance-class db.r6g.2xlarge \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password SecurePassword123! \
  --allocated-storage 1000 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --enable-performance-insights \
  --performance-insights-retention-period 7 \
  --db-subnet-group-name ait-core-db-subnet \
  --vpc-security-group-ids sg-12345678
```

**2. Create Read Replicas:**

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier ait-core-production-replica-1 \
  --source-db-instance-identifier ait-core-production \
  --db-instance-class db.r6g.2xlarge \
  --availability-zone eu-west-1a

aws rds create-db-instance-read-replica \
  --db-instance-identifier ait-core-production-replica-2 \
  --source-db-instance-identifier ait-core-production \
  --db-instance-class db.r6g.2xlarge \
  --availability-zone eu-west-1b
```

**3. Run Migrations:**

```bash
# Connect to database
kubectl run -it --rm psql-client --image=postgres:15 --restart=Never -- \
  psql postgresql://user:pass@rds-endpoint:5432/aitcore

# Run Prisma migrations
kubectl exec -it deployment/ait-core-api -n ait-core -- \
  npx prisma migrate deploy

# Seed initial data
kubectl exec -it deployment/ait-core-api -n ait-core -- \
  npx prisma db seed
```

**4. Configure Connection Pooling (PgBouncer):**

```yaml
# k8s/pgbouncer.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: ait-core
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:1.21.0
        ports:
        - containerPort: 5432
        env:
        - name: DATABASES_HOST
          value: "rds-endpoint.amazonaws.com"
        - name: DATABASES_PORT
          value: "5432"
        - name: DATABASES_DBNAME
          value: "aitcore"
        - name: DATABASES_USER
          valueFrom:
            secretKeyRef:
              name: ait-core-secrets
              key: DB_USER
        - name: DATABASES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ait-core-secrets
              key: DB_PASSWORD
```

### Database Performance Tuning

**PostgreSQL Configuration:**

```sql
-- Increase connection limits
ALTER SYSTEM SET max_connections = 500;

-- Optimize memory
ALTER SYSTEM SET shared_buffers = '16GB';
ALTER SYSTEM SET effective_cache_size = '48GB';
ALTER SYSTEM SET maintenance_work_mem = '2GB';
ALTER SYSTEM SET work_mem = '32MB';

-- Optimize WAL
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET max_wal_size = '4GB';

-- Query optimization
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Apply changes
SELECT pg_reload_conf();
```

---

## 8. Monitoring Setup

### Prometheus Stack Installation

**1. Install kube-prometheus-stack:**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
  --set grafana.adminPassword=SecureGrafanaPassword
```

**2. Configure ServiceMonitors:**

```yaml
# k8s/monitoring/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ait-core-api
  namespace: ait-core
  labels:
    app: ait-core-api
spec:
  selector:
    matchLabels:
      app: ait-core-api
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

**3. Create Grafana Dashboards:**

```json
// k8s/monitoring/dashboards/api-dashboard.json
{
  "dashboard": {
    "title": "AIT-CORE API Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{app=\"ait-core-api\"}[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{app=\"ait-core-api\",status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack for Logs

**1. Install Elasticsearch:**

```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace \
  --set replicas=3 \
  --set volumeClaimTemplate.resources.requests.storage=500Gi
```

**2. Install Filebeat:**

```bash
helm install filebeat elastic/filebeat \
  --namespace logging \
  --set daemonset.enabled=true
```

**3. Install Kibana:**

```bash
helm install kibana elastic/kibana \
  --namespace logging \
  --set service.type=LoadBalancer
```

### Jaeger for Distributed Tracing

```bash
kubectl create namespace observability
kubectl apply -n observability -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.51.0/jaeger-operator.yaml

# Create Jaeger instance
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
  namespace: observability
spec:
  strategy: production
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
EOF
```

### Sentry for Error Tracking

**1. Configure Sentry in Application:**

```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

**2. Create Alerts:**
- Navigate to Sentry dashboard
- Create alert rules for critical errors
- Configure Slack/email notifications

---

## 9. Backup Strategy

### Database Backups

**Automated RDS Backups:**

```bash
# Configure backup window and retention
aws rds modify-db-instance \
  --db-instance-identifier ait-core-production \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00"

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ait-core-production \
  --db-snapshot-identifier ait-core-manual-$(date +%Y%m%d-%H%M%S)
```

**Point-in-Time Recovery:**

```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ait-core-production \
  --target-db-instance-identifier ait-core-restored \
  --restore-time 2024-01-28T10:00:00Z
```

### Application Backups

**1. Backup ConfigMaps and Secrets:**

```bash
# Export all resources
kubectl get all,configmap,secret -n ait-core -o yaml > backup-$(date +%Y%m%d).yaml

# Backup to S3
aws s3 cp backup-$(date +%Y%m%d).yaml s3://ait-core-backups/k8s/
```

**2. Automated Backup Script:**

```bash
#!/bin/bash
# /opt/scripts/backup.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/tmp/ait-backups"
S3_BUCKET="s3://ait-core-backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Kubernetes resources
kubectl get all,configmap,secret,pvc -n ait-core -o yaml > $BACKUP_DIR/k8s-$DATE.yaml

# Backup database
pg_dump postgresql://user:pass@rds-endpoint:5432/aitcore | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Backup to S3
aws s3 sync $BACKUP_DIR/ $S3_BUCKET/$(date +%Y/%m/%d)/

# Cleanup local files older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

**3. Schedule with CronJob:**

```yaml
# k8s/cronjobs/backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-job
  namespace: ait-core
spec:
  schedule: "0 3 * * *"  # Daily at 3 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: amazon/aws-cli:latest
            command: ["/bin/bash", "/scripts/backup.sh"]
            volumeMounts:
            - name: backup-script
              mountPath: /scripts
          volumes:
          - name: backup-script
            configMap:
              name: backup-script
          restartPolicy: OnFailure
```

### Backup Verification

**Weekly Backup Testing:**

```bash
#!/bin/bash
# Test backup restore

# Restore to test environment
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ait-core-test-restore \
  --db-snapshot-identifier latest-snapshot

# Verify data integrity
psql postgresql://user:pass@test-endpoint:5432/aitcore -c "SELECT COUNT(*) FROM policies;"

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier ait-core-test-restore \
  --skip-final-snapshot
```

---

## 10. Disaster Recovery

### Recovery Time Objective (RTO)

- **Target RTO**: 4 hours
- **Actual RTO**: < 2 hours (tested quarterly)

### Recovery Point Objective (RPO)

- **Target RPO**: 15 minutes
- **Actual RPO**: < 5 minutes (continuous replication)

### DR Plan

**1. Primary Region Failure:**

```bash
# Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier ait-core-production-replica-1

# Update DNS to point to DR region
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-failover.json

# Deploy application to DR region
kubectl config use-context eks-dr-region
kubectl apply -f k8s/
```

**2. Database Corruption:**

```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ait-core-restored \
  --db-snapshot-identifier ait-core-snapshot-20240128

# Point application to restored instance
kubectl set env deployment/ait-core-api \
  DATABASE_URL=postgresql://user:pass@restored-endpoint:5432/aitcore \
  -n ait-core
```

**3. Kubernetes Cluster Failure:**

```bash
# Restore from backup
kubectl apply -f s3://ait-core-backups/latest/k8s-backup.yaml

# Verify all pods are running
kubectl get pods -n ait-core --watch

# Test application
curl https://api.sorianomediadores.es/health
```

### DR Testing Schedule

| Test Type | Frequency | Next Test |
|-----------|-----------|-----------|
| Database failover | Monthly | Feb 15, 2024 |
| Full DR drill | Quarterly | Mar 30, 2024 |
| Backup restore | Weekly | Feb 5, 2024 |
| Runbook review | Monthly | Feb 1, 2024 |

---

## 11. Security Hardening

### Network Security

**1. VPC Configuration:**

```bash
# Create VPC with private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create private subnets (for apps)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone eu-west-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone eu-west-1b

# Create database subnets
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone eu-west-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.12.0/24 --availability-zone eu-west-1b
```

**2. Security Groups:**

```bash
# Application security group
aws ec2 create-security-group \
  --group-name ait-core-app-sg \
  --description "AIT-CORE application security group" \
  --vpc-id vpc-xxx

# Allow HTTPS from load balancer only
aws ec2 authorize-security-group-ingress \
  --group-id sg-app \
  --protocol tcp \
  --port 443 \
  --source-group sg-lb

# Database security group
aws ec2 create-security-group \
  --group-name ait-core-db-sg \
  --description "AIT-CORE database security group" \
  --vpc-id vpc-xxx

# Allow PostgreSQL from application security group only
aws ec2 authorize-security-group-ingress \
  --group-id sg-db \
  --protocol tcp \
  --port 5432 \
  --source-group sg-app
```

### Pod Security Policies

```yaml
# k8s/security/pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

### Network Policies

```yaml
# k8s/security/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ait-core-network-policy
  namespace: ait-core
spec:
  podSelector:
    matchLabels:
      app: ait-core-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

### WAF Configuration (AWS WAF)

```bash
# Create WAF WebACL
aws wafv2 create-web-acl \
  --name ait-core-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=aitCoreWAF

# waf-rules.json
[
  {
    "Name": "RateLimitRule",
    "Priority": 1,
    "Statement": {
      "RateBasedStatement": {
        "Limit": 2000,
        "AggregateKeyType": "IP"
      }
    },
    "Action": {
      "Block": {}
    }
  },
  {
    "Name": "SQLiRule",
    "Priority": 2,
    "Statement": {
      "ManagedRuleGroupStatement": {
        "VendorName": "AWS",
        "Name": "AWSManagedRulesSQLiRuleSet"
      }
    },
    "OverrideAction": {
      "None": {}
    }
  }
]
```

---

## 12. Performance Optimization

### CDN Configuration (Cloudflare)

**Cache Rules:**

```javascript
// Static assets: cache for 1 year
Cache-Control: public, max-age=31536000, immutable

// API responses: cache for 5 minutes with stale-while-revalidate
Cache-Control: public, max-age=300, stale-while-revalidate=600

// HTML pages: cache for 1 hour
Cache-Control: public, max-age=3600, must-revalidate
```

### Database Query Optimization

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_policies_client_id ON policies(client_id);
CREATE INDEX CONCURRENTLY idx_policies_status_date ON policies(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_claims_policy_id ON claims(policy_id);
CREATE INDEX CONCURRENTLY idx_claims_status_date ON claims(status, created_at DESC);

-- Analyze and vacuum
ANALYZE policies;
VACUUM ANALYZE policies;

-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Redis Caching Strategy

```typescript
// Cache frequently accessed data
const CACHE_TTL = {
  policies: 300,      // 5 minutes
  clients: 600,       // 10 minutes
  reports: 3600,      // 1 hour
  static: 86400,      // 24 hours
};

// Cache aside pattern
async function getPolicy(id: string) {
  // Try cache first
  const cached = await redis.get(`policy:${id}`);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const policy = await db.policy.findUnique({ where: { id } });

  // Store in cache
  await redis.setex(
    `policy:${id}`,
    CACHE_TTL.policies,
    JSON.stringify(policy)
  );

  return policy;
}
```

### Application Performance

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Connection pooling
const pool = new Pool({
  max: 50,
  min: 10,
  idle: 10000,
});

// Query timeout
const result = await db.$queryRaw`
  SELECT * FROM policies
  WHERE status = 'active'
  LIMIT 100
`.timeout(5000);

// Batch operations
const batchSize = 100;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  await db.policy.createMany({ data: batch });
}
```

---

## 13. Scaling Strategy

### Horizontal Scaling

**Auto-scaling based on metrics:**

```yaml
# HPA configured in section 4
# Scales from 5 to 20 pods based on CPU/memory

# Verify auto-scaling
kubectl get hpa -n ait-core --watch

# Manual scaling if needed
kubectl scale deployment ait-core-api --replicas=10 -n ait-core
```

### Vertical Scaling

**Resource optimization:**

```yaml
# Start with conservative resources
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"

# Monitor and adjust based on actual usage
kubectl top pods -n ait-core
kubectl top nodes
```

### Database Scaling

**Read replicas for read-heavy workloads:**

```typescript
// Database connection configuration
const readReplicas = [
  'replica1.amazonaws.com',
  'replica2.amazonaws.com',
];

// Read from replicas
const policy = await db.policy.findMany({
  // Routes to read replica
});

// Write to primary
const newPolicy = await db.policy.create({
  // Routes to primary
});
```

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run --vus 100 --duration 5m load-test.js

# load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function() {
  const res = http.get('https://api.sorianomediadores.es/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

## 14. Maintenance Procedures

### Rolling Updates

```bash
# Update deployment
kubectl set image deployment/ait-core-api \
  api=123456789012.dkr.ecr.eu-west-1.amazonaws.com/ait-core-api:1.1.0 \
  -n ait-core

# Monitor rollout
kubectl rollout status deployment/ait-core-api -n ait-core

# Rollback if needed
kubectl rollout undo deployment/ait-core-api -n ait-core
```

### Database Maintenance

```sql
-- Weekly maintenance (automated)
VACUUM ANALYZE;

-- Monthly reindex (during maintenance window)
REINDEX DATABASE aitcore CONCURRENTLY;

-- Check table bloat
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS external_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### Maintenance Windows

**Schedule:**
- **Weekly**: Sunday 03:00-04:00 UTC (Database backups)
- **Monthly**: First Sunday 03:00-05:00 UTC (OS patches, DB maintenance)
- **Quarterly**: As needed (Major upgrades)

**Maintenance Mode:**

```bash
# Enable maintenance mode
kubectl set env deployment/ait-core-api MAINTENANCE_MODE=true -n ait-core

# Verify
curl https://api.sorianomediadores.es/health
# {"status":"maintenance","message":"System under maintenance"}

# Disable maintenance mode
kubectl set env deployment/ait-core-api MAINTENANCE_MODE=false -n ait-core
```

### Health Checks

```bash
# API health
curl https://api.sorianomediadores.es/health

# Database health
psql postgresql://user:pass@endpoint:5432/aitcore -c "SELECT 1;"

# Redis health
redis-cli -h endpoint ping

# Kafka health
kafka-broker-api-versions --bootstrap-server endpoint:9092
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Backup verified
- [ ] Rollback plan prepared
- [ ] Stakeholders notified

### Deployment

- [ ] Build Docker images
- [ ] Push to registry
- [ ] Update Kubernetes manifests
- [ ] Apply database migrations
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment

- [ ] Verify all services running
- [ ] Check logs for errors
- [ ] Run health checks
- [ ] Monitor metrics
- [ ] Verify user access
- [ ] Update status page
- [ ] Send completion notification
- [ ] Document any issues

---

## Support

For deployment support:
- **DevOps Team**: devops@aintech.es
- **On-Call**: +34 900 XXX XXX
- **Documentation**: https://docs.aintech.es/deployment
- **Runbooks**: https://wiki.aintech.es/runbooks

---

*Deployment Guide v1.0.0 | Last Updated: January 28, 2026*
