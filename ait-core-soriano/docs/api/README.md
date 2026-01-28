# AIT-CORE Soriano API Documentation

Welcome to the comprehensive API documentation for the AIT-CORE Soriano Insurance Platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [API Overview](#api-overview)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [API Reference](#api-reference)
6. [Webhooks](#webhooks)
7. [SDKs & Libraries](#sdks--libraries)
8. [Support](#support)

## Getting Started

### Base URLs

| Environment | URL | Description |
|-------------|-----|-------------|
| Production | `https://api.soriano.com/api/v1` | Production environment |
| Staging | `https://api-staging.soriano.com/api/v1` | Staging environment for testing |
| Development | `https://api-dev.soriano.com/api/v1` | Development environment |
| Local | `http://localhost:3000/api/v1` | Local development |

### Quick Start

1. **Obtain API Credentials**: Contact support@soriano.com to get your API credentials
2. **Authenticate**: Use the `/auth/login` endpoint to obtain a JWT token
3. **Make API Calls**: Include the token in the Authorization header
4. **Handle Responses**: Process the standardized JSON responses

### Example Request

```bash
# Login to get JWT token
curl -X POST https://api.soriano.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-secure-password"
  }'

# Use the token to make authenticated requests
curl -X GET https://api.soriano.com/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## API Overview

### Architecture

The AIT-CORE API follows REST principles and is organized around resources. The API:

- Uses standard HTTP verbs (GET, POST, PUT, PATCH, DELETE)
- Returns JSON-encoded responses
- Uses standard HTTP response codes
- Supports API versioning via URI path
- Implements comprehensive error handling

### API Versioning

The API uses URI versioning. The current version is `v1`:

```
https://api.soriano.com/api/v1/...
```

When breaking changes are introduced, a new version will be released (v2, v3, etc.). Previous versions will be maintained for a minimum of 12 months.

### Request Format

All requests must:
- Use HTTPS (HTTP requests will be redirected)
- Include appropriate headers
- Send JSON-encoded bodies for POST/PUT/PATCH requests
- Follow URL parameter conventions for GET requests

### Response Format

All responses follow a standard format:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
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

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 OK | Request succeeded |
| 201 Created | Resource created successfully |
| 204 No Content | Request succeeded with no content to return |
| 400 Bad Request | Invalid request parameters |
| 401 Unauthorized | Authentication required or failed |
| 403 Forbidden | Insufficient permissions |
| 404 Not Found | Resource not found |
| 409 Conflict | Resource conflict (duplicate) |
| 422 Unprocessable Entity | Validation error |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Server error |
| 503 Service Unavailable | Service temporarily unavailable |

## Authentication

See [Authentication Guide](./guides/authentication.md) for detailed information.

### Authentication Methods

1. **JWT Bearer Token** (Primary method)
2. **API Key** (Service-to-service)
3. **Refresh Token** (Token refresh)

### Quick Authentication Example

```bash
# Get access token
curl -X POST https://api.soriano.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'

# Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "role": "USER"
    }
  }
}

# Use the token
curl -X GET https://api.soriano.com/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Rate Limiting

See [Rate Limiting Guide](./guides/rate-limiting.md) for detailed information.

### Rate Limits by Tier

| Tier | Requests per Minute | Requests per Hour |
|------|---------------------|-------------------|
| Anonymous | 30 | 100 |
| Authenticated | 100 | 1,000 |
| Premium | 300 | 10,000 |
| Admin | 500 | 20,000 |

### Rate Limit Headers

Every API response includes rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## API Reference

### Core Resources

- [Authentication](./openapi/authentication.yaml) - User authentication and authorization
- [Users](./openapi/users.yaml) - User management
- [Insurance Policies](./openapi/insurance.yaml) - Insurance operations
- [Quotes](./openapi/quotes.yaml) - Quote generation and management
- [Claims](./openapi/claims.yaml) - Claims processing
- [Customers](./openapi/customers.yaml) - Customer management
- [Payments](./openapi/payments.yaml) - Payment processing
- [Documents](./openapi/documents.yaml) - Document management
- [Notifications](./openapi/notifications.yaml) - Notification system
- [Analytics](./openapi/analytics.yaml) - Business intelligence

### Specialized Modules

- [AI Accountant](./openapi/modules/ai-accountant.yaml) - Accounting operations
- [AI Treasury](./openapi/modules/ai-treasury.yaml) - Treasury management
- [Lead Generation](./openapi/modules/lead-generation.yaml) - Lead management
- [Data Analytics](./openapi/modules/data-analytics.yaml) - Advanced analytics

### Complete OpenAPI Specification

Download the complete OpenAPI 3.0 specification:
- [openapi.yaml](./openapi/openapi.yaml) - Complete API specification
- [openapi.json](./openapi/openapi.json) - JSON format

## Webhooks

See [Webhooks Guide](./guides/webhooks.md) for detailed information.

Webhooks allow your application to receive real-time notifications about events in the AIT-CORE system.

### Supported Events

- `user.created` - User account created
- `user.updated` - User profile updated
- `user.deleted` - User account deleted
- `policy.created` - Insurance policy created
- `policy.updated` - Insurance policy updated
- `policy.expired` - Insurance policy expired
- `claim.submitted` - Claim submitted
- `claim.approved` - Claim approved
- `claim.rejected` - Claim rejected
- `payment.successful` - Payment processed
- `payment.failed` - Payment failed

## SDKs & Libraries

### Official SDKs

- **JavaScript/TypeScript**: Coming soon
- **Python**: Coming soon
- **PHP**: Coming soon
- **C#/.NET**: Coming soon

### Community SDKs

Check our [GitHub organization](https://github.com/ait-core-soriano) for community-contributed SDKs.

## Interactive Documentation

Access the interactive Swagger UI documentation:

- **Production**: [https://api.soriano.com/docs](https://api.soriano.com/docs)
- **Staging**: [https://api-staging.soriano.com/docs](https://api-staging.soriano.com/docs)
- **Development**: [https://api-dev.soriano.com/docs](https://api-dev.soriano.com/docs)

The interactive documentation allows you to:
- Browse all available endpoints
- Test API calls directly from the browser
- View request/response schemas
- Generate code samples

## Additional Resources

### Guides

- [Authentication Guide](./guides/authentication.md) - Complete authentication documentation
- [Rate Limiting Guide](./guides/rate-limiting.md) - Rate limiting details
- [Webhooks Guide](./guides/webhooks.md) - Webhook integration guide
- [Error Handling Guide](./guides/error-handling.md) - Error codes and handling
- [Pagination Guide](./guides/pagination.md) - Pagination implementation
- [Filtering & Sorting Guide](./guides/filtering-sorting.md) - Query parameters
- [Best Practices](./guides/best-practices.md) - API best practices
- [Migration Guide](./guides/migration.md) - Version migration guides

### Examples

- [JavaScript Examples](./examples/javascript/)
- [Python Examples](./examples/python/)
- [cURL Examples](./examples/curl/)
- [Postman Collection](./examples/postman/)

## Support

### Getting Help

- **Documentation**: [https://docs.soriano.com](https://docs.soriano.com)
- **Email Support**: support@soriano.com
- **Developer Forum**: [https://forum.soriano.com](https://forum.soriano.com)
- **Status Page**: [https://status.soriano.com](https://status.soriano.com)

### Reporting Issues

Found a bug or have a feature request? Please email us at support@soriano.com with:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- API endpoint and request details

### Security Issues

For security concerns, please email security@soriano.com. Do not post security issues publicly.

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Core authentication and user management
- Insurance operations (policies, quotes, claims)
- Payment processing
- Document management
- Notification system
- WebSocket support for real-time updates

## Legal

- [Terms of Service](https://soriano.com/terms)
- [Privacy Policy](https://soriano.com/privacy)
- [API Terms](https://soriano.com/api-terms)
- [SLA](https://soriano.com/sla)

---

**Last Updated**: January 28, 2026
**API Version**: 1.0.0
**Documentation Version**: 1.0.0
