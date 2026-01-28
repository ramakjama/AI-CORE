# API Best Practices

This guide provides best practices for integrating with the AIT-CORE Soriano API efficiently and reliably.

## Table of Contents

1. [Performance Optimization](#performance-optimization)
2. [Security](#security)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Data Management](#data-management)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Testing](#testing)

## Performance Optimization

### 1. Use Pagination

Always use pagination for list endpoints to reduce response size and improve performance:

```javascript
// Bad: Fetch all users at once
const response = await fetch('/api/v1/users');
const users = await response.json();

// Good: Use pagination
async function getAllUsers() {
  const users = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(`/api/v1/users?page=${page}&limit=100`);
    const data = await response.json();

    users.push(...data.data);
    hasMore = data.meta.page < data.meta.totalPages;
    page++;
  }

  return users;
}
```

### 2. Request Only Needed Fields

Use field selection to reduce payload size:

```javascript
// Bad: Fetch all fields
const response = await fetch('/api/v1/users/123');

// Good: Request only needed fields
const response = await fetch('/api/v1/users/123?fields=id,email,firstName,lastName');
```

### 3. Implement Caching

Cache API responses to reduce redundant requests:

```javascript
class ApiCache {
  constructor(ttl = 60000) { // 1 minute default
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key, fetcher) {
    const cached = this.cache.get(key);

    // Check if cached and not expired
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new ApiCache(300000); // 5 minutes

async function getUser(userId) {
  return cache.get(`user_${userId}`, async () => {
    const response = await fetch(`/api/v1/users/${userId}`);
    return response.json();
  });
}
```

### 4. Use Bulk Operations

Prefer bulk endpoints over multiple individual requests:

```javascript
// Bad: Multiple individual requests
for (const userId of userIds) {
  await fetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
}

// Good: Single bulk request
await fetch('/api/v1/users/bulk/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userIds)
});
```

### 5. Use WebSockets for Real-Time Data

For real-time updates, use WebSockets instead of polling:

```javascript
// Bad: Polling every second
setInterval(async () => {
  const response = await fetch('/api/v1/notifications');
  const notifications = await response.json();
  updateUI(notifications);
}, 1000);

// Good: WebSocket connection
const ws = new WebSocket('wss://api.soriano.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'notifications',
    userId: currentUserId
  }));
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  updateUI(notification);
};
```

### 6. Compress Requests

Enable compression for large payloads:

```javascript
async function makeCompressedRequest(url, data) {
  const compressed = await compressData(JSON.stringify(data));

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Encoding': 'gzip'
    },
    body: compressed
  });
}
```

### 7. Use HTTP/2

HTTP/2 provides better performance through multiplexing. Ensure your client supports it.

## Security

### 1. Store Tokens Securely

```javascript
// Bad: Store in localStorage (XSS vulnerable)
localStorage.setItem('accessToken', token);

// Good: Store in memory or HTTP-only cookies
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    // Refresh token stored in HTTP-only cookie by server
  }

  getAccessToken() {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
```

### 2. Always Use HTTPS

```javascript
// Ensure all API calls use HTTPS
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.soriano.com'
  : 'http://localhost:3000';
```

### 3. Validate Input

Always validate and sanitize user input before sending to API:

```javascript
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

async function createUser(userData) {
  // Validate
  if (!validateEmail(userData.email)) {
    throw new Error('Invalid email format');
  }

  // Sanitize
  const sanitized = {
    email: sanitizeInput(userData.email),
    firstName: sanitizeInput(userData.firstName),
    lastName: sanitizeInput(userData.lastName)
  };

  return fetch('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(sanitized)
  });
}
```

### 4. Implement CSRF Protection

For web applications, implement CSRF token validation:

```javascript
// Get CSRF token from meta tag or cookie
function getCsrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.content;
}

// Include in requests
async function makeSecureRequest(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': getCsrfToken()
    }
  });
}
```

### 5. Don't Log Sensitive Data

```javascript
// Bad: Log entire request/response
console.log('Request:', request);
console.log('Response:', response);

// Good: Log only necessary information
console.log('Request ID:', response.meta.requestId);
console.log('Status:', response.success);
```

## Error Handling

### 1. Implement Comprehensive Error Handling

```javascript
class ApiClient {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      // Handle HTTP errors
      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error);
      }

      return response.json();

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }

      // Handle timeout
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }

      throw error;
    }
  }
}
```

### 2. Implement Retry Logic with Exponential Backoff

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      // Don't retry on client errors
      if (error.code && !error.code.startsWith('SYSTEM_')) {
        throw error;
      }

      // Last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. Handle Token Expiration

```javascript
class ApiClient {
  async request(url, options = {}) {
    try {
      return await this._makeRequest(url, options);
    } catch (error) {
      // Token expired, refresh and retry once
      if (error.code === 'AUTH_TOKEN_EXPIRED' && !options.isRetry) {
        await this.refreshToken();
        return this._makeRequest(url, { ...options, isRetry: true });
      }
      throw error;
    }
  }

  async refreshToken() {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.accessToken;
    } else {
      // Refresh failed, redirect to login
      this.logout();
    }
  }
}
```

## Rate Limiting

### 1. Monitor Rate Limit Headers

```javascript
async function makeApiRequest(url, options = {}) {
  const response = await fetch(url, options);

  // Check rate limit headers
  const limit = parseInt(response.headers.get('X-RateLimit-Limit'));
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
  const reset = parseInt(response.headers.get('X-RateLimit-Reset'));

  // Warn when approaching limit
  if (remaining < limit * 0.1) {
    console.warn(`Rate limit warning: ${remaining}/${limit} requests remaining`);
  }

  // Handle rate limit
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'));
    throw new RateLimitError(retryAfter);
  }

  return response;
}
```

### 2. Implement Request Throttling

```javascript
class RequestThrottler {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.queue = [];
    this.processing = false;
  }

  async throttle(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const now = Date.now();

    // Remove old requests
    this.requests = (this.requests || []).filter(
      time => now - time < this.windowMs
    );

    // Process if under limit
    if (this.requests.length < this.maxRequests) {
      const { request, resolve, reject } = this.queue.shift();
      this.requests.push(now);

      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.processing = false;

    // Process next
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }
}

// Usage
const throttler = new RequestThrottler(100, 60000); // 100 req/min

async function makeThrottledRequest(url) {
  return throttler.throttle(() => fetch(url));
}
```

## Data Management

### 1. Use Appropriate Data Types

```javascript
// Bad: Send numbers as strings
{
  "amount": "1200.50",
  "quantity": "5"
}

// Good: Use correct types
{
  "amount": 1200.50,
  "quantity": 5
}
```

### 2. Handle Null Values Properly

```javascript
// Bad: Send empty strings for null
{
  "middleName": "",
  "phone": ""
}

// Good: Use null for missing optional fields
{
  "middleName": null,
  "phone": null
}
```

### 3. Use ISO 8601 for Dates

```javascript
// Bad: Various date formats
{
  "startDate": "01/28/2024",
  "endDate": "28-01-2024"
}

// Good: ISO 8601
{
  "startDate": "2024-01-28T00:00:00Z",
  "endDate": "2024-01-28T23:59:59Z"
}
```

### 4. Implement Data Validation

```javascript
class DataValidator {
  static validateUser(user) {
    const errors = [];

    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push({ field: 'email', message: 'Invalid email' });
    }

    if (!user.password || user.password.length < 8) {
      errors.push({ field: 'password', message: 'Password too short' });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return true;
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

## Monitoring & Debugging

### 1. Log Request IDs

```javascript
async function makeApiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  // Log request ID for debugging
  console.log(`Request ID: ${data.meta?.requestId}`);

  return data;
}
```

### 2. Implement Request Timing

```javascript
async function makeTimedRequest(url, options = {}) {
  const startTime = performance.now();

  try {
    const response = await fetch(url, options);
    const duration = performance.now() - startTime;

    console.log(`Request to ${url} took ${duration.toFixed(2)}ms`);

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Request to ${url} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}
```

### 3. Use Correlation IDs

```javascript
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function makeTrackedRequest(url, options = {}) {
  const correlationId = generateCorrelationId();

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-Correlation-ID': correlationId
    }
  });
}
```

### 4. Implement Error Tracking

```javascript
// Sentry integration
Sentry.init({ dsn: 'your-sentry-dsn' });

