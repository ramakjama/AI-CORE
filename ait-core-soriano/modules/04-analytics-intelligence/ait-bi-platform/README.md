# AIT Business Intelligence Platform

> Comprehensive Business Intelligence platform with interactive dashboards, advanced analytics, custom reports, and real-time metrics.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ait-core/ait-bi-platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-75%25-brightgreen.svg)](coverage)

---

## Features

### 📊 Interactive Dashboards
- **10 Pre-built Templates** - Executive, Sales, Operations, Finance, Claims, CRM, Agent, Customer, Compliance, Marketing
- **15 Widget Types** - Number cards, charts, tables, maps, gauges, and more
- **Drag & Drop Layout** - Fully customizable dashboard layouts
- **Real-time Updates** - Auto-refresh with configurable intervals
- **Responsive Design** - Works on desktop, tablet, and mobile

### 📈 Advanced Metrics & Analytics
- **30+ KPIs** - Revenue, policies, claims, customers, retention, ratios
- **Time Series Analysis** - Track trends with day/week/month granularity
- **Comparative Analysis** - Compare metrics across periods
- **Trend Forecasting** - AI-powered trend prediction
- **Real-time Metrics** - Live dashboard with current metrics

### 📑 Custom Reports
- **15 Report Templates** - Pre-built reports for common use cases
- **5 Export Formats** - PDF, Excel, CSV, JSON, HTML
- **Scheduled Reports** - Automated report generation and distribution
- **Custom Parameters** - Flexible filtering and grouping
- **Professional Layout** - Publication-ready reports

### 🔍 Query Builder
- **Visual Query Builder** - No SQL knowledge required
- **Natural Language** - Convert plain text to queries
- **Query Optimization** - Automatic performance optimization
- **Saved Queries** - Save and reuse common queries
- **Execution Plans** - View and optimize query performance

### 📉 Charts & Visualizations
- **15+ Chart Types** - Line, bar, pie, scatter, heatmap, funnel, gauge, etc.
- **Multiple Libraries** - Support for Chart.js, Recharts, ECharts
- **Theme Support** - Light and dark themes
- **Export Charts** - PNG, SVG export
- **Responsive Charts** - Auto-resize based on screen size

---

## Installation

```bash
npm install @ait-core/ait-bi-platform
```

---

## Quick Start

### 1. Import Module

```typescript
import { BiPlatformModule } from '@ait-core/ait-bi-platform';

@Module({
  imports: [
    BiPlatformModule,
    TypeOrmModule.forRoot({...}),
  ],
})
export class AppModule {}
```

### 2. Create Dashboard

```typescript
import { BiDashboardService } from '@ait-core/ait-bi-platform';

// Create from template
const dashboard = await dashboardTemplatesService.createExecutiveDashboard(userId);

// Or create custom
const customDashboard = await biDashboardService.create(userId, {
  name: 'My Dashboard',
  type: DashboardType.CUSTOM,
  visibility: DashboardVisibility.PRIVATE,
});
```

### 3. Add Widgets

```typescript
await biDashboardService.addWidget(dashboard.id, {
  config: {
    type: WidgetType.NUMBER_CARD,
    title: 'Total Revenue',
    dataSource: 'metrics',
    query: { metric: 'revenue', period: 'month' },
    options: { prefix: '€', showTrend: true },
  },
  position: { x: 0, y: 0, width: 3, height: 2 },
});
```

### 4. Generate Report

```typescript
import { ReportService } from '@ait-core/ait-bi-platform';

// Create report
const report = await reportService.monthlyRevenue(1, 2024);

// Export as PDF
const pdf = await reportService.exportPDF(report.id);
```

### 5. Query Data

```typescript
import { QueryBuilderService } from '@ait-core/ait-bi-platform';

const query = await queryBuilderService.buildQuery({
  select: [
    { field: 'product_type' },
    { field: 'premium', aggregation: 'SUM', alias: 'total' },
  ],
  from: 'policies',
  where: [{ field: 'status', operator: '=', value: 'active' }],
  groupBy: ['product_type'],
  orderBy: [{ field: 'total', direction: 'DESC' }],
});

const result = await queryBuilderService.executeQuery(query);
```

---

## API Endpoints

### Dashboards
```
GET    /api/v1/bi/dashboards
POST   /api/v1/bi/dashboards
GET    /api/v1/bi/dashboards/:id
PUT    /api/v1/bi/dashboards/:id
DELETE /api/v1/bi/dashboards/:id
POST   /api/v1/bi/dashboards/:id/widgets
PUT    /api/v1/bi/dashboards/:id/widgets/:widgetId
DELETE /api/v1/bi/dashboards/:id/widgets/:widgetId
```

### Metrics
```
GET  /api/v1/bi/metrics/kpis
GET  /api/v1/bi/metrics/time-series
POST /api/v1/bi/metrics/compare
GET  /api/v1/bi/metrics/realtime/dashboard
GET  /api/v1/bi/metrics/realtime/alerts
```

