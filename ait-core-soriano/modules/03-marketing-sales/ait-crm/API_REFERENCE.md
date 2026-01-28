# AIT-CRM API Reference

## Base URL
```
https://api.ait-core.com/v1
```

## Authentication
All requests require Bearer token authentication:
```
Authorization: Bearer {your-api-token}
```

---

## 📋 Endpoints Summary

| Resource | Endpoints | Count |
|----------|-----------|-------|
| Leads | `/leads/*` | 20 |
| Opportunities | `/opportunities/*` | 18 |
| Activities | `/activities/*` | 15 |
| Campaigns | `/campaigns/*` | 18 |
| Analytics | `/analytics/*` | 13 |
| **TOTAL** | | **84** |

---

## 1. Leads API

### 1.1 CRUD Operations

#### Create Lead
```http
POST /leads
Content-Type: application/json

{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "company": "Acme Corp",
  "jobTitle": "CEO",
  "source": "WEBSITE",
  "notes": "Interested in insurance"
}

Response: 201 Created
{
  "id": "lead_xxx",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "status": "NEW",
  "score": 68,
  "createdAt": "2026-01-28T10:00:00Z"
}
```

#### Get All Leads
```http
GET /leads?page=1&limit=20&status=NEW&minScore=70

Response: 200 OK
{
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8
}
```

#### Get Lead by ID
```http
GET /leads/{id}

Response: 200 OK
{
  "id": "lead_xxx",
  "firstName": "Juan",
  "lastName": "Pérez",
  "activities": [...],
  "assignedTo": { ... }
}
```

#### Update Lead
```http
PUT /leads/{id}
Content-Type: application/json

{
  "status": "CONTACTED",
  "notes": "Called and discussed options"
}

Response: 200 OK
```

#### Delete Lead
```http
DELETE /leads/{id}

Response: 204 No Content
```

### 1.2 Lead Scoring

#### Calculate Score
```http
POST /leads/{id}/calculate-score

Response: 200 OK
{
  "score": 75
}
```

#### Update Score
```http
POST /leads/{id}/update-score

Response: 200 OK
{
  "id": "lead_xxx",
  "score": 75
}
```

#### Get Hot Leads
```http
GET /leads/scoring/hot?threshold=70

Response: 200 OK
[
  {
    "id": "lead_1",
    "firstName": "María",
    "score": 85
  }
]
```

#### Get Cold Leads
```http
GET /leads/scoring/cold?threshold=30

Response: 200 OK
```

#### Recalculate All Scores
```http
POST /leads/scoring/recalculate-all

Response: 202 Accepted
{
  "message": "Score recalculation completed"
}
```

### 1.3 Assignment

#### Assign Lead
```http
POST /leads/{id}/assign
Content-Type: application/json

{
  "agentId": "agent_123"
}

Response: 200 OK
```

#### Auto-Assign Lead
```http
POST /leads/{id}/auto-assign

Response: 200 OK
```

#### Reassign Lead
```http
POST /leads/{id}/reassign
Content-Type: application/json

{
  "fromAgentId": "agent_1",
  "toAgentId": "agent_2"
}

Response: 200 OK
```

#### Get Unassigned Leads
```http
GET /leads/assignment/unassigned

Response: 200 OK
```

#### Get Leads by Agent
```http
GET /leads/assignment/by-agent/{agentId}

Response: 200 OK
```

### 1.4 Conversion

#### Convert to Customer
```http
POST /leads/{id}/convert
Content-Type: application/json

{
  "createOpportunity": true,
  "estimatedValue": 5000,
  "notes": "Ready for sales"
}

Response: 200 OK
{
  "lead": { ... },
  "customer": { ... },
  "opportunity": { ... }
}
```

#### Can Convert
```http
GET /leads/{id}/can-convert

Response: 200 OK
{
  "canConvert": true
}
```

#### Mark as Qualified
```http
POST /leads/{id}/qualify

Response: 200 OK
```

#### Mark as Unqualified
```http
POST /leads/{id}/unqualify
Content-Type: application/json

{
  "reason": "Budget too low"
}

Response: 200 OK
```

### 1.5 Import/Export

#### Import Leads
```http
POST /leads/import
Content-Type: multipart/form-data

file: leads.xlsx

Response: 200 OK
{
  "total": 100,
  "successful": 95,
  "failed": 5,
  "errors": [...]
}
```

#### Export Leads
```http
GET /leads/export?format=xlsx&status=NEW

Response: 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

#### Bulk Update
```http
POST /leads/bulk-update
Content-Type: application/json

{
  "leadIds": ["lead_1", "lead_2"],
  "updates": {
    "status": "CONTACTED"
  }
}

