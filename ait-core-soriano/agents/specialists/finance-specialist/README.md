# Finance Specialist Agent

Agente especialista en finanzas y contabilidad del sistema AIT-CORE.

## Descripción

El Finance Specialist es un agente AI especializado en análisis financiero, contabilidad, planificación estratégica financiera y optimización fiscal. Proporciona análisis rigurosos basados en principios contables y mejores prácticas financieras.

## Capacidades

### Experiencia Principal
- Análisis financiero y cálculo de ratios (liquidez, solvencia, rentabilidad)
- Contabilidad general y de costes (PGC, IFRS/NIIF)
- Planificación financiera y elaboración de presupuestos
- Gestión de tesorería y análisis de flujo de caja
- Valoración de empresas y activos
- Análisis de inversiones (VAN, TIR, payback, análisis de sensibilidad)
- Gestión de riesgos financieros
- Optimización fiscal y planificación tributaria
- Consolidación contable
- Control de gestión y reporting financiero

### Certificaciones
- CFA Level III
- Auditor de Cuentas ROAC
- Asesor Fiscal

## Uso

```typescript
import { getFinanceSpecialist } from '@ait-agents/finance-specialist';

const agent = getFinanceSpecialist(process.env.ANTHROPIC_API_KEY);

// Análisis financiero
const analysis = await agent.analyze({
  question: "Analiza la situación financiera de la empresa",
  context: {
    balanceSheet: {...},
    incomeStatement: {...},
    cashFlow: {...}
  },
  options: {
    depth: 'deep',
    format: 'structured'
  }
}, agentContext);

// Recomendaciones financieras
const recommendations = await agent.recommend({
  situation: "Necesitamos optimizar la estructura de capital",
  context: { currentDebt: 500000, equity: 1000000, wacc: 0.08 },
  objectives: ["Reducir coste de capital", "Mejorar ratios financieros"]
}, agentContext);

// Validación de propuestas
const validation = await agent.validate({
  investment: {
    amount: 100000,
    expectedROI: 0.15,
    paybackPeriod: 3
  }
}, agentContext);
```

## API Endpoints

- `POST /api/v1/agents/specialists/finance/analyze` - Análisis financiero
- `POST /api/v1/agents/specialists/finance/recommend` - Recomendaciones
- `POST /api/v1/agents/specialists/finance/answer` - Responder preguntas
- `POST /api/v1/agents/specialists/finance/validate` - Validar propuestas
- `GET /api/v1/agents/specialists/finance/capabilities` - Obtener capacidades
- `GET /api/v1/agents/specialists/finance/health` - Health check

## Configuración

Configuración mediante `agent.config.json`:

```json
{
  "ai": {
    "model": "claude-sonnet-4-5-20250929",
    "temperature": 0.3,
    "maxTokens": 4096
  }
}
```

## Variables de Entorno

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Limitaciones

- No ejecuta transacciones financieras directamente
- No accede a cuentas bancarias en tiempo real
- Requiere consulta a sistemas contables para datos actualizados
- Las recomendaciones son consultivas y deben ser revisadas por profesionales

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Build
pnpm build

# Tests
pnpm test
```

## Licencia

Propietario - AIT-CORE Soriano Mediadores