### Reports
```
POST   /api/v1/bi/reports
GET    /api/v1/bi/reports
GET    /api/v1/bi/reports/:id
PUT    /api/v1/bi/reports/:id
DELETE /api/v1/bi/reports/:id
POST   /api/v1/bi/reports/:id/generate
GET    /api/v1/bi/reports/:id/export
POST   /api/v1/bi/reports/:id/schedule
```

### Query Builder
```
POST   /api/v1/bi/query-builder/build
POST   /api/v1/bi/query-builder/execute
POST   /api/v1/bi/query-builder/validate
POST   /api/v1/bi/query-builder/save
GET    /api/v1/bi/query-builder/saved
POST   /api/v1/bi/query-builder/natural-language
```

### Charts
```
POST /api/v1/bi/charts/generate
POST /api/v1/bi/charts/line
POST /api/v1/bi/charts/bar
POST /api/v1/bi/charts/pie
GET  /api/v1/bi/charts/:id/export
```

---

## Architecture

```
ait-bi-platform/
├── src/
│   ├── controllers/          # 6 controllers
│   │   ├── bi-dashboard.controller.ts
│   │   ├── metrics.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── query-builder.controller.ts
│   │   ├── charts.controller.ts
│   │   └── dashboard-templates.controller.ts
│   ├── services/             # 9 services
│   │   ├── bi-dashboard.service.ts
│   │   ├── metrics.service.ts
│   │   ├── real-time-metrics.service.ts
│   │   ├── dashboard-templates.service.ts
│   │   ├── report.service.ts
│   │   ├── query-builder.service.ts
│   │   ├── chart.service.ts
│   │   ├── data-query.service.ts
│   │   └── kafka.service.ts
│   ├── entities/             # 3 entities
│   │   ├── dashboard.entity.ts
│   │   ├── widget.entity.ts
│   │   └── report.entity.ts
│   ├── types/                # Type definitions
│   │   ├── metrics.types.ts
│   │   ├── widget.types.ts
│   │   └── report.types.ts
│   └── dtos/                 # Data transfer objects
├── BI_USER_GUIDE.md          # Complete user guide
├── REPORT_TEMPLATES.md       # Report templates documentation
└── README.md                 # This file
```

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ait_bi

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ait-bi-platform

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=60000

# BI Settings
BI_REFRESH_INTERVAL=300000
BI_MAX_DASHBOARD_WIDGETS=20
BI_QUERY_TIMEOUT=30000
BI_REPORT_RETENTION_DAYS=90
```

### Module Configuration

```typescript
@Module({
  imports: [
    BiPlatformModule.forRoot({
      refreshInterval: 300000,
      cacheTTL: 60000,
      maxWidgets: 20,
      queryTimeout: 30000,
    }),
  ],
})
export class AppModule {}
```

---

## Dashboard Templates

1. **Executive Dashboard** - High-level KPIs and trends
2. **Sales Dashboard** - Sales metrics and conversion
3. **Operations Dashboard** - Operational efficiency
4. **Finance Dashboard** - Financial ratios and profitability
5. **Claims Dashboard** - Claims processing and settlement
6. **CRM Dashboard** - Customer metrics and engagement
7. **Agent Dashboard** - Individual agent performance
8. **Customer Dashboard** - Personal insurance overview
9. **Compliance Dashboard** - Regulatory compliance
10. **Marketing Dashboard** - Campaign performance and ROI

---

## Report Templates

1. Monthly Revenue Report
2. Quarterly Performance Report
3. Annual Summary Report
4. Policy Report
5. Claim Report
6. Customer Report
7. Agent Performance Report
8. Commission Report
9. Loss Ratio Report
10. Expense Ratio Report
11. Combined Ratio Report
12. Renewal Report
13. Cancellation Report
14. Customer Segmentation Report
15. Product Performance Report

---

## Widget Types

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

---

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:** 75%+
- 60+ unit tests
- 4 service test suites
- Complete service coverage

---

## Performance

### Benchmarks
- Dashboard load time: < 2s
- Widget refresh: < 500ms
- Query execution: < 1s
- Report generation: < 5s
- Real-time updates: < 100ms latency

### Optimization
- Query result caching
- Incremental data loading
- Lazy widget rendering
- Background report generation
- Connection pooling

---

## Security

- JWT authentication
- Role-based access control (RBAC)
- Row-level security
- Data encryption at rest
- Audit logging
- SQL injection prevention
- XSS protection

---

## Documentation

- [User Guide](./BI_USER_GUIDE.md) - Complete usage guide
- [Report Templates](./REPORT_TEMPLATES.md) - Report documentation
- [API Reference](https://api.ait-core.com/docs) - API documentation
- [Examples](./examples/) - Code examples

---

## Support

- **Email:** support@ait-core.com
- **Documentation:** https://docs.ait-core.com/bi-platform
- **Community:** https://community.ait-core.com
- **Issues:** https://github.com/ait-core/ait-bi-platform/issues

---

## License

MIT License - see [LICENSE](LICENSE) file for details

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## Authors

- AIT Core Team
- Contributors: https://github.com/ait-core/ait-bi-platform/contributors

---

## Acknowledgments

- Chart.js for charting library
- NestJS for framework
- TypeORM for database ORM
- date-fns for date manipulation
- All contributors and users

---

**Made with ❤️ by AIT Core Team**
