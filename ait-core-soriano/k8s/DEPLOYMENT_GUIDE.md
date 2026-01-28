# AIT-CORE Kubernetes Deployment Guide

Complete guide for deploying AIT-CORE to AWS EKS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### Required Tools

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Kustomize
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
sudo mv kustomize /usr/local/bin/
```

### AWS Configuration

```bash
# Configure AWS credentials
aws configure

# Verify access
aws sts get-caller-identity
```

---

## Quick Start

### 1. Create EKS Cluster

```bash
cd k8s
chmod +x *.sh
./setup-eks.sh ait-core-production eu-west-1
```

This script will:
- Create EKS cluster with 3-10 nodes
- Install AWS Load Balancer Controller
- Install EBS CSI Driver
- Install cert-manager
- Install Nginx Ingress
- Install Prometheus + Grafana
- Configure Cluster Autoscaler

### 2. Create Secrets

```bash
# Copy and edit secrets template
cp overlays/production/secrets.env.example overlays/production/secrets.env
nano overlays/production/secrets.env

# Create secrets in cluster
kubectl create namespace ait-core
kubectl create secret generic ait-core-secrets \
  --from-env-file=overlays/production/secrets.env \
  -n ait-core
```

### 3. Deploy AIT-CORE

```bash
# Validate manifests
./validate.sh

# Deploy to production
./deploy.sh production
```

---

## Detailed Setup

### Step 1: Infrastructure Setup

#### Create VPC (if needed)

```bash
aws ec2 create-vpc --cidr-block 10.0.0.0/16
```

#### Create EKS Cluster

Using eksctl (recommended):

```bash
eksctl create cluster \
  --name ait-core-production \
  --region eu-west-1 \
  --version 1.29 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed \
  --with-oidc \
  --full-ecr-access
```

Or using the provided script:

```bash
./setup-eks.sh ait-core-production eu-west-1 t3.xlarge 3 10
```

### Step 2: Install Add-ons

#### AWS Load Balancer Controller

```bash
# Download IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

# Create IAM policy
aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=ait-core-production \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
  --approve

# Install with Helm
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=ait-core-production
```

#### EBS CSI Driver

```bash
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster ait-core-production \
  --service-account-role-arn arn:aws:iam::ACCOUNT_ID:role/AmazonEKS_EBS_CSI_DriverRole \
  --force
```

#### cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=available --timeout=300s \
  deployment/cert-manager -n cert-manager
```

#### Nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer
```

#### Prometheus + Grafana

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin
```

---

## Configuration

### Environment Variables

Create `overlays/production/secrets.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DATABASE_USER=aitcore
DATABASE_PASSWORD=strong_password
DATABASE_NAME=ait_core

# Redis
REDIS_URL=redis://:password@host:6379/0
REDIS_PASSWORD=redis_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@soriano-mediadores.com
SMTP_PASSWORD=app_password

# Payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
```

### ConfigMaps

Edit `configmaps/ait-core-config.yaml` for application settings:

```yaml
NODE_ENV: production
LOG_LEVEL: info
API_RATE_LIMIT: "100"
ENABLE_ANALYTICS: "true"
```

### Domain Configuration

Update `ingress/ingress.yaml` with your domains:

```yaml
spec:
  tls:
    - hosts:
        - api.your-domain.com
        - www.your-domain.com
        - admin.your-domain.com
```

---

## Deployment

### Validate Manifests

```bash
./validate.sh
```

### Deploy to Environment

```bash
# Development
./deploy.sh dev

# Staging
./deploy.sh staging

# Production
./deploy.sh production
```

### Manual Deployment

```bash
# Using kubectl
kubectl apply -k overlays/production

# Using kustomize
kustomize build overlays/production | kubectl apply -f -
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n ait-core

# Check services
kubectl get svc -n ait-core

# Check ingress
kubectl get ingress -n ait-core

# Check deployments
kubectl get deployments -n ait-core
```

### View Logs

```bash
# API logs
kubectl logs -f deployment/api -n ait-core

# Web logs
kubectl logs -f deployment/web -n ait-core

# All logs with label
kubectl logs -f -l app=api -n ait-core --all-containers=true
```

---

## Monitoring

### Access Grafana

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Open http://localhost:3000
- Username: `admin`
- Password: `admin` (or value from helm install)

### Access Prometheus

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Open http://localhost:9090

### View Metrics

