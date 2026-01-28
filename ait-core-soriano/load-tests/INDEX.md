# AIT-CORE Load Testing Suite - File Index

Complete index of all files in the load testing suite.

## Quick Navigation

- [Installation](#installation)
- [Documentation](#documentation)
- [Configuration](#configuration)
- [Tests](#tests)
- [Utilities](#utilities)
- [Scripts](#scripts)
- [Reports](#reports)

---

## Installation

### install.sh
**Path**: `./install.sh`
**Purpose**: Automated installation and setup script
**Usage**: `bash install.sh`

Quick setup of the entire load testing environment including:
- K6 verification
- Environment configuration
- Directory creation
- Initial smoke test

---

## Documentation

### README.md
**Path**: `./README.md`
**Purpose**: Comprehensive documentation
**Topics**:
- Overview and architecture
- Installation instructions
- Test types and usage
- Configuration guide
- Production testing guidelines
- CI/CD integration
- Troubleshooting

### QUICKSTART.md
**Path**: `./QUICKSTART.md`
**Purpose**: 5-minute quick start guide
**Topics**:
- Install K6
- Basic configuration
- First test run
- Common commands
- Understanding results

### QUICK_REFERENCE.md
**Path**: `./QUICK_REFERENCE.md`
**Purpose**: One-page reference card
**Topics**:
- Command cheat sheet
- Key metrics
- Performance targets
- Common issues

### PERFORMANCE_BENCHMARKS.md
**Path**: `./PERFORMANCE_BENCHMARKS.md`
**Purpose**: Performance targets and SLOs
**Topics**:
- Service Level Objectives
- Capacity benchmarks
- Infrastructure requirements
- Historical results
- Optimization recommendations

### LOAD_TEST_SUMMARY.md
**Path**: `./LOAD_TEST_SUMMARY.md`
**Purpose**: Implementation summary
**Topics**:
- File overview
- Test coverage
- Features
- Usage examples
- Best practices

---

## Configuration

### package.json
**Path**: `./package.json`
**Purpose**: NPM configuration and scripts
**Scripts**:
- `test:smoke` - Smoke test
- `test:load` - Load test
- `test:stress` - Stress test
- `test:spike` - Spike test
- `test:soak` - Soak test
- `test:auth` - Auth API test
- `test:gateway` - Gateway test
- `test:production` - Production load test
- `test:all` - Comprehensive test
- `benchmark` - Run benchmarks
- `capacity` - Capacity planning

### .env.example
**Path**: `./.env.example`
**Purpose**: Environment configuration template
**Variables**:
- API endpoint URLs
- Test configuration
- Threshold values
- Rate limiting settings

### .gitignore
**Path**: `./.gitignore`
**Purpose**: Git ignore rules
**Excludes**:
- Environment files (.env)
- Reports (*.json)
- Node modules
- Logs

### docker-compose.monitoring.yml
**Path**: `./docker-compose.monitoring.yml`
**Purpose**: Optional monitoring stack
**Services**:
- InfluxDB (metrics storage)
- Grafana (visualization)
- Prometheus (metrics collection)

---

## Configuration Modules

### config/environments.js
**Path**: `./config/environments.js`
**Purpose**: Environment configurations
**Environments**:
- Development
- Staging
- Production

Each environment includes:
- Base URL
- Service URLs
- Configuration overrides

### config/thresholds.js
**Path**: `./config/thresholds.js`
**Purpose**: Performance threshold definitions
**Types**:
- Standard thresholds
- Strict thresholds (auth)
- Relaxed thresholds (heavy ops)
- Database operation thresholds
- Document operation thresholds

### config/scenarios.js
**Path**: `./config/scenarios.js`
**Purpose**: Load test scenario definitions
**Scenarios**:
- Smoke test (minimal)
- Load test (normal)
- Stress test (beyond normal)
- Spike test (sudden spike)
- Soak test (sustained)
- Breakpoint test (find limits)
- Production load test (realistic)
- Capacity planning (incremental)

---

## Tests

### Core Load Tests

#### tests/smoke-test.js
**Duration**: 1 minute
**VUs**: 1
**Purpose**: Quick validation that system works
**Checks**:
- Gateway health
- Service discovery
- Metrics endpoint

#### tests/load-test.js
**Duration**: 16 minutes
**VUs**: 0 → 50 → 100 → 0
**Purpose**: Normal expected load testing
**Flows**:
- Authentication flow
- User operations
- Gateway operations
- Data operations

#### tests/stress-test.js
**Duration**: 26 minutes
**VUs**: 0 → 100 → 200 → 300 → 0
**Purpose**: Find system breaking points
**Focus**:
- High-load authentication
- Concurrent operations
- High-frequency requests
- Error tolerance

#### tests/spike-test.js
**Duration**: 6 minutes
**VUs**: 50 → 500 (spike) → 50 → 0
**Purpose**: Sudden traffic spike simulation
**Metrics**:
- Spike error rate
- Circuit breaker trips
- Recovery time

#### tests/soak-test.js
**Duration**: 2+ hours
**VUs**: 100 (sustained)
**Purpose**: Extended stability testing
**Monitoring**:
- Memory leak detection
- Performance degradation
- Long-term stability

### Specialized Tests

#### tests/production-load-test.js
**Duration**: 30 minutes
**VUs**: Dynamic (peak 150)
**Purpose**: Realistic production traffic patterns
**Journeys**:
- Browser journey (60%)
- Transaction journey (30%)
- Power user journey (10%)
**Metrics**:
- User journey success
- Business transaction success
- SLA compliance

#### tests/comprehensive-test.js
**Duration**: 20 minutes
**VUs**: 0 → 120 → 0
**Purpose**: Full system coverage
**Coverage**:
- All services
- All endpoints
- Health checks
- Authenticated operations
- Gateway routing

### API-Specific Tests

#### tests/api/auth-api-test.js
**Duration**: 10 minutes
**VUs**: 0 → 100 → 0
**Purpose**: Authentication service testing
**Endpoints**:
- Register
- Login
- Token refresh
- Get current user
- Logout
**Metrics**:
- Login success rate
- Register success rate
- Token refresh success rate
- Rate limit hits

#### tests/api/gateway-test.js
**Duration**: 10 minutes
**VUs**: 0 → 200 → 0
**Purpose**: API Gateway functionality
**Tests**:
- Health checks
- Readiness checks
- Service discovery
- Routing (auth service)
- Routing (datahub service)
- Rate limiting
- Circuit breaker
- Metrics endpoint
**Metrics**:
- Routing success rate
- Circuit breaker trips
- Service availability

---

## Utilities

### utils/helpers.js
**Path**: `./utils/helpers.js`
**Purpose**: Common testing utilities
**Functions**:
- `randomString()` - Generate random strings
- `randomEmail()` - Generate test emails
- `randomInt()` - Random integers
- `getAuthHeaders()` - Auth header formatter
- `getStandardHeaders()` - Standard headers
- `checkResponse()` - Response validation
- `checkAuthResponse()` - Auth response validation
- `extractToken()` - Token extraction
- `thinkTime()` - User think time simulation
- `createTestUser()` - Test user data
- `createTestDocument()` - Test document data
- `createTestNotification()` - Test notification data
- `weightedChoice()` - Weighted random selection
- `simulateUserBehavior()` - User behavior patterns

**Custom Metrics**:
- errorRate
- apiDuration
- requestCount

### utils/auth.js
**Path**: `./utils/auth.js`
**Purpose**: Authentication utilities
**Functions**:
- `registerUser()` - Register new user
- `loginUser()` - Login and get response
- `getAuthToken()` - Get JWT token
- `refreshToken()` - Refresh authentication
- `logoutUser()` - User logout
- `getCurrentUser()` - Get user profile
- `setupAuth()` - Setup test authentication

---

## Scripts

### scripts/run-benchmarks.js
**Path**: `./scripts/run-benchmarks.js`
**Purpose**: Performance benchmark runner
**Usage**: `npm run benchmark`
**Features**:
- Runs multiple benchmark tests
- Generates comparison reports
- Tracks performance over time
- Identifies regressions

**Benchmarks**:
- Auth Service Benchmark (5m, 50 VUs)
- Gateway Benchmark (5m, 100 VUs)
- Load Test Benchmark (10m, 100 VUs)

### scripts/capacity-planning.js
**Path**: `./scripts/capacity-planning.js`
**Purpose**: Capacity analysis and planning
**Usage**: `npm run capacity`
**Analysis**:
- Capacity score (0-100)
- Performance grade
- Max concurrent users
- Breaking point detection
- Scaling recommendations

**Output**:
- Capacity metrics
- Breaking points
- Recommendations
- Overall assessment

### scripts/run-all-tests.sh
**Path**: `./scripts/run-all-tests.sh`
**Purpose**: Complete test suite runner
**Usage**: `bash scripts/run-all-tests.sh [environment]`
**Features**:
- Interactive test selection
- Progress tracking
- Summary reporting
- Automatic capacity analysis

**Tests**:
1. Smoke Test (always runs)
2. Auth API Test (optional)
3. Gateway Test (optional)
4. Load Test (optional)
5. Stress Test (optional)
6. Spike Test (optional)
7. Comprehensive Test (optional)
8. Soak Test (optional, 2h+)

---

## Reports

### reports/.gitkeep
**Path**: `./reports/.gitkeep`
**Purpose**: Preserve reports directory in git

Reports generated by tests are saved here in JSON format:
- `smoke-test-summary.json`
- `load-test-summary.json`
- `stress-test-summary.json`
- `spike-test-summary.json`
- `soak-test-summary.json`
- `auth-api-test-summary.json`
- `gateway-test-summary.json`
- `production-load-test-summary.json`
- `comprehensive-test-summary.json`
- `capacity-planning-*.json`
- `benchmark-report-*.json`

---

## File Statistics

**Total Files**: 27
- Documentation: 6
- Configuration: 4
- Core Tests: 5
- API Tests: 2
- Specialized Tests: 2
- Utilities: 2
- Scripts: 3
- Setup: 3

**Total Lines of Code**: ~5,000+
- JavaScript/K6: ~3,500
- Documentation: ~1,500

---

## File Dependencies

```
Root
├── Configuration
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   └── docker-compose.monitoring.yml
│
├── Config Modules
│   ├── config/environments.js
│   ├── config/thresholds.js
│   └── config/scenarios.js
│
├── Utilities (used by all tests)
│   ├── utils/helpers.js
│   └── utils/auth.js
│
├── Tests (depend on config + utils)
│   ├── tests/smoke-test.js
│   ├── tests/load-test.js
│   ├── tests/stress-test.js
│   ├── tests/spike-test.js
│   ├── tests/soak-test.js
│   ├── tests/production-load-test.js
│   ├── tests/comprehensive-test.js
│   ├── tests/api/auth-api-test.js
│   └── tests/api/gateway-test.js
│
├── Scripts (depend on reports)
│   ├── scripts/run-benchmarks.js
│   ├── scripts/capacity-planning.js
│   └── scripts/run-all-tests.sh
│
└── Reports (generated by tests)
    └── reports/
```

---

## Quick File Access

**Need to run a test?**
→ See `package.json` scripts or `tests/` directory

**Need to configure?**
→ Edit `.env` or check `config/` directory

**Need documentation?**
→ Start with `README.md` or `QUICKSTART.md`

**Need performance targets?**
→ See `PERFORMANCE_BENCHMARKS.md`

**Need analysis?**
→ Run `scripts/capacity-planning.js`

**Need to understand structure?**
→ This file (INDEX.md)

---

## Next Steps

1. **First Time Setup**: Run `install.sh`
2. **Quick Start**: Read `QUICKSTART.md`
3. **Full Documentation**: Read `README.md`
4. **Run First Test**: `npm run test:smoke`
5. **View Results**: `cat reports/smoke-test-summary.json`

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
