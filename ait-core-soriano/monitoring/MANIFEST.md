# AIT-CORE Monitoring Stack - File Manifest

Complete list of all monitoring configuration files and their purposes.

## Directory Structure

```
monitoring/
├── README.md                           # Main documentation
├── QUICK_START.md                      # Quick start guide
├── DEPLOYMENT_GUIDE.md                 # Production deployment guide
├── MANIFEST.md                         # This file
├── .env.example                        # Environment variables template
├── docker-compose.monitoring.yml       # Docker Compose configuration
│
├── prometheus/                         # Prometheus configuration
│   ├── prometheus.yml                  # Main Prometheus config
│   ├── blackbox.yml                    # Blackbox exporter config
│   ├── rules/
│   │   └── recording-rules.yml         # Recording rules for metrics
│   └── alerts/
│       ├── application-alerts.yml      # Application-level alerts
│       └── infrastructure-alerts.yml   # Infrastructure alerts
│
├── grafana/                            # Grafana configuration
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml         # Datasource configuration
│   │   └── dashboards/
│   │       └── dashboards.yml          # Dashboard provisioning
│   └── dashboards/
│       ├── system-overview.json        # System metrics dashboard
│       ├── application-performance.json # Application metrics dashboard
│       └── business-metrics.json       # Business KPI dashboard
│
├── alertmanager/                       # AlertManager configuration
│   ├── alertmanager.yml                # Alert routing and receivers
│   └── templates/
│       └── email.tmpl                  # Email notification template
│
├── elk/                                # ELK Stack configuration
│   ├── elasticsearch/
│   │   ├── elasticsearch.yml           # Elasticsearch config
│   │   ├── index-lifecycle-policy.json # ILM policy
│   │   └── index-template.json         # Index template
│   ├── logstash/
│   │   ├── logstash.yml                # Logstash config
│   │   └── pipeline/
│   │       └── logstash.conf           # Log processing pipeline
│   ├── kibana/
│   │   └── kibana.yml                  # Kibana configuration
│   └── filebeat/
│       └── filebeat.yml                # Filebeat configuration
│
├── loki/                               # Loki log aggregation
│   ├── loki-config.yml                 # Loki configuration
│   └── promtail-config.yml             # Promtail configuration
│
├── tempo/                              # Tempo distributed tracing
│   └── tempo.yml                       # Tempo configuration
│
├── sentry/                             # Sentry error tracking
│   ├── sentry.yml                      # Sentry server config
│   ├── sentry-integration.ts           # Node.js/Express integration
│   └── sentry-client.tsx               # React/Next.js integration
│
└── k8s/                                # Kubernetes manifests
    ├── namespace.yaml                  # Monitoring namespace
    ├── kustomization.yaml              # Kustomize configuration
    ├── prometheus/
    │   ├── prometheus-config.yaml      # ConfigMaps for Prometheus
    │   └── prometheus-deployment.yaml  # Prometheus deployment
    ├── grafana/
    │   └── grafana-deployment.yaml     # Grafana deployment
    └── alertmanager/
        └── alertmanager-deployment.yaml # AlertManager deployment
```

## File Descriptions

### Root Level

**README.md**
- Complete monitoring documentation
- Component overview
- Configuration guide
- Usage instructions

**QUICK_START.md**
- 5-minute setup guide
- Essential configuration steps
- Verification procedures
- Troubleshooting tips

**DEPLOYMENT_GUIDE.md**
- Production deployment steps
- Pre-deployment checklist
- Post-deployment verification
- Scaling considerations

**.env.example**
- Template for environment variables
- All required credentials
- Integration settings
- Service configurations

**docker-compose.monitoring.yml**
- Complete monitoring stack definition
- 15+ services configured
- Network and volume definitions
- Production-ready settings

### Prometheus (/prometheus)

**prometheus.yml**
- Scrape configurations
- Service discovery
- Alert routing
- Recording rules
- Remote storage (optional)

**blackbox.yml**
- HTTP/HTTPS probing
- TCP endpoint checks
- ICMP ping monitoring
- DNS query monitoring

**rules/recording-rules.yml**
- Pre-computed metrics
- Performance aggregations
- SLI/SLO calculations
- Custom business metrics

**alerts/application-alerts.yml**
- High error rate alerts
- Slow response time alerts
- Service availability alerts
- Database alerts
- Cache alerts
- SLO violations

**alerts/infrastructure-alerts.yml**
- CPU/Memory alerts
- Disk space alerts
- Network alerts
- Container health alerts
- Database health alerts
- Certificate expiration alerts

### Grafana (/grafana)

**provisioning/datasources/datasources.yml**
- Prometheus datasource
- Loki datasource
- Tempo datasource
- Elasticsearch datasource
- PostgreSQL datasource
- Auto-provisioned

**provisioning/dashboards/dashboards.yml**
- Dashboard auto-loading
- Folder organization
- Update policies

**dashboards/system-overview.json**
- CPU, Memory, Disk metrics
- Network traffic
- Service status
- Container metrics

**dashboards/application-performance.json**
- Request rates
- Response times
- Error rates
- Database connections
- Cache performance

**dashboards/business-metrics.json**
- Insurance policies
- Claims processing
- Revenue metrics
- Customer metrics
- Agent performance

### AlertManager (/alertmanager)

**alertmanager.yml**
- Alert grouping
- Route definitions
- Receiver configurations
- Inhibition rules
- Email/Slack/PagerDuty setup

**templates/email.tmpl**
- HTML email template
- Alert formatting
- Severity indicators
- Runbook links