Response: 200 OK
{
  "updated": 2,
  "failed": 0
}
```

---

## 2. Opportunities API

### 2.1 CRUD Operations

#### Create Opportunity
```http
POST /opportunities
Content-Type: application/json

{
  "name": "Enterprise Deal",
  "leadId": "lead_xxx",
  "stage": "QUALIFIED",
  "value": 50000,
  "probability": 50,
  "expectedCloseDate": "2026-03-31T00:00:00Z"
}

Response: 201 Created
```

#### Get All Opportunities
```http
GET /opportunities?page=1&limit=20&stage=PROPOSAL

Response: 200 OK
```

#### Get Opportunity by ID
```http
GET /opportunities/{id}

Response: 200 OK
```

#### Update Opportunity
```http
PUT /opportunities/{id}
Content-Type: application/json

{
  "value": 55000,
  "probability": 75
}

Response: 200 OK
```

#### Delete Opportunity
```http
DELETE /opportunities/{id}

Response: 204 No Content
```

### 2.2 Pipeline Management

#### Move to Stage
```http
POST /opportunities/{id}/move-stage
Content-Type: application/json

{
  "stage": "PROPOSAL"
}

Response: 200 OK
```

#### Get by Stage
```http
GET /opportunities/pipeline/by-stage/PROPOSAL

Response: 200 OK
```

#### Get Pipeline View
```http
GET /opportunities/pipeline/view?agentId=agent_123

Response: 200 OK
{
  "stages": {
    "QUALIFIED": {
      "count": 5,
      "value": 150000,
      "opportunities": [...]
    }
  },
  "totalValue": 500000,
  "totalCount": 25
}
```

#### Calculate Probability
```http
POST /opportunities/{id}/calculate-probability

Response: 200 OK
{
  "probability": 65
}
```

#### Update Probability
```http
POST /opportunities/{id}/update-probability

Response: 200 OK
```

#### Forecast Revenue
```http
GET /opportunities/forecast/revenue

Response: 200 OK
{
  "period": "Next 3 months",
  "predictedRevenue": 500000,
  "weightedRevenue": 275000,
  "opportunities": 15
}
```

#### Get Stale Opportunities
```http
GET /opportunities/pipeline/stale?days=30

Response: 200 OK
```

#### Close Won
```http
POST /opportunities/{id}/close-won
Content-Type: application/json

{
  "actualValue": 55000,
  "notes": "Great negotiation"
}

Response: 200 OK
```

#### Close Lost
```http
POST /opportunities/{id}/close-lost
Content-Type: application/json

{
  "reason": "Chose competitor",
  "notes": "Better pricing"
}

Response: 200 OK
```

#### Reopen Opportunity
```http
POST /opportunities/{id}/reopen
Content-Type: application/json

{
  "reason": "Customer reconsidering"
}

Response: 200 OK
```

### 2.3 Activities

#### Log Activity
```http
POST /opportunities/{id}/activities
Content-Type: application/json

{
  "type": "CALL",
  "description": "Discussed pricing"
}

Response: 201 Created
```

#### Get Activities
```http
GET /opportunities/{id}/activities

Response: 200 OK
```

#### Schedule Follow-up
```http
POST /opportunities/{id}/schedule-follow-up
Content-Type: application/json

{
  "scheduledFor": "2026-02-15T10:00:00Z",
  "description": "Follow up on proposal",
  "type": "CALL"
}

Response: 201 Created
```

#### Get Upcoming Activities
```http
GET /opportunities/activities/upcoming?agentId=agent_123

Response: 200 OK
```

---

## 3. Activities API

### 3.1 CRUD Operations

#### Create Activity
```http
POST /activities
Content-Type: application/json

{
  "type": "CALL",
  "description": "Initial contact call",
  "leadId": "lead_xxx"
}

Response: 201 Created
```

#### Get All Activities
```http
GET /activities?type=CALL&leadId=lead_xxx

Response: 200 OK
```

#### Get Activity by ID
```http
GET /activities/{id}

Response: 200 OK
```

#### Update Activity
```http
PUT /activities/{id}
Content-Type: application/json

{
  "completedAt": "2026-01-28T15:00:00Z"
}

Response: 200 OK
```

#### Delete Activity
```http
DELETE /activities/{id}

Response: 204 No Content
```

### 3.2 Activity Types

#### Log Call
```http
POST /activities/log-call
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "description": "Discussed insurance options",
  "duration": 30,
  "outcome": "Interested"
}

Response: 201 Created
```

#### Log Email
```http
POST /activities/log-email
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "subject": "Insurance Quote",
  "body": "Dear customer...",
  "status": "sent"
}

