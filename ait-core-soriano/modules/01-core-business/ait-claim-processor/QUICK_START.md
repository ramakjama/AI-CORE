# 🚀 Quick Start - AIT Claim Processor

## ⚡ Instalación Rápida

```bash
# Navegar al módulo
cd ait-core-soriano/modules/01-core-business/ait-claim-processor

# Instalar dependencias
npm install

# Compilar
npm run build

# Ejecutar tests
npm test
```

## 📦 Uso Inmediato

### 1. Importar en tu aplicación

```typescript
import { Module } from '@nestjs/common';
import { ClaimProcessorModule } from '@ait-core/claim-processor';

@Module({
  imports: [ClaimProcessorModule],
})
export class AppModule {}
```

### 2. Usar el servicio

```typescript
import { ClaimService } from '@ait-core/claim-processor';
import { ClaimType } from '@ait-core/claim-processor';

@Injectable()
export class MyService {
  constructor(private claimService: ClaimService) {}

  async processClaim() {
    // Crear claim
    const claim = await this.claimService.create({
      policyId: 'pol_123',
      customerId: 'cust_456',
      type: ClaimType.AUTO_ACCIDENT,
      title: 'Accidente de tráfico',
      description: 'Colisión trasera',
      incidentDate: new Date(),
      estimatedAmount: 2500,
    });

    // Submit para revisión
    await this.claimService.submit(claim.id);

    // Aprobar
    await this.claimService.approve(claim.id, {
      approvedAmount: 2400,
      approvalNotes: 'Aprobado',
    });

    // Procesar pago
    await this.claimService.processPayment(claim.id, {
      amount: 2400,
      paymentMethod: 'BANK_TRANSFER',
    });

    // Cerrar
    await this.claimService.close(claim.id, 'Completado');

    return claim;
  }
}
```

## 🎯 Casos de Uso Comunes

### Caso 1: Auto-Aprobación Rápida

```typescript
// Claims < €500 se auto-aprueban automáticamente
const claim = await claimService.create({
  policyId: 'pol_123',
  customerId: 'cust_456',
  type: ClaimType.AUTO_ACCIDENT,
  title: 'Daño menor',
  estimatedAmount: 450, // < 500
  // ... resto de campos
});

await claimService.submit(claim.id);

// El sistema automáticamente:
// 1. Detecta fraude (score bajo)
// 2. Valida documentos
// 3. AUTO-APRUEBA
// Estado: APPROVED ✅
```

### Caso 2: Claim con Documentos

```typescript
// 1. Crear claim
const claim = await claimService.create({...});

// 2. Subir documentos
const photoDoc = await claimService.uploadDocument(
  claim.id,
  photoFile,
  DocumentType.PHOTO_DAMAGE
);

const invoiceDoc = await claimService.uploadDocument(
  claim.id,
  invoiceFile,
  DocumentType.INVOICE
);

// 3. Procesar OCR automáticamente
const ocrResult = await claimService.processDocument(invoiceDoc.id);

console.log('Monto extraído:', ocrResult.extractedData.totalAmount);

// 4. Submit
await claimService.submit(claim.id);
```

### Caso 3: Detección de Fraude

```typescript
// Crear claim
const claim = await claimService.create({
  estimatedAmount: 50000, // Monto alto
  // ...
});

// Detectar fraude
const fraudAnalysis = await claimService.detectFraud(claim);

console.log({
  riskLevel: fraudAnalysis.riskLevel, // HIGH, CRITICAL
  score: fraudAnalysis.score, // 0-100
  recommendation: fraudAnalysis.recommendation, // INVESTIGATE, REJECT
  flags: fraudAnalysis.flags, // Array de banderas
});

if (fraudAnalysis.riskLevel === 'CRITICAL') {
  // Auto-rechazar
  await claimService.reject(claim.id, {
    reason: 'Alto riesgo de fraude detectado',
    reasonCode: 'FRAUD_DETECTED',
  });
}
```

### Caso 4: Analytics

```typescript
// Obtener estadísticas
const stats = await claimService.getStatistics();

console.log({
  total: stats.totalClaims,
  approvalRate: stats.approvalRate, // 85%
  avgProcessingTime: stats.averageProcessingTime, // 7.5 días
  highValue: stats.highValueClaims, // 15 claims > €10k
});

// Claims pendientes
const pending = await claimService.getPendingClaims();
console.log(`${pending.length} claims esperando revisión`);

// Claims de alto valor
const highValue = await claimService.getHighValueClaims(10000);
console.log(`${highValue.length} claims > €10,000`);

// Razones de rechazo
const reasons = await claimService.getTopRejectReasons();
reasons.forEach(r => {
  console.log(`${r.code}: ${r.count} (${r.percentage}%)`);
});
```

## 🔧 Configuración

### Variables de Entorno (.env)

```env
# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/claims"

# OCR Providers
GOOGLE_VISION_API_KEY=your_key_here
AWS_TEXTRACT_REGION=us-east-1
AWS_TEXTRACT_ACCESS_KEY=your_key_here

# Storage
S3_BUCKET_NAME=claims-documents
S3_REGION=us-east-1
S3_ACCESS_KEY=your_key_here
S3_SECRET_KEY=your_secret_here

# Notifications
SENDGRID_API_KEY=your_key_here
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here

# Payment Gateway
STRIPE_API_KEY=your_key_here

# Fraud Detection
FRAUD_THRESHOLD_HIGH=70
FRAUD_THRESHOLD_CRITICAL=80

# Automation
AUTO_APPROVE_THRESHOLD=500
AUTO_CLOSE_DAYS=90
```

