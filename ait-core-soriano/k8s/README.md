# AIT-CORE Kubernetes Deployment

Complete production-ready Kubernetes manifests for AWS EKS deployment.

## Architecture Overview

- **57 Modules** across 7 categories
- **4 Applications** (web, api, admin, mobile)
- **Auto-scaling** with HPA
- **Monitoring** with Prometheus/Grafana
- **SSL/TLS** with cert-manager
- **High Availability** with pod anti-affinity
- **Rolling Updates** with zero-downtime

## Directory Structure

```
k8s/
├── base/                      # Base configurations (Kustomize)
│   ├── deployments/          # All deployment manifests
│   ├── services/             # Service definitions
│   └── kustomization.yaml
├── overlays/                  # Environment overlays
│   ├── dev/
│   ├── staging/
│   └── production/
├── configmaps/               # Application configs
├── secrets/                  # Secret templates
├── ingress/                  # Ingress rules
├── hpa/                      # Horizontal Pod Autoscalers
├── monitoring/               # Prometheus ServiceMonitors
├── network-policies/         # Network security
└── rbac/                     # Role-based access control
```

## Quick Start

### Prerequisites

```bash
# Install required tools
kubectl version --client
helm version
aws eks --version
```

### Setup

1. **Configure AWS EKS**
```bash
# Create EKS cluster
eksctl create cluster \
  --name ait-core-production \
  --region us-east-1 \
  --nodegroup-name ait-core-nodes \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

2. **Install Prerequisites**
```bash
# Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/aws/deploy.yaml

# Cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Prometheus Operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

3. **Configure Secrets**
```bash
# Create namespace
kubectl create namespace ait-core

# Create secrets (replace with actual values)
kubectl create secret generic ait-core-secrets \
  --from-literal=database-url='postgresql://user:pass@host:5432/db' \
  --from-literal=redis-url='redis://host:6379' \
  --from-literal=jwt-secret='your-jwt-secret' \
  -n ait-core

# Create Docker registry secret
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=your-username \
  --docker-password=your-password \
  --docker-email=your-email \
  -n ait-core
```

4. **Deploy**
```bash
# Development
kubectl apply -k overlays/dev

# Staging
kubectl apply -k overlays/staging

# Production
kubectl apply -k overlays/production
```

## Environment Variables

Configure via ConfigMaps and Secrets:

### ConfigMaps
- `ait-core-config` - Application configuration
- `ait-core-modules-config` - Module-specific configs

### Secrets
- `ait-core-secrets` - Database, Redis, JWT secrets
- `ait-core-api-keys` - External API keys
- `regcred` - Docker registry credentials

## Scaling

### Manual Scaling
```bash
kubectl scale deployment api --replicas=5 -n ait-core
```

### Auto-scaling (HPA)
HPA is configured for:
- CPU: 70% threshold
- Memory: 80% threshold
- Min replicas: 2
- Max replicas: 10

## Monitoring

### Access Prometheus
```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

### Access Grafana
```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Default credentials: admin/prom-operator
```

### ServiceMonitors
All services expose metrics on `/metrics` endpoint (port 9090).

## Health Checks

All deployments include:
- **Liveness Probe**: Ensures container is running
- **Readiness Probe**: Ensures container is ready to accept traffic
- **Startup Probe**: Handles slow-starting containers

## SSL/TLS

SSL certificates managed by cert-manager:
- Automatic certificate issuance
- Auto-renewal before expiration
- Let's Encrypt production issuer

## Backup & Recovery

### Database Backups
```bash
# Manual backup
kubectl exec -it postgresql-0 -n ait-core -- pg_dump -U postgres ait_core > backup.sql

# Automated backups via CronJob (configured)
```

### Disaster Recovery
- RDS automated backups (if using AWS RDS)
- Point-in-time recovery
- Multi-AZ deployment

## Troubleshooting

### View Logs
```bash
# Application logs
kubectl logs -f deployment/api -n ait-core

# Follow logs from all pods
kubectl logs -f -l app=api -n ait-core --all-containers=true
```

### Debug Pod
```bash
kubectl exec -it deployment/api -n ait-core -- /bin/sh
```

### Check Events
```bash
kubectl get events -n ait-core --sort-by='.lastTimestamp'
```

### Pod Status
```bash
kubectl get pods -n ait-core -o wide
```

## Resource Requirements

### Per Environment

#### Development
- Nodes: 2-3 (t3.medium)
- CPU: ~8 cores
- Memory: ~16GB

#### Staging
- Nodes: 3-5 (t3.large)
- CPU: ~16 cores
- Memory: ~32GB

#### Production
- Nodes: 5-10 (t3.xlarge)
- CPU: ~40 cores
- Memory: ~80GB
- RDS: db.r6g.xlarge
- ElastiCache: cache.r6g.large

## Security

- Network Policies restrict inter-pod communication
- RBAC controls access to Kubernetes API
- Secrets encrypted at rest
- Pod Security Standards enforced
- Image scanning with Trivy
- Regular security updates

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
- name: Deploy to EKS
  run: |
    aws eks update-kubeconfig --region us-east-1 --name ait-core-production
    kubectl apply -k k8s/overlays/production
```

### ArgoCD (GitOps)
```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create application
argocd app create ait-core \
  --repo https://github.com/your-org/ait-core-soriano \
  --path k8s/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace ait-core
```

## Cost Optimization

- Use Spot Instances for non-critical workloads
- Enable Cluster Autoscaler
- Right-size pods based on metrics
- Use HPA to scale based on demand
- Schedule dev/staging shutdown during off-hours

## Maintenance

### Update Deployment
```bash
# Update image
kubectl set image deployment/api api=your-registry/api:v2.0.0 -n ait-core

# Rollback
kubectl rollout undo deployment/api -n ait-core

# Check rollout status
kubectl rollout status deployment/api -n ait-core
```

### Drain Node for Maintenance
```bash
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
kubectl uncordon <node-name>
```

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Monitoring: Grafana dashboards
- Alerts: Configured in Prometheus AlertManager

## License

Proprietary - Soriano Mediadores 2026