Response: 201 Created
```

#### Log Meeting
```http
POST /activities/log-meeting
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "title": "Product Demo",
  "scheduledFor": "2026-02-15T10:00:00Z",
  "duration": 60,
  "location": "Office"
}

Response: 201 Created
```

#### Log Note
```http
POST /activities/log-note
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "content": "Customer prefers monthly payment"
}

Response: 201 Created
```

#### Log Task
```http
POST /activities/log-task
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "title": "Send quote",
  "dueDate": "2026-02-10T00:00:00Z",
  "priority": "high"
}

Response: 201 Created
```

#### Log Demo
```http
POST /activities/log-demo
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "description": "Product demo completed",
  "duration": 45,
  "feedback": "Very interested"
}

Response: 201 Created
```

#### Log Proposal
```http
POST /activities/log-proposal
Content-Type: application/json

{
  "opportunityId": "opp_xxx",
  "title": "Enterprise Insurance Proposal",
  "value": 50000,
  "documentUrl": "https://..."
}

Response: 201 Created
```

#### Log Document
```http
POST /activities/log-document
Content-Type: application/json

{
  "leadId": "lead_xxx",
  "title": "Contract signed",
  "documentType": "contract",
  "documentUrl": "https://..."
}

Response: 201 Created
```

### 3.3 Timeline

#### Get Timeline
```http
GET /activities/timeline/lead/lead_xxx

Response: 200 OK
```

#### Get Recent Activities
```http
GET /activities/agent/{agentId}/recent?days=7

Response: 200 OK
```

#### Get Activity Summary
```http
GET /activities/agent/{agentId}/summary?period=week

Response: 200 OK
{
  "totalActivities": 45,
  "byType": {
    "CALL": 15,
    "EMAIL": 20,
    "MEETING": 5
  },
  "completedTasks": 12,
  "pendingTasks": 8
}
```

#### Export Activities
```http
GET /activities/export?type=CALL

Response: 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

## 4. Campaigns API

### 4.1 CRUD Operations

#### Create Campaign
```http
POST /campaigns
Content-Type: application/json

{
  "name": "Q1 2026 Promotion",
  "description": "Special insurance offer",
  "templateId": "tpl_xxx",
  "segmentIds": ["seg_hot_leads"],
  "scheduledDate": "2026-02-15T10:00:00Z"
}

Response: 201 Created
```

#### Get All Campaigns
```http
GET /campaigns?status=SCHEDULED

Response: 200 OK
```

#### Get Campaign by ID
```http
GET /campaigns/{id}

Response: 200 OK
```

#### Update Campaign
```http
PUT /campaigns/{id}
Content-Type: application/json

{
  "scheduledDate": "2026-02-20T10:00:00Z"
}

Response: 200 OK
```

#### Delete Campaign
```http
DELETE /campaigns/{id}

Response: 204 No Content
```

### 4.2 Execution

#### Schedule Campaign
```http
POST /campaigns/{id}/schedule
Content-Type: application/json

{
  "scheduledDate": "2026-02-15T10:00:00Z"
}

Response: 200 OK
```

#### Send Campaign
```http
POST /campaigns/{id}/send

Response: 200 OK
{
  "campaignId": "cmp_xxx",
  "totalRecipients": 150,
  "sent": 148,
  "failed": 2
}
```

#### Send Test
```http
POST /campaigns/{id}/send-test
Content-Type: application/json

{
  "emails": ["test@example.com"]
}

Response: 200 OK
```

#### Pause Campaign
```http
POST /campaigns/{id}/pause

Response: 200 OK
```

#### Resume Campaign
```http
POST /campaigns/{id}/resume

Response: 200 OK
```

#### Cancel Campaign
```http
POST /campaigns/{id}/cancel

Response: 200 OK
```

#### Duplicate Campaign
```http
POST /campaigns/{id}/duplicate

Response: 201 Created
```

#### Get Sending Queue
```http
GET /campaigns/queue/sending

Response: 200 OK
```

### 4.3 Analytics

#### Get Statistics
```http
GET /campaigns/{id}/statistics

Response: 200 OK
{
  "totalSent": 148,
  "delivered": 145,
  "opened": 87,
  "clicked": 23,
  "openRate": 60.14,
  "clickRate": 26.44,
  "conversionRate": 3.45
}
```

#### Get Open Rate
```http
GET /campaigns/{id}/open-rate

Response: 200 OK
{
  "openRate": 60.14
}
```

#### Get Click Rate
```http
GET /campaigns/{id}/click-rate

Response: 200 OK
```

