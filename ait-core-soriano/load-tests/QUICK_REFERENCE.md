# Load Testing Quick Reference Card

## Installation

```bash
# Install K6
brew install k6              # macOS
choco install k6             # Windows

# Setup
cd load-tests
cp .env.example .env
npm install
```

## Common Commands

```bash
# Quick Tests
npm run test:smoke           # 1 min - verify system works
npm run test:load            # 16 min - normal load
npm run test:stress          # 26 min - find breaking points

# API Tests
npm run test:auth            # Auth service
npm run test:gateway         # API Gateway

# Production
npm run test:production      # 30 min - realistic patterns
npm run test:all             # 20 min - full coverage

# Analysis
npm run benchmark            # Performance benchmarks
npm run capacity             # Capacity planning
```

## K6 Direct Commands

```bash
# Basic
k6 run tests/smoke-test.js

# Custom VUs
k6 run --vus 50 tests/load-test.js

# Custom duration
k6 run --duration 10m tests/load-test.js

# With metrics
k6 run --out json=report.json tests/load-test.js

# InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js
```

## Environment Variables

```bash
# Set environment
export ENVIRONMENT=staging
export API_GATEWAY_URL=https://staging-api.ait-core.com

# Run test
npm run test:load
```

## Test Types

| Test | Duration | VUs | Purpose |
|------|----------|-----|---------|
| Smoke | 1m | 1 | Verify system |
| Load | 16m | 100 | Normal traffic |
| Stress | 26m | 300 | Breaking points |
| Spike | 6m | 500 | Traffic spikes |
| Soak | 2h+ | 100 | Stability |

## Performance Targets

### API Gateway
- P95: < 500ms
- P99: < 1000ms
- Error: < 0.1%

### Auth Service
- P95: < 300ms
- P99: < 800ms
- Error: < 0.05%

### DataHub
- P95: < 1000ms
- P99: < 3000ms
- Error: < 0.5%

## Reading Results

```bash
# View latest report
cat reports/load-test-summary.json

# Pretty print
cat reports/load-test-summary.json | jq .

# Check metrics
k6 run tests/load-test.js | grep http_req_duration
```

## Key Metrics

- **http_req_duration**: Response time
- **http_req_failed**: Error rate
- **http_reqs**: Total requests
- **vus**: Virtual users
- **iterations**: Completed test iterations

## Good Results

```
http_req_duration..: avg=250ms p(95)=1500ms p(99)=2800ms
http_req_failed....: 0.05% ✓ 14950 ✗ 50
http_reqs..........: 15000 (250/s)
```

## Poor Results

```
http_req_duration..: avg=3500ms p(95)=8500ms p(99)=12000ms
http_req_failed....: 8.5% ✓ 4575 ✗ 425
http_reqs..........: 5000 (83/s)
```

## Thresholds

```javascript
// Standard
http_req_duration: ['p(95)<2000', 'p(99)<5000']
http_req_failed: ['rate<0.01']  // < 1%

// Strict (Auth)
http_req_duration: ['p(95)<1000', 'p(99)<2000']
http_req_failed: ['rate<0.005']  // < 0.5%
```

## Troubleshooting

```bash
# Check services
curl http://localhost:4003/health

# Test connectivity
k6 run --vus 1 --duration 10s tests/smoke-test.js

# Debug mode
k6 run --http-debug tests/load-test.js

# Verbose logs
k6 run --log-output=stdout tests/load-test.js
```

## Monitoring Stack

```bash
# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Grafana: http://localhost:3001 (admin/admin)
# InfluxDB: http://localhost:8086

# Run with metrics
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js
```

## CI/CD

```yaml
# GitHub Actions
- name: Load Test
  run: |
    npm run test:smoke
    npm run test:load
  working-directory: ./load-tests
```

## File Structure

```
load-tests/
├── config/          # Environments, thresholds, scenarios
├── tests/           # K6 test scripts
│   ├── api/        # API-specific tests
│   ├── smoke-test.js
│   ├── load-test.js
│   └── ...
├── utils/           # Helper functions
├── scripts/         # Analysis scripts
├── reports/         # Test results
└── README.md        # Full documentation
```

## Production Safety

✅ Always smoke test first
✅ Start with low VUs
✅ Monitor in real-time
✅ Have rollback plan
✅ Schedule during low traffic
✅ Notify team

## Support

- README.md - Full documentation
- QUICKSTART.md - 5-minute guide
- PERFORMANCE_BENCHMARKS.md - Targets & SLOs
- K6 Docs: https://k6.io/docs/
