# AIT-NERVE - Motor Manager & Engine Orchestration

AIT-NERVE is the central nervous system of the AIT-CORE platform, responsible for orchestrating and managing all 23 computational engines provided by the `ait-engines` Python service.

## Overview

AIT-NERVE acts as the intelligent coordinator between the NestJS backend and the Python computational engines, providing:

- **Engine Lifecycle Management**: Start, stop, restart, and scale engines dynamically
- **Intelligent Request Routing**: Route requests to the most appropriate engine based on workload
- **Health Monitoring**: Continuous health checks and performance metrics for all engines
- **Failover & Load Balancing**: Automatic failover and intelligent load distribution
- **Unified API**: Single entry point for accessing all 23 engines

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AIT-NERVE                             │
│                    (Motor Manager)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Engine     │  │   Health     │  │   Request    │      │
│  │ Orchestrator │  │   Monitor    │  │   Router     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Failover   │  │     Load     │  │  Performance │      │
│  │   Manager    │  │   Balancer   │  │   Metrics    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ait-engines (Python Service)                    │
│                   23 Computational Engines                   │
├─────────────────────────────────────────────────────────────┤
│  Statistical │ Economic │ Financial │ Strategic │ ...        │
└─────────────────────────────────────────────────────────────┘
```

## The 23 Engines

### 1. Statistical Engine
- Descriptive statistics, hypothesis testing, distributions

### 2. Economic Engine
- Macroeconomic indicators, market analysis, forecasting

### 3. Financial Engine
- Financial modeling, risk assessment, portfolio optimization

### 4. Strategic Engine
- Strategic planning, competitive analysis, scenario planning

### 5. Machine Learning Engine
- Classification, regression, clustering, feature engineering

### 6. Deep Learning Engine
- Neural networks, computer vision, NLP, transfer learning

### 7. Optimization Engine
- Linear/nonlinear optimization, constraint solving

### 8. Simulation Engine
- Monte Carlo, discrete event simulation, agent-based modeling

### 9. Time Series Engine
- Forecasting, seasonality detection, trend analysis

### 10. NLP Engine
- Text analysis, sentiment analysis, entity extraction

### 11. Computer Vision Engine
- Image classification, object detection, segmentation

### 12. Graph Analytics Engine
- Network analysis, community detection, path finding

### 13. Geospatial Engine
- Geographic analysis, mapping, spatial statistics

### 14. Risk Assessment Engine
- Risk modeling, stress testing, scenario analysis

### 15. Predictive Maintenance Engine
- Failure prediction, maintenance scheduling, anomaly detection

### 16. Recommendation Engine
- Collaborative filtering, content-based recommendations

### 17. Fraud Detection Engine
- Anomaly detection, pattern recognition, risk scoring

### 18. Customer Analytics Engine
- Segmentation, churn prediction, lifetime value

### 19. Supply Chain Engine
- Inventory optimization, demand forecasting, logistics

### 20. Pricing Engine
- Dynamic pricing, price optimization, elasticity analysis

### 21. Credit Scoring Engine
- Credit risk assessment, default prediction, scoring models

### 22. Insurance Analytics Engine
- Actuarial analysis, claim prediction, underwriting

### 23. Document Intelligence Engine
- Document classification, information extraction, OCR

## Features

### Engine Orchestration
- Dynamic engine startup and shutdown
- Resource allocation and scaling
- Version management and updates
- Configuration management

### Health Monitoring
- Real-time health checks (every 30 seconds)
- Performance metrics collection
- Resource utilization tracking
- Automatic unhealthy engine detection

### Request Routing
- Intelligent routing based on engine availability
- Workload distribution
- Priority-based routing
- Queue management

### Failover & Load Balancing
- Automatic failover to backup engines
- Round-robin and weighted load balancing
- Circuit breaker pattern
- Graceful degradation

### Performance Metrics
- Request latency tracking
- Throughput monitoring
- Error rate analysis
- Resource utilization metrics

## API Endpoints

### Engine Management
```
POST   /nerve/engines/:engineId/start    - Start an engine
POST   /nerve/engines/:engineId/stop     - Stop an engine
POST   /nerve/engines/:engineId/restart  - Restart an engine
GET    /nerve/engines                    - List all engines
GET    /nerve/engines/:engineId          - Get engine details
PUT    /nerve/engines/:engineId/scale    - Scale engine instances
```

### Engine Execution
```
POST   /nerve/execute/:engineId          - Execute on specific engine
POST   /nerve/execute/auto               - Auto-route to best engine
POST   /nerve/batch                      - Batch execution
```

### Health & Monitoring
```
GET    /nerve/health                     - Overall system health
GET    /nerve/health/:engineId           - Specific engine health
GET    /nerve/metrics                    - Performance metrics
GET    /nerve/metrics/:engineId          - Engine-specific metrics
```

### Configuration
```
GET    /nerve/config                     - Get configuration
PUT    /nerve/config                     - Update configuration
GET    /nerve/config/:engineId           - Get engine config
PUT    /nerve/config/:engineId           - Update engine config
```

## Usage Example

```typescript
import { NerveService } from '@ait-core/nerve';

