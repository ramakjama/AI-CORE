# AIT-NERVE API Documentation

## Base URL
```
http://localhost:3000/api/v1/nerve
```

## Authentication
Currently optional. When enabled:
```
Authorization: Bearer <JWT_TOKEN>
X-API-Key: <API_KEY>
```

---

## Engine Management

### List All Engines
Get a list of all configured engines.

```http
GET /engines
Query Parameters:
  - enabled: boolean (optional) - Filter by enabled status
```

**Response:**
```json
[
  {
    "id": "statistical-engine",
    "name": "Statistical Engine",
    "type": "statistical",
    "enabled": true,
    "currentInstances": 2,
    "maxInstances": 3,
    "minInstances": 1
  }
]
```

### Get Engine Details
Get detailed information about a specific engine.

```http
GET /engines/:engineId
```

**Response:**
```json
{
  "id": "statistical-engine",
  "name": "Statistical Engine",
  "type": "statistical",
  "url": "http://localhost:8001",
  "version": "1.0.0",
  "enabled": true,
  "currentInstances": 2,
  "instances": [
    {
      "id": "statistical-engine-1",
      "status": "running",
      "healthy": true,
      "uptime": 3600000,
      "metrics": {
        "requestsTotal": 150,
        "requestsSuccess": 145,
        "requestsFailed": 5,
        "averageResponseTime": 234
      }
    }
  ]
}
```

### Start Engine
Start an engine with optional instance count.

```http
POST /engines/:engineId/start
Content-Type: application/json

{
  "instances": 2  // Optional, defaults to minInstances
}
```

**Response:**
```json
{
  "success": true,
  "message": "Engine statistical-engine started"
}
```

### Stop Engine
Stop all instances of an engine.

```http
POST /engines/:engineId/stop
```

**Response:**
```json
{
  "success": true,
  "message": "Engine statistical-engine stopped"
}
```

### Restart Engine
Restart an engine (stops then starts).

```http
POST /engines/:engineId/restart
```

**Response:**
```json
{
  "success": true,
  "message": "Engine statistical-engine restarted"
}
```

### Scale Engine
Scale an engine to a target number of instances.

```http
PUT /engines/:engineId/scale
Content-Type: application/json

{
  "targetInstances": 5,
  "reason": "high-load"  // Optional
}
```

**Response:**
```json
{
  "engineId": "statistical-engine",
  "previousInstances": 2,
  "currentInstances": 5,
  "targetInstances": 5,
  "status": "success"
}
```

---

## Execution

### Execute on Specific Engine
Execute an operation on a specific engine.

```http
POST /execute/:engineId
Content-Type: application/json

{
  "operation": "descriptive_stats",
  "parameters": {
    "data": [1, 2, 3, 4, 5],
    "include_median": true
  },
  "priority": 1,  // Optional
  "timeout": 60000,  // Optional
  "retryOnFailure": true,  // Optional
  "metadata": {}  // Optional
}
```

**Response:**
```json
{
  "requestId": "req_1706432100_abc123",
  "engineId": "statistical-engine",
  "engineInstance": "statistical-engine-1",
  "status": "success",
  "result": {
    "mean": 3,
    "median": 3,
    "std": 1.41,
    "min": 1,
    "max": 5
  },
  "executionTime": 234,
  "timestamp": "2024-01-28T10:30:00.000Z"
}
```

### Auto-Route Execution
Let AIT-NERVE automatically select the best engine.

```http
POST /execute/auto
Content-Type: application/json

{
  "engineType": "statistical",  // Optional
  "operation": "descriptive_stats",
  "parameters": {
    "data": [1, 2, 3, 4, 5]
  }
}
```

**Response:** Same as execute on specific engine

### Batch Execution
Execute multiple operations in batch.

```http
POST /batch
Content-Type: application/json

{
  "requests": [
    {
      "engineId": "statistical-engine",
      "operation": "descriptive_stats",
      "parameters": { "data": [1, 2, 3] }
    },
    {
      "engineId": "financial-engine",
      "operation": "calculate_npv",
      "parameters": { "cash_flows": [100, 200, 300], "rate": 0.1 }
    }
  ],
  "parallel": true,  // Execute in parallel
  "failFast": false,  // Stop on first error
  "timeout": 120000  // Overall timeout
}
```

