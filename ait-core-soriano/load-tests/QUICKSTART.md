# Quick Start Guide - AIT-CORE Load Testing

Get started with load testing in 5 minutes!

## 1. Install K6

### Windows (PowerShell as Administrator)
```powershell
choco install k6
```

### macOS
```bash
brew install k6
```

### Linux
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 2. Configure Environment

```bash
cd C:\Users\rsori\codex\ait-core-soriano\load-tests
cp .env.example .env
```

Edit `.env`:
```env
API_GATEWAY_URL=http://localhost:4003
AUTH_SERVICE_URL=http://localhost:4001
```

## 3. Run Your First Test

### Smoke Test (1 minute)
```bash
npm run test:smoke
```

Expected output:
```
✓ gateway health: status is 200
✓ services: has service list
✓ metrics: has content

checks.........................: 100.00% ✓ 6       ✗ 0
data_received..................: 2.1 kB  35 B/s
data_sent......................: 420 B   7 B/s
http_req_duration..............: avg=45ms  min=12ms  med=32ms  max=156ms  p(95)=98ms
http_reqs......................: 6       0.1/s
```

## 4. Run Load Test (16 minutes)

```bash
npm run test:load
```

This test:
- Ramps up to 50 users
- Then to 100 users
- Tests authentication, gateway routing, data operations
- Generates detailed report

## 5. View Results

```bash
# View latest report
cat reports/load-test-summary.json

# Or open in editor
code reports/load-test-summary.json
```

## 6. Common Commands

```bash
# Quick smoke test
npm run test:smoke

# Full load test
npm run test:load

# Stress test (find breaking points)
npm run test:stress

# Authentication API test
npm run test:auth

# Gateway test
npm run test:gateway

# All tests
npm run test:all
```

## 7. Understanding Results

### Key Metrics

- **http_req_duration**: Response time
  - p(95) < 2000ms = Good
  - p(95) < 5000ms = Acceptable
  - p(95) > 5000ms = Needs improvement

- **http_req_failed**: Error rate
  - < 1% = Good
  - < 5% = Acceptable
  - > 5% = Critical

- **http_reqs**: Throughput
  - Higher is better
  - Compare across test runs

### Sample Good Results
```
http_req_duration..............: avg=250ms  p(95)=1500ms  p(99)=2800ms
http_req_failed................: 0.05%
http_reqs......................: 15000  250/s
```

### Sample Poor Results (Needs Investigation)
```
http_req_duration..............: avg=3500ms  p(95)=8500ms  p(99)=12000ms
http_req_failed................: 8.5%
http_reqs......................: 5000  83/s
```

## 8. What Tests Do

### Smoke Test
- Checks if all services are up
- Validates basic endpoints
- Takes 1 minute
- Use before any other tests

### Load Test
- Simulates normal user load
- Tests 50-100 concurrent users
- Includes authentication flows
- Takes 16 minutes

### Stress Test
- Pushes system to limits
- Tests up to 300 concurrent users
- Finds breaking points
- Takes 26 minutes

### Spike Test
- Sudden traffic spike
- 50 → 500 users instantly
- Tests recovery
- Takes 6 minutes

## 9. Next Steps

1. **Review Results**: Check `reports/` directory
2. **Run Benchmarks**: `npm run benchmark`
3. **Capacity Planning**: `npm run capacity`
4. **Production Test**: `npm run test:production` (be careful!)

## 10. Troubleshooting

### Services Not Running
```bash
# Check gateway
curl http://localhost:4003/health

# Check auth service
curl http://localhost:4001/api/v1/health
```

### K6 Not Found
```bash
# Verify installation
k6 version

# Reinstall if needed (Windows)
choco install k6 --force
```

### Connection Refused
```bash
# Update URLs in .env
API_GATEWAY_URL=http://localhost:4003  # Correct port?
```

### Rate Limit Errors
```bash
# Reduce VUs in test
k6 run --vus 10 tests/load-test.js
```

## Example Test Run

```bash
$ npm run test:smoke

> @ait-core/load-tests@1.0.0 test:smoke
> k6 run tests/smoke-test.js

          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: tests/smoke-test.js
     output: -

  scenarios: (100.00%) 1 scenario, 1 max VUs, 1m30s max duration
           * default: 1 iterations for each of 1 VUs (maxDuration: 1m30s)

running (00m01.2s), 0/1 VUs, 1 complete and 0 interrupted iterations
default ✓ [======================================] 1 VUs  00m01.2s/1m30s  1/1 iters

     ✓ gateway health: status is 200
     ✓ gateway health: success is true
     ✓ services: status is 200
     ✓ services: has service list
     ✓ metrics: status is 200
     ✓ metrics: has content

     checks.........................: 100.00% ✓ 6       ✗ 0
     data_received..................: 2.1 kB  1.8 kB/s
     data_sent......................: 420 B   349 B/s
     http_req_duration..............: avg=45ms  min=12ms  med=32ms  max=156ms  p(95)=98ms
     http_req_waiting...............: avg=44ms  min=11ms  med=31ms  max=155ms  p(95)=97ms
     http_reqs......................: 6       4.98/s
     iteration_duration.............: avg=1.2s  min=1.2s  med=1.2s  max=1.2s   p(95)=1.2s
     iterations.....................: 1       0.83/s
     vus............................: 1       min=1     max=1
     vus_max........................: 1       min=1     max=1
```

## Success!

You're now ready to load test your AIT-CORE system. Remember:

1. Start with smoke tests
2. Run load tests regularly
3. Monitor results over time
4. Use capacity planning to guide scaling decisions

Happy testing! 🚀