#### Get Conversion Rate
```http
GET /campaigns/{id}/conversion-rate

Response: 200 OK
```

#### Get Unsubscribe Rate
```http
GET /campaigns/{id}/unsubscribe-rate

Response: 200 OK
```

#### Get Bounce Rate
```http
GET /campaigns/{id}/bounce-rate

Response: 200 OK
```

### 4.4 Segmentation

#### Create Segment
```http
POST /campaigns/segments
Content-Type: application/json

{
  "name": "Hot Leads",
  "description": "Leads with high score",
  "criteria": {
    "minScore": 70,
    "status": "NEW"
  }
}

Response: 201 Created
```

#### Get Recipients
```http
GET /campaigns/{id}/recipients

Response: 200 OK
```

#### Add Recipients
```http
POST /campaigns/{id}/add-recipients
Content-Type: application/json

{
  "contactIds": ["lead_1", "lead_2"]
}

Response: 200 OK
```

#### Remove Recipients
```http
POST /campaigns/{id}/remove-recipients
Content-Type: application/json

{
  "contactIds": ["lead_3"]
}

Response: 200 OK
```

---

## 5. Analytics API

### 5.1 Lead Analytics

#### Get Lead Statistics
```http
GET /analytics/leads/statistics?source=WEBSITE

Response: 200 OK
{
  "total": 250,
  "new": 80,
  "contacted": 60,
  "qualified": 40,
  "converted": 70,
  "conversionRate": 28.0,
  "averageScore": 65.5
}
```

#### Get Conversion Funnel
```http
GET /analytics/leads/conversion-funnel?period=month

Response: 200 OK
{
  "period": "Last 30 days",
  "stages": [
    { "name": "New Leads", "count": 200, "percentage": 100 },
    { "name": "Contacted", "count": 150, "percentage": 75 },
    { "name": "Qualified", "count": 80, "percentage": 40 },
    { "name": "Converted", "count": 25, "percentage": 12.5 }
  ]
}
```

#### Get Source Performance
```http
GET /analytics/leads/source-performance

Response: 200 OK
```

### 5.2 Sales Analytics

#### Get Sales Statistics
```http
GET /analytics/sales/statistics

Response: 200 OK
{
  "totalOpportunities": 50,
  "wonOpportunities": 15,
  "lostOpportunities": 5,
  "winRate": 75.0,
  "averageDealSize": 45000
}
```

#### Get Revenue Forecast
```http
GET /analytics/sales/revenue-forecast?months=3

Response: 200 OK
```

#### Get Win/Loss Analysis
```http
GET /analytics/sales/win-loss-analysis?period=month

Response: 200 OK
```

#### Get Average Deal Size
```http
GET /analytics/sales/average-deal-size

Response: 200 OK
{
  "averageDealSize": 45000
}
```

#### Get Average Sales Cycle
```http
GET /analytics/sales/average-sales-cycle

Response: 200 OK
{
  "averageSalesCycleDays": 45
}
```

### 5.3 Agent Performance

#### Get Agent Performance
```http
GET /analytics/agents/{agentId}/performance?period=month

Response: 200 OK
{
  "agentName": "Juan Vendedor",
  "leadsConverted": 12,
  "opportunitiesWon": 8,
  "totalRevenue": 360000,
  "winRate": 80.0
}
```

#### Get Top Performers
```http
GET /analytics/agents/top-performers?period=month&limit=5

Response: 200 OK
```

#### Get Activity Report
```http
GET /analytics/agents/{agentId}/activity-report?period=week

Response: 200 OK
```

### 5.4 Campaign Analytics

#### Get Campaign ROI
```http
GET /analytics/campaigns/{campaignId}/roi

Response: 200 OK
{
  "roi": 450.25
}
```

#### Get Email Engagement
```http
GET /analytics/campaigns/email-engagement?period=month

Response: 200 OK
{
  "totalCampaigns": 5,
  "totalEmailsSent": 750,
  "averageOpenRate": 58.5,
  "averageClickRate": 22.3
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Lead lead_xxx not found"
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Try again in 60 seconds"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Rate Limits

- **Standard:** 100 requests/minute
- **Bulk operations:** 10 requests/minute
- **Exports:** 5 requests/minute

---

## Webhooks

Subscribe to events:

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["lead.created", "opportunity.won", "campaign.sent"]
}
```

Available events:
- `lead.created`
- `lead.updated`
- `lead.converted`
- `opportunity.created`
- `opportunity.won`
- `opportunity.lost`
- `campaign.sent`
- `campaign.completed`

---

**Version:** 1.0.0
**Last Updated:** 28 January 2026