**Response:**
```json
{
  "batchId": "batch_1706432100",
  "totalRequests": 2,
  "successCount": 2,
  "failureCount": 0,
  "results": [
    { /* execution result 1 */ },
    { /* execution result 2 */ }
  ],
  "executionTime": 456,
  "timestamp": "2024-01-28T10:30:00.000Z"
}
```

---

## Health & Monitoring

### System Health
Get overall system health status.

```http
GET /health
```

**Response:**
```json
{
  "healthy": true,
  "totalEngines": 23,
  "healthyEngines": 21,
  "unhealthyEngines": 2,
  "totalInstances": 45,
  "healthyInstances": 43,
  "unhealthyInstances": 2,
  "engines": [
    {
      "engineId": "statistical-engine",
      "healthy": true,
      "instanceCount": 2
    }
  ]
}
```

### Engine Health
Get health status for specific engine.

```http
GET /health/:engineId
```

**Response:**
```json
{
  "engineId": "statistical-engine",
  "overallHealth": true,
  "instances": [
    {
      "instanceId": "statistical-engine-1",
      "health": {
        "healthy": true,
        "status": "running",
        "uptime": 3600000,
        "lastCheck": "2024-01-28T10:30:00.000Z",
        "responseTime": 234,
        "errorRate": 0.03
      }
    }
  ]
}
```

### Performance Metrics
Get comprehensive performance metrics.

```http
GET /metrics
```

**Response:**
```json
{
  "timestamp": "2024-01-28T10:30:00.000Z",
  "system": {
    "healthy": true,
    "totalEngines": 23,
    "healthyEngines": 21,
    "totalInstances": 45,
    "healthyInstances": 43
  },
  "routing": {
    "totalRequests": 10000,
    "successfulRequests": 9750,
    "failedRequests": 250,
    "averageResponseTime": 345
  },
  "failover": {
    "totalFailovers": 12,
    "circuitBreakersOpen": 2,
    "circuitBreakersClosed": 21
  },
  "engines": [ /* per-engine metrics */ ]
}
```

### Metrics Summary
Get high-level metrics summary.

```http
GET /metrics/summary
```

**Response:**
```json
{
  "uptime": 3600000,
  "totalRequests": 10000,
  "successRate": 97.5,
  "averageResponseTime": 345,
  "healthyEngines": 21,
  "totalEngines": 23,
  "activeInstances": 43,
  "circuitBreakersOpen": 2
}
```

### Engine Metrics
Get metrics for specific engine.

```http
GET /metrics/:engineId
```

### Prometheus Metrics
Get Prometheus-formatted metrics.

```http
GET /metrics/prometheus
```

**Response:** Prometheus metrics format

---

## Circuit Breakers

### Get All Circuit Breakers
Get state of all circuit breakers.

```http
GET /circuit-breakers
```

**Response:**
```json
[
  {
    "engineId": "statistical-engine",
    "state": "closed",
    "failureCount": 0,
    "successCount": 150,
    "lastFailure": null,
    "nextRetry": null
  }
]
```

### Get Circuit Breaker State
Get circuit breaker state for specific engine.

```http
GET /circuit-breakers/:engineId
```

### Reset Circuit Breaker
Manually reset a circuit breaker.

```http
POST /circuit-breakers/:engineId/reset
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit breaker for statistical-engine reset"
}
```

---

## Configuration

### Get System Configuration
Get current system configuration.

```http
GET /config
```

**Response:**
```json
{
  "engines": [
    {
      "id": "statistical-engine",
      "name": "Statistical Engine",
      "type": "statistical",
      "enabled": true,
      "maxInstances": 3,
      "minInstances": 1
    }
  ]
}
```

### Get Engine Configuration
Get configuration for specific engine.

```http
GET /config/:engineId
```

### Update Engine Configuration
Update engine configuration (runtime changes).

```http
PUT /config/:engineId
Content-Type: application/json

{
  "enabled": true,
  "maxInstances": 5,
  "timeout": 90000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Configuration for statistical-engine updated"
}
```

---

## Statistics

### Get System Statistics
Get comprehensive system statistics.

```http
GET /stats
```

