# AIT-CORE SORIANO - Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Cloud Deployment (AWS/Azure/GCP)](#cloud-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Environment Configuration](#environment-configuration)
9. [Database Setup](#database-setup)
10. [Monitoring & Observability](#monitoring--observability)
11. [Disaster Recovery](#disaster-recovery)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying AIT-CORE SORIANO in various environments from local development to production cloud infrastructure.

### Deployment Targets

- **Local Development**: Docker Compose on developer workstation
- **Staging**: Kubernetes cluster (3-5 nodes)
- **Production**: Kubernetes cluster (10+ nodes, multi-AZ)

### Deployment Architecture

```
┌────────────────────────────────────────────────────────┐
│                   PRODUCTION                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │          Load Balancer (ALB/CloudFlare)          │ │
│  └───────────────────┬──────────────────────────────┘ │
│                      │                                  │
│  ┌───────────────────┴──────────────────────────────┐ │
│  │         Kubernetes Cluster (10+ nodes)           │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │ │
│  │  │  API   │  │Modules │  │ Agents │  │Engines │ │ │
│  │  │ (5x)   │  │ (57x)  │  │ (16x)  │  │ (2x)   │ │ │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                      │                                  │
│  ┌───────────────────┴──────────────────────────────┐ │
│  │            Data Layer (Managed Services)         │ │
│  │  • RDS PostgreSQL (Multi-AZ)                     │ │
│  │  • ElastiCache Redis (Cluster)                   │ │
│  │  • MSK Kafka (3 brokers)                         │ │
│  │  • Elasticsearch Service                         │ │
│  │  • S3 (object storage)                           │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20+ | Runtime for API and apps |
| pnpm | 8+ | Package manager |
| Docker | 24+ | Containerization |
| Kubernetes | 1.28+ | Orchestration |
| kubectl | 1.28+ | K8s CLI |
| Helm | 3.12+ | K8s package manager |
| PostgreSQL | 15+ | Database (local dev) |
| Redis | 7+ | Cache (local dev) |
| Python | 3.11+ | AI engines |

### Cloud Accounts (Production)

- AWS / Azure / GCP account
- Domain with DNS control
- SSL certificates
- Anthropic API key (Claude)

### Access Requirements

- GitHub repository access
- Container registry access (ECR/ACR/GCR)
- Cloud provider credentials
- Database credentials
- API keys for external services

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/aintech/ait-core-soriano.git
cd ait-core-soriano

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# nano .env

# Start infrastructure (PostgreSQL, Redis, Kafka, etc.)
pnpm docker:up

# Wait for services to be ready (30-60 seconds)

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start all services in development mode
pnpm dev
```

### Access Points (Local)

- **API**: http://localhost:3000
- **Web App**: http://localhost:3001
- **Admin Panel**: http://localhost:3002
- **API Docs**: http://localhost:3000/api/docs
- **Grafana**: http://localhost:3005
- **Kibana**: http://localhost:5601

### Development Workflow

```bash
# Start specific app
cd apps/api
pnpm dev

# Start specific module
cd modules/01-core-business/ai-accountant
pnpm dev

# Run tests
pnpm test                    # All tests
pnpm test:unit              # Unit tests only
pnpm test:integration       # Integration tests
pnpm test:e2e               # End-to-end tests

# Lint and format
pnpm lint
pnpm format

# Type checking
pnpm type-check

# Build for production
pnpm build
```

---

## Docker Deployment

### Build Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker build -t ait-core-api:latest -f apps/api/Dockerfile .
docker build -t ait-core-web:latest -f apps/web/Dockerfile .
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://aitcore:aitcore2024@postgres:5432/soriano_core
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api:/app/apps/api

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: aitcore
      POSTGRES_PASSWORD: aitcore2024
      POSTGRES_DB: soriano_core
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Kubernetes Deployment

### Cluster Requirements

**Staging**:
- 3-5 nodes (t3.medium or equivalent)
- 8 GB RAM per node
- 50 GB disk per node

**Production**:
- 10+ nodes (t3.large or equivalent)
- 16 GB RAM per node
- 100 GB disk per node
- Multi-AZ deployment
- Auto-scaling enabled

### Install Kubernetes

**AWS (EKS)**:
```bash
eksctl create cluster \
  --name ait-core-prod \
  --region eu-west-1 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 10 \
  --nodes-min 5 \
  --nodes-max 20 \
  --managed
```

**Azure (AKS)**:
```bash
az aks create \
  --resource-group ait-core-rg \
  --name ait-core-prod \
  --node-count 10 \
  --node-vm-size Standard_D4s_v3 \
  --enable-cluster-autoscaler \
  --min-count 5 \
  --max-count 20
```

**GCP (GKE)**:
```bash
gcloud container clusters create ait-core-prod \
  --region europe-west1 \
  --num-nodes 10 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 5 \
  --max-nodes 20
```

### Kubernetes Manifests

**Namespace**:
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ait-core-prod
```

**ConfigMap**:
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ait-core-config
  namespace: ait-core-prod
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_PORT: "3000"
```

**Secret**:
```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ait-core-secrets
  namespace: ait-core-prod
type: Opaque
data:
  DATABASE_URL: <base64-encoded>
  ANTHROPIC_API_KEY: <base64-encoded>
  JWT_SECRET: <base64-encoded>
```

**Deployment (API)**:
```yaml
# k8s/deployments/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ait-core-api
  namespace: ait-core-prod
spec:
  replicas: 5
  selector:
    matchLabels:
      app: ait-core-api
  template:
    metadata:
      labels:
        app: ait-core-api
    spec:
      containers:
      - name: api
        image: your-registry/ait-core-api:latest
        ports:
        - containerPort: 3000
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
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Service**:
```yaml
# k8s/services/api.yaml
apiVersion: v1
kind: Service
metadata:
  name: ait-core-api
  namespace: ait-core-prod
spec:
  selector:
    app: ait-core-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress**:
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ait-core-ingress
  namespace: ait-core-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.sorianomediadores.es
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
```

**HorizontalPodAutoscaler**:
```yaml
# k8s/hpa/api.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ait-core-api-hpa
  namespace: ait-core-prod
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
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy all services
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa/

# Check status
kubectl get pods -n ait-core-prod
kubectl get services -n ait-core-prod
kubectl get ingress -n ait-core-prod

# View logs
kubectl logs -f deployment/ait-core-api -n ait-core-prod

# Scale deployment
kubectl scale deployment ait-core-api --replicas=10 -n ait-core-prod
```

### Helm Deployment (Alternative)

```bash
# Install Helm chart
helm install ait-core ./helm/ait-core \
  --namespace ait-core-prod \
  --create-namespace \
  --values helm/ait-core/values.prod.yaml

# Upgrade
helm upgrade ait-core ./helm/ait-core \
  --namespace ait-core-prod \
  --values helm/ait-core/values.prod.yaml

# Rollback
helm rollback ait-core 1 --namespace ait-core-prod

# Uninstall
helm uninstall ait-core --namespace ait-core-prod
```

---

## Cloud Deployment

### AWS Deployment

**Services Used**:
- EKS (Kubernetes)
- RDS PostgreSQL
- ElastiCache Redis
- MSK (Kafka)
- Elasticsearch Service
- S3
- CloudFront
- Route 53
- ALB

**Terraform Configuration**:
```hcl
# terraform/aws/main.tf
module "eks" {
  source = "./modules/eks"
  cluster_name = "ait-core-prod"
  node_groups = {
    api = { desired_size = 5 }
    modules = { desired_size = 3 }
    agents = { desired_size = 2 }
  }
}

module "rds" {
  source = "./modules/rds"
  engine_version = "15.4"
  instance_class = "db.r5.xlarge"
  multi_az = true
  backup_retention = 30
}

module "elasticache" {
  source = "./modules/elasticache"
  node_type = "cache.r5.large"
  num_cache_nodes = 3
}
```

Deploy:
```bash
cd terraform/aws
terraform init
terraform plan
terraform apply
```

### Azure Deployment

**Services Used**:
- AKS (Kubernetes)
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Event Hubs
- Azure Cognitive Search
- Blob Storage
- Application Gateway
- Azure DNS

### GCP Deployment

**Services Used**:
- GKE (Kubernetes)
- Cloud SQL
- Memorystore
- Cloud Pub/Sub
- Elasticsearch (self-managed)
- Cloud Storage
- Cloud Load Balancing
- Cloud DNS

---

## CI/CD Pipeline

### GitHub Actions Workflow

**CI Pipeline** (.github/workflows/ci.yml):
```yaml
name: CI

on:
  push:
    branches: [ develop, main ]
  pull_request:
    branches: [ develop, main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: ${{ secrets.REGISTRY_URL }}/ait-core-api:${{ github.sha }}
```

**CD Pipeline (Staging)** (.github/workflows/deploy-staging.yml):
```yaml
name: Deploy to Staging

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_STAGING }}" > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy to staging
        run: |
          kubectl set image deployment/ait-core-api \
            api=${{ secrets.REGISTRY_URL }}/ait-core-api:${{ github.sha }} \
            -n ait-core-staging

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/ait-core-api \
            -n ait-core-staging
```

**CD Pipeline (Production)** (.github/workflows/deploy-production.yml):
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_PROD }}" > kubeconfig
          export KUBECONFIG=./kubeconfig

      - name: Deploy to production
        run: |
          kubectl set image deployment/ait-core-api \
            api=${{ secrets.REGISTRY_URL }}/ait-core-api:${{ github.sha }} \
            -n ait-core-prod

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/ait-core-api \
            -n ait-core-prod

      - name: Notify team
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text":"Deployed to production: ${{ github.sha }}"}'
```

### Deployment Approval

Production deployments require manual approval in GitHub Actions:

```yaml
environment:
  name: production
  url: https://api.sorianomediadores.es
```

---

## Environment Configuration

### Environment Variables

**Development** (.env.development):
```bash
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://aitcore:aitcore2024@localhost:5432/soriano_core

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Authentication
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=1h

# Claude API
ANTHROPIC_API_KEY=sk-ant-...

# AWS (if using)
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**Production** (managed via Kubernetes Secrets):
```bash
NODE_ENV=production
LOG_LEVEL=info

DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/soriano_core
REDIS_URL=redis://elasticache-endpoint:6379
KAFKA_BROKERS=msk-broker1:9092,msk-broker2:9092,msk-broker3:9092

JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1h

ANTHROPIC_API_KEY=<production-key>

AWS_REGION=eu-west-1
# Use IAM roles instead of keys in production
```

---

## Database Setup

### Run Migrations

```bash
# Development
pnpm db:migrate

# Production (manual)
pnpm db:migrate:deploy

# Create new migration
pnpm db:migrate:create --name add_new_field
```

### Database Backup

**Automated Backups** (AWS RDS):
- Daily automated snapshots
- 30-day retention
- Point-in-time recovery

**Manual Backup**:
```bash
pg_dump -h database-host -U username -d soriano_core > backup.sql
```

**Restore**:
```bash
psql -h database-host -U username -d soriano_core < backup.sql
```

---

## Monitoring & Observability

### Prometheus + Grafana

Deploy monitoring stack:
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

Access Grafana:
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000
```

### ELK Stack

Deploy logging stack:
```bash
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace
helm install kibana elastic/kibana --namespace logging
```

### Application Metrics

Expose metrics:
```typescript
// src/metrics.ts
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});
```

---

## Disaster Recovery

### Backup Strategy

- **Database**: Daily full backup + hourly incremental
- **Files**: Continuous replication to S3
- **Configuration**: Version controlled in Git
- **Secrets**: Stored in Vault with backups

### Recovery Procedures

**RTO (Recovery Time Objective)**: < 1 hour
**RPO (Recovery Point Objective)**: < 15 minutes

**Failover Steps**:
1. Detect failure (automated monitoring)
2. Promote standby database to primary
3. Update DNS/load balancer
4. Scale up capacity
5. Verify system health
6. Notify stakeholders

---

## Troubleshooting

### Common Issues

**Pods not starting**:
```bash
kubectl describe pod <pod-name> -n ait-core-prod
kubectl logs <pod-name> -n ait-core-prod
```

**Database connection issues**:
```bash
# Test connection from pod
kubectl exec -it <pod-name> -n ait-core-prod -- psql $DATABASE_URL
```

**High memory usage**:
```bash
kubectl top pods -n ait-core-prod
```

**Certificate issues**:
```bash
kubectl describe certificate ait-core-tls -n ait-core-prod
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
