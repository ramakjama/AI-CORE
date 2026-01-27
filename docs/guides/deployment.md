# AI-CORE: Guia de Despliegue

## Vision General

Esta guia cubre el despliegue de AI-CORE en diferentes entornos utilizando Docker, Kubernetes, y servicios cloud.

## Arquitectura de Despliegue

```
+------------------------------------------------------------------+
|                    Production Architecture                        |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                        CDN / Edge                           |  |
|  |                    (CloudFlare/Fastly)                      |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|  +------------------------------------------------------------+  |
|  |                    Load Balancer                            |  |
|  |                   (ALB/NLB/Ingress)                         |  |
|  +------------------------------------------------------------+  |
|           |                  |                  |                |
|           v                  v                  v                |
|  +----------------+  +----------------+  +----------------+      |
|  |   API Pod 1    |  |   API Pod 2    |  |   API Pod N    |      |
|  +----------------+  +----------------+  +----------------+      |
|           |                  |                  |                |
|           +------------------+------------------+                |
|                              |                                   |
|  +------------------------------------------------------------+  |
|  |                    Service Mesh (Istio)                     |  |
|  +------------------------------------------------------------+  |
|           |                  |                  |                |
|           v                  v                  v                |
|  +----------------+  +----------------+  +----------------+      |
|  |   PostgreSQL   |  |     Redis      |  | Elasticsearch  |      |
|  |   (Primary)    |  |   (Cluster)    |  |   (Cluster)    |      |
|  +----------------+  +----------------+  +----------------+      |
|           |                                                      |
|  +----------------+                                              |
|  |   PostgreSQL   |                                              |
|  |   (Replica)    |                                              |
|  +----------------+                                              |
|                                                                  |
+------------------------------------------------------------------+
```

## Docker

### Dockerfile Multi-Stage

```dockerfile
# Dockerfile
# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY libs/ai-core/package.json ./libs/ai-core/
COPY libs/ai-agents/package.json ./libs/ai-agents/
COPY libs/ai-comms/package.json ./libs/ai-comms/
COPY libs/ai-iam/package.json ./libs/ai-iam/
COPY libs/database/package.json ./libs/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN pnpm db:generate

# Build all packages
RUN pnpm build --filter=@ai-core/api...

# Prune dev dependencies
RUN pnpm prune --prod

# =============================================================================
# Stage 3: Runner
# =============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/apps/api/package.json ./

# Copy Prisma files
COPY --from=builder --chown=appuser:nodejs /app/libs/database/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/main.js"]
```

### Docker Compose (Produccion)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    image: ai-core/api:${VERSION:-latest}
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
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
    networks:
      - ai-core-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: pgvector/pgvector:pg16
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
    networks:
      - ai-core-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
    networks:
      - ai-core-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - ai-core-network

networks:
  ai-core-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Docker Build Scripts

```bash
#!/bin/bash
# scripts/docker-build.sh

set -e

VERSION=${1:-$(git rev-parse --short HEAD)}
REGISTRY=${DOCKER_REGISTRY:-ghcr.io/soriano-mediadores}

echo "Building AI-CORE version: $VERSION"

# Build API
docker build \
  --target runner \
  --tag ${REGISTRY}/ai-core-api:${VERSION} \
  --tag ${REGISTRY}/ai-core-api:latest \
  --cache-from ${REGISTRY}/ai-core-api:latest \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -f Dockerfile \
  .

# Build Web
docker build \
  --target runner \
  --tag ${REGISTRY}/ai-core-web:${VERSION} \
  --tag ${REGISTRY}/ai-core-web:latest \
  -f apps/web/Dockerfile \
  .

# Push images
docker push ${REGISTRY}/ai-core-api:${VERSION}
docker push ${REGISTRY}/ai-core-api:latest
docker push ${REGISTRY}/ai-core-web:${VERSION}
docker push ${REGISTRY}/ai-core-web:latest

echo "Build complete: ${VERSION}"
```

## Kubernetes

### Estructura de Manifiestos

```
infrastructure/kubernetes/
├── base/                    # Base configurations
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   └── kustomization.yaml
│
├── apps/
│   ├── api/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   └── kustomization.yaml
│   │
│   └── web/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── kustomization.yaml
│
├── ingress/
│   ├── ingress.yaml
│   ├── certificate.yaml
│   └── kustomization.yaml
│
├── overlays/
│   ├── development/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
│
└── kustomization.yaml
```

### Namespace

```yaml
# base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-core
  labels:
    name: ai-core
    istio-injection: enabled
```

### ConfigMap

```yaml
# base/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-core-config
  namespace: ai-core
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  CORS_ORIGINS: "https://app.ai-core.com,https://admin.ai-core.com"
  RATE_LIMIT_MAX: "1000"
  RATE_LIMIT_WINDOW: "60000"
```

### Secrets (External Secrets Operator)