// Inject the service
constructor(private nerveService: NerveService) {}

// Execute on a specific engine
const result = await this.nerveService.execute('statistical-engine', {
  operation: 'descriptive_stats',
  data: [1, 2, 3, 4, 5]
});

// Auto-route to best available engine
const result = await this.nerveService.executeAuto({
  engineType: 'statistical',
  operation: 'descriptive_stats',
  data: [1, 2, 3, 4, 5]
});

// Check engine health
const health = await this.nerveService.getEngineHealth('statistical-engine');

// Get performance metrics
const metrics = await this.nerveService.getMetrics();
```

## Configuration

```yaml
# config/engines.yaml
engines:
  statistical-engine:
    url: http://localhost:8001
    maxInstances: 3
    healthCheckInterval: 30000
    timeout: 60000

  economic-engine:
    url: http://localhost:8002
    maxInstances: 2
    healthCheckInterval: 30000
    timeout: 90000

loadBalancing:
  strategy: weighted-round-robin
  weights:
    statistical-engine: 1.0
    economic-engine: 1.5

failover:
  enabled: true
  maxRetries: 3
  retryDelay: 1000
  circuitBreakerThreshold: 5
```

## Environment Variables

```env
# Engine Service URLs
ENGINES_BASE_URL=http://localhost:8000
ENGINES_HEALTH_CHECK_INTERVAL=30000
ENGINES_REQUEST_TIMEOUT=60000

# Redis (for distributed coordination)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring
METRICS_ENABLED=true
METRICS_PORT=9090

# Load Balancing
LOAD_BALANCING_STRATEGY=weighted-round-robin

# Failover
FAILOVER_ENABLED=true
FAILOVER_MAX_RETRIES=3
CIRCUIT_BREAKER_THRESHOLD=5
```

## Integration with ait-engines

AIT-NERVE communicates with the Python `ait-engines` service via HTTP/REST:

1. **Engine Discovery**: Automatically discovers available engines on startup
2. **Health Checks**: Periodic health checks to all engine endpoints
3. **Request Execution**: Sends computation requests and receives results
4. **Error Handling**: Handles engine failures and retries

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

## Monitoring

AIT-NERVE exposes Prometheus metrics on port 9090:

- `nerve_engine_requests_total` - Total requests per engine
- `nerve_engine_request_duration_seconds` - Request duration histogram
- `nerve_engine_health_status` - Engine health status (0/1)
- `nerve_engine_error_rate` - Error rate per engine
- `nerve_engine_queue_size` - Request queue size

## Production Deployment

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f ait-nerve

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace ait-core

# Apply configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ait-core

# View logs
kubectl logs -f deployment/ait-nerve -n ait-core

# Scale deployment
kubectl scale deployment ait-nerve --replicas=3 -n ait-core
```

### Environment-Specific Configuration

**Development**
```bash
npm run start:dev
```

**Production**
```bash
npm run build
npm run start:prod
```

