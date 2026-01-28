# Quick Start Guide - AIT-CORE Monitoring

Get the monitoring stack up and running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM available
- 50GB disk space

## 1. Clone and Navigate

```bash
cd C:\Users\rsori\codex\ait-core-soriano\monitoring
```

## 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials (minimum required)
# GRAFANA_ADMIN_PASSWORD=your-password
# ELASTIC_PASSWORD=your-password
```

## 3. Increase System Limits (Linux/Mac)

```bash
# For Elasticsearch
sudo sysctl -w vm.max_map_count=262144
```

For Windows with WSL2, run in PowerShell as Administrator:
```powershell
wsl -d docker-desktop sysctl -w vm.max_map_count=262144
```

## 4. Start Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

## 5. Wait for Services to Start

```bash
# Check status
docker-compose -f docker-compose.monitoring.yml ps

# Watch logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

## 6. Access Services

Once all services are running (wait 2-3 minutes):

| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | http://localhost:3000 | admin / (your password) |
| Prometheus | http://localhost:9090 | - |
| AlertManager | http://localhost:9093 | - |
| Kibana | http://localhost:5601 | - |
| Elasticsearch | http://localhost:9200 | elastic / (your password) |

## 7. Verify Setup

### Check Prometheus Targets

1. Go to http://localhost:9090/targets
2. All targets should show as "UP"

### Check Grafana Dashboards

1. Login to Grafana: http://localhost:3000
2. Go to Dashboards → Browse
3. Open "AIT-CORE System Overview"

### Check Elasticsearch

```bash
curl http://localhost:9200/_cluster/health?pretty
```

Should show status: "green" or "yellow"

## 8. Configure Your Application

### Add Metrics Endpoint

```typescript
// In your Express app
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Add Sentry

```typescript
import Sentry from './monitoring/sentry/sentry-integration';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'development',
});
```

### Add to Docker Compose

```yaml
services:
  your-app:
    # ... your config
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=3000"
      - "prometheus.io/path=/metrics"
    networks:
      - monitoring

networks:
  monitoring:
    external: true
    name: monitoring_monitoring
```

## 9. Send Test Data

### Create Test Metrics

```bash
# Push test metric to Pushgateway
echo "test_metric 42" | curl --data-binary @- http://localhost:9091/metrics/job/test
```

### Send Test Log

```bash
# Send test log to Logstash
curl -XPOST 'http://localhost:8080/' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Test log entry","level":"INFO","service":"test"}'
```

### Trigger Test Alert

```bash
# Send test alert to AlertManager
curl -XPOST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "This is a test alert"
  }
}]'
```

## 10. Common Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.monitoring.yml logs -f

# Specific service
docker-compose -f docker-compose.monitoring.yml logs -f prometheus
```

### Restart Service

```bash
docker-compose -f docker-compose.monitoring.yml restart grafana
```

### Stop All

```bash
docker-compose -f docker-compose.monitoring.yml down
```

### Stop and Remove Data

```bash
# WARNING: This will delete all metrics and logs!
docker-compose -f docker-compose.monitoring.yml down -v
```

## Troubleshooting

### Services Won't Start

**Check Docker resources**:
- Ensure Docker has at least 8GB RAM
- Check disk space

**Check logs**:
```bash
docker-compose -f docker-compose.monitoring.yml logs [service-name]
```

### Elasticsearch Stuck on Yellow/Red

```bash
# Check cluster health
curl http://localhost:9200/_cluster/health?pretty

# For single-node setup, yellow is normal
# Set number of replicas to 0
curl -X PUT "localhost:9200/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "number_of_replicas": 0
  }
}'
```

### Can't Access Grafana

1. Wait 2-3 minutes for service to fully start
2. Check if port 3000 is available
3. Check Grafana logs:
   ```bash
   docker-compose -f docker-compose.monitoring.yml logs grafana
   ```

### Prometheus Not Scraping Targets

1. Check network connectivity
2. Verify service is exposing metrics
3. Check Prometheus config:
   ```bash
   docker exec ait-core-prometheus cat /etc/prometheus/prometheus.yml
   ```

## Next Steps

1. **Configure Alerts**: Edit `alertmanager/alertmanager.yml` with your notification channels
2. **Customize Dashboards**: Create dashboards for your specific metrics
3. **Set Up Sentry**: Configure error tracking for your applications
4. **Review Documentation**: Read the full README.md for advanced features
5. **Production Deployment**: Follow DEPLOYMENT_GUIDE.md for production setup

## Quick Reference

### Default Ports

- 3000: Grafana
- 5000: Logstash Syslog (TCP/UDP)
- 5001: Logstash TCP JSON
- 5044: Logstash Beats
- 5601: Kibana
- 8080: Logstash HTTP / cAdvisor
- 9090: Prometheus
- 9091: Pushgateway
- 9093: AlertManager
- 9100: Node Exporter
- 9114: Elasticsearch Exporter
- 9115: Blackbox Exporter
- 9121: Redis Exporter
- 9187: PostgreSQL Exporter
- 9200: Elasticsearch HTTP
- 9300: Elasticsearch Transport
- 9600: Logstash API

### Environment Variables

See `.env.example` for all available configuration options.

### Data Persistence

All data is stored in Docker volumes:
- prometheus-data
- grafana-data
- elasticsearch-data
- logstash-data
- kibana-data

To backup:
```bash
docker run --rm -v monitoring_prometheus-data:/data -v $(pwd):/backup \
  ubuntu tar czf /backup/prometheus-backup.tar.gz /data
```

## Support

- Documentation: `monitoring/README.md`
- Deployment Guide: `monitoring/DEPLOYMENT_GUIDE.md`
- Issues: Create an issue in the repository
- Email: monitoring@ait-core.soriano.com

---

**Congratulations!** Your monitoring stack is now running. Start building dashboards and configuring alerts for your AIT-CORE system.