async function makeMonitoredRequest(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        endpoint: url,
        method: options.method || 'GET'
      },
      extra: {
        requestId: error.requestId,
        errorCode: error.code
      }
    });
    throw error;
  }
}
```

## Testing

### 1. Mock API Responses

```javascript
// Jest example
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/v1/users/:id', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: req.params.id,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2. Test Error Scenarios

```javascript
describe('API Error Handling', () => {
  it('should handle 404 errors', async () => {
    server.use(
      rest.get('/api/v1/users/:id', (req, res, ctx) => {
        return res(
          ctx.status(404),
          ctx.json({
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'User not found'
            }
          })
        );
      })
    );

    await expect(getUser('123')).rejects.toThrow('User not found');
  });
});
```

### 3. Test Rate Limiting

```javascript
it('should handle rate limiting', async () => {
  server.use(
    rest.get('/api/v1/users', (req, res, ctx) => {
      return res(
        ctx.status(429),
        ctx.set('Retry-After', '60'),
        ctx.json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests'
          }
        })
      );
    })
  );

  await expect(getUsers()).rejects.toThrow('Too many requests');
});
```

## Environment Management

### 1. Use Environment Variables

```javascript
// .env.production
API_BASE_URL=https://api.soriano.com
API_TIMEOUT=30000
API_KEY=sk_live_...

// .env.development
API_BASE_URL=http://localhost:3000
API_TIMEOUT=5000
API_KEY=sk_test_...

// config.js
export const config = {
  apiBaseUrl: process.env.API_BASE_URL,
  apiTimeout: parseInt(process.env.API_TIMEOUT),
  apiKey: process.env.API_KEY
};
```

