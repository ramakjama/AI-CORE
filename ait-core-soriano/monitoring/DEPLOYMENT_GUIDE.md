# AIT-CORE Monitoring Deployment Guide

Step-by-step guide for deploying the monitoring stack in production.

## Prerequisites

### For Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 16GB RAM
- 100GB+ disk space
- Linux/Unix-based OS recommended

### For Kubernetes Deployment
- Kubernetes 1.24+
- kubectl configured
- At least 3 worker nodes
- Storage class configured
- Ingress controller (optional)

## Pre-Deployment Checklist

- [ ] Review resource requirements
- [ ] Prepare persistent storage
- [ ] Configure network/firewall rules
- [ ] Set up DNS entries (if needed)
- [ ] Prepare SSL/TLS certificates
- [ ] Configure SMTP for email alerts
- [ ] Set up Slack/PagerDuty integrations
- [ ] Review security policies

## Step 1: Prepare Configuration

### 1.1 Create Environment File

```bash
cd monitoring
cp .env.example .env
```

### 1.2 Configure Credentials

Edit `.env` and set all required values:

```bash
# Critical settings to change:
GRAFANA_ADMIN_PASSWORD=<strong-password>
ELASTIC_PASSWORD=<strong-password>
KIBANA_PASSWORD=<strong-password>
SENTRY_SECRET_KEY=<random-32-char-string>

# Integration settings:
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=<app-specific-password>
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_SERVICE_KEY=<your-pagerduty-key>
```

### 1.3 Generate Encryption Keys

```bash
# Generate Kibana encryption keys
openssl rand -base64 32  # For KIBANA_ENCRYPTION_KEY
openssl rand -base64 32  # For KIBANA_REPORTING_ENCRYPTION_KEY
openssl rand -base64 32  # For KIBANA_SAVED_OBJECTS_ENCRYPTION_KEY

# Generate Sentry secret key
openssl rand -base64 50
```

## Step 2: Docker Compose Deployment

### 2.1 System Preparation

```bash
# Increase vm.max_map_count for Elasticsearch
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf

# Create required directories
mkdir -p /data/monitoring/{prometheus,grafana,elasticsearch,logstash,kibana}
```

### 2.2 Deploy Monitoring Stack

```bash
# Pull all images
docker-compose -f docker-compose.monitoring.yml pull

# Start services
docker-compose -f docker-compose.monitoring.yml up -d

# Check status
docker-compose -f docker-compose.monitoring.yml ps
```

### 2.3 Verify Deployment

```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Grafana
curl http://localhost:3000/api/health

# Check Elasticsearch
curl http://localhost:9200/_cluster/health?pretty

# Check all services
docker-compose -f docker-compose.monitoring.yml logs --tail=50
```

### 2.4 Initial Configuration

**Set up Elasticsearch**:
```bash
# Wait for Elasticsearch to be ready
until curl -s http://localhost:9200 > /dev/null; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

# Create ILM policy
curl -X PUT "localhost:9200/_ilm/policy/ait-core-logs-policy" \
  -H 'Content-Type: application/json' \
  -d @elk/elasticsearch/index-lifecycle-policy.json

# Create index template
curl -X PUT "localhost:9200/_index_template/ait-core-logs" \
  -H 'Content-Type: application/json' \
  -d @elk/elasticsearch/index-template.json
```

**Configure Grafana**:
1. Access Grafana: http://localhost:3000
2. Login with admin credentials
3. Verify datasources are configured
4. Import dashboards from `grafana/dashboards/`

**Configure Kibana**:
1. Access Kibana: http://localhost:5601
2. Configure index pattern: `logs-*`
3. Set timestamp field: `@timestamp`

## Step 3: Kubernetes Deployment

### 3.1 Create Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 3.2 Create Secrets

```bash
# Grafana credentials
kubectl create secret generic grafana-credentials \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=<password> \
  -n monitoring

# Elasticsearch password
kubectl create secret generic elasticsearch-credentials \
  --from-literal=password=<password> \
  -n monitoring

# SMTP credentials
kubectl create secret generic smtp-credentials \
  --from-literal=username=<email> \
  --from-literal=password=<password> \
  -n monitoring
```

### 3.3 Deploy Monitoring Components

```bash
# Deploy using Kustomize
kubectl apply -k k8s/

# Or deploy individually
kubectl apply -f k8s/prometheus/prometheus-config.yaml
kubectl apply -f k8s/prometheus/prometheus-deployment.yaml
kubectl apply -f k8s/grafana/grafana-deployment.yaml
kubectl apply -f k8s/alertmanager/alertmanager-deployment.yaml
```

### 3.4 Verify Deployment

```bash
# Check all resources
kubectl get all -n monitoring

# Check pods are running
kubectl get pods -n monitoring -w

# Check persistent volumes
kubectl get pvc -n monitoring

# View logs
kubectl logs -n monitoring -l app=prometheus --tail=50
```