```bash
# Pod metrics
kubectl top pods -n ait-core

# Node metrics
kubectl top nodes
```

### Alerts

View active alerts in Prometheus:
http://localhost:9090/alerts

Configure AlertManager for notifications:

```bash
kubectl edit configmap alertmanager-config -n monitoring
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Describe pod
kubectl describe pod POD_NAME -n ait-core

# View events
kubectl get events -n ait-core --sort-by='.lastTimestamp'

# Check logs
kubectl logs POD_NAME -n ait-core --previous
```

### Service Not Accessible

```bash
# Check service
kubectl describe svc SERVICE_NAME -n ait-core

# Check endpoints
kubectl get endpoints SERVICE_NAME -n ait-core

# Test connectivity
kubectl run curl --image=curlimages/curl -i --tty --rm -- sh
curl http://SERVICE_NAME:PORT
```

### Ingress Issues

```bash
# Check ingress
kubectl describe ingress ait-core-ingress -n ait-core

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify SSL certificate
kubectl get certificate -n ait-core
kubectl describe certificate ait-core-tls -n ait-core
```

### Database Connection Issues

```bash
# Test database connectivity
kubectl run psql --image=postgres:16 -i --tty --rm -- \
  psql postgresql://user:pass@postgresql:5432/ait_core

# Check PostgreSQL logs
kubectl logs statefulset/postgresql -n ait-core
```

### Performance Issues

```bash
# Check resource usage
kubectl top pods -n ait-core

# Check HPA status
kubectl get hpa -n ait-core

# Scale manually if needed
kubectl scale deployment/api --replicas=10 -n ait-core
```

---

## Maintenance

### Update Deployment

```bash
# Update image
kubectl set image deployment/api api=new-image:tag -n ait-core

# Check rollout status
kubectl rollout status deployment/api -n ait-core

# View rollout history
kubectl rollout history deployment/api -n ait-core
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/api -n ait-core

# Rollback to specific revision
kubectl rollout undo deployment/api --to-revision=2 -n ait-core

# Or use the script
./rollback.sh api ait-core
```

### Backup Database

```bash
# Manual backup
kubectl exec -it postgresql-0 -n ait-core -- \
  pg_dump -U postgres ait_core > backup-$(date +%Y%m%d).sql

# Automated backups (CronJob)
kubectl apply -f backup-cronjob.yaml
```

### Update Secrets

```bash
# Update specific secret
kubectl create secret generic ait-core-secrets \
  --from-env-file=overlays/production/secrets.env \
  -n ait-core \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart deployments to pick up new secrets
kubectl rollout restart deployment/api -n ait-core
```

### Scaling

```bash
# Manual scale
kubectl scale deployment/api --replicas=5 -n ait-core

# Auto-scaling is configured via HPA
kubectl get hpa -n ait-core
```

### Drain Node for Maintenance

```bash
# Drain node
kubectl drain NODE_NAME --ignore-daemonsets --delete-emptydir-data

# Perform maintenance...

# Uncordon node
kubectl uncordon NODE_NAME
```

### Clean Up

```bash
# Delete specific deployment
kubectl delete deployment api -n ait-core

# Delete namespace (careful!)
kubectl delete namespace ait-core

# Delete EKS cluster
eksctl delete cluster --name ait-core-production
```

---

## Security Best Practices

1. **Keep secrets secure**: Never commit secrets to git
2. **Use RBAC**: Limit access based on roles
3. **Network Policies**: Restrict pod-to-pod communication
4. **Image Scanning**: Scan images for vulnerabilities
5. **Regular Updates**: Keep K8s and apps updated
6. **Audit Logs**: Enable and monitor audit logs
7. **Backup Regularly**: Automate database backups
8. **SSL/TLS**: Always use HTTPS in production

---

## Cost Optimization

1. **Right-size pods**: Use appropriate resource requests/limits
2. **Use HPA**: Auto-scale based on demand
3. **Spot Instances**: Use for non-critical workloads
4. **Cluster Autoscaler**: Auto-scale nodes
5. **Schedule downtime**: Stop dev/staging during off-hours
6. **Monitor costs**: Use AWS Cost Explorer

---

## Support

For issues or questions:
- Check logs: `kubectl logs -f deployment/api -n ait-core`
- Check events: `kubectl get events -n ait-core`
- Review documentation: `/docs`
- Contact DevOps team

---

## License

Proprietary - Soriano Mediadores 2026
