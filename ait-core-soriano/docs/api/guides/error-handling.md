# Error Handling Guide

This guide explains how errors are handled in the AIT-CORE Soriano API and how to properly handle them in your application.

## Table of Contents

1. [Error Response Format](#error-response-format)
2. [HTTP Status Codes](#http-status-codes)
3. [Error Codes](#error-codes)
4. [Common Errors](#common-errors)
5. [Error Handling Best Practices](#error-handling-best-practices)
6. [Validation Errors](#validation-errors)

## Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

### Error Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable error description |
| `error.details` | array | Additional error details (optional) |
| `meta.timestamp` | string | ISO 8601 timestamp of when error occurred |
| `meta.requestId` | string | Unique request identifier for debugging |

## HTTP Status Codes

### 2xx Success

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded with no content to return |

### 4xx Client Errors

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | HTTP method not supported |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx Server Errors

| Code | Status | Description |
|------|--------|-------------|
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Invalid response from upstream server |
| 503 | Service Unavailable | Service temporarily unavailable |
| 504 | Gateway Timeout | Upstream server timeout |

## Error Codes

### Authentication Errors (AUTH_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid or malformed JWT token |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Invalid refresh token |
| `AUTH_INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `AUTH_ACCOUNT_INACTIVE` | 403 | User account is deactivated |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `AUTH_SESSION_EXPIRED` | 401 | User session has expired |

### Validation Errors (VALIDATION_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | General validation error |
| `VALIDATION_REQUIRED_FIELD` | 422 | Required field is missing |
| `VALIDATION_INVALID_FORMAT` | 422 | Invalid field format |
| `VALIDATION_OUT_OF_RANGE` | 422 | Value outside allowed range |
| `VALIDATION_INVALID_ENUM` | 422 | Invalid enum value |

### Resource Errors (RESOURCE_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists |
| `RESOURCE_CONFLICT` | 409 | Resource state conflict |
| `RESOURCE_LOCKED` | 409 | Resource is locked |
| `RESOURCE_DELETED` | 410 | Resource has been deleted |

### Rate Limiting Errors (RATE_LIMIT_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `RATE_LIMIT_LOGIN_ATTEMPTS` | 429 | Too many login attempts |
| `RATE_LIMIT_REGISTRATION` | 429 | Too many registration attempts |

### Business Logic Errors (BUSINESS_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BUSINESS_POLICY_EXPIRED` | 400 | Policy has expired |
| `BUSINESS_CLAIM_REJECTED` | 400 | Claim cannot be processed |
| `BUSINESS_INSUFFICIENT_COVERAGE` | 400 | Insufficient insurance coverage |
| `BUSINESS_PAYMENT_FAILED` | 400 | Payment processing failed |
| `BUSINESS_QUOTE_EXPIRED` | 400 | Quote has expired |

### System Errors (SYSTEM_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SYSTEM_INTERNAL_ERROR` | 500 | Internal server error |
| `SYSTEM_DATABASE_ERROR` | 500 | Database operation failed |
| `SYSTEM_SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `SYSTEM_TIMEOUT` | 504 | Request timeout |

## Common Errors

### 401 Unauthorized - Invalid Credentials

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Verify email and password are correct.

### 401 Unauthorized - Token Expired

```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "JWT token has expired"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Use refresh token to obtain a new access token.

### 403 Forbidden - Insufficient Permissions

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INSUFFICIENT_PERMISSIONS",
    "message": "You don't have permission to access this resource"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Check user role and permissions. Contact administrator for access.

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Verify the resource ID is correct and the resource exists.

### 409 Conflict - Duplicate Resource

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_ALREADY_EXISTS",
    "message": "A user with this email already exists"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Use a different unique identifier (e.g., different email).

### 422 Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Fix validation errors in the specified fields.

### 429 Rate Limit Exceeded

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Wait for the specified `retryAfter` seconds before retrying.

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "SYSTEM_INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Solution**: Contact support with the `requestId` for investigation.

## Error Handling Best Practices

### 1. Always Check HTTP Status Code

```javascript
async function makeApiRequest(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error);
  }

  return response.json();
}

class ApiError extends Error {
  constructor(errorResponse) {
    super(errorResponse.error.message);
    this.code = errorResponse.error.code;
    this.details = errorResponse.error.details;
    this.requestId = errorResponse.meta.requestId;
  }
}
```

### 2. Handle Specific Error Codes

```javascript
try {
  await makeApiRequest('/api/v1/users/me');
} catch (error) {
  if (error.code === 'AUTH_TOKEN_EXPIRED') {
    // Refresh token and retry
    await refreshToken();
    return makeApiRequest('/api/v1/users/me');
  } else if (error.code === 'AUTH_INSUFFICIENT_PERMISSIONS') {
    // Redirect to access denied page
    router.push('/access-denied');
  } else {
    // Show generic error message
    showErrorNotification(error.message);
  }
}
```

### 3. Implement Retry Logic

```javascript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await makeApiRequest(url, options);
    } catch (error) {
      // Retry on network errors or 5xx errors
      if (i === maxRetries - 1 ||
          (error.code && !error.code.startsWith('SYSTEM_'))) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 4. Log Errors with Request ID

```javascript
try {
  await makeApiRequest('/api/v1/users');
} catch (error) {
  console.error('API Error:', {
    code: error.code,
    message: error.message,
    requestId: error.requestId,
    timestamp: new Date().toISOString()
  });

  // Send to error tracking service
  Sentry.captureException(error, {
    tags: {
      errorCode: error.code,
      requestId: error.requestId
    }
  });
}
```

### 5. Display User-Friendly Messages

```javascript
function getErrorMessage(error) {
  const userMessages = {
    'AUTH_INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
    'AUTH_TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
    'RESOURCE_NOT_FOUND': 'The requested resource was not found.',
    'VALIDATION_ERROR': 'Please check the form for errors.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    'SYSTEM_INTERNAL_ERROR': 'Something went wrong. Please try again later.'
  };

  return userMessages[error.code] || error.message || 'An unexpected error occurred.';
}
```

### 6. Handle Network Errors

```javascript
async function makeApiRequest(url, options) {
  try {
    const response = await fetch(url, options);
    // ... handle response
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}
```

## Validation Errors

### Field-Level Validation

Validation errors include detailed information about which fields failed validation:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "constraints": {
          "minLength": 8
        }
      },
      {
        "field": "age",
        "message": "Age must be between 18 and 100",
        "constraints": {
          "min": 18,
          "max": 100
        }
      }
    ]
  }
}
```

### Handling Validation Errors in Forms

```javascript
function handleValidationError(error, form) {
  // Clear previous errors
  clearFormErrors(form);

  // Display errors for each field
  error.details.forEach(detail => {
    const field = form.querySelector(`[name="${detail.field}"]`);
    if (field) {
      showFieldError(field, detail.message);
    }
  });
}

function showFieldError(field, message) {
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.textContent = message;
  field.parentNode.appendChild(errorElement);
  field.classList.add('error');
}
```

## Debugging with Request IDs

Every error response includes a unique `requestId`. When contacting support, provide this ID for faster troubleshooting:

```javascript
try {
  await makeApiRequest('/api/v1/users');
} catch (error) {
  console.error(`API Error (Request ID: ${error.requestId})`, error);

  // Show to user
  showNotification({
    type: 'error',
    message: `An error occurred. Reference: ${error.requestId}`,
    duration: 10000
  });
}
```

## Error Monitoring

Implement error monitoring to track API errors in production:

```javascript
// Sentry example
Sentry.init({
  dsn: 'your-sentry-dsn',
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error && error.requestId) {
      event.tags = {
        ...event.tags,
        requestId: error.requestId,
        errorCode: error.code
      };
    }
    return event;
  }
});

// Track API errors
try {
  await makeApiRequest('/api/v1/users');
} catch (error) {
  Sentry.captureException(error);
}
```

## Testing Error Handling

Test how your application handles errors:

```javascript
// Mock API error responses
const mockErrorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: [
      { field: 'email', message: 'Invalid email format' }
    ]
  },
  meta: {
    timestamp: '2024-01-28T12:00:00Z',
    requestId: 'req_test123'
  }
};

// Test error handling
describe('API Error Handling', () => {
  it('should handle validation errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => mockErrorResponse
    });

    await expect(makeApiRequest('/api/v1/users')).rejects.toThrow('Validation failed');
  });
});
```

## Next Steps

- [Authentication Guide](./authentication.md)
- [Rate Limiting Guide](./rate-limiting.md)
- [Best Practices](./best-practices.md)
- [API Reference](../openapi/openapi.yaml)

---

**Last Updated**: January 28, 2026
