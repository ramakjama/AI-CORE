# AIT-CORE API Documentation Index

Complete index of all API documentation for the AIT-CORE Soriano Insurance Platform.

## Quick Links

- [Main README](./README.md) - Start here
- [Quick Start Guide](./guides/quick-start.md) - Get started in 5 minutes
- [OpenAPI Specification](./openapi/openapi.yaml) - Complete API spec
- [Interactive Docs](https://api.soriano.com/docs) - Swagger UI

## Documentation Structure

### Main Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | API overview and getting started |
| [API_DOCUMENTATION_INDEX.md](./API_DOCUMENTATION_INDEX.md) | This index |

### Guides

Comprehensive guides for API integration:

| Guide | Description |
|-------|-------------|
| [Quick Start](./guides/quick-start.md) | Get started in 5 minutes |
| [Authentication](./guides/authentication.md) | JWT, API keys, OAuth, token refresh |
| [Rate Limiting](./guides/rate-limiting.md) | Rate limits, throttling, best practices |
| [Webhooks](./guides/webhooks.md) | Real-time events, webhook setup, security |
| [Error Handling](./guides/error-handling.md) | Error codes, handling strategies |
| [Best Practices](./guides/best-practices.md) | Performance, security, testing |
| [Pagination](./guides/pagination.md) | Pagination implementation |
| [Filtering & Sorting](./guides/filtering-sorting.md) | Query parameters |
| [Migration Guide](./guides/migration.md) | Version migration |

### OpenAPI Specifications

Complete OpenAPI 3.0 specifications:

| File | Description |
|------|-------------|
| [openapi.yaml](./openapi/openapi.yaml) | Complete API specification |
| [openapi.json](./openapi/openapi.json) | JSON format |

#### Module-Specific Specs

| Module | Specification |
|--------|---------------|
| Authentication | [authentication.yaml](./openapi/authentication.yaml) |
| Users | [users.yaml](./openapi/users.yaml) |
| Policies | [policies.yaml](./openapi/policies.yaml) |
| Quotes | [quotes.yaml](./openapi/quotes.yaml) |
| Claims | [claims.yaml](./openapi/claims.yaml) |
| Customers | [customers.yaml](./openapi/customers.yaml) |
| Payments | [payments.yaml](./openapi/payments.yaml) |
| Documents | [documents.yaml](./openapi/documents.yaml) |
| Notifications | [notifications.yaml](./openapi/notifications.yaml) |
| Analytics | [analytics.yaml](./openapi/analytics.yaml) |
| AI Accountant | [modules/ai-accountant.yaml](./openapi/modules/ai-accountant.yaml) |
| AI Treasury | [modules/ai-treasury.yaml](./openapi/modules/ai-treasury.yaml) |
| Lead Generation | [modules/lead-generation.yaml](./openapi/modules/lead-generation.yaml) |

### Examples

Code examples in multiple languages:

#### JavaScript/TypeScript
- [Basic Usage](./examples/javascript/basic-usage.js)
- [Authentication](./examples/javascript/authentication.js)
- [Error Handling](./examples/javascript/error-handling.js)
- [Webhooks](./examples/javascript/webhooks.js)
- [React Integration](./examples/javascript/react-example.jsx)
- [Node.js SDK](./examples/javascript/nodejs-sdk.js)

#### Python
- [Basic Usage](./examples/python/basic_usage.py)
- [Authentication](./examples/python/authentication.py)
- [Error Handling](./examples/python/error_handling.py)
- [Webhooks](./examples/python/webhooks.py)
- [Django Integration](./examples/python/django_example.py)
- [Flask Integration](./examples/python/flask_example.py)

#### PHP
- [Basic Usage](./examples/php/basic-usage.php)
- [Authentication](./examples/php/authentication.php)
- [Error Handling](./examples/php/error-handling.php)
- [Webhooks](./examples/php/webhooks.php)
- [Laravel Integration](./examples/php/laravel-example.php)

#### cURL
- [Authentication Examples](./examples/curl/authentication.sh)
- [User Management](./examples/curl/users.sh)
- [Policy Management](./examples/curl/policies.sh)
- [Claims Management](./examples/curl/claims.sh)

#### Postman
- [Collection](./examples/postman/ait-core-api.postman_collection.json)
- [Production Environment](./examples/postman/production.postman_environment.json)
- [Staging Environment](./examples/postman/staging.postman_environment.json)
- [Setup Guide](./examples/postman/README.md)

### Schemas

JSON schemas for request/response validation:

| Schema | Description |
|--------|-------------|
| [User](./schemas/user.json) | User object schema |
| [Policy](./schemas/policy.json) | Insurance policy schema |
| [Quote](./schemas/quote.json) | Quote schema |
| [Claim](./schemas/claim.json) | Claim schema |
| [Payment](./schemas/payment.json) | Payment schema |
| [Error](./schemas/error.json) | Error response schema |
| [Webhook](./schemas/webhook.json) | Webhook payload schema |

## API Endpoints Overview

### Core Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile

#### Users
- `GET /users` - List users (paginated)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users/me` - Get current user
- `POST /users/:id/change-password` - Change password

#### Policies
- `GET /policies` - List policies
- `GET /policies/:id` - Get policy by ID
- `POST /policies` - Create policy
- `PATCH /policies/:id` - Update policy
- `DELETE /policies/:id` - Cancel policy
- `POST /policies/:id/renew` - Renew policy

#### Quotes
- `GET /quotes` - List quotes
- `GET /quotes/:id` - Get quote by ID
- `POST /quotes` - Create quote
- `PATCH /quotes/:id` - Update quote
- `POST /quotes/:id/accept` - Accept quote
- `POST /quotes/:id/convert` - Convert to policy

#### Claims
- `GET /claims` - List claims
- `GET /claims/:id` - Get claim by ID
- `POST /claims` - Submit claim
- `PATCH /claims/:id` - Update claim
- `POST /claims/:id/approve` - Approve claim
- `POST /claims/:id/reject` - Reject claim

#### Customers
- `GET /customers` - List customers
- `GET /customers/:id` - Get customer by ID
- `POST /customers` - Create customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer

#### Payments
- `GET /payments` - List payments
- `GET /payments/:id` - Get payment by ID
- `POST /payments` - Process payment
- `POST /payments/:id/refund` - Refund payment

#### Documents
- `GET /documents` - List documents
- `POST /documents/upload` - Upload document
- `GET /documents/:id` - Download document
- `DELETE /documents/:id` - Delete document

#### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

#### Webhooks
- `GET /webhooks` - List webhooks
- `POST /webhooks` - Create webhook
- `PATCH /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook
- `POST /webhooks/:id/test` - Test webhook

#### Health
- `GET /health` - Health check
- `GET /health/detailed` - Detailed health status

### Specialized Module Endpoints

#### AI Accountant
- `POST /accountant/entries` - Create accounting entry
- `GET /accountant/entries` - List entries
- `GET /accountant/balance-sheet` - Generate balance sheet
- `GET /accountant/profit-loss` - Generate P&L statement

#### AI Treasury
- `GET /treasury/cash-flow` - Get cash flow
- `POST /treasury/payments` - Process payment
- `GET /treasury/forecasts` - Get financial forecasts

#### Lead Generation
- `GET /leads` - List leads
- `POST /leads` - Create lead
- `POST /leads/:id/qualify` - Qualify lead
- `POST /leads/:id/convert` - Convert to customer

## Authentication Methods

| Method | Header | Use Case |
|--------|--------|----------|
| JWT Bearer Token | `Authorization: Bearer <token>` | User authentication |
| API Key | `X-API-Key: <key>` | Service-to-service |
| Refresh Token | Cookie or body | Token refresh |

## Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": []
  },
  "meta": {
    "timestamp": "ISO 8601",
    "requestId": "unique-id"
  }
}
```

## Rate Limits

| Tier | Requests/Min | Requests/Hour |
|------|--------------|---------------|
| Anonymous | 30 | 100 |
| Authenticated | 100 | 1,000 |
| Premium | 300 | 10,000 |
| Admin | 500 | 20,000 |

## Webhook Events

### User Events
- `user.created`, `user.updated`, `user.deleted`
- `user.activated`, `user.deactivated`
- `user.email_verified`, `user.password_changed`

### Policy Events
- `policy.created`, `policy.updated`, `policy.deleted`
- `policy.activated`, `policy.cancelled`, `policy.expired`
- `policy.renewed`, `policy.payment_due`

### Quote Events
- `quote.created`, `quote.updated`
- `quote.accepted`, `quote.rejected`, `quote.expired`
- `quote.converted`

### Claim Events
- `claim.submitted`, `claim.updated`
- `claim.approved`, `claim.rejected`
- `claim.paid`, `claim.closed`

### Payment Events
- `payment.successful`, `payment.failed`
- `payment.refunded`, `payment.pending`, `payment.cancelled`

## HTTP Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 204 | No Content | Success with no content |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Authentication failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service down |

## Error Codes

### Authentication Errors
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_TOKEN_INVALID`
- `AUTH_INSUFFICIENT_PERMISSIONS`

