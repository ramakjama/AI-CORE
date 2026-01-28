# AIT-CORE Load Testing Suite

Comprehensive K6-based load testing suite for AIT-CORE production APIs. This suite provides stress testing, performance benchmarks, and capacity planning data for all AIT-CORE services.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Configuration](#configuration)
- [Reports](#reports)
- [Production Testing](#production-testing)
- [Capacity Planning](#capacity-planning)
- [CI/CD Integration](#cicd-integration)

## Overview

This load testing suite includes:

- **Smoke Tests**: Quick validation that system works under minimal load
- **Load Tests**: Normal expected load scenarios
- **Stress Tests**: Beyond normal load to find breaking points
- **Spike Tests**: Sudden traffic spike scenarios
- **Soak Tests**: Extended duration tests for stability
- **API-Specific Tests**: Targeted tests for each service
- **Production Load Tests**: Realistic traffic pattern simulation
- **Comprehensive Tests**: Full system coverage

## Prerequisites

### Required Software

1. **K6** (v0.47.0 or higher)
   ```bash
   # Windows (using Chocolatey)
   choco install k6

   # macOS
   brew install k6

   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Node.js** (v18 or higher) - for benchmark and capacity planning scripts

### Optional Tools

- **InfluxDB**: For time-series metrics storage
- **Grafana**: For real-time test visualization
- **K6 Cloud**: For cloud-based load testing

## Installation

1. Clone the repository and navigate to load-tests:
   ```bash
   cd C:\Users\rsori\codex\ait-core-soriano\load-tests
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your target URLs:
   ```env
   API_GATEWAY_URL=http://localhost:4003
   AUTH_SERVICE_URL=http://localhost:4001
   DATAHUB_SERVICE_URL=http://localhost:4002
   ```

4. Install Node.js dependencies (for scripts):
   ```bash
   npm install
   ```

## Test Types

### 1. Smoke Test
Quick validation test with minimal load.

- **Duration**: 1 minute
- **VUs**: 1
- **Purpose**: Verify system is operational
- **Run**: `npm run test:smoke`

### 2. Load Test
Standard load testing with gradual ramp-up.

- **Duration**: 16 minutes
- **VUs**: 0 → 50 → 100 → 0
- **Purpose**: Test normal expected load
- **Run**: `npm run test:load`

### 3. Stress Test
Push system beyond normal capacity.

- **Duration**: 26 minutes
- **VUs**: 0 → 100 → 200 → 300 → 0
- **Purpose**: Find breaking points
- **Run**: `npm run test:stress`

### 4. Spike Test
Sudden traffic spike simulation.

- **Duration**: 6 minutes
- **VUs**: 50 → 500 (spike) → 50 → 0
- **Purpose**: Test system recovery
- **Run**: `npm run test:spike`

### 5. Soak Test
Extended duration stability test.

- **Duration**: 2+ hours
- **VUs**: 100 (sustained)
- **Purpose**: Detect memory leaks and degradation
- **Run**: `npm run test:soak`

### 6. API-Specific Tests

#### Authentication API Test
- **Run**: `npm run test:auth`
- **Focus**: Login, register, refresh, logout

#### Gateway Test
- **Run**: `npm run test:gateway`
- **Focus**: Routing, circuit breaker, rate limiting

#### DataHub Test
- **Run**: `npm run test:datahub`
- **Focus**: Data operations

### 7. Production Load Test
Realistic production traffic patterns.

- **Duration**: 30 minutes
- **VUs**: Dynamic (peak 150)
- **Purpose**: Production readiness
- **Run**: `npm run test:production`

### 8. Comprehensive Test
Full system coverage.

- **Duration**: 20 minutes
- **VUs**: 0 → 120 → 0
- **Purpose**: All services and endpoints
- **Run**: `npm run test:all`

## Running Tests

### Basic Usage

```bash
# Run a specific test
npm run test:load

# Run with custom environment
ENVIRONMENT=staging npm run test:load

# Run with output to file
npm run report
```

### Advanced K6 Usage

```bash
# Custom VUs and duration
k6 run --vus 50 --duration 5m tests/load-test.js

# With specific thresholds
k6 run --threshold http_req_duration=p(95)<2000 tests/load-test.js

# With tags
k6 run --tag testid=load001 tests/load-test.js

# With environment variables
k6 run -e API_GATEWAY_URL=https://api.staging.ait-core.com tests/load-test.js
```

### Output to InfluxDB

```bash
k6 run --out influxdb=http://localhost:8086/k6 tests/load-test.js
```

### K6 Cloud

```bash
k6 cloud tests/cloud-test.js
```

## Configuration

### Environment Variables

Edit `.env` file:

```env
# Target Environments
API_GATEWAY_URL=http://localhost:4003
AUTH_SERVICE_URL=http://localhost:4001
DATAHUB_SERVICE_URL=http://localhost:4002

# Test Configuration
TEST_DURATION=5m
VUS_MAX=100

# Thresholds
HTTP_REQ_DURATION_P95=2000
HTTP_REQ_FAILED_RATE=0.01
```

### Thresholds

Modify `config/thresholds.js`:

```javascript
export const thresholds = {
  standard: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.01'],
  },
};
```

### Scenarios

Modify `config/scenarios.js`:

```javascript
export const scenarios = {
  load: {
    executor: 'ramping-vus',
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 50 },
    ],
  },
};
```

## Reports

All test reports are saved to the `reports/` directory.

### Report Types

1. **JSON Reports**: Detailed metrics in JSON format
2. **Summary Reports**: Human-readable summaries
3. **Benchmark Reports**: Performance comparison data
4. **Capacity Reports**: Capacity planning analysis

### Reading Reports

```bash
# View latest load test report
cat reports/load-test-summary.json

# View capacity planning report
cat reports/capacity-planning-*.json
```

### Report Structure

```json
{
  "timestamp": "2026-01-28T10:00:00Z",
  "test_type": "load",
  "duration": "16m",
  "max_vus": 100,
  "results": {
    "total_requests": 15000,
    "avg_response_time": 250,
    "p95_response_time": 1500,
    "error_rate": 0.001
  }
}
```

## Production Testing

### Pre-Production Checklist

- [ ] Review production environment configuration
- [ ] Ensure monitoring is active (Grafana, logs)
- [ ] Have rollback plan ready
- [ ] Schedule during low-traffic window
- [ ] Notify team members
- [ ] Set up alerts for anomalies

### Running Production Tests

```bash
# Set production environment
export ENVIRONMENT=production
export PROD_API_GATEWAY_URL=https://api.ait-core.com

# Run production load test
npm run test:production

# Monitor in real-time (separate terminal)
watch -n 1 'tail -n 20 reports/production-load-test-summary.json'
```

### Production Test Guidelines

1. **Start Small**: Begin with smoke test
2. **Gradual Increase**: Slowly ramp up load
3. **Monitor Closely**: Watch metrics in real-time
4. **Stop Conditions**: Define when to stop test
5. **Post-Test Review**: Analyze results immediately

### Safety Measures

- Maximum VUs capped at safe levels
- Circuit breakers to prevent cascade failures
- Rate limiting respects production limits
- Automatic test termination on critical errors

## Capacity Planning

### Running Capacity Analysis

```bash
# Run benchmarks
npm run benchmark

# Generate capacity planning report
npm run capacity
```

### Interpreting Capacity Reports

The capacity planning script analyzes test results and provides:

1. **Capacity Score**: 0-100 rating
2. **Grade**: Excellent, Good, Fair, Poor, Critical
3. **Max Concurrent Users**: Estimated capacity
4. **Recommendations**: Actionable insights
5. **Breaking Points**: Where system fails

### Example Output

```
CAPACITY PLANNING REPORT
================================================================================
Overall Capacity:
  Score: 85/100
  Grade: Good
  Max Concurrent Users: 120
  Assessment: System is performing adequately. Consider scaling for peak loads.

Breaking Points:
  - At 300 VUs (stress-test-summary.json)
    Error Rate: 8.5%
    P95 Response Time: 5200ms

Recommendations:
  1. [High] Performance
     Issue: High response times detected
     Action: Optimize database queries, implement caching, or scale infrastructure
```

### Capacity Planning Metrics

- **Response Time Trends**: Detect performance degradation
- **Error Rate Patterns**: Identify failure thresholds
- **Throughput Analysis**: Requests per second capacity
- **Resource Utilization**: CPU, memory, network

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Smoke Test
        run: npm run test:smoke
        working-directory: ./load-tests

      - name: Run Load Test
        run: npm run test:load
        working-directory: ./load-tests

      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: load-test-reports
          path: load-tests/reports/
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any

    stages {
        stage('Setup') {
            steps {
                sh 'cd load-tests && npm install'
            }
        }

        stage('Smoke Test') {
            steps {
                sh 'cd load-tests && npm run test:smoke'
            }
        }

        stage('Load Test') {
            steps {
                sh 'cd load-tests && npm run test:load'
            }
        }

        stage('Capacity Planning') {
            steps {
                sh 'cd load-tests && npm run capacity'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'load-tests/reports/**/*.json'
        }
    }
}
```

## Best Practices

1. **Start Small**: Always run smoke test first
2. **Incremental Load**: Gradually increase VUs
3. **Monitor Resources**: Watch CPU, memory, disk I/O
4. **Document Results**: Keep historical data
5. **Regular Testing**: Schedule periodic tests
6. **Realistic Data**: Use production-like test data
7. **Think Time**: Include realistic user delays
8. **Error Analysis**: Investigate all failures
9. **Trend Analysis**: Compare results over time
10. **Team Communication**: Share findings

## Troubleshooting

### Common Issues

**Issue**: "Connection refused"
```bash
# Check if services are running
curl http://localhost:4003/health
```

**Issue**: "Rate limit exceeded"
```bash
# Reduce VUs or increase rate limit window
# Edit .env: RATE_LIMIT_MAX_REQUESTS=2000
```

**Issue**: "Out of memory"
```bash
# Reduce VUs or split tests
k6 run --vus 50 tests/load-test.js
```

### Debug Mode

```bash
# Run with verbose logging
k6 run --log-output=stdout tests/load-test.js

# Run with HTTP debug
k6 run --http-debug tests/load-test.js
```

## Support

For issues or questions:

- Check documentation in `docs/`
- Review test examples in `tests/`
- Consult K6 documentation: https://k6.io/docs/

## License

MIT - AIT-CORE Team
