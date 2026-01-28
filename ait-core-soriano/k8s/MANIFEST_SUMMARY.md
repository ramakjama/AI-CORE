# AIT-CORE Kubernetes Manifests Summary

Complete inventory of all Kubernetes resources for the AIT-CORE system.

## Overview

- **Total Modules**: 57
- **Applications**: 4 (api, web, admin, mobile-api)
- **Total Deployments**: 61+ (4 apps + 57 modules)
- **Total Services**: 61+ (matching deployments)
- **Infrastructure**: PostgreSQL, Redis, PgBouncer
- **Environments**: Development, Staging, Production

---

## Directory Structure

```
k8s/
├── README.md                          # Main documentation
├── DEPLOYMENT_GUIDE.md                # Complete deployment guide
├── MANIFEST_SUMMARY.md                # This file
├── namespace.yaml                     # Namespace definitions
├── generate-module-deployments.py     # Module manifest generator
├── deploy.sh                          # Main deployment script
├── rollback.sh                        # Rollback script
├── setup-eks.sh                       # EKS cluster setup
├── validate.sh                        # Manifest validation
├── .github-workflows-deploy.yaml      # CI/CD pipeline template
│
├── base/                              # Base Kustomize resources
│   ├── kustomization.yaml
│   ├── deployments/
│   │   ├── api-deployment.yaml
│   │   ├── web-deployment.yaml
│   │   ├── admin-deployment.yaml
│   │   ├── mobile-deployment.yaml
│   │   ├── postgresql-statefulset.yaml
│   │   ├── redis-statefulset.yaml
│   │   ├── modules-template.yaml
│   │   └── modules/
│   │       ├── 01-core-business.yaml         (2 modules)
│   │       ├── 02-insurance-specialized.yaml (20 modules)
│   │       ├── 03-marketing-sales.yaml       (10 modules)
│   │       ├── 04-analytics-intelligence.yaml (6 modules)
│   │       ├── 05-security-compliance.yaml    (4 modules)
│   │       ├── 06-infrastructure.yaml         (5 modules)
│   │       └── 07-integration-automation.yaml (2 modules)
│   │
│   └── services/
│       ├── api-service.yaml
│       ├── web-service.yaml
│       ├── admin-service.yaml
│       ├── mobile-service.yaml
│       └── modules/
│           ├── 01-core-business.yaml
│           ├── 02-insurance-specialized.yaml
│           ├── 03-marketing-sales.yaml
│           ├── 04-analytics-intelligence.yaml
│           ├── 05-security-compliance.yaml
│           ├── 06-infrastructure.yaml
│           └── 07-integration-automation.yaml
│
├── overlays/                          # Environment-specific configs
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       └── dev-resources.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       ├── kustomization.yaml
│       ├── secrets.env.example
│       └── patches/
│           ├── api-production.yaml
│           ├── web-production.yaml
│           └── resources-production.yaml
│
├── configmaps/
│   ├── ait-core-config.yaml           # App configuration
│   └── modules-config.yaml            # Module configuration
│
├── secrets/
│   └── ait-core-secrets.yaml          # Secret templates
│
├── ingress/
│   ├── ingress.yaml                   # Main ingress rules
│   └── cert-issuer.yaml               # SSL certificate issuer
│
├── hpa/
│   ├── apps-hpa.yaml                  # App autoscaling
│   └── modules-hpa.yaml               # Module autoscaling
│
├── monitoring/
│   ├── servicemonitors.yaml           # Prometheus monitoring
│   ├── prometheus-rules.yaml          # Alert rules
│   └── grafana-dashboards.yaml        # Grafana dashboards
│
├── network-policies/
│   └── network-policies.yaml          # Network security
│
└── rbac/
    └── rbac.yaml                      # Role-based access control
```

---

## Applications (4)

### 1. API Backend
- **Deployment**: `api-deployment.yaml`
- **Service**: `api-service.yaml` (ClusterIP + LoadBalancer)
- **Replicas**: 3-10 (auto-scaling)
- **Port**: 3000
- **Health**: `/health`
- **Metrics**: 9090

