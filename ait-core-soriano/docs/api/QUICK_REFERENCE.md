# AIT-CORE API Quick Reference

Quick reference card for developers integrating with the AIT-CORE Soriano API.

## Base URLs

```
Production:   https://api.soriano.com/api/v1
Staging:      https://api-staging.soriano.com/api/v1
Development:  https://api-dev.soriano.com/api/v1
Local:        http://localhost:3000/api/v1
```

## Authentication

### Login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response: { accessToken, refreshToken, user }
```

### Use Token
```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Refresh Token
```bash
POST /auth/refresh
{ "refreshToken": "YOUR_REFRESH_TOKEN" }
```

## Rate Limits

| Tier | /min | /hour |
|------|------|-------|
| Anonymous | 30 | 100 |
| Authenticated | 100 | 1,000 |
| Premium | 300 | 10,000 |
| Admin | 500 | 20,000 |

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000060
```

## Common Endpoints

### Users
```bash
GET    /users              # List users
GET    /users/me           # Current user
GET    /users/:id          # Get user
POST   /users              # Create user
PATCH  /users/:id          # Update user
DELETE /users/:id          # Delete user
```

### Policies
```bash
GET    /policies           # List policies
GET    /policies/:id       # Get policy
POST   /policies           # Create policy
PATCH  /policies/:id       # Update policy
DELETE /policies/:id       # Cancel policy
POST   /policies/:id/renew # Renew policy
```

### Quotes
```bash
GET  /quotes                # List quotes
POST /quotes                # Create quote
POST /quotes/:id/accept     # Accept quote
POST /quotes/:id/convert    # Convert to policy
```

### Claims
```bash
GET  /claims                # List claims
POST /claims                # Submit claim
POST /claims/:id/approve    # Approve claim
POST /claims/:id/reject     # Reject claim
```

### Payments
```bash
GET  /payments              # List payments
POST /payments              # Process payment
POST /payments/:id/refund   # Refund payment
```

### Documents
```bash
GET    /documents           # List documents
POST   /documents/upload    # Upload document
GET    /documents/:id       # Download document
DELETE /documents/:id       # Delete document
```

### Notifications
```bash
GET   /notifications                # List notifications
GET   /notifications/unread-count   # Unread count
PATCH /notifications/:id/read       # Mark as read
PATCH /notifications/mark-all-read  # Mark all read
```

### Webhooks
```bash
GET    /webhooks           # List webhooks
POST   /webhooks           # Create webhook
PATCH  /webhooks/:id       # Update webhook
DELETE /webhooks/:id       # Delete webhook
POST   /webhooks/:id/test  # Test webhook
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |
| 503 | Service Unavailable |

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": []
  },
  "meta": {
    "timestamp": "2024-01-28T12:00:00Z",
    "requestId": "req_abc123"
  }
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email/password |
| `AUTH_TOKEN_EXPIRED` | Token expired |
| `AUTH_INSUFFICIENT_PERMISSIONS` | No permission |
| `VALIDATION_ERROR` | Input validation failed |
| `RESOURCE_NOT_FOUND` | Resource not found |
| `RESOURCE_ALREADY_EXISTS` | Duplicate resource |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SYSTEM_INTERNAL_ERROR` | Server error |

## Pagination

```bash
GET /users?page=1&limit=10

Response:
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Filtering & Sorting

```bash
# Search
GET /users?search=john

# Filter
GET /users?role=ADMIN&isActive=true

# Sort
GET /users?sortBy=createdAt&sortOrder=desc

# Combined
GET /users?search=john&role=ADMIN&sortBy=email&sortOrder=asc&page=1&limit=20
```

## Webhooks

### Create Webhook
```bash
POST /webhooks
{
  "url": "https://your-app.com/webhook",
  "events": ["policy.created", "claim.submitted"],
  "description": "Production webhook"
}
```

### Verify Signature
```javascript
// Signature format: t=timestamp,v1=signature
const crypto = require('crypto');

function verify(payload, signature, secret) {
  const parts = signature.split(',').reduce((acc, p) => {
    const [k, v] = p.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const signedPayload = `${parts.t}.${payload}`;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return computed === parts.v1;
}
```

## Code Templates

### JavaScript
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.soriano.com/api/v1',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// GET
const users = await api.get('/users?page=1&limit=10');

// POST
const user = await api.post('/users', {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// PATCH
await api.patch('/users/123', { firstName: 'Jane' });

// DELETE
await api.delete('/users/123');
```

### Python
```python
import requests

BASE_URL = 'https://api.soriano.com/api/v1'
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# GET
response = requests.get(f'{BASE_URL}/users',
    params={'page': 1, 'limit': 10},
    headers=headers)

# POST
response = requests.post(f'{BASE_URL}/users',
    json={
        'email': 'user@example.com',
        'firstName': 'John',
        'lastName': 'Doe'
    },
    headers=headers)

# PATCH
response = requests.patch(f'{BASE_URL}/users/123',
    json={'firstName': 'Jane'},
    headers=headers)

# DELETE
response = requests.delete(f'{BASE_URL}/users/123',
    headers=headers)
```

### cURL
```bash
# GET
curl -X GET "https://api.soriano.com/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# POST
curl -X POST "https://api.soriano.com/api/v1/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'

# PATCH
curl -X PATCH "https://api.soriano.com/api/v1/users/123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane"}'

# DELETE
curl -X DELETE "https://api.soriano.com/api/v1/users/123" \
  -H "Authorization: Bearer $TOKEN"
```

## Best Practices

### DO ✅
- Use HTTPS in production
- Store tokens securely (not in localStorage)
- Implement token refresh
- Handle errors gracefully
- Respect rate limits
- Use pagination
- Cache responses when appropriate
- Verify webhook signatures
- Use environment variables for config
- Implement request timeouts
- Log request IDs for debugging

### DON'T ❌
- Don't store tokens in localStorage
- Don't ignore rate limit headers
- Don't make redundant API calls
- Don't log sensitive data
- Don't skip error handling
- Don't use HTTP in production
- Don't hardcode credentials
- Don't ignore webhook signatures
- Don't make synchronous blocking calls
- Don't retry on 4xx errors (except 429)

## Testing

### Test Credentials
```
Email: admin@test.com
Password: Admin123!
Environment: Staging/Development only
```

### Postman
```bash
# Import collection
curl -O https://docs.soriano.com/postman/collection.json

# Run with Newman
newman run collection.json -e environment.json
```

### Interactive Docs
```
Production:  https://api.soriano.com/docs
Staging:     https://api-staging.soriano.com/docs
```

## Support

### Documentation
- Main: https://docs.soriano.com/api
- Quick Start: https://docs.soriano.com/api/quick-start
- Interactive: https://api.soriano.com/docs

### Contact
- Email: support@soriano.com
- Technical: tech-support@soriano.com
- Security: security@soriano.com

### Resources
- Status: https://status.soriano.com
- Forum: https://forum.soriano.com
- GitHub: https://github.com/ait-core-soriano

## Emergency Contacts

### Production Issues
- Email: emergency@soriano.com
- Phone: +34 900 123 456 (24/7)

### Security Issues
- Email: security@soriano.com
- PGP Key: https://soriano.com/pgp

## Version Information

- **API Version**: v1
- **Documentation Version**: 1.0.0
- **Last Updated**: January 28, 2026
- **OpenAPI Spec**: 3.0.3

---

**Need more details?** Check the [Complete API Documentation](./README.md)