### 2. Environment-Specific Behavior

```javascript
class ApiClient {
  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
    this.debug = process.env.NODE_ENV === 'development';
  }

  async request(url, options = {}) {
    if (this.debug) {
      console.log('Request:', url, options);
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      timeout: this.timeout
    });

    if (this.debug) {
      console.log('Response:', await response.clone().json());
    }

    return response;
  }
}
```

## Documentation

### 1. Document API Integration

```javascript
/**
 * Fetches user by ID
 *
 * @param {string} userId - User UUID
 * @returns {Promise<User>} User object
 * @throws {ApiError} If user not found or request fails
 *
 * @example
 * const user = await getUser('123e4567-e89b-12d3-a456-426614174000');
 * console.log(user.email); // user@example.com
 */
async function getUser(userId) {
  const response = await fetch(`/api/v1/users/${userId}`);
  return response.json();
}
```

### 2. Maintain Changelog

Keep track of API integration changes:

```markdown
# API Integration Changelog

## [1.2.0] - 2024-01-28
### Added
- Implemented WebSocket support for real-time notifications
- Added request retry logic with exponential backoff

### Changed
- Updated error handling to include request IDs
- Improved token refresh mechanism

### Fixed
- Fixed race condition in token refresh
```

## Next Steps

- [Authentication Guide](./authentication.md)
- [Rate Limiting Guide](./rate-limiting.md)
- [Error Handling Guide](./error-handling.md)
- [API Reference](../openapi/openapi.yaml)

---

**Last Updated**: January 28, 2026