### 2. Web Frontend
- **Deployment**: `web-deployment.yaml`
- **Service**: `web-service.yaml`
- **Replicas**: 3-10 (auto-scaling)
- **Port**: 3000
- **Framework**: Next.js

### 3. Admin Portal
- **Deployment**: `admin-deployment.yaml`
- **Service**: `admin-service.yaml`
- **Replicas**: 2-5 (auto-scaling)
- **Port**: 3001
- **Framework**: Next.js

### 4. Mobile API
- **Deployment**: `mobile-deployment.yaml`
- **Service**: `mobile-service.yaml`
- **Replicas**: 2-8 (auto-scaling)
- **Port**: 3002

---

## Modules (57)

### Category 1: Core Business (2 modules)
1. ai-accountant
2. ai-treasury

**Resources per module**:
- Replicas: 2
- Memory: 256Mi - 1Gi
- CPU: 100m - 500m

### Category 2: Insurance Specialized (20 modules)
1. agrario
2. ahorro
3. autos
4. caucion
5. ciber
6. comunidades
7. credito
8. decesos
9. empresas
10. hogar
11. industrial
12. ingenieria
13. mascotas
14. multirriesgo
15. pensiones
16. rc (Responsabilidad Civil)
17. salud
18. transporte
19. unit-linked
20. vida

**Resources per module**:
- Replicas: 1
- Memory: 128Mi - 512Mi
- CPU: 50m - 250m

### Category 3: Marketing & Sales (10 modules)
1. ai-brand-manager
2. ai-campaign-manager
3. ai-conversion-optimizer
4. ai-customer-journey
5. ai-influencer-manager
6. ai-lead-generation
7. ai-loyalty-programs
8. ai-marketing
9. ai-pricing-optimizer
10. ai-referral-engine

**Resources per module**:
- Replicas: 1
- Memory: 256Mi - 512Mi
- CPU: 100m - 500m

### Category 4: Analytics & Intelligence (6 modules)
1. ai-business-intelligence
2. ai-customer-analytics
3. ai-data-analyst
4. ai-operational-analytics
5. ai-predictive-analytics
6. ai-risk-analytics

**Resources per module**:
- Replicas: 2
- Memory: 512Mi - 2Gi
- CPU: 250m - 1000m

### Category 5: Security & Compliance (4 modules)
1. ai-audit-trail
2. ai-compliance
3. ai-defender
4. ai-fraud-detection

**Resources per module**:
- Replicas: 2
- Memory: 256Mi - 1Gi
- CPU: 100m - 500m

### Category 6: Infrastructure (5 modules)
1. ait-api-gateway
2. ait-authenticator
3. ait-datahub
4. ait-document-service
5. ait-notification-service

**Resources per module**:
- Replicas: 3
- Memory: 512Mi - 2Gi
- CPU: 250m - 1000m

### Category 7: Integration & Automation (2 modules)
1. ait-connector
2. ait-nerve

**Resources per module**:
- Replicas: 2
- Memory: 512Mi - 1Gi
- CPU: 250m - 1000m

---

## Infrastructure Components

### PostgreSQL
- **Type**: StatefulSet
- **Replicas**: 1
- **Storage**: 100Gi (gp3)
- **Image**: postgres:16-alpine
- **Port**: 5432

### Redis
- **Type**: StatefulSet
- **Replicas**: 1
- **Storage**: 20Gi (gp3)
- **Image**: redis:7-alpine
- **Port**: 6379

### PgBouncer (Connection Pooling)
- **Type**: Deployment
- **Replicas**: 2
- **Max Connections**: 1000
- **Pool Size**: 25

---

## Ingress Configuration

### Domains
- `www.soriano-mediadores.com` → Web
- `api.soriano-mediadores.com` → API
- `admin.soriano-mediadores.com` → Admin
- `mobile-api.soriano-mediadores.com` → Mobile API
- `modules.soriano-mediadores.com` → Module Access

### SSL/TLS
- **Provider**: Let's Encrypt (via cert-manager)
- **Issuer**: ClusterIssuer (letsencrypt-prod)
- **Auto-renewal**: Enabled
- **Force HTTPS**: Yes