```yaml
# base/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ai-core-secrets
  namespace: ai-core
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: ai-core-secrets
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: ai-core/production
        property: database_url
    - secretKey: JWT_SECRET
      remoteRef:
        key: ai-core/production
        property: jwt_secret
    - secretKey: OPENAI_API_KEY
      remoteRef:
        key: ai-core/production
        property: openai_api_key
```

### Deployment

```yaml
# apps/api/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-core-api
  namespace: ai-core
  labels:
    app: ai-core-api
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
  selector:
    matchLabels:
      app: ai-core-api
  template:
    metadata:
      labels:
        app: ai-core-api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: ai-core-api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      containers:
        - name: api
          image: ghcr.io/soriano-mediadores/ai-core-api:latest
          imagePullPolicy: Always
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP

          envFrom:
            - configMapRef:
                name: ai-core-config
            - secretRef:
                name: ai-core-secrets

          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: 2000m
              memory: 2Gi

          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3

          startupProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 30

          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL

          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /app/.cache

      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: ai-core-api
                topologyKey: kubernetes.io/hostname

      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: ai-core-api
```

### Service

```yaml
# apps/api/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-core-api
  namespace: ai-core
  labels:
    app: ai-core-api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: http
      protocol: TCP
      name: http
  selector:
    app: ai-core-api
```

### Horizontal Pod Autoscaler

```yaml
# apps/api/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-core-api-hpa
  namespace: ai-core
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-core-api
  minReplicas: 3
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
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
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

### Pod Disruption Budget

```yaml
# apps/api/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ai-core-api-pdb
  namespace: ai-core
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: ai-core-api
```

### Ingress

```yaml
# ingress/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-core-ingress
  namespace: ai-core
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.ai-core.com
        - app.ai-core.com
      secretName: ai-core-tls
  rules:
    - host: api.ai-core.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ai-core-api
                port:
                  number: 80
    - host: app.ai-core.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ai-core-web
                port:
                  number: 80
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      version: ${{ steps.meta.outputs.version }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_STAGING }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/ai-core-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.build.outputs.version }} \
            -n ai-core-staging
          kubectl rollout status deployment/ai-core-api -n ai-core-staging

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure kubectl
        uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG_PRODUCTION }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/ai-core-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ needs.build.outputs.version }} \
            -n ai-core
          kubectl rollout status deployment/ai-core-api -n ai-core

      - name: Verify deployment
        run: |
          kubectl get pods -n ai-core -l app=ai-core-api
          curl -f https://api.ai-core.com/health || exit 1
```

## Monitoring y Observabilidad

### Prometheus ServiceMonitor

```yaml
# monitoring/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ai-core-api
  namespace: monitoring
  labels:
    app: ai-core-api
spec:
  selector:
    matchLabels:
      app: ai-core-api
  namespaceSelector:
    matchNames:
      - ai-core
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

### Grafana Dashboard

```
+------------------------------------------------------------------+
|                    AI-CORE Monitoring Dashboard                   |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+  +------------------+  +------------------+ |
|  | Request Rate     |  | Error Rate       |  | Latency P99      | |
|  | 1,234 req/s      |  | 0.02%            |  | 45ms             | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                    Request Latency Histogram                |  |
|  |  [====================]                                     |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +------------------+  +------------------+  +------------------+ |
|  | CPU Usage        |  | Memory Usage     |  | Pod Count        | |
|  | 45%              |  | 62%              |  | 5/20             | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Disaster Recovery

### Backup Strategy

```
+------------------------------------------------------------------+
|                      Backup Strategy                              |
+------------------------------------------------------------------+
|                                                                  |
|  Database (PostgreSQL):                                          |
|  +------------------------------------------------------------+  |
|  | - Full backup: Daily at 02:00 UTC                          |  |
|  | - Incremental WAL: Continuous                               |  |
|  | - Retention: 30 days                                        |  |
|  | - Cross-region replication: Enabled                         |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Redis:                                                          |
|  +------------------------------------------------------------+  |
|  | - RDB snapshots: Every 15 minutes                          |  |
|  | - AOF persistence: Enabled                                  |  |
|  | - Retention: 7 days                                         |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  Object Storage:                                                 |
|  +------------------------------------------------------------+  |
|  | - Versioning: Enabled                                       |  |
|  | - Cross-region replication: Enabled                         |  |
|  | - Lifecycle: Archive after 90 days                          |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

### RTO/RPO Targets

| Componente | RPO (Perdida maxima) | RTO (Tiempo recuperacion) |
|------------|---------------------|---------------------------|
| Database | 5 minutos | 30 minutos |
| Redis Cache | 15 minutos | 10 minutos |
| Application | 0 (stateless) | 5 minutos |
| Object Storage | 1 hora | 1 hora |

## Referencias

- [Getting Started](./getting-started.md)
- [Development Guide](./development.md)
- [Architecture Overview](../architecture/overview.md)
- [Security Model](../architecture/security.md)
