# Rate Limiting Guide

This guide explains how rate limiting works in the AIT-CORE Soriano API and how to handle rate limits in your application.

## Table of Contents

1. [Overview](#overview)
2. [Rate Limit Tiers](#rate-limit-tiers)
3. [Rate Limit Headers](#rate-limit-headers)
4. [Endpoint-Specific Limits](#endpoint-specific-limits)
5. [Handling Rate Limits](#handling-rate-limits)
6. [Best Practices](#best-practices)
7. [Increasing Limits](#increasing-limits)

## Overview

Rate limiting protects the API from abuse and ensures fair usage across all clients. The AIT-CORE API implements multi-tier rate limiting with different strategies for various endpoints.

### How Rate Limiting Works

Rate limits are calculated based on:
- **IP Address**: For anonymous requests
- **User ID**: For authenticated requests
- **API Key**: For service-to-service authentication

### Rate Limit Windows

The API uses sliding window rate limiting across multiple time periods:
- **Short-term**: 1 second window
- **Medium-term**: 1 minute window
- **Long-term**: 1 hour window

All limits must be satisfied for a request to succeed.

## Rate Limit Tiers

### Anonymous Users

Users who are not authenticated are subject to the most restrictive limits:

| Time Window | Limit | Description |
|-------------|-------|-------------|
| 1 second | 2 requests | Burst protection |
| 1 minute | 30 requests | Per-minute limit |
| 1 hour | 100 requests | Hourly quota |

**Use Case**: Public endpoints, health checks, documentation

### Authenticated Users (Basic)

Standard authenticated users with free accounts:

| Time Window | Limit | Description |
|-------------|-------|-------------|
| 1 second | 10 requests | Burst protection |
| 1 minute | 100 requests | Per-minute limit |
| 1 hour | 1,000 requests | Hourly quota |

**Use Case**: Individual users, small applications

### Premium Users

Users with premium subscriptions:

| Time Window | Limit | Description |
|-------------|-------|-------------|
| 1 second | 20 requests | Burst protection |
| 1 minute | 300 requests | Per-minute limit |
| 1 hour | 10,000 requests | Hourly quota |

**Use Case**: Business users, medium applications

### Admin Users

System administrators and internal users:

| Time Window | Limit | Description |
|-------------|-------|-------------|
| 1 second | 50 requests | Burst protection |
| 1 minute | 500 requests | Per-minute limit |
| 1 hour | 20,000 requests | Hourly quota |

**Use Case**: Internal tools, admin dashboards

## Rate Limit Headers

Every API response includes rate limit information in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000060
X-RateLimit-Window: 60
```

### Header Descriptions

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum number of requests allowed in the current window |
| `X-RateLimit-Remaining` | Number of requests remaining in the current window |
| `X-RateLimit-Reset` | Unix timestamp when the rate limit resets |
| `X-RateLimit-Window` | Size of the rate limit window in seconds |

### Example Response

```bash
curl -i https://api.soriano.com/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

```http
HTTP/2 200 OK
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000060
X-RateLimit-Window: 60

{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com"
  }
}
```

## Endpoint-Specific Limits

Some endpoints have additional rate limits to prevent abuse:

### Authentication Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /auth/login` | 5 attempts | 15 minutes |
| `POST /auth/register` | 3 attempts | 1 hour |
| `POST /auth/refresh` | 10 attempts | 1 minute |
| `POST /auth/forgot-password` | 3 attempts | 1 hour |
| `POST /auth/reset-password` | 3 attempts | 1 hour |
| `POST /auth/verify-email` | 5 attempts | 10 minutes |

**Reason**: Prevent brute force attacks and account enumeration

### File Upload Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /documents/upload` | 50 uploads | 1 hour |
| `POST /documents/*/upload` | 50 uploads | 1 hour |

**Constraints**:
- Maximum file size: 10 MB per file
- Maximum 5 files per request

**Reason**: Prevent storage abuse and bandwidth exhaustion

### Search Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `GET /search` | 20 requests | 1 minute |
| `GET /*/search` | 20 requests | 1 minute |

**Reason**: Search operations are resource-intensive

### Export/Report Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /reports/generate` | 10 requests | 1 hour |
| `GET /reports/*/export` | 10 requests | 1 hour |
| `GET /*/export` | 10 requests | 1 hour |

**Reason**: Report generation is computationally expensive

### Payment Endpoints

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `POST /payments` | 3 attempts | 5 minutes |
| `POST /payments/*/process` | 3 attempts | 5 minutes |

**Reason**: Prevent payment fraud and accidental duplicate charges

### WebSocket Connections

| Action | Rate Limit | Window |
|--------|------------|--------|
| New connections | 5 connections | 1 minute |
| Messages sent | 10 messages | 1 second |
| Room joins | 10 joins | 1 minute |

**Reason**: Prevent WebSocket abuse and server overload

## Handling Rate Limits

### Rate Limit Exceeded Response

When you exceed a rate limit, you'll receive a 429 (Too Many Requests) response:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60,
    "limit": 100,
    "window": 60
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Retry-After Header

Rate limit responses include a `Retry-After` header indicating when you can retry:

```http
HTTP/2 429 Too Many Requests
Content-Type: application/json
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640000060
```

### Implementation Examples

#### JavaScript/TypeScript

```javascript
async function makeApiRequest(url, options = {}) {
  const response = await fetch(url, options);

  // Check rate limit headers
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = parseInt(response.headers.get('X-RateLimit-Reset'));

  // Warn when approaching limit
  if (remaining < 10) {
    console.warn(`Warning: Only ${remaining} requests remaining until ${new Date(reset * 1000)}`);
  }

  // Handle rate limit
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'));
    console.log(`Rate limited. Retrying after ${retryAfter} seconds`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return makeApiRequest(url, options);
  }

  return response;
}
```

#### Python

```python
import time
import requests

def make_api_request(url, headers=None):
    response = requests.get(url, headers=headers)

    # Check rate limit headers
    remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
    reset = int(response.headers.get('X-RateLimit-Reset', 0))

    # Warn when approaching limit
    if remaining < 10:
        reset_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(reset))
        print(f'Warning: Only {remaining} requests remaining until {reset_time}')

    # Handle rate limit
    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        print(f'Rate limited. Retrying after {retry_after} seconds')

        # Wait and retry
        time.sleep(retry_after)
        return make_api_request(url, headers)

    return response
```

#### PHP

```php
<?php
function makeApiRequest($url, $headers = []) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_HEADER, true);

    $response = curl_exec($ch);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    // Parse rate limit headers
    preg_match('/X-RateLimit-Remaining: (\d+)/', $header, $remaining);
    preg_match('/X-RateLimit-Reset: (\d+)/', $header, $reset);

    // Warn when approaching limit
    if (isset($remaining[1]) && $remaining[1] < 10) {
        error_log("Warning: Only {$remaining[1]} requests remaining");
    }

    // Handle rate limit
    if ($status === 429) {
        preg_match('/Retry-After: (\d+)/', $header, $retry);
        $retryAfter = isset($retry[1]) ? (int)$retry[1] : 60;

        error_log("Rate limited. Retrying after {$retryAfter} seconds");
        sleep($retryAfter);

        return makeApiRequest($url, $headers);
    }

    return json_decode($body, true);
}
?>
```

## Best Practices

### 1. Monitor Rate Limit Headers

Always check the rate limit headers to avoid hitting limits:

```javascript
function checkRateLimit(response) {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const limit = parseInt(response.headers.get('X-RateLimit-Limit'));

  // Implement adaptive throttling
  if (remaining < limit * 0.1) { // Less than 10% remaining
    // Slow down requests
    return true;
  }
  return false;
}
```

### 2. Implement Exponential Backoff

For rate limit errors, use exponential backoff instead of fixed delays:

```javascript
async function fetchWithBackoff(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s...
    const delay = Math.pow(2, i) * 1000;
    console.log(`Rate limited. Waiting ${delay}ms before retry ${i + 1}/${retries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Cache API Responses

Reduce API calls by caching responses:

```javascript
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function fetchWithCache(url, options = {}) {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, options);
  const data = await response.json();

  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });

  return data;
}
```

### 4. Batch Requests

Use bulk endpoints to reduce the number of API calls:

```javascript
// ❌ Bad: Multiple individual requests
for (const user of users) {
  await fetch(`/api/v1/users/${user.id}`, { method: 'DELETE' });
}

// ✅ Good: Single bulk request
await fetch('/api/v1/users/bulk/delete', {
  method: 'DELETE',
  body: JSON.stringify(users.map(u => u.id))
});
```

### 5. Use WebSockets for Real-Time Data

For real-time updates, use WebSockets instead of polling:

```javascript
// ❌ Bad: Polling every second
setInterval(async () => {
  const response = await fetch('/api/v1/notifications');
  const data = await response.json();
  updateUI(data);
}, 1000);

// ✅ Good: WebSocket connection
const ws = new WebSocket('wss://api.soriano.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateUI(data);
};
```

### 6. Request Only What You Need

Use query parameters to limit response size:

```javascript
// ❌ Bad: Fetch all data
const response = await fetch('/api/v1/users');

// ✅ Good: Fetch only what you need
const response = await fetch('/api/v1/users?page=1&limit=10&fields=id,email,firstName');
```

## Increasing Limits

### Temporary Limit Increases

For short-term needs (events, migrations), contact support@soriano.com with:
- Reason for increase
- Expected duration
- Estimated request volume

### Permanent Limit Increases

Consider upgrading your account:

| Plan | Monthly Cost | Requests/Hour | Features |
|------|--------------|---------------|----------|
| Free | €0 | 1,000 | Basic features |
| Basic | €49 | 10,000 | + Priority support |
| Premium | €199 | 50,000 | + Custom limits, SLA |
| Enterprise | Custom | Custom | + Dedicated support, custom SLA |

Contact sales@soriano.com for enterprise pricing.

### IP Whitelisting

Enterprise customers can request IP whitelisting to bypass rate limits for specific IPs. This is useful for:
- Internal tools
- CI/CD pipelines
- Monitoring systems

## Rate Limit Status Endpoint

Check your current rate limit status:

**Endpoint**: `GET /api/v1/rate-limit/status`

**Request**:
```bash
curl -X GET https://api.soriano.com/api/v1/rate-limit/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "limits": {
      "short": {
        "window": 1,
        "limit": 10,
        "remaining": 8,
        "reset": 1640000001
      },
      "medium": {
        "window": 60,
        "limit": 100,
        "remaining": 75,
        "reset": 1640000060
      },
      "long": {
        "window": 3600,
        "limit": 1000,
        "remaining": 823,
        "reset": 1640003600
      }
    },
    "tier": "authenticated",
    "userId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Troubleshooting

### Issue: Hitting Rate Limits Unexpectedly

**Possible Causes**:
- Multiple clients using the same API key
- Polling instead of using WebSockets
- Not caching responses
- Not using bulk endpoints

**Solutions**:
- Use unique API keys per client
- Switch to WebSockets for real-time data
- Implement response caching
- Use bulk endpoints

### Issue: Rate Limit Not Resetting

**Cause**: Using the wrong rate limit window

**Solution**: Check the `X-RateLimit-Reset` header for the exact reset time

### Issue: Different Rate Limits for Same User

**Cause**: Rate limits are calculated separately for different endpoints

**Solution**: Check endpoint-specific rate limits in this guide

## Next Steps

- [Authentication Guide](./authentication.md)
- [Error Handling Guide](./error-handling.md)
- [Best Practices](./best-practices.md)
- [API Reference](../openapi/openapi.yaml)

---

**Last Updated**: January 28, 2026