### Validation Errors
- `VALIDATION_ERROR`
- `VALIDATION_REQUIRED_FIELD`
- `VALIDATION_INVALID_FORMAT`

### Resource Errors
- `RESOURCE_NOT_FOUND`
- `RESOURCE_ALREADY_EXISTS`
- `RESOURCE_CONFLICT`

### Rate Limiting Errors
- `RATE_LIMIT_EXCEEDED`
- `RATE_LIMIT_LOGIN_ATTEMPTS`

### System Errors
- `SYSTEM_INTERNAL_ERROR`
- `SYSTEM_DATABASE_ERROR`
- `SYSTEM_SERVICE_UNAVAILABLE`

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | https://api.soriano.com/api/v1 |
| Staging | https://api-staging.soriano.com/api/v1 |
| Development | https://api-dev.soriano.com/api/v1 |
| Local | http://localhost:3000/api/v1 |

## Support

### Documentation
- Main Site: https://docs.soriano.com
- API Docs: https://api.soriano.com/docs
- Status Page: https://status.soriano.com

### Contact
- Email: support@soriano.com
- Technical Support: tech-support@soriano.com
- Security Issues: security@soriano.com
- Sales: sales@soriano.com

### Resources
- Developer Forum: https://forum.soriano.com
- GitHub: https://github.com/ait-core-soriano
- Blog: https://blog.soriano.com
- Changelog: https://changelog.soriano.com