**Response:**
```json
{
  "routing": {
    "totalRequests": 10000,
    "successfulRequests": 9750,
    "failedRequests": 250,
    "averageResponseTime": 345,
    "requestsByEngine": {
      "statistical-engine": 3000,
      "financial-engine": 2500
    }
  },
  "failover": {
    "totalFailovers": 12,
    "circuitBreakersOpen": 2,
    "engineFailures": {
      "statistical-engine": 5,
      "economic-engine": 7
    }
  },
  "health": {
    "averageResponseTime": 345,
    "averageErrorRate": 0.025,
    "averageUptime": 3600000,
    "instancesByStatus": {
      "running": 43,
      "unhealthy": 2,
      "stopped": 0
    }
  }
}
```

---

## Alerting

### Get All Alerts
Get list of system alerts.

```http
GET /alerts
Query Parameters:
  - severity: info|warning|error|critical
  - acknowledged: boolean
  - engineId: string
  - limit: number
```

**Response:**
```json
[
  {
    "id": "alert_123",
    "timestamp": "2024-01-28T10:30:00.000Z",
    "severity": "warning",
    "type": "high-error-rate",
    "message": "High error rate detected for engine statistical-engine",
    "details": {},
    "engineId": "statistical-engine",
    "acknowledged": false
  }
]
```

### Get Alert Statistics
Get alert statistics and summary.

```http
GET /alerts/stats
```

**Response:**
```json
{
  "total": 45,
  "bySeverity": {
    "info": 20,
    "warning": 15,
    "error": 8,
    "critical": 2
  },
  "acknowledged": 30,
  "unacknowledged": 15,
  "last24Hours": 10
}
```

### Acknowledge Alert
Mark an alert as acknowledged.

```http
POST /alerts/:alertId/acknowledge
Content-Type: application/json

{
  "acknowledgedBy": "admin"
}
```

---

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const socket = io('http://localhost:3000/nerve');

// Subscribe to events
socket.emit('subscribe-metrics', { enable: true });
socket.emit('subscribe-health', { enable: true });
socket.emit('subscribe-engine', {
  engineId: 'statistical-engine',
  enable: true
});

// Listen for updates
socket.on('metrics', (data) => { /* handle metrics */ });
socket.on('health', (data) => { /* handle health */ });
socket.on('engine-event', (event) => { /* handle event */ });
```

### Available WebSocket Events

**Client → Server:**
- `subscribe-metrics` - Subscribe to metrics updates
- `subscribe-health` - Subscribe to health updates
- `subscribe-engine` - Subscribe to engine-specific events
- `get-engine-status` - Get engine status
- `get-system-metrics` - Get current metrics
- `start-engine` - Start engine
- `stop-engine` - Stop engine
- `restart-engine` - Restart engine
- `scale-engine` - Scale engine
- `reset-circuit-breaker` - Reset circuit breaker

**Server → Client:**
- `initial-state` - Initial state on connection
- `metrics` - Metrics updates (every 5s)
- `health` - Health updates (every 10s)
- `engine-event` - Engine lifecycle events

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message description",
  "statusCode": 400,
  "timestamp": "2024-01-28T10:30:00.000Z"
}
```

### Common Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

Default rate limits:
- 100 requests per minute per IP
- Burst allowance: 20 requests

Response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706432160
```

---

## SDK Examples

### Node.js / TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3000/api/v1/nerve',
  timeout: 30000,
});

// Execute operation
const result = await client.post('/execute/statistical-engine', {
  operation: 'descriptive_stats',
  parameters: { data: [1, 2, 3, 4, 5] }
});

// Check health
const health = await client.get('/health');
```

### Python

```python
import requests

BASE_URL = 'http://localhost:3000/api/v1/nerve'

# Execute operation
response = requests.post(
    f'{BASE_URL}/execute/statistical-engine',
    json={
        'operation': 'descriptive_stats',
        'parameters': {'data': [1, 2, 3, 4, 5]}
    }
)
result = response.json()
```

### cURL

```bash
# Execute operation
curl -X POST http://localhost:3000/api/v1/nerve/execute/statistical-engine \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "descriptive_stats",
    "parameters": {"data": [1,2,3,4,5]}
  }'

# Check health
curl http://localhost:3000/api/v1/nerve/health
```

---

For complete API documentation with interactive examples, visit:
**http://localhost:3000/api/v1/docs** (Swagger UI)
