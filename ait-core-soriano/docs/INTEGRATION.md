# AIT-CORE SORIANO - Integration Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Overview](#overview)
2. [Integrating Your App](#integrating-your-app)
3. [SDK Usage](#sdk-usage)
4. [Module Integration](#module-integration)
5. [Agent Integration](#agent-integration)
6. [Authentication](#authentication)
7. [Webhook Integration](#webhook-integration)
8. [Event-Driven Integration](#event-driven-integration)
9. [External API Connectors](#external-api-connectors)
10. [Examples & Use Cases](#examples--use-cases)

---

## Overview

This guide explains how to integrate external applications with AIT-CORE SORIANO using various methods:

- **REST API**: Direct HTTP requests
- **SDK**: Official client libraries (JavaScript, Python)
- **WebSocket**: Real-time bidirectional communication
- **Webhooks**: Event-driven notifications
- **Kafka**: Enterprise event streaming

---

## Integrating Your App

### Integration Methods

| Method | Use Case | Complexity | Real-time |
|--------|----------|------------|-----------|
| REST API | Standard CRUD operations | Low | No |
| SDK | Simplified API access | Low | No |
| WebSocket | Real-time updates | Medium | Yes |
| Webhooks | Event notifications | Medium | Yes |
| Kafka | Enterprise event streaming | High | Yes |

### Quick Start

**Step 1**: Get API credentials
```bash
# Contact admin or use web interface to generate API key
```

**Step 2**: Install SDK (optional but recommended)
```bash
npm install @ait-core/sdk
# or
pip install ait-core-sdk
```

**Step 3**: Make your first API call
```javascript
import { AITCoreClient } from '@ait-core/sdk';

const client = new AITCoreClient({
  baseUrl: 'https://api.sorianomediadores.es',
  apiKey: process.env.AIT_API_KEY,
});

const contacts = await client.crm.contacts.list();
console.log(contacts);
```

---

## SDK Usage

### JavaScript/TypeScript SDK

**Installation**:
```bash
npm install @ait-core/sdk
```

**Configuration**:
```typescript
import { AITCoreClient } from '@ait-core/sdk';

const client = new AITCoreClient({
  baseUrl: 'https://api.sorianomediadores.es',
  apiKey: process.env.AIT_API_KEY,
  timeout: 30000,
  retries: 3,
});
```

**Using Modules**:
```typescript
// CRM
const contacts = await client.crm.contacts.list({ page: 1, limit: 20 });
const contact = await client.crm.contacts.get('contact_id');
const newContact = await client.crm.contacts.create({
  name: 'John Doe',
  email: 'john@example.com',
});

// Insurance
const quote = await client.insurance.vida.createQuote({
  customerId: 'cust_123',
  coverage: 100000,
  term: 20,
});

const policy = await client.insurance.vida.createPolicy({
  quoteId: quote.id,
  startDate: '2026-02-01',
});

// Accounting
const entry = await client.accounting.entries.create({
  date: new Date(),
  description: 'Payment to supplier',
  entries: [
    { account: '600', debit: 1000, credit: 0 },
    { account: '572', debit: 0, credit: 1000 },
  ],
});
```

**Using AI Agents**:
```typescript
// Consult specialist
const analysis = await client.agents.insuranceSpecialist.analyze({
  question: 'Analyze risk profile for this client',
  context: {
    age: 45,
    occupation: 'office worker',
    healthStatus: 'good',
  },
});

// Get recommendations
const recommendations = await client.agents.financeSpecialist.recommend({
  situation: 'Client needs investment advice',
  context: {
    capital: 50000,
    riskTolerance: 'medium',
    timeHorizon: '5 years',
  },
});

// Executor agent decision
const decision = await client.agents.cfoAgent.decide({
  situation: 'Approve marketing budget increase',
  options: [
    { id: 'approve', description: 'Increase budget by 20%' },
    { id: 'reject', description: 'Keep current budget' },
  ],
  context: { currentBudget: 100000, requestedIncrease: 20000 },
});
```

### Python SDK

**Installation**:
```bash
pip install ait-core-sdk
```

**Configuration**:
```python
from ait_core import AITCoreClient

client = AITCoreClient(
    base_url='https://api.sorianomediadores.es',
    api_key=os.getenv('AIT_API_KEY'),
    timeout=30,
    retries=3
)
```

**Using Modules**:
```python
# CRM
contacts = client.crm.contacts.list(page=1, limit=20)
contact = client.crm.contacts.get('contact_id')
new_contact = client.crm.contacts.create({
    'name': 'John Doe',
    'email': 'john@example.com'
})

# Insurance
quote = client.insurance.vida.create_quote({
    'customer_id': 'cust_123',
    'coverage': 100000,
    'term': 20
})

# Accounting
entry = client.accounting.entries.create({
    'date': '2026-01-28',
    'description': 'Payment to supplier',
    'entries': [
        {'account': '600', 'debit': 1000, 'credit': 0},
        {'account': '572', 'debit': 0, 'credit': 1000}
    ]
})
```

**Using AI Agents**:
```python
# Consult specialist
analysis = client.agents.insurance_specialist.analyze({
    'question': 'Analyze risk profile for this client',
    'context': {
        'age': 45,
        'occupation': 'office worker',
        'health_status': 'good'
    }
})

# Get recommendations
recommendations = client.agents.finance_specialist.recommend({
    'situation': 'Client needs investment advice',
    'context': {
        'capital': 50000,
        'risk_tolerance': 'medium',
        'time_horizon': '5 years'
    }
})
```

---

## Module Integration

### Integrate AI-ACCOUNTANT

**Create accounting entries**:
```javascript
const entry = await client.accounting.entries.create({
  date: '2026-01-28',
  description: 'Monthly salary payment',
  entries: [
    { account: '640', debit: 10000, credit: 0 },   // Salaries expense
    { account: '465', debit: 0, credit: 2000 },     // Withholding tax
    { account: '476', debit: 0, credit: 1000 },     // Social security
    { account: '572', debit: 0, credit: 7000 },     // Bank payment
  ],
});
```

**Get financial reports**:
```javascript
const balanceSheet = await client.accounting.reports.balanceSheet({
  date: '2026-01-31',
});

const profitLoss = await client.accounting.reports.profitLoss({
  startDate: '2026-01-01',
  endDate: '2026-01-31',
});
```

### Integrate AI-CRM

**Manage contacts**:
```javascript
// Create contact
const contact = await client.crm.contacts.create({
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+34 600 123 456',
  company: 'Acme Corp',
  type: 'prospect',
  source: 'website',
});

// Update contact
await client.crm.contacts.update(contact.id, {
  type: 'customer',
  status: 'active',
});

// Add interaction
await client.crm.interactions.create({
  contactId: contact.id,
  type: 'call',
  subject: 'Product demo',
  notes: 'Interested in cyber insurance',
  date: new Date(),
});
```

### Integrate Insurance Modules

**Create insurance quote**:
```javascript
// Auto insurance quote
const autoQuote = await client.insurance.autos.createQuote({
  customerId: 'cust_123',
  vehicleData: {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    registrationNumber: 'ABC-1234',
  },
  coverage: {
    type: 'comprehensive',
    liability: 100000,
    collision: true,
    theft: true,
  },
  driverData: {
    age: 35,
    experience: 15,
    accidents: 0,
  },
});

console.log(`Premium: €${autoQuote.premium.annual}/year`);
```

**Create policy from quote**:
```javascript
const policy = await client.insurance.autos.createPolicy({
  quoteId: autoQuote.id,
  startDate: '2026-02-01',
  paymentMethod: 'bank_transfer',
  paymentFrequency: 'annual',
});

console.log(`Policy created: ${policy.number}`);
```

**Submit claim**:
```javascript
const claim = await client.insurance.autos.createClaim({
  policyId: policy.id,
  incidentDate: '2026-02-15',
  incidentType: 'collision',
  description: 'Rear-end collision at traffic light',
  estimatedDamage: 2500,
  documents: ['photo1.jpg', 'police_report.pdf'],
});
```

---

## Agent Integration

### Insurance Specialist Integration

**Risk Assessment**:
```javascript
const riskAssessment = await client.agents.insuranceSpecialist.analyze({
  question: 'Assess underwriting risk for business insurance application',
  context: {
    businessType: 'Restaurant',
    revenue: 500000,
    employees: 15,
    location: 'Madrid',
    claimsHistory: {
      last3Years: 1,
      totalPayout: 5000,
    },
    safetyMeasures: {
      fireAlarm: true,
      sprinklerSystem: false,
      securitySystem: true,
    },
  },
  options: {
    depth: 'deep',
    includeReferences: true,
  },
});

console.log(riskAssessment.data.summary);
console.log('Risk Level:', riskAssessment.data.findings[0].importance);
```

**Product Recommendations**:
```javascript
const recommendations = await client.agents.insuranceSpecialist.recommend({
  situation: 'Client needs comprehensive family protection',
  context: {
    familyComposition: {
      adults: 2,
      children: 2,
      ages: [35, 33, 8, 5],
    },
    income: 80000,
    mortgage: 250000,
    currentInsurance: ['health'],
    budget: 300,
  },
  objectives: ['income protection', 'mortgage coverage', 'education funding'],
});

recommendations.data.forEach(rec => {
  console.log(`${rec.title}: ${rec.description}`);
  console.log(`Confidence: ${rec.confidence * 100}%`);
});
```

### Finance Specialist Integration

**Financial Analysis**:
```javascript
const financialAnalysis = await client.agents.financeSpecialist.analyze({
  question: 'Analyze company financial health',
  context: {
    revenue: 1000000,
    expenses: 850000,
    assets: 500000,
    liabilities: 200000,
    cashFlow: {
      operating: 180000,
      investing: -50000,
      financing: -30000,
    },
  },
});

console.log('Financial Health:', financialAnalysis.data.summary);
console.log('Key Metrics:', financialAnalysis.data.findings);
```

### CEO Agent Integration

**Strategic Decision Making**:
```javascript
const decision = await client.agents.ceoAgent.decide({
  situation: 'Decide whether to expand into new insurance product line',
  options: [
    {
      id: 'cyber-insurance',
      description: 'Launch cyber insurance product',
      pros: [
        'High growth market',
        'Low competition',
        'Strong margins',
      ],
      cons: [
        'Requires new expertise',
        'Initial investment: €200K',
        'Regulatory complexity',
      ],
      estimatedImpact: {
        revenue: 500000,
        cost: 200000,
        timeToMarket: '6 months',
      },
    },
    {
      id: 'pet-insurance',
      description: 'Launch pet insurance product',
      pros: [
        'Easier to underwrite',
        'Lower investment',
        'Quick launch',
      ],
      cons: [
        'Lower margins',
        'Competitive market',
        'Limited growth',
      ],
      estimatedImpact: {
        revenue: 200000,
        cost: 50000,
        timeToMarket: '3 months',
      },
    },
  ],
  context: {
    companySize: 50,
    currentProducts: ['vida', 'salud', 'hogar', 'autos'],
    budget: 300000,
    timeline: '2026',
  },
});

console.log('Decision:', decision.data.selectedOption);
console.log('Rationale:', decision.data.rationale);
console.log('Confidence:', decision.data.confidence * 100 + '%');
console.log('Next Actions:', decision.data.nextActions);
```

---

## Authentication

### API Key Authentication

**Get API Key**:
1. Log in to admin panel
2. Navigate to Settings → API Keys
3. Click "Generate New API Key"
4. Copy and store securely

**Use API Key**:
```javascript
// In headers
fetch('https://api.sorianomediadores.es/api/v1/contacts', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
});

// In SDK
const client = new AITCoreClient({
  apiKey: process.env.AIT_API_KEY,
});
```

### OAuth 2.0 Integration

**Authorization Code Flow**:
```javascript
// Step 1: Redirect user to authorization URL
const authUrl = `https://api.sorianomediadores.es/oauth/authorize?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=read write`;

window.location.href = authUrl;

// Step 2: Handle callback
const code = new URLSearchParams(window.location.search).get('code');

// Step 3: Exchange code for access token
const tokenResponse = await fetch('https://api.sorianomediadores.es/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }),
});

const { access_token, refresh_token } = await tokenResponse.json();
```

---

## Webhook Integration

### Configure Webhooks

```javascript
// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://yourapp.com/webhooks/ait-core',
  events: [
    'policy.created',
    'policy.updated',
    'claim.submitted',
    'payment.received',
  ],
  secret: 'your-webhook-secret',
});

console.log('Webhook ID:', webhook.id);
```

### Handle Webhook Events

**Express.js Example**:
```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();

app.post('/webhooks/ait-core', express.json(), (req, res) => {
  // Verify signature
  const signature = req.headers['x-ait-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', 'your-webhook-secret')
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (`sha256=${expectedSignature}` !== signature) {
    return res.status(401).send('Invalid signature');
  }

  // Process event
  const { type, data } = req.body;

  switch (type) {
    case 'policy.created':
      console.log('New policy:', data.policyId);
      // Send notification, update your database, etc.
      break;

    case 'claim.submitted':
      console.log('New claim:', data.claimId);
      // Trigger internal workflow
      break;

    case 'payment.received':
      console.log('Payment received:', data.amount);
      // Update accounting records
      break;
  }

  res.sendStatus(200);
});

app.listen(3000);
```

---

## Event-Driven Integration

### Kafka Integration

**Subscribe to Events**:
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'your-app',
  brokers: ['kafka.sorianomediadores.es:9092'],
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_USERNAME,
    password: process.env.KAFKA_PASSWORD,
  },
});

const consumer = kafka.consumer({ groupId: 'your-app-group' });

await consumer.connect();
await consumer.subscribe({
  topics: ['module-events', 'agent-events', 'system-events'],
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const event = JSON.parse(message.value.toString());

    console.log(`Received event from ${topic}:`, event);

    // Process event
    switch (event.type) {
      case 'policy.created':
        await handlePolicyCreated(event.data);
        break;
      case 'agent.decision':
        await handleAgentDecision(event.data);
        break;
    }
  },
});
```

**Publish Events**:
```javascript
const producer = kafka.producer();

await producer.connect();

await producer.send({
  topic: 'custom-events',
  messages: [
    {
      key: 'event-id',
      value: JSON.stringify({
        type: 'custom.event',
        data: { ... },
        timestamp: new Date(),
      }),
    },
  ],
});
```

---

## External API Connectors

### Using External Connectors

AIT-CONNECTOR provides 200+ external API integrations. Access them through the connector API:

```javascript
// Call external insurance company API
const mapfreQuote = await client.connector.external.call({
  connectorId: 'mapfre',
  method: 'createQuote',
  params: {
    productType: 'auto',
    vehicleData: { ... },
    customerData: { ... },
  },
});

// Call government API (DGS)
const dgsValidation = await client.connector.external.call({
  connectorId: 'dgs',
  method: 'validatePolicy',
  params: {
    policyNumber: 'POL-12345',
    insuranceCompany: 'Mapfre',
  },
});

// Call payment gateway
const stripePayment = await client.connector.external.call({
  connectorId: 'stripe',
  method: 'createPayment',
  params: {
    amount: 1000,
    currency: 'EUR',
    customerId: 'cust_abc123',
  },
});
```

---

## Examples & Use Cases

### Use Case 1: Insurance Broker Portal

**Scenario**: Build a customer portal for insurance quotes and policy management.

```javascript
// Step 1: User submits quote request
async function requestQuote(customerId, insuranceType, details) {
  // Consult insurance specialist
  const analysis = await client.agents.insuranceSpecialist.analyze({
    question: `Analyze ${insuranceType} insurance request`,
    context: details,
  });

  // Generate quote
  const quote = await client.insurance[insuranceType].createQuote({
    customerId,
    ...details,
  });

  return {
    quote,
    analysis: analysis.data.summary,
    recommendations: analysis.data.insights,
  };
}

// Step 2: User purchases policy
async function purchasePolicy(quoteId, paymentDetails) {
  const policy = await client.insurance[insuranceType].createPolicy({
    quoteId,
    startDate: paymentDetails.startDate,
    paymentMethod: paymentDetails.method,
  });

  // Process payment
  const payment = await client.connector.external.call({
    connectorId: 'stripe',
    method: 'createPayment',
    params: {
      amount: policy.premium,
      currency: 'EUR',
      metadata: { policyId: policy.id },
    },
  });

  return { policy, payment };
}

// Step 3: User views policies
async function getUserPolicies(customerId) {
  const policies = await client.insurance.policies.list({
    customerId,
    status: 'active',
  });

  return policies;
}
```

### Use Case 2: Financial Dashboard

**Scenario**: Build an executive financial dashboard.

```javascript
async function getFinancialDashboard() {
  // Get accounting data
  const balanceSheet = await client.accounting.reports.balanceSheet({
    date: new Date(),
  });

  const profitLoss = await client.accounting.reports.profitLoss({
    startDate: startOfMonth(new Date()),
    endDate: new Date(),
  });

  // Get AI analysis
  const analysis = await client.agents.financeSpecialist.analyze({
    question: 'Analyze current financial position',
    context: {
      balanceSheet,
      profitLoss,
    },
  });

  // Get cash flow forecast
  const forecast = await client.treasury.forecast({
    horizon: '90-days',
  });

  return {
    metrics: {
      revenue: profitLoss.revenue,
      expenses: profitLoss.expenses,
      profit: profitLoss.profit,
      assets: balanceSheet.assets,
      liabilities: balanceSheet.liabilities,
    },
    analysis: analysis.data,
    forecast,
  };
}
```

### Use Case 3: Automated Lead Nurturing

**Scenario**: Automatically nurture leads based on AI recommendations.

```javascript
async function nurtureLead(leadId) {
  // Get lead data
  const lead = await client.crm.leads.get(leadId);

  // Get customer specialist recommendations
  const recommendations = await client.agents.customerSpecialist.recommend({
    situation: 'Lead nurturing strategy',
    context: {
      leadData: lead,
      interactionHistory: lead.interactions,
      leadScore: lead.score,
    },
  });

  // Execute recommended actions
  for (const action of recommendations.data) {
    switch (action.type) {
      case 'send_email':
        await client.marketing.email.send({
          to: lead.email,
          template: action.emailTemplate,
          personalization: { name: lead.name },
        });
        break;

      case 'schedule_call':
        await client.crm.tasks.create({
          assigneeId: lead.ownerId,
          type: 'call',
          subject: 'Follow up with lead',
          dueDate: action.suggestedDate,
        });
        break;

      case 'add_to_campaign':
        await client.marketing.campaigns.addContact({
          campaignId: action.campaignId,
          contactId: lead.contactId,
        });
        break;
    }
  }
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-28
**Support:** integration-support@sorianomediadores.es
