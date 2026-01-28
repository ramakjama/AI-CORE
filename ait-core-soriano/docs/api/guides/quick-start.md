# Quick Start Guide

Get started with the AIT-CORE Soriano API in minutes.

## Prerequisites

- API credentials (contact support@soriano.com)
- Basic knowledge of REST APIs
- HTTP client (curl, Postman, or programming language)

## Step 1: Authentication

### Get Your Access Token

```bash
curl -X POST https://api.soriano.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "your-email@example.com",
      "role": "USER"
    }
  }
}
```

Save the `accessToken` - you'll use it for all subsequent requests.

## Step 2: Make Your First Request

### Get Your Profile

```bash
curl -X GET https://api.soriano.com/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "your-email@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isActive": true,
    "emailVerified": true
  }
}
```

## Step 3: Work with Resources

### List Insurance Policies

```bash
curl -X GET "https://api.soriano.com/api/v1/policies?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create a Quote

```bash
curl -X POST https://api.soriano.com/api/v1/quotes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "AUTO",
    "customerId": "cus_123abc",
    "coverages": [
      {
        "type": "LIABILITY",
        "limit": 1000000
      }
    ],
    "vehicleInfo": {
      "make": "Toyota",
      "model": "Camry",
      "year": 2023
    }
  }'
```

## Step 4: Handle Errors

All errors follow a consistent format:

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

## Language Examples

### JavaScript/TypeScript

```javascript
// Install axios
// npm install axios

const axios = require('axios');

const API_BASE_URL = 'https://api.soriano.com/api/v1';

class ApiClient {
  constructor() {
    this.accessToken = null;
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async login(email, password) {
    const response = await this.client.post('/auth/login', {
      email,
      password
    });
    this.accessToken = response.data.data.accessToken;
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/users/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    return response.data;
  }

  async listPolicies(page = 1, limit = 10) {
    const response = await this.client.get('/policies', {
      params: { page, limit },
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });
    return response.data;
  }
}

// Usage
(async () => {
  const api = new ApiClient();

  // Login
  await api.login('user@example.com', 'password');

  // Get profile
  const profile = await api.getProfile();
  console.log('Profile:', profile);

  // List policies
  const policies = await api.listPolicies();
  console.log('Policies:', policies);
})();
```

### Python

```python
# Install requests
# pip install requests

import requests
from typing import Dict, Optional

API_BASE_URL = 'https://api.soriano.com/api/v1'

class ApiClient:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def login(self, email: str, password: str) -> Dict:
        response = self.session.post(
            f'{API_BASE_URL}/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data['data']['accessToken']
        return data

    def get_profile(self) -> Dict:
        response = self.session.get(
            f'{API_BASE_URL}/users/me',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        response.raise_for_status()
        return response.json()

    def list_policies(self, page: int = 1, limit: int = 10) -> Dict:
        response = self.session.get(
            f'{API_BASE_URL}/policies',
            params={'page': page, 'limit': limit},
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        response.raise_for_status()
        return response.json()

# Usage
if __name__ == '__main__':
    api = ApiClient()

    # Login
    api.login('user@example.com', 'password')

    # Get profile
    profile = api.get_profile()
    print('Profile:', profile)

    # List policies
    policies = api.list_policies()
    print('Policies:', policies)
```

### PHP

```php
<?php
// Using Guzzle HTTP client
// composer require guzzlehttp/guzzle

require 'vendor/autoload.php';

use GuzzleHttp\Client;

const API_BASE_URL = 'https://api.soriano.com/api/v1';

class ApiClient {
    private $accessToken;
    private $client;

    public function __construct() {
        $this->client = new Client([
            'base_uri' => API_BASE_URL,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);
    }

    public function login($email, $password) {
        $response = $this->client->post('/auth/login', [
            'json' => [
                'email' => $email,
                'password' => $password
            ]
        ]);

        $data = json_decode($response->getBody(), true);
        $this->accessToken = $data['data']['accessToken'];
        return $data;
    }

    public function getProfile() {
        $response = $this->client->get('/users/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken
            ]
        ]);

        return json_decode($response->getBody(), true);
    }

    public function listPolicies($page = 1, $limit = 10) {
        $response = $this->client->get('/policies', [
            'query' => [
                'page' => $page,
                'limit' => $limit
            ],
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken
            ]
        ]);

        return json_decode($response->getBody(), true);
    }
}

// Usage
$api = new ApiClient();

// Login
$api->login('user@example.com', 'password');

// Get profile
$profile = $api->getProfile();
echo "Profile: " . json_encode($profile) . "\n";

// List policies
$policies = $api->listPolicies();
echo "Policies: " . json_encode($policies) . "\n";
?>
```

## Common Tasks

### Refresh Token

```bash
curl -X POST https://api.soriano.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

### Search Resources

```bash
curl -X GET "https://api.soriano.com/api/v1/users?search=john&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upload Document

```bash
curl -X POST https://api.soriano.com/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "type=POLICY_DOCUMENT" \
  -F "policyId=pol_123abc"
```

### Create Webhook

```bash
curl -X POST https://api.soriano.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/ait-core",
    "events": ["policy.created", "claim.submitted"],
    "description": "Production webhook"
  }'
```

## Testing

### Postman Collection

Import our Postman collection for easy testing:

1. Download: [AIT-CORE API.postman_collection.json](../examples/postman/ait-core-api.postman_collection.json)
2. Import into Postman
3. Set environment variables:
   - `base_url`: https://api.soriano.com/api/v1
   - `access_token`: (will be set automatically after login)

### Interactive Documentation

Use our Swagger UI for interactive testing:

- **Production**: https://api.soriano.com/docs
- **Staging**: https://api-staging.soriano.com/docs

## Rate Limits

Be aware of rate limits:

| Tier | Requests/Minute | Requests/Hour |
|------|-----------------|---------------|
| Anonymous | 30 | 100 |
| Authenticated | 100 | 1,000 |
| Premium | 300 | 10,000 |

Monitor rate limit headers in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000060
```

## Next Steps

### Learn More

- [Authentication Guide](./authentication.md) - Detailed authentication documentation
- [Rate Limiting Guide](./rate-limiting.md) - Rate limiting details
- [Error Handling Guide](./error-handling.md) - Error codes and handling
- [Best Practices](./best-practices.md) - API integration best practices
- [Webhooks Guide](./webhooks.md) - Real-time event notifications

### API Reference

- [Complete OpenAPI Spec](../openapi/openapi.yaml)
- [Interactive API Docs](https://api.soriano.com/docs)

### Support

- **Email**: support@soriano.com
- **Documentation**: https://docs.soriano.com
- **Status Page**: https://status.soriano.com

## Troubleshooting

### Common Issues

**401 Unauthorized**
- Check your access token is valid and not expired
- Verify you're including the Authorization header correctly
- Try refreshing your token

**429 Too Many Requests**
- You've exceeded rate limits
- Wait for the time specified in `Retry-After` header
- Consider caching responses or using bulk endpoints

**500 Internal Server Error**
- Temporary server issue
- Retry the request
- If persists, contact support with the `requestId`

### Debug Mode

Enable debug logging in your client:

```javascript
const api = new ApiClient({ debug: true });

// Will log all requests and responses
await api.getProfile();
// > Request: GET /users/me
// > Response: { success: true, data: {...} }
```

---

**Last Updated**: January 28, 2026