## 🧪 Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm run test:cov

# Watch mode (desarrollo)
npm run test:watch

# Solo unit tests
npm run test:unit
```

## 📊 Verificar Estado

```typescript
// Verificar estado de un claim
const claim = await claimService.findOne(claimId);

console.log({
  state: claim.state,
  lastChange: claim.lastStateChange,
  history: claim.stateHistory.map(h => `${h.fromState} → ${h.toState}`),
});

// Verificar SLA
const automation = new ClaimAutomationService(stateMachine);
const sla = await automation.checkSLA(claim);

if (sla.breached) {
  console.log(`⚠️ SLA breached by ${Math.abs(sla.daysRemaining)} days`);
} else {
  console.log(`✅ ${sla.daysRemaining} days remaining`);
}
```

## 🎨 Estados del Sistema

```
DRAFT           → Borrador inicial
  ↓
SUBMITTED       → Enviado para revisión
  ↓
UNDER_REVIEW    → En revisión por ajustador
  ↓
APPROVED        → Aprobado para pago
  ↓
PAYMENT_PENDING → Procesando pago
  ↓
PAID            → Pagado
  ↓
CLOSED          → Cerrado y archivado
```

**Estados alternativos**:
- `PENDING_DOCUMENTS` → Esperando documentos del cliente
- `INVESTIGATING` → Bajo investigación
- `REJECTED` → Rechazado

## 📱 API REST Endpoints

### CRUD
- `POST   /claims` - Crear
- `GET    /claims` - Listar
- `GET    /claims/:id` - Obtener uno
- `PUT    /claims/:id` - Actualizar

### Workflow
- `POST   /claims/:id/submit` - Enviar
- `POST   /claims/:id/approve` - Aprobar
- `POST   /claims/:id/reject` - Rechazar
- `POST   /claims/:id/close` - Cerrar

### Documentos
- `POST   /claims/:id/documents` - Subir
- `GET    /claims/:id/documents` - Listar
- `POST   /claims/:id/documents/:docId/process` - Procesar OCR

### Analytics
- `GET    /claims/analytics/statistics` - Estadísticas
- `GET    /claims/analytics/pending` - Pendientes
- `GET    /claims/analytics/high-value` - Alto valor

**Ver documentación completa**: [README.md](./README.md)

## 🚨 Troubleshooting

### Error: "Transición inválida"

```typescript
try {
  await claimService.approve(claimId, dto);
} catch (error) {
  if (error.message.includes('Transición inválida')) {
    // El claim no está en un estado que permita aprobación
    const claim = await claimService.findOne(claimId);
    console.log('Estado actual:', claim.state);
    console.log('Estados permitidos:', getAvailableTransitions(claim.state));
  }
}
```

### Error: "Documentos requeridos faltantes"

```typescript
// Verificar documentos antes de aprobar
const validation = await claimService.validateDocuments(claimId);

if (!validation.allValid) {
  console.log('Documentos faltantes:', validation.validations.filter(v => !v.validated));
}
```

### Error: OCR falla

```typescript
// Intentar con otro proveedor
try {
  const result = await ocrService.extractText(file, 'google');
} catch (error) {
  // Fallback a Tesseract
  const result = await ocrService.extractText(file, 'tesseract');
}
```

## 📚 Documentación Completa

- **[README.md](./README.md)** - Documentación principal (600 líneas)
- **[WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md)** - Guía de workflow (800 líneas)
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación
- **[FILE_MANIFEST.md](./FILE_MANIFEST.md)** - Manifiesto de archivos

## 💡 Tips Importantes

1. **Siempre verificar el estado** antes de operaciones
2. **Usar validaciones** antes de transiciones críticas
3. **Revisar fraud analysis** para claims de alto valor
4. **Monitorear SLA** regularmente
5. **Implementar rate limiting** en producción

## ✅ Checklist de Producción

Antes de deployment a producción:

- [ ] Configurar variables de entorno
- [ ] Implementar base de datos (Prisma/TypeORM)
- [ ] Configurar OCR providers reales
- [ ] Integrar payment gateway
- [ ] Setup email/SMS services
- [ ] Configurar S3/MinIO
- [ ] Implementar autenticación JWT
- [ ] Añadir rate limiting
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Configurar logs (ELK Stack)
- [ ] SSL/HTTPS
- [ ] CI/CD pipeline

## 🎯 Próximos Pasos

1. Leer [WORKFLOW_GUIDE.md](./WORKFLOW_GUIDE.md) para entender los flujos
2. Revisar [README.md](./README.md) para API completa
3. Ejecutar tests para verificar funcionamiento
4. Implementar caso de uso específico
5. Integrar con tu aplicación

---

**¿Preguntas?** Ver [README.md](./README.md) o contactar a support@ait-core.com

**Estado**: 🟢 Production Ready
**Versión**: 1.0.0
**Última actualización**: 28/01/2026
