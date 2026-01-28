# AIT-TREASURY - Guía Completa

## Índice

1. [Introducción](#introducción)
2. [Instalación](#instalación)
3. [Arquitectura](#arquitectura)
4. [Módulos](#módulos)
5. [API Reference](#api-reference)
6. [Ejemplos de Uso](#ejemplos-de-uso)
7. [Configuración](#configuración)
8. [Tests](#tests)
9. [Producción](#producción)

---

## Introducción

**AIT-TREASURY** es el módulo completo de gestión de tesorería para el ecosistema AIT-CORE. Proporciona funcionalidades avanzadas para:

- **Cash Management**: Gestión de caja y liquidez en tiempo real
- **Cash Flow Analysis**: Generación automática de estados de flujo de caja
- **Forecasting**: Proyecciones a 12 meses con múltiples métodos (ML, regression, weighted)
- **Bank Integration**: Conexión con bancos vía Open Banking (PSD2)
- **Budget Management**: Control y tracking de presupuestos
- **Payment Processing**: Pagos masivos SEPA
- **Reconciliation**: Conciliación bancaria automática

### Características Principales

✅ **Real-time Cash Position**: Posición de caja consolidada en tiempo real
✅ **Automated Cash Flow Statements**: Estados financieros automáticos
✅ **12-Month Forecasting**: Proyecciones con IA y machine learning
✅ **Open Banking Integration**: Conexión directa con bancos españoles
✅ **SEPA Payments**: Pagos masivos nacionales e internacionales
✅ **Budget Tracking**: Alertas automáticas de sobre-gasto
✅ **Bank Reconciliation**: Matching automático de transacciones
✅ **Scenario Analysis**: Análisis optimista/realista/pesimista

---

## Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm o pnpm

### Instalación

```bash
# 1. Instalar dependencias
cd modules/01-core-business/ait-treasury
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Generar Prisma Client
pnpm prisma:generate

# 4. Crear tablas en BD
pnpm prisma:push

# 5. Compilar
pnpm build

# 6. Ejecutar en desarrollo
pnpm start:dev
```

### Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ait_treasury"

# Bank Integration (Open Banking)
BANK_INTEGRATION_ENABLED=true
BANK_PROVIDER=NORDIGEN
BANK_API_URL=https://ob.nordigen.com/api/v2
BANK_API_KEY=your_api_key_here
BANK_API_SECRET=your_secret_here
BANK_SANDBOX=true
BANK_AUTO_SYNC=true
BANK_SYNC_INTERVAL=30

# Application
PORT=3005
NODE_ENV=development
```

---

## Arquitectura

```
ait-treasury/
├── src/
│   ├── cash/                    # Cash Management
│   │   └── cash-management.service.ts
│   ├── cash-flow/               # Cash Flow Analysis
│   │   └── cash-flow.service.ts
│   ├── forecasting/             # Forecasting & Projections
│   │   └── cash-forecast.service.ts
│   ├── banks/                   # Bank Integration
│   │   └── bank-integration.service.ts
│   ├── budget/                  # Budget Management
│   │   └── budget.service.ts
│   ├── controllers/             # REST API Controllers
│   │   ├── cash-management.controller.ts
│   │   ├── cash-flow.controller.ts
│   │   ├── forecast.controller.ts
│   │   ├── bank.controller.ts
│   │   └── budget.controller.ts
│   ├── dto/                     # Data Transfer Objects
│   ├── interfaces/              # TypeScript Interfaces
│   ├── entities/                # Prisma Entities
│   └── shared/                  # Shared Services
│       └── prisma.service.ts
├── prisma/
│   └── schema.prisma           # Database Schema
├── test/                       # Tests (Jest)
└── TREASURY_GUIDE.md          # Esta guía
```

### Flujo de Datos

```
[Bank APIs]
    ↓
[BankIntegrationService] → [Transactions Sync]
    ↓
[CashManagementService] → [Cash Position]
    ↓
[CashFlowService] → [Statements]
    ↓
[CashForecastService] → [Projections]
    ↓
[API Controllers] → [REST Endpoints]
```

---

## Módulos

### 1. Cash Management

Gestión completa de caja y liquidez.

**Servicios**:
- `getCurrentPosition()`: Posición de caja actual
- `getPositionByDate(date)`: Posición histórica
- `recordInflow(dto)`: Registrar entrada de efectivo
- `recordOutflow(dto)`: Registrar salida de efectivo
- `reconcile(accountId, date)`: Conciliación bancaria
- `checkLowBalance()`: Verificar saldos bajos
- `forecastCashShortage(days)`: Proyectar déficits

**Endpoints**:
```
GET    /cash/position
GET    /cash/position/date/:date
GET    /cash/position/account/:accountId
POST   /cash/inflow
POST   /cash/outflow
GET    /cash/movements
POST   /cash/reconcile
POST   /cash/import-statement
GET    /cash/alerts/low-balance
GET    /cash/alerts/overdraft
GET    /cash/forecast/shortage?days=30
```

### 2. Cash Flow

Análisis de flujo de caja.

**Servicios**:
- `generateStatement(startDate, endDate)`: Estado de flujo de caja
- `getMonthlyFlow(year)`: Flujos mensuales del año
- `compareFlows(period1, period2)`: Comparar períodos
- `calculateBurnRate(months)`: Tasa de quema
- `calculateRunway()`: Runway (meses de efectivo)

**Endpoints**:
```
GET    /cash-flow/statement?startDate&endDate
GET    /cash-flow/monthly/:year
GET    /cash-flow/compare
GET    /cash-flow/burn-rate?months=6
GET    /cash-flow/runway
```

### 3. Forecasting

Proyecciones de tesorería con IA.

**Servicios**:
- `forecast(months, method)`: Proyección general
- `forecastByCategory(months)`: Por categoría
- `projectPremiums(months)`: Primas futuras
- `projectRenewals(months)`: Renovaciones
- `projectClaims(months)`: Siniestros
- `bestCaseScenario(months)`: Escenario optimista
- `worstCaseScenario(months)`: Escenario pesimista
- `compareToForecast(actual, forecast)`: Comparar vs real

**Endpoints**:
```
GET    /forecast?months=12&method=WEIGHTED
GET    /forecast/by-category?months=12
GET    /forecast/premiums?months=12
GET    /forecast/renewals?months=12
GET    /forecast/commissions?months=12
GET    /forecast/claims?months=12
GET    /forecast/scenarios/best-case?months=12
GET    /forecast/scenarios/worst-case?months=12
GET    /forecast/scenarios/most-likely?months=12
POST   /forecast/compare
```

### 4. Bank Integration

Integración con bancos vía Open Banking.

**Servicios**:
- `connectBank(bankId, credentials)`: Conectar banco
- `disconnectBank(connectionId)`: Desconectar
- `syncTransactions(connectionId)`: Sincronizar
- `getBalance(accountId)`: Obtener saldo
- `initiatePayment(dto)`: Iniciar pago SEPA
- `createPaymentBatch(dto)`: Lote de pagos
- `createStandingOrder(dto)`: Orden permanente

**Endpoints**:
```
POST   /banks/connect
DELETE /banks/connections/:id
POST   /banks/connections/:id/refresh
POST   /banks/connections/:id/sync
GET    /banks/accounts/:id/balance
GET    /banks/connections/:id/accounts
POST   /banks/payments
GET    /banks/payments/:id/status
DELETE /banks/payments/:id
POST   /banks/payments/batch
POST   /banks/standing-orders
DELETE /banks/standing-orders/:id
```

### 5. Budget Management

Gestión de presupuestos y control de gastos.

**Servicios**:
- `create(dto)`: Crear presupuesto
- `update(id, dto)`: Actualizar
- `delete(id)`: Eliminar
- `trackExpense(dto)`: Registrar gasto
- `getStatus(budgetId)`: Estado del presupuesto
- `getUtilization(budgetId)`: % utilizado
- `forecastBudget(budgetId)`: Proyectar uso
- `generateReport(startDate, endDate)`: Reporte

**Endpoints**:
```
POST   /budgets
GET    /budgets
GET    /budgets/:id
PUT    /budgets/:id
DELETE /budgets/:id
POST   /budgets/expenses
GET    /budgets/:id/status
GET    /budgets/:id/utilization
GET    /budgets/:id/forecast
POST   /budgets/reports
GET    /budgets/compare
```

---

## API Reference

### Autenticación

Todos los endpoints requieren autenticación vía Bearer Token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.ait.com/treasury/cash/position
```

### Formatos de Respuesta

Todas las respuestas son JSON:

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-01-28T12:00:00Z"
}
```

Errores:

```json
{
  "status": "error",
  "message": "Account not found",
  "code": "ACCOUNT_NOT_FOUND",
  "timestamp": "2026-01-28T12:00:00Z"
}
```

---

## Ejemplos de Uso

### 1. Obtener Posición de Caja

```typescript
const response = await fetch('/cash/position');
const position = await response.json();

console.log(`Total Balance: €${position.totalBalance}`);
console.log(`Available: €${position.availableBalance}`);
console.log(`Accounts: ${position.accounts.length}`);
```

### 2. Registrar Pago de Prima

```typescript
const inflow = {
  accountId: 'acc-001',
  amount: 1500.00,
  category: 'PREMIUM_COLLECTION',
  description: 'Premium payment - Policy #12345',
  reference: 'POL-12345',
  executionDate: new Date()
};

const response = await fetch('/cash/inflow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(inflow)
});
```

### 3. Generar Forecast 12 Meses

```typescript
const forecast = await fetch('/forecast?months=12&method=ML');
const data = await forecast.json();

console.log(`Projected Balance (12m): €${data.projections[11].projectedBalance}`);
console.log(`Confidence: ${data.confidence.overall * 100}%`);
```

### 4. Iniciar Pago SEPA

```typescript
const payment = {
  accountId: 'acc-001',
  creditorName: 'Proveedor ABC',
  creditorIban: 'ES1234567890123456789012',
  amount: 2500.00,
  reference: 'Invoice #INV-2026-001',
  executionDate: new Date('2026-02-01')
};

const response = await fetch('/banks/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payment)
});

const result = await response.json();
console.log(`Payment ID: ${result.paymentId}`);
console.log(`Status: ${result.status}`);
```

### 5. Crear y Trackear Presupuesto

```typescript
// Crear presupuesto
const budget = {
  name: 'Marketing Q1 2026',
  description: 'Budget for Q1 marketing campaigns',
  category: 'MARKETING',
  amount: 50000,
  currency: 'EUR',
  period: 'QUARTERLY',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-03-31'),
  alertThreshold: 80
};

const budgetResponse = await fetch('/budgets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(budget)
});

const createdBudget = await budgetResponse.json();

// Registrar gasto
const expense = {
  budgetId: createdBudget.id,
  amount: 5000,
  currency: 'EUR',
  description: 'Google Ads - January',
  category: 'MARKETING',
  vendor: 'Google Ireland Ltd.',
  date: new Date()
};

await fetch('/budgets/expenses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(expense)
});

// Ver estado
const status = await fetch(`/budgets/${createdBudget.id}/status`);
const budgetStatus = await status.json();

console.log(`Utilization: ${budgetStatus.utilization}%`);
console.log(`Status: ${budgetStatus.status}`); // HEALTHY | WARNING | CRITICAL
```

---

## Configuración

### Configurar Open Banking

1. Registrarse en Nordigen (https://nordigen.com)
2. Obtener API Key y Secret
3. Configurar en `.env`:

```env
BANK_API_KEY=your_key_here
BANK_API_SECRET=your_secret_here
```

4. Conectar banco:

```bash
curl -X POST /banks/connect \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "BBVA_BBVAESMM",
    "authorizationCode": "AUTH_CODE_FROM_BANK"
  }'
```

### Configurar Sincronización Automática

```env
BANK_AUTO_SYNC=true
BANK_SYNC_INTERVAL=30  # minutos
```

La sincronización automática descargará transacciones cada 30 minutos.

---

## Tests

Ejecutar tests:

```bash
# Todos los tests
pnpm test

# Tests específicos
pnpm test cash-management.service

# Con coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

Coverage objetivo: **>75%**

---

## Producción

### Deployment Checklist

- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada (`pnpm prisma:migrate`)
- [ ] Tests pasando (`pnpm test`)
- [ ] Build exitoso (`pnpm build`)
- [ ] API Keys configuradas
- [ ] Logs configurados
- [ ] Monitoring activo

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 3005

CMD ["pnpm", "start:prod"]
```

### Seguridad

- Usar HTTPS en producción
- Rotar API Keys cada 90 días
- Implementar rate limiting
- Habilitar audit logs
- Encriptar datos sensibles
- 2FA para acciones críticas

---

## Soporte

- **Documentación**: `/docs`
- **Issues**: GitHub Issues
- **Email**: soporte@ait.com

---

## Licencia

Propietario - AIN TECH © 2026

---

**Versión**: 1.0.0
**Última actualización**: 2026-01-28
**Autor**: AIN TECH - Soriano Mediadores