**With PM2**
```bash
pm2 start dist/main.js --name ait-nerve -i max
pm2 logs ait-nerve
pm2 restart ait-nerve
pm2 stop ait-nerve
```

## Performance Optimization

### Scaling Strategies

1. **Horizontal Scaling**: Deploy multiple AIT-NERVE instances behind a load balancer
2. **Engine Scaling**: Dynamically scale individual engine instances based on load
3. **Caching**: Use Redis for distributed caching and session management
4. **Connection Pooling**: Optimize HTTP connections to engine services

### Best Practices

- Enable Redis for distributed coordination in multi-instance deployments
- Configure appropriate timeouts based on engine workload
- Use circuit breakers to prevent cascade failures
- Monitor metrics and set up alerting for critical thresholds
- Implement rate limiting to prevent overload
- Use sticky sessions for stateful operations

## Troubleshooting

### Common Issues

**Engine Not Starting**
```bash
# Check engine health
curl http://localhost:3000/api/v1/nerve/health/:engineId

# View engine logs
docker-compose logs ait-engines

# Restart engine
curl -X POST http://localhost:3000/api/v1/nerve/engines/:engineId/restart
```

**High Error Rate**
```bash
# Check circuit breaker status
curl http://localhost:3000/api/v1/nerve/circuit-breakers

# Reset circuit breaker
curl -X POST http://localhost:3000/api/v1/nerve/circuit-breakers/:engineId/reset

# Check metrics
curl http://localhost:3000/api/v1/nerve/metrics
```

**Performance Issues**
```bash
# Check system health
curl http://localhost:3000/api/v1/nerve/health

# View metrics summary
curl http://localhost:3000/api/v1/nerve/metrics/summary

# Scale up engines
curl -X PUT http://localhost:3000/api/v1/nerve/engines/:engineId/scale \
  -H "Content-Type: application/json" \
  -d '{"targetInstances": 3, "reason": "high-load"}'
```

## WebSocket Real-Time Monitoring

Connect to WebSocket for real-time updates:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/nerve');

// Subscribe to metrics
socket.emit('subscribe-metrics', { enable: true });

// Subscribe to health updates
socket.emit('subscribe-health', { enable: true });

// Subscribe to engine events
socket.emit('subscribe-engine', { engineId: 'statistical-engine', enable: true });

// Listen for updates
socket.on('metrics', (data) => {
  console.log('Metrics update:', data);
});

socket.on('health', (data) => {
  console.log('Health update:', data);
});

socket.on('engine-event', (event) => {
  console.log('Engine event:', event);
});
```

## Alerting Configuration

Configure alerts for critical events:

```typescript
// Get all alerts
GET /nerve/alerts

// Get alert statistics
GET /nerve/alerts/stats

// Acknowledge alert
POST /nerve/alerts/:alertId/acknowledge

// Configure alert rules
PUT /nerve/alerts/rules/:ruleId
```

## Security Considerations

1. **Authentication**: Enable JWT authentication for production
2. **API Keys**: Use API keys for service-to-service communication
3. **Rate Limiting**: Configure rate limiting to prevent abuse
4. **CORS**: Restrict CORS origins in production
5. **HTTPS**: Always use HTTPS in production
6. **Network Security**: Deploy in private network/VPC
7. **Secrets Management**: Use environment variables or secret managers

## Monitoring & Observability

### Prometheus Metrics
- Access metrics at: `http://localhost:3000/api/v1/nerve/metrics/prometheus`
- Grafana dashboard at: `http://localhost:3001`

### Health Checks
- Liveness probe: `GET /api/v1/nerve/health`
- Readiness probe: `GET /api/v1/nerve/health`

### Logging
- Structured JSON logging
- Log rotation with daily files
- Configurable log levels
- Integration with ELK/Splunk

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@ait-core.com
- Documentation: https://docs.ait-core.com

## License

PROPRIETARY - AIT-CORE Platform

---

**AIT-NERVE** - Intelligent Engine Orchestration for AIT-CORE Platform
