# AIT-CORE Monitoring Stack

Complete production-ready observability solution for the AIT-CORE system.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

This monitoring stack provides comprehensive observability for the AIT-CORE system, including:

- **Metrics Collection**: Prometheus for time-series metrics
- **Visualization**: Grafana dashboards for real-time insights
- **Alerting**: AlertManager for intelligent alert routing
- **Logging**: ELK stack (Elasticsearch, Logstash, Kibana) for centralized logs
- **Tracing**: Tempo for distributed tracing
- **Error Tracking**: Sentry for application error monitoring
- **Performance Monitoring**: Application performance metrics and profiling

## Components

### Metrics & Monitoring

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and management
- **Node Exporter**: System-level metrics
- **cAdvisor**: Container metrics
- **Blackbox Exporter**: Endpoint monitoring
- **Push Gateway**: Batch job metrics

### Logging

- **Elasticsearch**: Log storage and indexing
- **Logstash**: Log processing and transformation
- **Kibana**: Log visualization and search
- **Filebeat**: Log shipping
- **Loki**: Alternative log aggregation
- **Promtail**: Log collection for Loki

### Tracing

- **Tempo**: Distributed tracing backend
- **OpenTelemetry**: Instrumentation

### Error Tracking

- **Sentry**: Error tracking and performance monitoring

### Database Exporters

- **PostgreSQL Exporter**: Database metrics
- **Redis Exporter**: Cache metrics
- **Elasticsearch Exporter**: Search engine metrics

## Quick Start

### Using Docker Compose

1. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

2. **Start the monitoring stack**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

3. **Access the services**:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (admin/admin)
   - AlertManager: http://localhost:9093
   - Kibana: http://localhost:5601
   - Elasticsearch: http://localhost:9200

### Using Kubernetes

1. **Create the namespace**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   ```

2. **Deploy using Kustomize**:
   ```bash
   kubectl apply -k k8s/
   ```

3. **Verify deployments**:
   ```bash
   kubectl get all -n monitoring
   ```

## Configuration

### Prometheus

Configuration file: `prometheus/prometheus.yml`

**Scrape Targets**:
- Application metrics: `/metrics` endpoint
- System metrics: Node Exporter
- Container metrics: cAdvisor
- Database metrics: Various exporters

**Data Retention**: 30 days (configurable)

### Grafana

**Datasources** (auto-provisioned):
- Prometheus (default)
- Loki (logs)
- Tempo (traces)
- Elasticsearch (logs)
- PostgreSQL (application data)

**Pre-configured Dashboards**:
- System Overview
- Application Performance
- Business Metrics
- Database Performance
- Container Metrics

### AlertManager

Configuration file: `alertmanager/alertmanager.yml`

**Notification Channels**:
- Email (SMTP)
- Slack
- PagerDuty
- Webhooks

**Alert Routing**:
- Critical alerts → PagerDuty + Slack
- Warnings → Slack
- Business alerts → Business team
- Security alerts → Security team

### ELK Stack

**Elasticsearch**:
- Index lifecycle management (ILM) enabled
- Hot/Warm/Cold architecture
- 30-day retention by default

**Logstash**:
- JSON log parsing
- Grok patterns for various formats
- GeoIP enrichment
- User-agent parsing

**Kibana**:
- Pre-configured index patterns
- Saved searches and visualizations

### Sentry

**Configuration**:
- Server-side integration: `sentry/sentry-integration.ts`
- Client-side integration: `sentry/sentry-client.tsx`

**Features**:
- Error tracking
- Performance monitoring
- Session replay
- User feedback
- Release tracking

## Dashboards

### System Overview
- CPU, Memory, Disk usage
- Network traffic
- Container status
- Active alerts

### Application Performance
- Request rate (QPS)
- Response time (p50, p95, p99)
- Error rate
- Database connections
- Cache hit rate

### Business Metrics
- Insurance policies created
- Claims processed
- Revenue metrics
- Customer satisfaction
- Agent performance

### Database Performance
- Query performance
- Connection pool usage
- Slow queries
- Replication lag

## Alerting

### Alert Rules

**Application Alerts** (`prometheus/alerts/application-alerts.yml`):
- High error rate
- Slow response time
- Service down
- Database connection pool exhaustion
- Cache hit rate low
- SLO violations

**Infrastructure Alerts** (`prometheus/alerts/infrastructure-alerts.yml`):
- High CPU/Memory usage
- Disk space low
- Container restarts
- Pod not ready
- Database down
- Certificate expiration

### Alert Severity Levels

- **Critical**: Immediate action required (PagerDuty + Slack + Email)
- **Warning**: Investigate soon (Slack + Email)
- **Info**: Informational only (Email)

### Runbooks

Each alert includes a runbook URL for troubleshooting steps:
- `https://runbooks.ait-core.soriano.com/{alert-name}`