### Features
- Rate limiting (100 req/s)
- CORS enabled
- Session affinity (cookie-based)
- Custom security headers
- Gzip compression

---

## Horizontal Pod Autoscaling (HPA)

### Applications
| Component | Min | Max | CPU Target | Memory Target |
|-----------|-----|-----|------------|---------------|
| API       | 3   | 10  | 70%        | 80%           |
| Web       | 3   | 10  | 70%        | 80%           |
| Admin     | 2   | 5   | 75%        | 80%           |
| Mobile    | 2   | 8   | 70%        | 80%           |

### Critical Modules
| Module        | Min | Max | CPU Target |
|---------------|-----|-----|------------|
| ait-datahub   | 3   | 10  | 60%        |
| ait-auth      | 3   | 10  | 65%        |
| ait-gateway   | 3   | 15  | 70%        |
| ai-defender   | 2   | 8   | 65%        |
| ai-fraud      | 2   | 8   | 70%        |

---

## Monitoring

### Prometheus
- **ServiceMonitors**: 5 (apps, frontend, modules, infrastructure, security)
- **Scrape Interval**: 15-30s
- **Metrics Port**: 9090
- **Path**: `/metrics`

### Alert Rules
- High Error Rate (>5%)
- High Response Time (>1s p95)
- Pod Crash Looping
- High Memory Usage (>90%)
- High CPU Usage (>90%)
- Service Down
- HPA Maxed Out
- Unauthorized Access Attempts
- Slow Database Queries

### Grafana Dashboards
1. AIT-CORE Overview
2. AIT-CORE Modules
3. API Performance
4. Database Metrics
5. Resource Usage

---

## Network Policies

### Implemented Policies
1. **Default Deny Ingress**: Block all by default
2. **Allow Ingress Controller**: Frontend pods from ingress
3. **Allow Frontend to Backend**: Web/Admin → API
4. **Allow API to Modules**: API → All modules
5. **Allow Inter-Module**: Module ↔ Module
6. **Allow Infrastructure Access**: All → Infrastructure modules
7. **Database Access**: Backend/Modules → PostgreSQL
8. **Redis Access**: Backend/Modules → Redis
9. **Prometheus Scraping**: Monitoring → All pods
10. **DNS Access**: All → kube-dns
11. **External Egress**: Controlled external access

---

## RBAC (Role-Based Access Control)

### Service Accounts
1. `ait-core-sa` - Main application service account
2. `prometheus-sa` - Monitoring service account

### Roles
1. `ait-core-role` - Application permissions
2. `ait-core-cluster-role` - Cluster-level permissions
3. `prometheus-role` - Metrics access

### Permissions
- Read ConfigMaps and Secrets
- Read Services and Endpoints
- Read Pods and Logs
- Create Events
- Access Metrics API

---

## ConfigMaps

### ait-core-config
- Node environment
- API configuration
- CORS settings
- Database pool settings
- Redis configuration
- Cache settings
- Session configuration
- File upload limits
- Email settings
- Feature flags
- AWS settings
- Monitoring settings

### ait-modules-config
- Module enable/disable flags (57 modules)
- Module ports
- Module communication settings
- Module registry URL
- Discovery interval

---

## Secrets

### ait-core-secrets (Template)
- Database credentials
- Redis credentials
- JWT secrets
- API keys (OpenAI, Anthropic, Groq)
- AWS credentials
- SMTP credentials
- Stripe keys
- Insurance provider API keys
- Sentry DSN

---

## Storage

### Storage Classes
- **gp3**: Default, SSD, 3000 IOPS, 125 MB/s
- **Volume Expansion**: Enabled
- **Binding Mode**: WaitForFirstConsumer

### Persistent Volumes
- PostgreSQL: 100Gi
- Redis: 20Gi

---

## Resource Summary

### Total Resource Requests (Production)
- **CPU**: ~40 cores
- **Memory**: ~80 GB
- **Storage**: ~120 Gi

### Total Resource Limits (Production)
- **CPU**: ~100 cores
- **Memory**: ~200 GB

