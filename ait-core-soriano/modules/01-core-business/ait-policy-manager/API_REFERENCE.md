# AIT Policy Manager - API Reference

## Table of Contents
- [Authentication](#authentication)
- [Policy CRUD](#policy-crud)
- [Policy Operations](#policy-operations)
- [Coverage Management](#coverage-management)
- [Documents](#documents)
- [Quotations](#quotations)
- [Statistics](#statistics)
- [Validations](#validations)

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-token>
```

## Policy CRUD

### Create Policy
**POST** `/api/v1/policies`

Creates a new insurance policy.

**Request Body:**
```json
{
  "clientId": "client-123",
  "productId": "product-auto-basic",
  "type": "auto",
  "effectiveDate": "2026-02-01T00:00:00Z",
  "expirationDate": "2027-02-01T00:00:00Z",
  "totalPremium": 850,
  "agentId": "agent-456",
  "coverages": [
    {
      "name": "Responsabilidad Civil",
      "code": "RC_AUTO",
      "sumInsured": 50000,
      "premium": 350,
      "deductible": 300
    }
  ],
  "notes": "Optional notes",
  "riskData": {
    "vehiclePlate": "ABC123",
    "vehicleMake": "Toyota",
    "vehicleModel": "Corolla",
    "vehicleYear": 2024
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "pol_abc123",
  "policyNumber": "AUT-2026-000001",
  "status": "draft",
  "effectiveDate": "2026-02-01T00:00:00Z",
  "expirationDate": "2027-02-01T00:00:00Z",
  "totalPremium": 850,
  "coverages": [...],
  "party": {...},
  "product": {...},
  "createdAt": "2026-01-28T12:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid data or validation failed
- `404 Not Found` - Client or product not found
- `409 Conflict` - Customer already has active policy of same type

---

### List Policies
**GET** `/api/v1/policies`

List and search policies with advanced filters.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Results per page (default: 20)
- `search` (string) - Search by policy number or customer name
- `status` (enum) - Filter by status: draft, active, suspended, cancelled, expired
- `type` (enum) - Filter by type: auto, home, life, health, business, travel, liability
- `customerId` (string) - Filter by customer ID
- `agentId` (string) - Filter by agent ID
- `insurerId` (string) - Filter by insurer ID
- `effectiveDateFrom` (date) - Filter by effective date range
- `effectiveDateTo` (date)
- `expirationDateFrom` (date) - Filter by expiration date range
- `expirationDateTo` (date)
- `minPremium` (number) - Filter by premium range
- `maxPremium` (number)
- `sortBy` (enum) - Sort field: policyNumber, createdAt, effectiveDate, expirationDate, totalPremium, status
- `sortOrder` (enum) - asc or desc

**Response:** `200 OK`
```json
{
  "data": [...],
  "total": 145,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

---

### Get Policy Details
**GET** `/api/v1/policies/:id`

Get complete policy details including coverages, claims, and endorsements.

**Response:** `200 OK`
```json
{
  "id": "pol_abc123",
  "policyNumber": "AUT-2026-000001",
  "status": "active",
  "effectiveDate": "2026-02-01T00:00:00Z",
  "expirationDate": "2027-02-01T00:00:00Z",
  "totalPremium": 850,
  "coverages": [
    {
      "id": "cov_123",
      "name": "Responsabilidad Civil",
      "sumInsured": 50000,
      "premium": 350
    }
  ],
  "party": {
    "id": "client-123",
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "product": {
    "id": "product-auto-basic",
    "name": "Auto Básico"
  },
  "claims": [],
  "endorsements": []
}
```

**Errors:**
- `404 Not Found` - Policy not found

---

### Update Policy
**PUT** `/api/v1/policies/:id`

Update policy details.

**Request Body:**
```json
{
  "status": "active",
  "totalPremium": 900,
  "notes": "Updated premium"
}
```

**Response:** `200 OK`

---

## Policy Operations

### Renew Policy
**POST** `/api/v1/policies/:id/renew`

Create a renewal policy for the next period.

**Request Body:**
```json
{
  "newEffectiveDate": "2027-02-01T00:00:00Z",
  "newExpirationDate": "2028-02-01T00:00:00Z",
  "newPremium": 900,
  "keepCurrentCoverages": true
}
```

**Response:** `201 Created`
```json
{
  "id": "pol_new123",
  "policyNumber": "AUT-2027-000001",
  "status": "active",
  "previousPolicyId": "pol_abc123",
  ...
}
```

**Errors:**
- `400 Bad Request` - Cannot renew cancelled policy

---

### Create Endorsement
**POST** `/api/v1/policies/:id/endorse`

Create an endorsement (mid-term modification).

**Request Body:**
```json
{
  "endorsementType": "add_coverage",
  "effectiveDate": "2026-06-01T00:00:00Z",
  "description": "Add glass coverage",
  "premiumAdjustment": 50,
  "newCoverages": [
    {
      "name": "Glass Coverage",
      "code": "GLASS",
      "sumInsured": 5000,
      "premium": 50
    }
  ],
  "removeCoverageIds": []
}
```

**Response:** `201 Created`
```json
{
  "id": "end_123",
  "endorsementNumber": "AUT-2026-000001-END-001",
  "premiumAdjustment": 50,
  "status": "pending"
}
```

---

### Cancel Policy
**POST** `/api/v1/policies/:id/cancel`

Cancel an active policy.

**Request Body:**
```json
{
  "cancellationDate": "2026-06-01T00:00:00Z",
  "reason": "Customer request",
  "refundAmount": 150
}
```

**Response:** `200 OK`

**Errors:**
- `400 Bad Request` - Policy already cancelled or has active claims

---

### Suspend Policy
**POST** `/api/v1/policies/:id/suspend`

Temporarily suspend a policy.

**Request Body:**
```json
{
  "reason": "Non-payment"
}
```

**Response:** `200 OK`

---

### Reactivate Policy
**POST** `/api/v1/policies/:id/reactivate`

Reactivate a suspended policy.

**Response:** `200 OK`

---

### Activate Policy
**POST** `/api/v1/policies/:id/activate`

Activate a policy from draft or quoted status.

**Response:** `200 OK`

---

## Coverage Management

### Add Coverage
**POST** `/api/v1/policies/:id/coverages`

Add a coverage to an existing policy.

**Request Body:**
```json
{
  "name": "Glass Coverage",
  "code": "GLASS",
  "sumInsured": 5000,
  "premium": 50,
  "deductible": 100,
  "mandatory": false
}
```

**Response:** `201 Created`

---

### List Coverages
**GET** `/api/v1/policies/:id/coverages`

Get all coverages for a policy.

**Response:** `200 OK`
```json
[
  {
    "id": "cov_123",
    "name": "Responsabilidad Civil",
    "sumInsured": 50000,
    "premium": 350,
    "deductible": 300
  }
]
```

---

### Update Coverage
**PUT** `/api/v1/policies/:id/coverages/:coverageId`

Update a specific coverage.

**Request Body:**
```json
{
  "sumInsured": 60000,
  "premium": 400
}
```

**Response:** `200 OK`

---

### Remove Coverage
**DELETE** `/api/v1/policies/:id/coverages/:coverageId`

Remove a coverage from the policy.

**Response:** `204 No Content`

**Errors:**
- `400 Bad Request` - Cannot remove mandatory coverage

---

## Documents

### Upload Document
**POST** `/api/v1/policies/:id/documents`

Upload a document for the policy.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (binary) - The document file
- `type` (string) - Document type: policy_certificate, endorsement, receipt, claim_document, cancellation, renewal, id_document, inspection_report, other
- `description` (string) - Optional description

**Response:** `201 Created`

---

### List Documents
**GET** `/api/v1/policies/:id/documents`

List all documents for a policy.

**Response:** `200 OK`

---

### Delete Document
**DELETE** `/api/v1/policies/:id/documents/:documentId`

Delete a policy document.

**Response:** `204 No Content`

---

### Generate Certificate
**GET** `/api/v1/policies/:id/certificate`

Generate and download policy certificate (PDF).

**Response:** `200 OK` (application/pdf)

---

## Quotations

### Calculate Quote
**POST** `/api/v1/policies/quote`

Calculate premium quote for a new policy.

**Request Body:**
```json
{
  "customerId": "client-123",
  "type": "auto",
  "coverages": [
    {
      "name": "RC",
      "code": "RC_AUTO",
      "sumInsured": 50000,
      "premium": 350
    }
  ],
  "riskData": {
    "vehiclePlate": "ABC123",
    "vehicleMake": "Toyota",
    "vehicleModel": "Corolla",
    "vehicleYear": 2024
  },
  "durationMonths": 12,
  "discountCodes": ["DISCOUNT10"]
}
```

**Response:** `200 OK`
```json
{
  "quoteId": "qt-1706443200-abc123",
  "totalPremium": 765,
  "basePremium": 850,
  "coverageBreakdown": [
    {
      "coverageCode": "RC_AUTO",
      "name": "Responsabilidad Civil",
      "premium": 350,
      "sumInsured": 50000
    }
  ],
  "discounts": [
    {
      "code": "DISCOUNT10",
      "description": "10% discount",
      "amount": 85
    }
  ],
  "totalDiscounts": 85,
  "surcharges": [],
  "validityDays": 30,
  "expiresAt": "2026-02-27T12:00:00Z",
  "notes": "Quote is valid for 30 days"
}
```

---

### Accept Quote
**POST** `/api/v1/policies/quote/:quoteId/accept`

Accept a quote and create the policy.

**Response:** `201 Created`

---

## Statistics

### Global Statistics
**GET** `/api/v1/policies/statistics/global`

Get global policy statistics.

**Response:** `200 OK`
```json
{
  "totalPolicies": 1250,
  "activePolicies": 980,
  "suspendedPolicies": 45,
  "cancelledPolicies": 150,
  "expiredPolicies": 75,
  "expiringPolicies": 32,
  "totalAnnualPremium": 1050000,
  "averagePremium": 840,
  "totalSumInsured": 50000000,
  "byType": {
    "auto": {
      "count": 650,
      "totalPremium": 550000,
      "averagePremium": 846
    },
    "home": {
      "count": 400,
      "totalPremium": 320000,
      "averagePremium": 800
    }
  },
  "byStatus": {
    "active": 980,
    "draft": 50,
    "suspended": 45
  },
  "topAgents": [],
  "monthlyRenewals": 45,
  "monthlyNewPolicies": 78,
  "monthlyCancellations": 12,
  "renewalRate": 85.5,
  "cancellationRate": 12.0
}
```

---

### Customer Statistics
**GET** `/api/v1/policies/statistics/customer/:customerId`

Get statistics for a specific customer.

**Response:** `200 OK`

---

### Expiring Policies
**GET** `/api/v1/policies/expiring/:days`

Get policies expiring in the next N days.

**Response:** `200 OK`
```json
[
  {
    "id": "pol_123",
    "policyNumber": "AUT-2026-000001",
    "expirationDate": "2026-02-15T00:00:00Z",
    "daysUntilExpiration": 18,
    "party": {...}
  }
]
```

---

### Customer Active Policies
**GET** `/api/v1/policies/customer/:customerId/active`

Get all active policies for a customer.

**Response:** `200 OK`

---

### Customer Total Premium
**GET** `/api/v1/policies/customer/:customerId/total-premium`

Calculate total annual premium for a customer.

**Response:** `200 OK`
```json
{
  "customerId": "client-123",
  "totalAnnualPremium": 2450
}
```

---

## Renewals

### Pending Renewals
**GET** `/api/v1/policies/renewals/pending`

Get policies pending automatic renewal.

**Response:** `200 OK`

---

### Process Renewals
**POST** `/api/v1/policies/renewals/process`

Process all pending renewals in batch.

**Response:** `200 OK`
```json
{
  "total": 25,
  "successful": 23,
  "failed": 2,
  "errors": [
    {
      "policyId": "pol_123",
      "policyNumber": "AUT-2026-000001",
      "error": "Customer has pending debt"
    }
  ]
}
```

---

## Validations

### Validate Policy
**POST** `/api/v1/policies/validate`

Validate policy data without creating it.

**Request Body:** Same as Create Policy

**Response:** `200 OK`
```json
{
  "isValid": false,
  "canProceed": false,
  "issues": [
    {
      "code": "NO_COVERAGES",
      "message": "At least one coverage is required",
      "severity": "error",
      "field": "coverages"
    }
  ],
  "errorCount": 1,
  "warningCount": 0,
  "summary": "Validation failed with 1 error(s)"
}
```

---

### Validate Endorsement
**POST** `/api/v1/policies/:id/validate-endorsement`

Validate endorsement before applying.

**Request Body:** Same as Create Endorsement

**Response:** `200 OK`

---

### Can Cancel
**GET** `/api/v1/policies/:id/can-cancel`

Check if a policy can be cancelled.

**Response:** `200 OK`
```json
{
  "policyId": "pol_123",
  "canCancel": true,
  "reason": "Policy can be cancelled"
}
```

---

### Check Overlaps
**GET** `/api/v1/policies/:id/overlaps`

Check for overlapping policies.

**Response:** `200 OK`
```json
{
  "policyId": "pol_123",
  "hasOverlap": false,
  "message": "No overlaps detected"
}
```

---

## History & Audit

### Policy History
**GET** `/api/v1/policies/:id/history`

Get complete change history.

**Response:** `200 OK`

---

### List Endorsements
**GET** `/api/v1/policies/:id/endorsements`

Get all endorsements for a policy.

**Response:** `200 OK`

---

### List Claims
**GET** `/api/v1/policies/:id/claims`

Get all claims for a policy.

**Response:** `200 OK`

---

## Beneficiaries

### Add Beneficiary
**POST** `/api/v1/policies/:id/beneficiaries`

Add a beneficiary to the policy.

**Response:** `201 Created`

---

### List Beneficiaries
**GET** `/api/v1/policies/:id/beneficiaries`

Get all beneficiaries.

**Response:** `200 OK`

---

## Search

### Search by Policy Number
**GET** `/api/v1/policies/search/by-number/:policyNumber`

Find policy by exact policy number.

**Response:** `200 OK`

---

### Search by Plate
**GET** `/api/v1/policies/search/by-plate/:plate`

Find auto policy by vehicle plate.

**Response:** `200 OK`

---

## Error Codes

| Code | Description |
|------|-------------|
| `CUSTOMER_NOT_FOUND` | Customer ID does not exist |
| `PRODUCT_NOT_FOUND` | Product ID does not exist |
| `POLICY_NOT_FOUND` | Policy ID does not exist |
| `INVALID_DATES` | Date validation failed |
| `PREMIUM_TOO_LOW` | Premium below minimum |
| `NO_COVERAGES` | No coverages provided |
| `MISSING_MANDATORY_COVERAGES` | Required coverages missing |
| `ALREADY_CANCELLED` | Policy is already cancelled |
| `ACTIVE_CLAIMS` | Cannot cancel policy with active claims |
| `PENDING_DEBT` | Customer has pending debt |
| `HIGH_LOSS_RATIO` | Loss ratio exceeds threshold |

---

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Webhooks

Configure webhooks to receive events:
- `policy.created`
- `policy.updated`
- `policy.renewed`
- `policy.endorsed`
- `policy.cancelled`
- `policy.suspended`
- `policy.reactivated`

## Support

For API support, contact: api-support@ait-core.com
