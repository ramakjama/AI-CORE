# Postman Collection

This directory contains Postman collections and environments for testing the AIT-CORE Soriano API.

## Files

- `ait-core-api.postman_collection.json` - Complete API collection with all endpoints
- `production.postman_environment.json` - Production environment variables
- `staging.postman_environment.json` - Staging environment variables
- `development.postman_environment.json` - Development environment variables

## Setup

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `ait-core-api.postman_collection.json`
4. Click "Import"

### 2. Import Environment

1. Click the gear icon in top-right corner
2. Click "Import"
3. Select the appropriate environment file
4. Click "Import"

### 3. Configure Environment

1. Select the imported environment from the dropdown
2. Click the eye icon to view/edit variables
3. Set your credentials:
   - `email`: Your account email
   - `password`: Your account password
   - `api_key`: Your API key (for API key authentication)

### 4. Run Authentication

1. Open the collection
2. Navigate to "Authentication" folder
3. Run "Login" request
4. The `access_token` and `refresh_token` will be automatically set

## Environment Variables

### Automatic Variables

These are set automatically by collection scripts:

- `access_token` - JWT access token (set after login)
- `refresh_token` - Refresh token (set after login)
- `user_id` - Current user ID (set after login)

### Manual Variables

Set these manually for your environment:

- `base_url` - API base URL
  - Production: `https://api.soriano.com/api/v1`
  - Staging: `https://api-staging.soriano.com/api/v1`
  - Development: `https://api-dev.soriano.com/api/v1`
  - Local: `http://localhost:3000/api/v1`

- `email` - Your account email
- `password` - Your account password
- `api_key` - Your API key (optional)

## Collection Structure

```
AIT-CORE API
├── Authentication
│   ├── Login
│   ├── Register
│   ├── Refresh Token
│   ├── Logout
│   └── Get Profile
├── Users
│   ├── List Users
│   ├── Get User by ID
│   ├── Create User
│   ├── Update User
│   ├── Delete User
│   └── Get Current User
├── Policies
│   ├── List Policies
│   ├── Get Policy by ID
│   ├── Create Policy
│   ├── Update Policy
│   └── Cancel Policy
├── Quotes
│   ├── List Quotes
│   ├── Get Quote by ID
│   ├── Create Quote
│   ├── Update Quote
│   └── Convert to Policy
├── Claims
│   ├── List Claims
│   ├── Get Claim by ID
│   ├── Submit Claim
│   ├── Update Claim
│   ├── Approve Claim
│   └── Reject Claim
├── Customers
│   ├── List Customers
│   ├── Get Customer by ID
│   ├── Create Customer
│   ├── Update Customer
│   └── Delete Customer
├── Payments
│   ├── List Payments
│   ├── Get Payment by ID
│   ├── Process Payment
│   └── Refund Payment
├── Documents
│   ├── List Documents
│   ├── Upload Document
│   ├── Download Document
│   └── Delete Document
├── Notifications
│   ├── List Notifications
│   ├── Mark as Read
│   └── Delete Notification
├── Webhooks
│   ├── List Webhooks
│   ├── Create Webhook
│   ├── Update Webhook
│   ├── Delete Webhook
│   └── Test Webhook
└── Health
    └── Health Check
```

## Pre-request Scripts

The collection includes pre-request scripts that:

1. Automatically refresh expired tokens
2. Set dynamic variables (timestamps, UUIDs, etc.)
3. Generate test data
4. Handle authentication

## Tests

Each request includes tests to verify:

- HTTP status code
- Response structure
- Required fields
- Data types
- Business logic

Example test results:
```
✓ Status code is 200
✓ Response has success field
✓ Response data is an object
✓ User has required fields
✓ Email format is valid
```

## Running Collections

### Run Single Request

1. Select a request
2. Click "Send"
3. View response and test results

### Run Folder

1. Right-click on a folder
2. Select "Run folder"
3. Configure run settings
4. Click "Run [Folder Name]"

### Run Entire Collection

1. Click the three dots next to collection name
2. Select "Run collection"
3. Configure run settings
4. Click "Run AIT-CORE API"

## Collection Runner

Use Collection Runner for automated testing:

1. Click "Runner" button in Postman
2. Select "AIT-CORE API" collection
3. Select environment
4. Configure:
   - Iterations: 1
   - Delay: 0ms
   - Data file: (optional)
5. Click "Run AIT-CORE API"

## Environment-Specific Testing

### Production

```json
{
  "base_url": "https://api.soriano.com/api/v1",
  "environment": "production"
}
```

**Note**: Be careful when testing in production. Use test accounts only.

### Staging

```json
{
  "base_url": "https://api-staging.soriano.com/api/v1",
  "environment": "staging"
}
```

**Recommended**: Use staging for integration testing.

### Development

```json
{
  "base_url": "https://api-dev.soriano.com/api/v1",
  "environment": "development"
}
```

### Local

```json
{
  "base_url": "http://localhost:3000/api/v1",
  "environment": "local"
}
```

## Tips & Tricks

### 1. Save Responses as Examples

Right-click on a request → "Save Response" → "Save as Example"

This helps document expected responses.

### 2. Use Variables for Dynamic Data

Instead of hardcoding IDs, use variables:

```
GET {{base_url}}/users/{{user_id}}
```

### 3. Chain Requests

Use test scripts to save values for subsequent requests:

```javascript
// In test script
pm.environment.set("policy_id", pm.response.json().data.id);

// In next request
GET {{base_url}}/policies/{{policy_id}}
```

### 4. Generate Test Data

Use Postman's dynamic variables:

```json
{
  "email": "{{$randomEmail}}",
  "firstName": "{{$randomFirstName}}",
  "lastName": "{{$randomLastName}}",
  "timestamp": "{{$timestamp}}"
}
```

### 5. Share Collections

Export and share collections with your team:

1. Click three dots → "Export"
2. Choose Collection v2.1
3. Share the JSON file

## Troubleshooting

### Token Expired

If you get 401 errors:

1. Run "Authentication → Refresh Token" request
2. Or run "Authentication → Login" again

### Variables Not Set

Check environment variables:

1. Click eye icon
2. Verify variables are set correctly
3. Ensure correct environment is selected

### CORS Errors

If testing from Postman web:

1. Use Postman desktop app instead
2. Or enable Postman Interceptor

### SSL Errors

For local development:

1. Settings → General
2. Turn off "SSL certificate verification"

**Warning**: Only do this for local development!

## Newman (CLI Runner)

Run collections from command line:

### Install Newman

```bash
npm install -g newman
```

### Run Collection

```bash
newman run ait-core-api.postman_collection.json \
  -e production.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Run with Environment Variables

```bash
newman run ait-core-api.postman_collection.json \
  --env-var "email=test@example.com" \
  --env-var "password=password123"
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: API Tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Newman
        run: npm install -g newman
      - name: Run API Tests
        run: |
          newman run docs/api/examples/postman/ait-core-api.postman_collection.json \
            -e docs/api/examples/postman/staging.postman_environment.json \
            --reporters cli,junit \
            --reporter-junit-export results.xml
```

## Support

For issues with the Postman collection:

- Email: support@soriano.com
- Documentation: https://docs.soriano.com

---

**Last Updated**: January 28, 2026