### Recommended EKS Setup
- **Node Type**: t3.xlarge (4 vCPU, 16 GB RAM)
- **Nodes**: 5-10 (auto-scaling)
- **Total vCPU**: 20-40
- **Total Memory**: 80-160 GB

---

## Deployment Workflows

### Manual Deployment
```bash
./validate.sh                    # Validate manifests
./deploy.sh production          # Deploy to production
```

### CI/CD (GitHub Actions)
1. Build Docker images
2. Push to ECR
3. Update kubeconfig
4. Create secrets
5. Deploy with Kustomize
6. Wait for rollout
7. Run smoke tests
8. Notify (Slack)

### Rollback
```bash
./rollback.sh api ait-core      # Rollback specific deployment
```

---

## Health Checks

### All Pods Include
1. **Liveness Probe**: Ensures container is running
2. **Readiness Probe**: Ensures container accepts traffic
3. **Startup Probe**: Handles slow-starting containers

### Endpoints
- **Health**: `/health` (port 3000)
- **Metrics**: `/metrics` (port 9090)

---

## Security Features

1. **Network Policies**: Restrict pod communication
2. **RBAC**: Least-privilege access
3. **Secrets Encryption**: At rest
4. **Pod Security Context**: Non-root user (1000)
5. **Image Pull Secrets**: Private registry access
6. **SSL/TLS**: Force HTTPS
7. **Security Headers**: X-Frame-Options, CSP, etc.
8. **Rate Limiting**: 100 req/s per IP
9. **CORS**: Configurable origins
10. **Audit Logging**: Enabled

---

## High Availability Features

1. **Multi-replica deployments**: 2-10 replicas per service
2. **Pod anti-affinity**: Spread across nodes
3. **Rolling updates**: Zero-downtime deployments
4. **Health probes**: Auto-restart unhealthy pods
5. **HPA**: Auto-scale based on load
6. **Cluster Autoscaler**: Auto-scale nodes
7. **Load balancing**: AWS NLB/ALB
8. **Database replication**: RDS Multi-AZ (production)
9. **Redis persistence**: AOF enabled

---

## Backup & DR

### Database Backups
- Manual: `kubectl exec` + `pg_dump`
- Automated: CronJob (daily)
- RDS automated backups (production)
- Point-in-time recovery

### Configuration Backups
- Git repository (all manifests)
- ConfigMap snapshots
- Secret backup (encrypted)

---

## Cost Estimation (Monthly)

### AWS EKS
- Control Plane: $73
- Worker Nodes (5x t3.xlarge): $750
- EBS Volumes (120 GB gp3): $10
- Data Transfer: $50-100
- Load Balancers: $50-100
- **Total**: ~$900-1000/month

### Production with RDS/ElastiCache
- Above + RDS (db.r6g.xlarge): $300
- Above + ElastiCache (cache.r6g.large): $150
- **Total**: ~$1350-1500/month

---

## Support & Maintenance

### Regular Tasks
- [ ] Monitor pod health daily
- [ ] Review logs weekly
- [ ] Update images monthly
- [ ] Backup database daily
- [ ] Review alerts continuously
- [ ] Update SSL certificates (auto)
- [ ] Scale based on metrics
- [ ] Security patches (as needed)

### Emergency Procedures
1. High load → Scale up
2. Pod crash → Check logs
3. Database issue → Failover to replica
4. Security breach → Enable network policies
5. Bad deployment → Rollback

---

## Documentation

- `README.md` - Overview and quick start
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `MANIFEST_SUMMARY.md` - This file
- Inline comments in all YAML files

---

## Scripts

- `generate-module-deployments.py` - Generate all 57 module manifests
- `deploy.sh` - Main deployment script
- `rollback.sh` - Rollback deployments
- `setup-eks.sh` - EKS cluster setup
- `validate.sh` - Validate manifests

---

## Version

- **K8s Version**: 1.29
- **Manifest Version**: 1.0.0
- **Last Updated**: 2026-01-28

---

## License

Proprietary - Soriano Mediadores 2026