## Deployment

### Docker Compose Deployment

```bash
# Start all monitoring services
docker-compose -f docker-compose.monitoring.yml up -d

# View logs
docker-compose -f docker-compose.monitoring.yml logs -f

# Stop all services
docker-compose -f docker-compose.monitoring.yml down

# Stop and remove volumes (WARNING: data loss)
docker-compose -f docker-compose.monitoring.yml down -v
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Deploy monitoring stack
kubectl apply -k k8s/

# Check status
kubectl get all -n monitoring

# Access Grafana (port-forward)
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Delete monitoring stack
kubectl delete -k k8s/
```

### Production Considerations

1. **Persistent Storage**: Ensure adequate storage for metrics and logs
2. **Resource Limits**: Adjust CPU/memory limits based on load
3. **High Availability**: Run multiple replicas of critical services
4. **Backup**: Regular backups of Prometheus data and Grafana dashboards
5. **Security**:
   - Enable TLS/SSL for all services
   - Use strong passwords
   - Implement network policies
   - Enable authentication

## Application Instrumentation

### Node.js/Express

```typescript
import Sentry from './monitoring/sentry/sentry-integration';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
});

// Add middleware
app.use(Sentry.requestHandler);
app.use(Sentry.tracingHandler);

// Error handler (must be last)
app.use(Sentry.errorHandler);

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### React/Next.js

```tsx
import Sentry from './monitoring/sentry/sentry-client';

// Initialize in _app.tsx
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
});

// Use error boundary
<Sentry.ErrorBoundary fallback={<ErrorPage />}>
  <Component {...pageProps} />
</Sentry.ErrorBoundary>

// Track route changes
Sentry.useRouteTracing();
```

### Adding Prometheus Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Counter for requests
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

// Histogram for response time
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Gauge for active connections
const activeConnections = new Gauge({
  name: 'db_connection_pool_active',
  help: 'Active database connections',
});
```

## Troubleshooting

### Common Issues

**Prometheus not scraping targets**:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service discovery
curl http://localhost:9090/api/v1/targets/metadata
```

**Grafana can't connect to Prometheus**:
- Verify network connectivity
- Check datasource configuration
- Ensure Prometheus is running

**Elasticsearch cluster RED**:
```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# Check indices
curl http://localhost:9200/_cat/indices?v
```

**High memory usage**:
- Reduce Prometheus retention period
- Increase memory limits
- Enable compression
- Use remote storage

### Logs

```bash
# Docker Compose logs
docker-compose -f docker-compose.monitoring.yml logs -f [service-name]

# Kubernetes logs
kubectl logs -n monitoring [pod-name] -f
```

### Performance Tuning

**Prometheus**:
- Adjust `scrape_interval` (default: 15s)
- Configure `retention.time` (default: 30d)
- Enable remote storage for long-term retention

**Elasticsearch**:
- Configure heap size (50% of RAM, max 32GB)
- Enable ILM for automatic index management
- Use SSD storage for hot data

**Grafana**:
- Enable caching
- Use query optimization
- Limit dashboard refresh rate

## Backup and Recovery

### Prometheus

```bash
# Create snapshot
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Backup directory
tar -czf prometheus-backup.tar.gz /prometheus/snapshots/
```

### Elasticsearch

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backups"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1?wait_for_completion=true"
```

### Grafana

Grafana dashboards are provisioned from JSON files and automatically restored.

## Security Best Practices

1. **Change default passwords** immediately
2. **Enable authentication** on all services
3. **Use TLS/SSL** for all external connections
4. **Implement network policies** in Kubernetes
5. **Regular security updates** for all components
6. **Limit access** to monitoring dashboards
7. **Encrypt sensitive data** in environment variables
8. **Regular security audits** of configurations

## Support

For issues and questions:
- Documentation: `docs/monitoring/`
- Runbooks: `https://runbooks.ait-core.soriano.com/`
- Team: monitoring@ait-core.soriano.com

## License

Proprietary - AIT-CORE Soriano Mediadores