### ELK Stack (/elk)

**elasticsearch/elasticsearch.yml**
- Cluster configuration
- Security settings
- Performance tuning
- Index management

**elasticsearch/index-lifecycle-policy.json**
- Hot/Warm/Cold architecture
- Data retention rules
- Rollover policies

**elasticsearch/index-template.json**
- Log field mappings
- Index settings
- Analysis configuration

**logstash/logstash.yml**
- Pipeline settings
- Monitoring configuration
- Queue configuration

**logstash/pipeline/logstash.conf**
- Input sources (Beats, TCP, HTTP)
- Filter pipeline (Grok, JSON)
- Output destinations
- Error handling

**kibana/kibana.yml**
- Elasticsearch connection
- Security configuration
- UI settings

**filebeat/filebeat.yml**
- Container log collection
- Docker metadata
- Output to Logstash

### Loki (/loki)

**loki-config.yml**
- Storage configuration
- Retention policies
- Query limits

**promtail-config.yml**
- Log discovery
- Label extraction
- Pipeline stages

### Tempo (/tempo)

**tempo.yml**
- Trace storage
- Metrics generation
- Service graph

### Sentry (/sentry)

**sentry.yml**
- Server configuration
- Database settings
- Email configuration

**sentry-integration.ts**
- Node.js/Express setup
- Error capturing
- Performance monitoring
- Transaction tracking

**sentry-client.tsx**
- React/Next.js setup
- Error boundaries
- User feedback
- Session replay

### Kubernetes (/k8s)

**namespace.yaml**
- Monitoring namespace
- Resource labels

**kustomization.yaml**
- Resource management
- Image versions
- Common labels

**prometheus/prometheus-config.yaml**
- Kubernetes service discovery
- ConfigMaps for rules and alerts
- RBAC configurations

**prometheus/prometheus-deployment.yaml**
- ServiceAccount
- ClusterRole/Binding
- Deployment spec
- Service definition
- PVC for storage

**grafana/grafana-deployment.yaml**
- Secret management
- ConfigMap for datasources
- Deployment spec
- LoadBalancer service
- PVC for data

**alertmanager/alertmanager-deployment.yaml**
- ConfigMap for routing
- Deployment spec
- Service definition
- PVC for storage

## Configuration Files by Purpose

### Metrics Collection
- prometheus/prometheus.yml
- prometheus/blackbox.yml
- All exporter configurations

### Alerting
- prometheus/alerts/*.yml
- alertmanager/alertmanager.yml
- alertmanager/templates/email.tmpl

### Visualization
- grafana/provisioning/datasources/datasources.yml
- grafana/dashboards/*.json

### Logging
- elk/logstash/pipeline/logstash.conf
- elk/elasticsearch/elasticsearch.yml
- elk/kibana/kibana.yml
- loki/loki-config.yml

### Tracing
- tempo/tempo.yml

### Error Tracking
- sentry/sentry.yml
- sentry/sentry-integration.ts
- sentry/sentry-client.tsx

### Deployment
- docker-compose.monitoring.yml
- k8s/*.yaml
- .env.example

### Documentation
- README.md
- QUICK_START.md
- DEPLOYMENT_GUIDE.md
- MANIFEST.md

## Key Features by File

### High Availability
- prometheus-deployment.yaml: Multi-replica support
- grafana-deployment.yaml: Persistent storage
- elasticsearch.yml: Cluster configuration

### Security
- .env.example: Credential management
- All *.yml: Authentication configs
- k8s secrets: Encrypted credentials

### Performance
- prometheus.yml: Optimized scrape intervals
- elasticsearch.yml: Memory tuning
- logstash.yml: Pipeline optimization

### Reliability
- All deployments: Health checks
- All deployments: Resource limits
- alertmanager.yml: Alert deduplication

### Scalability
- prometheus.yml: Remote storage ready
- elasticsearch.yml: Cluster-ready
- k8s manifests: HPA-ready

## Integration Points

### Application Integration
1. Expose /metrics endpoint
2. Add Sentry SDK (sentry-integration.ts)
3. Configure logging to stdout

### Kubernetes Integration
1. Add prometheus.io annotations
2. Deploy to monitoring namespace
3. Configure service discovery

### Alert Integration
1. Configure AlertManager receivers
2. Set up notification channels
3. Create runbook links

## Maintenance

### Regular Updates
- Update image versions in docker-compose.yml
- Review and tune alert thresholds
- Optimize retention policies
- Update dashboard definitions

### Monitoring the Monitors
- Prometheus self-monitoring
- Grafana health checks
- Elasticsearch cluster health
- AlertManager status

### Backup Recommendations
- Prometheus snapshots: Weekly
- Grafana dashboards: Version controlled
- Elasticsearch snapshots: Daily
- Configuration files: Git repository

## Total File Count

- Configuration files: 30+
- Documentation files: 4
- Kubernetes manifests: 6
- Total: 40+ files

## Version Information

- Prometheus: Latest (v2.48+)
- Grafana: Latest (v10.2+)
- Elasticsearch: 8.11.0
- Logstash: 8.11.0
- Kibana: 8.11.0
- AlertManager: Latest (v0.26+)
- Sentry: Latest

## Support

For questions about specific files or configurations:
- Review the file-level comments
- Check the main README.md
- Refer to DEPLOYMENT_GUIDE.md
- Contact: monitoring@ait-core.soriano.com

---

**Note**: This monitoring stack is production-ready and includes industry best practices for observability, alerting, and performance monitoring.
