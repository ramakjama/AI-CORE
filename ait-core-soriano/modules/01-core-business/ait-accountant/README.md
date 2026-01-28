# AI Accountant Module

AI-powered accounting automation module with real-time bookkeeping, automated journal entries, and PGC (Plan General Contable) compliance.

## Features

### Core Capabilities
- **Automated Journal Entries**: AI-powered transaction categorization and entry creation
- **Real-time Bookkeeping**: Live accounting updates and balance tracking
- **PGC Compliance**: Full Spanish accounting standard compliance
- **Account Reconciliation**: Automated bank reconciliation with AI matching
- **Financial Reports**: Balance sheets, P&L statements, trial balances
- **Tax Calculations**: Automated tax computation and reporting
- **Expense Categorization**: Smart expense classification
- **Invoice Accounting**: Automatic invoice processing and recording
- **Fiscal Period Management**: Period opening, closing, and controls

## API Endpoints

### Accounting Entries
- `POST /api/v1/accountant/entries` - Create accounting entry
- `GET /api/v1/accountant/entries` - List entries with filters
- `GET /api/v1/accountant/entries/:id` - Get entry by ID
- `PUT /api/v1/accountant/entries/:id` - Update entry
- `DELETE /api/v1/accountant/entries/:id` - Delete entry
- `POST /api/v1/accountant/entries/:id/approve` - Approve entry
- `POST /api/v1/accountant/entries/:id/reject` - Reject entry

### Financial Reports
- `GET /api/v1/accountant/balance-sheet` - Generate balance sheet
- `GET /api/v1/accountant/profit-loss` - Generate P&L statement
- `GET /api/v1/accountant/trial-balance` - Generate trial balance

### Journal Management
- `POST /api/v1/journal/entries` - Create journal entry
- `GET /api/v1/journal/entries` - List journal entries
- `GET /api/v1/journal/entries/:id` - Get journal entry
- `POST /api/v1/journal/entries/batch` - Create batch entries
- `GET /api/v1/journal/general-ledger` - Get general ledger
- `GET /api/v1/journal/account-ledger/:accountId` - Get account ledger

### Reconciliation
- `POST /api/v1/reconciliation` - Start reconciliation
- `GET /api/v1/reconciliation` - List reconciliations
- `GET /api/v1/reconciliation/:id` - Get reconciliation details
- `POST /api/v1/reconciliation/:id/complete` - Complete reconciliation
- `POST /api/v1/reconciliation/:id/match` - Match transactions
- `POST /api/v1/reconciliation/auto-reconcile` - AI auto-reconciliation
- `GET /api/v1/reconciliation/:id/discrepancies` - Get discrepancies

### Fiscal Periods
- `POST /api/v1/accountant/close-period` - Close fiscal period

## Installation

```bash
pnpm install
```

## Development

```bash
# Build
pnpm run build

# Watch mode
pnpm run dev

# Run tests
pnpm run test

# Lint
pnpm run lint
```

## Configuration

Required environment variables:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AI_API_KEY=...
```

## Dependencies

### Required Modules
- `ait-pgc-engine` - Spanish accounting chart integration
- `ai-treasury` - Cash flow and liquidity management

### Optional Modules
- `ai-encashment` - Payment collection integration
- `ai-ops` - Operations data integration

## Architecture

```
ait-accountant/
├── src/
│   ├── controllers/
│   │   ├── accountant.controller.ts
│   │   ├── journal.controller.ts
│   │   └── reconciliation.controller.ts
│   ├── services/
│   │   ├── accountant.service.ts
│   │   ├── journal.service.ts
│   │   ├── reconciliation.service.ts
│   │   ├── ledger.service.ts
│   │   └── fiscal-period.service.ts
│   ├── dto/
│   ├── entities/
│   ├── interfaces/
│   └── index.ts
├── package.json
├── module.config.json
└── README.md
```

## Usage Example

```typescript
import { AiAccountantModule } from '@ait-core/ait-accountant';

@Module({
  imports: [AiAccountantModule],
})
export class AppModule {}
```

## Security

- All endpoints require authentication
- Role-based access control (RBAC)
- Audit logging for all transactions
- Encryption at rest and in transit
- 7-year data retention for compliance

## Compliance

- SOX (Sarbanes-Oxley)
- GDPR
- LOPD (Spanish data protection)
- Spanish PGC standards

## Support

For issues and questions, contact AIN TECH support.

## License

PROPRIETARY - Soriano Mediadores
