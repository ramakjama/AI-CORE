# AI Insurance Module

Modulo de gestion integral de seguros para el mercado espanol.

## Caracteristicas

### Gestion de Polizas
- Emision de polizas nuevas
- Renovaciones automaticas y manuales
- Suplementos (modificaciones, altas/bajas de cobertura)
- Anulaciones con calculo de extorno prorrata temporis
- Suspension por impago y rehabilitacion

### Gestion de Recibos
- Generacion automatica segun frecuencia de pago
- Planes de pago personalizados
- Procesamiento de cobros
- Gestion de impagados y devoluciones
- Conciliacion bancaria automatica
- Generacion de remesas SEPA
- Recordatorios de pago

### Gestion de Siniestros
- Apertura y tramitacion de siniestros
- Verificacion automatica de cobertura
- Gestion de reservas (inicial, ajustada, final)
- Calculo de franquicias
- Pagos a beneficiarios/proveedores
- Recobros
- Deteccion de fraude
- Gestion de litigios

### Gestion de Comisiones
- Calculo automatico segun reglas configurables
- Comisiones por ramo y tipo de operacion
- Liquidaciones periodicas
- Extractos de comisiones
- Ajustes y regularizaciones
- Retencion IRPF automatica

## Normativa Espanola

El modulo implementa la normativa espanola de seguros:

- **IPS**: Impuesto sobre Primas de Seguro (6% general)
- **Consorcio**: Recargo del Consorcio de Compensacion de Seguros
- **Fraccionamiento**: Recargos por pago fraccionado
- **Retenciones**: IRPF 15% sobre comisiones a mediadores

## Uso

```typescript
import { AIInsurance } from '@anthropic/ai-insurance';

// Crear poliza
const policy = await AIInsurance.policy.create(
  'party-123',
  'AUTO-TR',
  {
    type: 'vehicle',
    details: {},
    vehicle: {
      plate: '1234ABC',
      brand: 'SEAT',
      model: 'Leon',
      year: 2023,
      enginePower: 150,
      fuelType: 'GASOLINE',
      usage: 'PRIVATE',
      parkingType: 'GARAGE',
    },
  },
  {
    paymentFrequency: 'ANNUAL',
    paymentMethod: 'DIRECT_DEBIT',
    iban: 'ES1234567890123456789012',
    agentId: 'agent-456',
  }
);

// Generar recibos
const receipts = await AIInsurance.receipt.generate(policy.id);

// Abrir siniestro
const claim = await AIInsurance.claim.open(policy.id, {
  type: 'COLLISION',
  incidentDate: new Date(),
  description: 'Colision en interseccion',
  estimatedAmount: 2500,
});

// Calcular comision
const commission = await AIInsurance.commission.calculate(
  policy.id,
  'NEW_BUSINESS',
  receipts[0].id
);
```

## Estructura

```
ai-insurance/
  src/
    types/
      index.ts          # Tipos, enums e interfaces
    services/
      policy.service.ts    # Gestion de polizas
      receipt.service.ts   # Gestion de recibos
      claim.service.ts     # Gestion de siniestros
      commission.service.ts # Gestion de comisiones
    index.ts            # Exports y facade
  package.json
  tsconfig.json
```

## Tasas Configuradas

| Concepto | Tasa |
|----------|------|
| IPS General | 6% |
| Consorcio Auto | 0.55% |
| Consorcio Incendio | 0.09% |
| Fraccionamiento Mensual | 5% |
| Fraccionamiento Trimestral | 3% |
| Fraccionamiento Semestral | 2% |
| Retencion IRPF | 15% |

## Comisiones por Ramo

| Ramo | Nueva Produccion | Cartera | Suplemento |
|------|-----------------|---------|------------|
| Auto | 15% | 12% | 10% |
| Hogar | 25% | 20% | 15% |
| Vida | 30% | 5% | 5% |
| Salud | 15% | 10% | 8% |
| Decesos | 35% | 10% | 5% |
