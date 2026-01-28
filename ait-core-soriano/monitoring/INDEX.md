# AIT-CORE Monitoring - Quick Reference Index

## 📚 Start Here

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [SETUP_COMPLETE.md](SETUP_COMPLETE.md) | Overview of what's been created | 5 min |
| [QUICK_START.md](QUICK_START.md) | Get running in 5 minutes | 5 min |
| [README.md](README.md) | Complete documentation | 30 min |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment | 20 min |
| [MANIFEST.md](MANIFEST.md) | File inventory | 10 min |

## 🚀 Common Tasks

### First Time Setup
1. Read [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
2. Follow [QUICK_START.md](QUICK_START.md)
3. Configure `.env` from `.env.example`
4. Run `docker-compose -f docker-compose.monitoring.yml up -d`

### Production Deployment
1. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Complete pre-deployment checklist
3. Configure secrets and credentials
4. Deploy using Docker Compose or Kubernetes

### Add New Service to Monitor
1. Add scrape config to `prometheus/prometheus.yml`
2. Add alert rules to `prometheus/alerts/`
3. Create dashboard in Grafana
4. Document in runbook

### Create New Alert
1. Add rule to `prometheus/alerts/application-alerts.yml` or `infrastructure-alerts.yml`
2. Configure routing in `alertmanager/alertmanager.yml`
3. Test alert triggering
4. Create runbook entry

### Add New Dashboard
1. Create in Grafana UI or JSON file
2. Save to `grafana/dashboards/`
3. Add to provisioning config
4. Document metrics used

## 📁 Configuration Files by Service

### Prometheus
- Main config: `prometheus/prometheus.yml`
- Recording rules: `prometheus/rules/recording-rules.yml`
- Application alerts: `prometheus/alerts/application-alerts.yml`
- Infrastructure alerts: `prometheus/alerts/infrastructure-alerts.yml`
- Blackbox: `prometheus/blackbox.yml`

### Grafana
- Datasources: `grafana/provisioning/datasources/datasources.yml`
- Dashboard config: `grafana/provisioning/dashboards/dashboards.yml`
- System dashboard: `grafana/dashboards/system-overview.json`
- App dashboard: `grafana/dashboards/application-performance.json`
- Business dashboard: `grafana/dashboards/business-metrics.json`

### AlertManager
- Config: `alertmanager/alertmanager.yml`
- Email template: `alertmanager/templates/email.tmpl`

### Elasticsearch
- Config: `elk/elasticsearch/elasticsearch.yml`
- ILM Policy: `elk/elasticsearch/index-lifecycle-policy.json`
- Index template: `elk/elasticsearch/index-template.json`

### Logstash
- Config: `elk/logstash/logstash.yml`
- Pipeline: `elk/logstash/pipeline/logstash.conf`

### Kibana
- Config: `elk/kibana/kibana.yml`

### Loki
- Config: `loki/loki-config.yml`
- Promtail: `loki/promtail-config.yml`

### Tempo
- Config: `tempo/tempo.yml`

### Sentry
- Server: `sentry/sentry.yml`
- Node.js integration: `sentry/sentry-integration.ts`
- React integration: `sentry/sentry-client.tsx`

## 🔧 Deployment Files

### Docker Compose
- Stack: `docker-compose.monitoring.yml`
- Environment: `.env.example` → copy to `.env`

### Kubernetes
- Namespace: `k8s/namespace.yaml`
- Kustomize: `k8s/kustomization.yaml`
- Prometheus: `k8s/prometheus/prometheus-deployment.yaml`
- Grafana: `k8s/grafana/grafana-deployment.yaml`
- AlertManager: `k8s/alertmanager/alertmanager-deployment.yaml`

## 🌐 Default Ports

| Service | Port | URL |
|---------|------|-----|
| Grafana | 3000 | http://localhost:3000 |
| Prometheus | 9090 | http://localhost:9090 |
| AlertManager | 9093 | http://localhost:9093 |
| Kibana | 5601 | http://localhost:5601 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Loki | 3100 | http://localhost:3100 |
| Tempo | 3200 | http://localhost:3200 |
| Logstash HTTP | 8080 | http://localhost:8080 |
| cAdvisor | 8080 | http://localhost:8080 |
| Node Exporter | 9100 | http://localhost:9100 |
| Pushgateway | 9091 | http://localhost:9091 |

## 📊 Pre-Built Dashboards

1. **System Overview** (`grafana/dashboards/system-overview.json`)
   - CPU, Memory, Disk usage
   - Network traffic
   - Service status
   - Container metrics

2. **Application Performance** (`grafana/dashboards/application-performance.json`)
   - Request rate (QPS)
   - Response times (p50, p95, p99)
   - Error rates
   - Database connections
   - Cache hit rate

3. **Business Metrics** (`grafana/dashboards/business-metrics.json`)
   - Insurance policies created
   - Claims processed
   - Revenue metrics
   - Customer satisfaction
   - Agent performance

## 🚨 Alert Categories

### Application Alerts (`prometheus/alerts/application-alerts.yml`)
- HighErrorRate
- APIResponseTimeHigh
- ServiceDown
- DatabaseConnectionPoolHigh
- CacheHitRateLow
- SLOViolationAvailability
- SLOViolationLatency

### Infrastructure Alerts (`prometheus/alerts/infrastructure-alerts.yml`)
- HighCPUUsage
- HighMemoryUsage
- DiskSpaceLow
- ContainerRestartRateHigh
- NodeNotReady
- PostgreSQLDown
- RedisDown
- ElasticsearchClusterRed
- SSLCertificateExpiring

## 🔍 Quick Troubleshooting

### Check Service Health
```bash
# Docker Compose
docker-compose -f docker-compose.monitoring.yml ps

# Kubernetes
kubectl get pods -n monitoring
```

### View Logs
```bash
# Docker Compose
docker-compose -f docker-compose.monitoring.yml logs -f [service]

# Kubernetes
kubectl logs -n monitoring -f [pod-name]
```

### Test Prometheus Targets
```bash
curl http://localhost:9090/api/v1/targets
```

### Check Elasticsearch Health
```bash
curl http://localhost:9200/_cluster/health?pretty
```

### Send Test Alert
```bash
curl -XPOST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {"alertname": "TestAlert", "severity": "warning"},
  "annotations": {"summary": "Test"}
}]'
```

## 📖 Learning Resources

### Prometheus
- Docs: https://prometheus.io/docs/
- Query language: https://prometheus.io/docs/prometheus/latest/querying/basics/
- Best practices: https://prometheus.io/docs/practices/naming/

### Grafana
- Docs: https://grafana.com/docs/
- Dashboard best practices: https://grafana.com/docs/grafana/latest/dashboards/
- Variables: https://grafana.com/docs/grafana/latest/variables/

### ELK Stack
- Elasticsearch: https://elastic.co/guide/
- Logstash: https://elastic.co/guide/en/logstash/
- Kibana: https://elastic.co/guide/en/kibana/

### Sentry
- Docs: https://docs.sentry.io/
- Performance: https://docs.sentry.io/product/performance/
- Error tracking: https://docs.sentry.io/product/issues/

## 🎯 Key Metrics to Monitor

### Golden Signals
1. **Latency** - `http_request_duration_seconds`
2. **Traffic** - `http_requests_total`
3. **Errors** - `http_requests_total{status=~"5.."}`
4. **Saturation** - CPU, Memory, Disk usage

### USE Method (Resources)
- **Utilization** - % time resource is busy
- **Saturation** - Amount of queued work
- **Errors** - Count of error events

### RED Method (Services)
- **Rate** - Requests per second
- **Errors** - Failed requests per second
- **Duration** - Request latency

## 🔐 Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Enable SSL/TLS for production
- [ ] Configure authentication
- [ ] Set up network policies
- [ ] Rotate encryption keys
- [ ] Enable audit logging
- [ ] Configure RBAC
- [ ] Implement secret management

## 📈 Scaling Guidelines

### When to Scale

**Prometheus**:
- High memory usage (>80%)
- Query latency increasing
- Scrape falling behind

**Elasticsearch**:
- Cluster health yellow/red
- Query performance degrading
- Disk space filling up

**Grafana**:
- Dashboard load times slow
- Many concurrent users

### How to Scale

1. **Vertical**: Increase CPU/Memory
2. **Horizontal**: Add more instances
3. **Distributed**: Use Thanos/Cortex for Prometheus
4. **Sharding**: Elasticsearch cluster

## 🎓 Training Paths

### For Developers
1. Add metrics to code
2. Create custom dashboards
3. Understand alerts
4. Use distributed tracing

### For Operations
1. Deploy and maintain stack
2. Tune performance
3. Configure alerts
4. Handle incidents

### For Business Users
1. Read business dashboards
2. Understand KPIs
3. Set SLOs
4. Request custom metrics

## 📞 Support

### Internal Resources
- Monitoring Team: monitoring@ait-core.soriano.com
- Documentation: This directory
- Runbooks: (to be created)
- Training: (to be scheduled)

### External Help
- Prometheus community
- Grafana forums
- Elastic support
- Stack Overflow

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Basic monitoring stack
- [x] Pre-built dashboards
- [x] Alert rules
- [x] Documentation

### Phase 2 (Next)
- [ ] Custom business dashboards
- [ ] Advanced alert tuning
- [ ] SLO/SLI definitions
- [ ] Runbook creation

### Phase 3 (Future)
- [ ] Machine learning anomaly detection
- [ ] Predictive alerting
- [ ] Advanced analytics
- [ ] Cost optimization

## 📝 Maintenance Schedule

### Daily
- Check alert queue
- Monitor disk usage
- Review critical alerts

### Weekly
- Review dashboard usage
- Tune alert thresholds
- Check backup status

### Monthly
- Review retention policies
- Optimize queries
- Update documentation
- Security audit

### Quarterly
- Capacity planning
- Technology updates
- Training sessions
- Strategy review

---

**Quick Tip**: Bookmark this page for easy access to all monitoring resources!

**Total Files**: 38 configuration files + 5 documentation files = 43 files
**Status**: Production Ready ✅
**Last Updated**: 2026-01-28