## Legal

- [Terms of Service](https://soriano.com/terms)
- [Privacy Policy](https://soriano.com/privacy)
- [API Terms](https://soriano.com/api-terms)
- [SLA](https://soriano.com/sla)
- [Cookie Policy](https://soriano.com/cookies)

## Changelog

### Version 1.0.0 (Current)
**Release Date**: January 28, 2026

#### Features
- Complete RESTful API
- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-tier rate limiting
- WebSocket support for real-time updates
- Comprehensive error handling
- Webhook system for event notifications
- Full CRUD operations for all resources
- Advanced filtering and sorting
- Pagination support
- File upload/download
- Audit logging
- Multi-language support (ES, EN)

#### Modules
- Core business operations
- Insurance specialized modules (Auto, Home, Life, Health)
- AI-powered modules (Accountant, Treasury, Analytics)
- Marketing and sales tools
- Security and compliance features

#### Documentation
- Complete OpenAPI 3.0 specification
- Authentication guides
- Rate limiting documentation
- Webhook integration guide
- Error handling guide
- Best practices guide
- Code examples (JavaScript, Python, PHP)
- Postman collection
- Interactive Swagger UI

## Next Version (1.1.0) - Planned

### Upcoming Features
- GraphQL API
- OAuth 2.0 support
- Multi-factor authentication (MFA)
- Advanced analytics endpoints
- Real-time collaboration features
- Enhanced search capabilities
- Batch operations API
- Export/import APIs

---

**Documentation Version**: 1.0.0
**Last Updated**: January 28, 2026
**API Version**: v1
