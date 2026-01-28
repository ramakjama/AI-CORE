# AIT Business Intelligence Platform - User Guide

## Overview

The AIT BI Platform is a comprehensive Business Intelligence solution that provides interactive dashboards, advanced analytics, custom reports, and real-time metrics for insurance operations.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboards](#dashboards)
3. [Metrics & KPIs](#metrics--kpis)
4. [Reports](#reports)
5. [Query Builder](#query-builder)
6. [Charts & Visualizations](#charts--visualizations)
7. [API Reference](#api-reference)

---

## Getting Started

### Installation

```bash
npm install @ait-core/ait-bi-platform
```

### Basic Setup

```typescript
import { BiPlatformModule } from '@ait-core/ait-bi-platform';

@Module({
  imports: [BiPlatformModule],
})
export class AppModule {}
```

### Configuration

Set environment variables:

```env
BI_PLATFORM_ENABLED=true
BI_REFRESH_INTERVAL=300000
BI_CACHE_TTL=60000
```

---

## Dashboards

### Creating Dashboards

#### From Templates

The platform provides 10 pre-built dashboard templates:

```typescript
// Executive Dashboard
POST /api/v1/bi/dashboard-templates/executive

// Sales Dashboard
POST /api/v1/bi/dashboard-templates/sales

// Operations Dashboard
POST /api/v1/bi/dashboard-templates/operations

// Finance Dashboard
POST /api/v1/bi/dashboard-templates/finance

// Claims Dashboard
POST /api/v1/bi/dashboard-templates/claims

// CRM Dashboard
POST /api/v1/bi/dashboard-templates/crm

// Agent Performance Dashboard
POST /api/v1/bi/dashboard-templates/agent

// Customer Dashboard
POST /api/v1/bi/dashboard-templates/customer

// Compliance Dashboard
POST /api/v1/bi/dashboard-templates/compliance

// Marketing Dashboard
POST /api/v1/bi/dashboard-templates/marketing
```

#### Custom Dashboard

```typescript
POST /api/v1/bi/dashboards

{
  "name": "My Custom Dashboard",
  "description": "Custom analytics dashboard",
  "type": "custom",
  "visibility": "private",
  "refreshInterval": 300
}
```

### Managing Widgets

#### Add Widget

```typescript
POST /api/v1/bi/dashboards/:id/widgets

{
  "config": {
    "type": "NUMBER_CARD",
    "title": "Total Revenue",
    "dataSource": "metrics",
    "query": { "metric": "revenue", "period": "month" },
    "options": {
      "prefix": "€",
      "showTrend": true
    }
  },
  "position": { "x": 0, "y": 0, "width": 3, "height": 2 }
}
```

#### Widget Types

1. **NUMBER_CARD** - Single metric with trend
2. **LINE_CHART** - Trends over time
3. **BAR_CHART** - Comparisons
4. **PIE_CHART** - Proportions
5. **AREA_CHART** - Volume over time
6. **FUNNEL_CHART** - Conversion rates
7. **GAUGE_CHART** - Metric vs target
8. **HEATMAP** - Patterns across dimensions
9. **TABLE** - Tabular data
10. **LEADERBOARD** - Rankings
11. **SPARKLINE** - Mini trend line
12. **PROGRESS_BAR** - Progress to goal
13. **MAP** - Geographic data
14. **TIMELINE** - Events over time
15. **CUSTOM** - Custom component

### Dashboard Operations

```typescript
// Get all dashboards
GET /api/v1/bi/dashboards

// Get dashboard by ID
GET /api/v1/bi/dashboards/:id

// Update dashboard
PUT /api/v1/bi/dashboards/:id

// Delete dashboard
DELETE /api/v1/bi/dashboards/:id

// Duplicate dashboard
POST /api/v1/bi/dashboards/:id/duplicate

// Refresh dashboard data
POST /api/v1/bi/dashboards/:id/refresh

// Toggle favorite
POST /api/v1/bi/dashboards/:id/favorite
```

---

## Metrics & KPIs

### Available KPIs (30+)

#### Revenue & Financial
- Total Revenue
- Gross Premium
- Net Premium
- Earned Premium
- Commission Revenue
- Investment Income

#### Policy Metrics
- Total Policies
- New Policies
- Renewed Policies
- Canceled Policies
- Active Policies
- Pending Policies

#### Claims Metrics
- Total Claims
- Paid Claims
- Reserved Claims
- Rejected Claims
- Claim Amount
- Average Claim Amount

#### Customer Metrics
- Total Customers
- New Customers
- Active Customers
- Churned Customers
- Retention Rate
- Churn Rate
- Customer LTV
- Customer Acquisition Cost (CAC)

#### Operational Metrics
- Total Quotes
- Conversion Rate
- Average Response Time

#### Financial Ratios
- Loss Ratio
- Expense Ratio
- Combined Ratio

### Get KPIs

```typescript
GET /api/v1/bi/metrics/kpis?startDate=2024-01-01&endDate=2024-01-31

Response:
{
  "revenue": 875432.50,
  "policies": 847,
  "claims": 67,
  "customers": 3542,
  "retention": 94.2,
  "churn": 5.8,
  "ltv": 3847.20,
  "cac": 285.50,
  "conversionRate": 23.4,
  "lossRatio": 62.3,
  "expenseRatio": 24.1,
  "combinedRatio": 86.4
}
```

### Time Series

```typescript
GET /api/v1/bi/metrics/time-series?metric=revenue&startDate=2024-01-01&endDate=2024-01-31&granularity=day

Response:
{
  "metric": "revenue",
  "granularity": "day",
  "points": [
    { "timestamp": "2024-01-01", "value": 28453.20 },
    { "timestamp": "2024-01-02", "value": 31247.80 },
    ...
  ]
}
```

### Real-Time Metrics

```typescript
// Live Dashboard
GET /api/v1/bi/metrics/realtime/dashboard

// Current Active Users
GET /api/v1/bi/metrics/realtime/active

// Today's Revenue
GET /api/v1/bi/metrics/realtime/today-revenue

// Last 24 Hours
GET /api/v1/bi/metrics/realtime/last-24-hours?metric=revenue&granularity=hour

// Active Alerts
GET /api/v1/bi/metrics/realtime/alerts

// Top Performers
GET /api/v1/bi/metrics/realtime/top-performers?dimension=agent&limit=10
```

---

## Reports

### Generate Reports

#### Pre-defined Templates (15)

```typescript
// Monthly Revenue Report
POST /api/v1/bi/reports/templates/monthly-revenue
{ "month": 1, "year": 2024 }

// Quarterly Performance
POST /api/v1/bi/reports/templates/quarterly-performance
{ "quarter": 1, "year": 2024 }

// Annual Summary
POST /api/v1/bi/reports/templates/annual-summary
{ "year": 2024 }

// Policy Report
POST /api/v1/bi/reports/templates/policy-report
{ "status": ["active"], "dateFrom": "2024-01-01" }

// Claim Report
POST /api/v1/bi/reports/templates/claim-report
{ "status": ["paid", "pending"] }

// Customer Report
POST /api/v1/bi/reports/templates/customer-report
{ "segment": ["premium"] }

// Agent Performance
POST /api/v1/bi/reports/templates/agent-performance
{ "agentId": "AGT-001", "period": {...} }

// Commission Report
POST /api/v1/bi/reports/templates/commission-report
{ "period": {...} }

// Loss Ratio Report
POST /api/v1/bi/reports/templates/loss-ratio
{ "period": {...} }

// Expense Ratio Report
POST /api/v1/bi/reports/templates/expense-ratio
{ "period": {...} }

// Combined Ratio Report
POST /api/v1/bi/reports/templates/combined-ratio
{ "period": {...} }

// Renewal Report
POST /api/v1/bi/reports/templates/renewal-report
{ "upcoming": true }

// Cancellation Report
POST /api/v1/bi/reports/templates/cancellation-report
{ "period": {...} }

// Customer Segmentation
POST /api/v1/bi/reports/templates/customer-segmentation

// Product Performance
POST /api/v1/bi/reports/templates/product-performance
{ "period": {...} }
```

### Export Formats

Reports can be exported in 5 formats:

```typescript
// PDF
GET /api/v1/bi/reports/:id/export?format=pdf

// Excel
GET /api/v1/bi/reports/:id/export?format=excel

// CSV
GET /api/v1/bi/reports/:id/export?format=csv

// JSON
GET /api/v1/bi/reports/:id/export?format=json

// HTML
GET /api/v1/bi/reports/:id/export?format=html
```

### Schedule Reports

```typescript
POST /api/v1/bi/reports/:id/schedule

{
  "schedule": "0 9 * * 1",  // Every Monday at 9 AM
  "recipients": ["user@example.com"]
}
```

---

## Query Builder

### Build Custom Queries

```typescript
POST /api/v1/bi/query-builder/build

{
  "select": [
    { "field": "policy_number" },
    { "field": "premium", "aggregation": "SUM", "alias": "total_premium" }
  ],
  "from": "policies",
  "where": [
    { "field": "status", "operator": "=", "value": "active" }
  ],
  "groupBy": ["product_type"],
  "orderBy": [
    { "field": "total_premium", "direction": "DESC" }
  ],
  "limit": 100
}
```

### Natural Language Queries

```typescript
POST /api/v1/bi/query-builder/natural-language

{
  "prompt": "Show me all active policies with premium greater than 1000"
}
```

### Save & Reuse Queries

```typescript
// Save Query
POST /api/v1/bi/query-builder/save
{
  "name": "Active High-Value Policies",
  "query": {...}
}

// Execute Saved Query
POST /api/v1/bi/query-builder/saved/:id/execute
```

---

## Charts & Visualizations

### Create Charts

```typescript
// Line Chart
POST /api/v1/bi/charts/line
{
  "data": {
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      { "label": "Revenue", "data": [1000, 1500, 1200] }
    ]
  },
  "options": {
    "responsive": true,
    "legend": { "display": true }
  }
}

// Bar Chart
POST /api/v1/bi/charts/bar

// Pie Chart
POST /api/v1/bi/charts/pie

// Scatter Chart
POST /api/v1/bi/charts/scatter

// Heatmap
POST /api/v1/bi/charts/heatmap

// Gauge
POST /api/v1/bi/charts/gauge

// Funnel
POST /api/v1/bi/charts/funnel

// Waterfall
POST /api/v1/bi/charts/waterfall

// Sankey
POST /api/v1/bi/charts/sankey

// Treemap
POST /api/v1/bi/charts/treemap
```

### Chart Utilities

```typescript
// Get recommended chart type
POST /api/v1/bi/charts/recommend-type

// Apply theme
POST /api/v1/bi/charts/apply-theme?theme=dark

// Convert data format
POST /api/v1/bi/charts/convert-format?targetLibrary=recharts

// Export as image
GET /api/v1/bi/charts/:id/export?format=png
```

---

## API Reference

### Base URL
```
https://api.example.com/api/v1/bi
```

### Authentication
All endpoints require authentication via JWT token:
```
Authorization: Bearer <token>
```

### Rate Limiting
- 1000 requests per hour per user
- 100 requests per minute per user

### Pagination
```
?limit=20&offset=0
```

### Filtering
```
?type=executive&status=active&dateFrom=2024-01-01
```

### Sorting
```
?sortBy=createdAt&sortOrder=desc
```

---

## Best Practices

### Dashboard Design
1. Limit widgets to 8-12 per dashboard
2. Use appropriate widget types for data
3. Set reasonable refresh intervals (5-15 minutes)
4. Group related metrics together
5. Use consistent color schemes

### Query Optimization
1. Always use LIMIT to prevent large result sets
2. Add indexes on frequently queried columns
3. Use aggregations instead of fetching raw data
4. Cache frequently accessed queries
5. Use date range filters to reduce data volume

### Report Scheduling
1. Schedule during off-peak hours
2. Limit recipients to necessary users
3. Use appropriate formats (CSV for large datasets)
4. Set reasonable retention periods
5. Monitor execution times

### Performance
1. Enable caching for static data
2. Use real-time metrics sparingly
3. Optimize dashboard layouts
4. Limit concurrent dashboard refreshes
5. Monitor API usage

---

## Troubleshooting

### Common Issues

**Dashboard not loading**
- Check refresh interval settings
- Verify data source connectivity
- Check browser console for errors

**Slow query performance**
- Add appropriate indexes
- Reduce date range
- Use aggregations
- Enable query caching

**Report generation fails**
- Check parameter values
- Verify data availability
- Review error logs
- Check export format compatibility

---

## Support

For additional help:
- Documentation: https://docs.ait-core.com/bi-platform
- API Reference: https://api.ait-core.com/docs
- Support: support@ait-core.com
- Community: https://community.ait-core.com