### 3.5 Expose Services

**Using LoadBalancer**:
```yaml
# Already configured in service definitions
# Get external IPs
kubectl get svc -n monitoring
```

**Using Ingress**:
```bash
# Create ingress (example)
cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: monitoring-ingress
  namespace: monitoring
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - grafana.ait-core.soriano.com
        - prometheus.ait-core.soriano.com
      secretName: monitoring-tls
  rules:
    - host: grafana.ait-core.soriano.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
    - host: prometheus.ait-core.soriano.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
EOF
```

## Step 4: Application Integration

### 4.1 Add Prometheus Annotations

Add to your application deployments:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

### 4.2 Configure Sentry

```typescript
// In your application code
import Sentry from './monitoring/sentry/sentry-integration';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  release: process.env.APP_VERSION,
});
```

### 4.3 Set Up Log Shipping

Ensure your applications log to stdout/stderr for automatic collection.

## Step 5: Configure Alerts

### 5.1 Test Alert Routing

```bash
# Send test alert
curl -XPOST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert",
    "description": "This is a test"
  }
}]'
```

### 5.2 Verify Notifications

Check your configured channels:
- Email inbox
- Slack channels
- PagerDuty dashboard

## Step 6: Post-Deployment

### 6.1 Health Checks

```bash
# Create health check script
cat > check-monitoring.sh <<'EOF'
#!/bin/bash
echo "Checking Prometheus..."
curl -sf http://localhost:9090/-/healthy || echo "❌ Prometheus unhealthy"

echo "Checking Grafana..."
curl -sf http://localhost:3000/api/health || echo "❌ Grafana unhealthy"

echo "Checking Elasticsearch..."
curl -sf http://localhost:9200/_cluster/health || echo "❌ Elasticsearch unhealthy"

echo "Checking AlertManager..."
curl -sf http://localhost:9093/-/healthy || echo "❌ AlertManager unhealthy"

echo "✅ All checks complete"
EOF

chmod +x check-monitoring.sh
./check-monitoring.sh
```

### 6.2 Create Backup Job

```bash
# Example backup script
cat > backup-monitoring.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/backups/monitoring/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup Prometheus
docker exec ait-core-prometheus \
  curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
# Copy snapshot...

# Backup Grafana
docker cp ait-core-grafana:/var/lib/grafana "$BACKUP_DIR/grafana"

# Backup Elasticsearch
docker exec ait-core-elasticsearch \
  curl -X PUT "localhost:9200/_snapshot/backup/snapshot_$(date +%Y%m%d)"

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x backup-monitoring.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup-monitoring.sh
```

### 6.3 Documentation

Create runbook pages for each alert at:
`https://runbooks.ait-core.soriano.com/`

## Step 7: Scaling Considerations

### 7.1 Horizontal Scaling

**Prometheus**:
- Use Thanos or Cortex for multi-instance setup
- Configure remote write for long-term storage

**Elasticsearch**:
- Add more nodes for better performance
- Configure hot/warm/cold architecture

**Grafana**:
- Multiple instances behind load balancer
- Shared database for dashboards

### 7.2 Vertical Scaling

Adjust resource limits based on load:

```yaml
resources:
  requests:
    cpu: 2000m      # Increase
    memory: 8Gi     # Increase
  limits:
    cpu: 4000m
    memory: 16Gi
```

## Troubleshooting Deployment

### Common Issues

**Elasticsearch won't start**:
```bash
# Check vm.max_map_count
sysctl vm.max_map_count

# Should be at least 262144
sudo sysctl -w vm.max_map_count=262144
```

**Prometheus out of memory**:
```bash
# Reduce retention
--storage.tsdb.retention.time=15d
--storage.tsdb.retention.size=50GB

# Or increase memory limit
```

**PVC not binding (Kubernetes)**:
```bash
# Check storage classes
kubectl get sc

# Check PVC status
kubectl describe pvc -n monitoring

# May need to create PV manually or configure dynamic provisioning
```

## Production Checklist

- [ ] All services running and healthy
- [ ] Metrics being collected
- [ ] Dashboards accessible
- [ ] Alerts configured and tested
- [ ] Logs being aggregated
- [ ] Backups configured
- [ ] SSL/TLS enabled
- [ ] Authentication enabled
- [ ] Resource limits set
- [ ] Monitoring documented
- [ ] Team trained on dashboards
- [ ] Runbooks created
- [ ] Incident response plan documented

## Next Steps

1. **Monitor the monitors**: Set up alerts for monitoring system health
2. **Tune retention**: Adjust based on storage and compliance requirements
3. **Create SLOs**: Define service level objectives
4. **Regular reviews**: Weekly dashboard reviews, monthly alert tuning
5. **Capacity planning**: Monitor growth trends

## Support

For deployment issues:
- Check logs: `docker-compose logs` or `kubectl logs`
- Review documentation: `monitoring/README.md`
- Contact: devops@ait-core.soriano.com
