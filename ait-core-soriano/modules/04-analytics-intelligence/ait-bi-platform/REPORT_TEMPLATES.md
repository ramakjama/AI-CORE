# AIT BI Platform - Report Templates Guide

## Overview

This guide details all 15 pre-built report templates available in the AIT BI Platform, including their purpose, parameters, and output structure.

---

## Table of Contents

1. [Monthly Revenue Report](#1-monthly-revenue-report)
2. [Quarterly Performance Report](#2-quarterly-performance-report)
3. [Annual Summary Report](#3-annual-summary-report)
4. [Policy Report](#4-policy-report)
5. [Claim Report](#5-claim-report)
6. [Customer Report](#6-customer-report)
7. [Agent Performance Report](#7-agent-performance-report)
8. [Commission Report](#8-commission-report)
9. [Loss Ratio Report](#9-loss-ratio-report)
10. [Expense Ratio Report](#10-expense-ratio-report)
11. [Combined Ratio Report](#11-combined-ratio-report)
12. [Renewal Report](#12-renewal-report)
13. [Cancellation Report](#13-cancellation-report)
14. [Customer Segmentation Report](#14-customer-segmentation-report)
15. [Product Performance Report](#15-product-performance-report)

---

## 1. Monthly Revenue Report

**Purpose:** Analyze monthly revenue breakdown and trends by product and region.

**Endpoint:** `POST /api/v1/bi/reports/templates/monthly-revenue`

**Parameters:**
```json
{
  "month": 1,      // 1-12
  "year": 2024
}
```

**Output Sections:**
- Revenue Summary (total, gross, net, earned)
- Revenue by Product Type
- Revenue by Region
- Month-over-Month Comparison
- Revenue Trend Chart

**Use Cases:**
- Monthly financial review
- Revenue tracking
- Product performance analysis
- Regional comparison

---

## 2. Quarterly Performance Report

**Purpose:** Comprehensive business performance metrics for a quarter.

**Endpoint:** `POST /api/v1/bi/reports/templates/quarterly-performance`

**Parameters:**
```json
{
  "quarter": 1,    // 1-4
  "year": 2024
}
```

**Output Sections:**
- Executive Summary (all KPIs)
- Policy Performance
- Claims Analysis
- Customer Metrics
- Financial Ratios
- Quarter-over-Quarter Trends

**Use Cases:**
- Board presentations
- Quarterly reviews
- Strategic planning
- Investor reports

---

## 3. Annual Summary Report

**Purpose:** Year-end comprehensive business summary.

**Endpoint:** `POST /api/v1/bi/reports/templates/annual-summary`

**Parameters:**
```json
{
  "year": 2024
}
```

**Output Sections:**
- Year in Review (highlights)
- Annual Financial Summary
- Policy Growth Analysis
- Customer Acquisition & Retention
- Claims Performance
- Key Achievements
- Year-over-Year Comparison

**Use Cases:**
- Annual review meetings
- Year-end reporting
- Regulatory compliance
- Strategic planning

---

## 4. Policy Report

**Purpose:** Detailed policy information and statistics.

**Endpoint:** `POST /api/v1/bi/reports/templates/policy-report`

**Parameters:**
```json
{
  "status": ["active", "pending", "expired"],
  "productType": ["auto", "home", "life"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "agentId": ["AGT-001"],
  "region": ["north", "south"]
}
```

**Output Sections:**
- Policy Summary Statistics
- Policy List (detailed table)
- Distribution by Product
- Distribution by Region
- Premium Analysis
- Policy Lifecycle Analysis

**Use Cases:**
- Portfolio review
- Policy audit
- Product mix analysis
- Agent performance tracking

---

## 5. Claim Report

**Purpose:** Claims analysis and settlement data.

**Endpoint:** `POST /api/v1/bi/reports/templates/claim-report`

**Parameters:**
```json
{
  "status": ["open", "paid", "rejected"],
  "claimType": ["auto", "property", "medical"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "minAmount": 1000,
  "maxAmount": 100000
}
```

**Output Sections:**
- Claims Summary
- Claims List (detailed table)
- Settlement Time Analysis
- Claims by Type
- Average Claim Amount
- Rejection Analysis

**Use Cases:**
- Claims management
- Loss ratio analysis
- Fraud detection
- Process improvement

---

## 6. Customer Report

**Purpose:** Customer demographics and behavior analysis.

**Endpoint:** `POST /api/v1/bi/reports/templates/customer-report`

**Parameters:**
```json
{
  "segment": ["premium", "standard", "basic"],
  "status": ["active", "inactive"],
  "dateFrom": "2024-01-01",
  "dateTo": "2024-12-31",
  "region": ["north", "south"]
}
```

**Output Sections:**
- Customer Overview
- Customer Segmentation
- Demographic Analysis
- Lifetime Value Distribution
- Retention Analysis
- Acquisition Trends

**Use Cases:**
- Customer insights
- Segmentation analysis
- Marketing planning
- Retention strategies

---

## 7. Agent Performance Report

**Purpose:** Individual agent sales and productivity metrics.

**Endpoint:** `POST /api/v1/bi/reports/templates/agent-performance`

**Parameters:**
```json
{
  "agentId": "AGT-001",
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

**Output Sections:**
- Agent Profile
- Sales Performance (policies sold, revenue generated)
- Commission Summary
- Customer Satisfaction Scores
- Activity Metrics
- Performance vs Targets
- Peer Comparison

**Use Cases:**
- Performance review
- Commission calculation
- Training needs assessment
- Recognition programs

---

## 8. Commission Report

**Purpose:** Agent commissions and payouts.

**Endpoint:** `POST /api/v1/bi/reports/templates/commission-report`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

**Output Sections:**
- Total Commissions Payable
- Commission by Agent (detailed breakdown)
- Commission by Product Type
- Payout Schedule
- Year-to-Date Summary

**Use Cases:**
- Payroll processing
- Commission tracking
- Budget planning
- Agent compensation

---

## 9. Loss Ratio Report

**Purpose:** Loss ratio analysis by product and region.

**Endpoint:** `POST /api/v1/bi/reports/templates/loss-ratio`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Output Sections:**
- Overall Loss Ratio
- Loss Ratio by Product
- Loss Ratio by Region
- Trend Analysis
- Comparison to Industry Benchmarks
- Risk Assessment

**Use Cases:**
- Underwriting review
- Pricing strategy
- Risk management
- Product profitability

---

## 10. Expense Ratio Report

**Purpose:** Operating expense analysis.

**Endpoint:** `POST /api/v1/bi/reports/templates/expense-ratio`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Output Sections:**
- Total Expense Ratio
- Expense Breakdown (by category)
- Expense Ratio by Product
- Trend Analysis
- Cost Optimization Opportunities

**Use Cases:**
- Cost management
- Budget planning
- Efficiency analysis
- Financial planning

---

## 11. Combined Ratio Report

**Purpose:** Combined ratio analysis and trends.

**Endpoint:** `POST /api/v1/bi/reports/templates/combined-ratio`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Output Sections:**
- Combined Ratio Summary
- Loss Ratio Component
- Expense Ratio Component
- Trend Analysis
- Product-level Combined Ratios
- Profitability Assessment

**Use Cases:**
- Profitability analysis
- Executive reporting
- Strategic planning
- Investor relations

---

## 12. Renewal Report

**Purpose:** Policy renewal status and opportunities.

**Endpoint:** `POST /api/v1/bi/reports/templates/renewal-report`

**Parameters:**
```json
{
  "upcoming": true  // true for upcoming, false for recent
}
```

**Output Sections:**
- Renewal Summary
- Policies Due for Renewal (list)
- Renewal Rate Analysis
- At-Risk Policies
- Renewal Value Projection
- Action Items

**Use Cases:**
- Retention planning
- Customer outreach
- Revenue forecasting
- Agent task assignment

---

## 13. Cancellation Report

**Purpose:** Policy cancellations and reasons analysis.

**Endpoint:** `POST /api/v1/bi/reports/templates/cancellation-report`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Output Sections:**
- Cancellation Summary
- Cancellation List (detailed)
- Cancellation Reasons
- Impact on Revenue
- Product-level Analysis
- Prevention Strategies

**Use Cases:**
- Churn analysis
- Product improvement
- Retention strategies
- Customer feedback

---

## 14. Customer Segmentation Report

**Purpose:** Customer segments and characteristics analysis.

**Endpoint:** `POST /api/v1/bi/reports/templates/customer-segmentation`

**Parameters:**
```json
{}  // No parameters required
```

**Output Sections:**
- Segmentation Overview
- Segment Profiles (demographics, behavior)
- Segment Performance
- Lifetime Value by Segment
- Growth Opportunities
- Marketing Recommendations

**Use Cases:**
- Marketing strategy
- Product development
- Customer targeting
- Personalization

---

## 15. Product Performance Report

**Purpose:** Product-level performance metrics.

**Endpoint:** `POST /api/v1/bi/reports/templates/product-performance`

**Parameters:**
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Output Sections:**
- Product Summary
- Sales Performance by Product
- Profitability Analysis
- Claims Performance
- Customer Satisfaction
- Market Share
- Growth Trends

**Use Cases:**
- Product strategy
- Portfolio optimization
- Pricing decisions
- Product development

---

## Export Formats

All reports support 5 export formats:

### PDF
- Professional layout
- Charts and tables
- Company branding
- Print-ready

### Excel
- Multiple sheets
- Formatted tables
- Charts
- Formulas for analysis

### CSV
- Raw data
- Easy import/export
- Database loading
- Custom analysis

### JSON
- API integration
- Automated processing
- Data transformation
- System integration

### HTML
- Web viewing
- Email distribution
- Interactive elements
- Responsive design

---

## Scheduling Reports

All reports can be scheduled using cron expressions:

```typescript
POST /api/v1/bi/reports/:id/schedule

{
  "schedule": "0 9 * * 1",  // Every Monday at 9 AM
  "recipients": [
    "cfo@company.com",
    "ceo@company.com"
  ]
}
```

### Common Schedules

```
Daily:     "0 9 * * *"        // 9 AM every day
Weekly:    "0 9 * * 1"        // 9 AM every Monday
Monthly:   "0 9 1 * *"        // 9 AM first day of month
Quarterly: "0 9 1 1,4,7,10 *" // 9 AM first day of quarter
```

---

## Best Practices

### Report Design
1. Include executive summary
2. Use clear visualizations
3. Highlight key findings
4. Provide actionable insights
5. Include period comparisons

### Performance
1. Use appropriate date ranges
2. Limit detail rows (use pagination)
3. Cache static data
4. Schedule during off-peak hours
5. Monitor generation times

### Distribution
1. Send to relevant stakeholders only
2. Use appropriate format for audience
3. Include context and notes
4. Set retention policies
5. Secure sensitive data

### Customization
1. Clone and modify templates
2. Add custom metrics
3. Adjust visualizations
4. Customize branding
5. Add business rules

---

## Support

For report customization or issues:
- Email: reports@ait-core.com
- Documentation: https://docs.ait-core.com/reports
- Custom Reports: Contact your account manager
