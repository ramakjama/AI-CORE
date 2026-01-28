# Guía de Workflow - AIT Claim Processor

## 📋 Tabla de Contenidos

1. [Estados del Sistema](#estados-del-sistema)
2. [Flujos Principales](#flujos-principales)
3. [Transiciones Permitidas](#transiciones-permitidas)
4. [Reglas de Negocio](#reglas-de-negocio)
5. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Estados del Sistema

### DRAFT (Borrador)
**Descripción**: Claim inicial, aún no enviado para revisión.

**Puede transicionar a**:
- SUBMITTED (al enviar)

**Acciones permitidas**:
- Editar información
- Subir documentos
- Eliminar claim

**Tiempo típico**: 0-2 días

---

### SUBMITTED (Enviado)
**Descripción**: Claim enviado para revisión inicial.

**Puede transicionar a**:
- UNDER_REVIEW (revisión estándar)
- REJECTED (rechazo inmediato)
- DRAFT (devolver para correcciones)

**Acciones automáticas**:
- Asignación de ajustador
- Notificación a aseguradora
- Inicio de detección de fraude

**Tiempo típico**: 1-2 días

---

### UNDER_REVIEW (En Revisión)
**Descripción**: Ajustador está revisando el caso.

**Puede transicionar a**:
- APPROVED (aprobar directamente)
- REJECTED (rechazar)
- PENDING_DOCUMENTS (solicitar docs)
- INVESTIGATING (iniciar investigación)

**Acciones comunes**:
- Revisar documentación
- Validar cobertura
- Calcular monto estimado
- Evaluar fraude

**Tiempo típico**: 2-5 días

---

### PENDING_DOCUMENTS (Documentos Pendientes)
**Descripción**: Se requieren documentos adicionales del cliente.

**Puede transicionar a**:
- UNDER_REVIEW (al recibir documentos)
- REJECTED (si no se entregan a tiempo)
- CLOSED (auto-cierre por timeout)

**Acciones automáticas**:
- Envío de email/SMS al cliente
- Recordatorios cada 3 días
- Auto-cierre después de 7 días

**Tiempo típico**: 3-7 días

---

### INVESTIGATING (Investigando)
**Descripción**: Caso complejo que requiere investigación adicional.

**Puede transicionar a**:
- APPROVED (después de investigación exitosa)
- REJECTED (si la investigación revela problemas)
- PENDING_DOCUMENTS (si se necesitan más docs)

**Casos que requieren investigación**:
- Montos > €10,000
- Score de fraude > 50%
- Inconsistencias en documentación
- Múltiples claims del mismo cliente

**Tiempo típico**: 5-15 días

---

### APPROVED (Aprobado)
**Descripción**: Claim aprobado, listo para pago.

**Puede transicionar a**:
- PAYMENT_PENDING (iniciar pago)
- REJECTED (reversión por nueva información)

**Acciones automáticas**:
- Notificación al cliente
- Registro en contabilidad
- Generación de orden de pago

**Tiempo típico**: 1-2 días

---

### REJECTED (Rechazado)
**Descripción**: Claim rechazado con justificación.

**Puede transicionar a**:
- UNDER_REVIEW (apelación)
- CLOSED (cierre definitivo)

**Razones comunes de rechazo**:
- POLICY_EXCLUSION: Excluido por póliza
- INSUFFICIENT_EVIDENCE: Evidencia insuficiente
- FRAUD_DETECTED: Fraude detectado
- DUPLICATE_CLAIM: Claim duplicado
- POLICY_LAPSED: Póliza vencida

**Tiempo típico**: Inmediato

---

### PAYMENT_PENDING (Pago Pendiente)
**Descripción**: Pago en proceso.

**Puede transicionar a**:
- PAID (pago exitoso)
- REJECTED (problemas con el pago)

**Acciones automáticas**:
- Procesamiento con gateway de pago
- Verificación de cuenta bancaria
- Generación de comprobante

**Tiempo típico**: 1-3 días

---

### PAID (Pagado)
**Descripción**: Pago completado exitosamente.

**Puede transicionar a**:
- CLOSED (cierre normal)

**Acciones automáticas**:
- Envío de comprobante de pago
- Actualización contable
- Notificación a aseguradora

**Tiempo típico**: 1 día

---

### CLOSED (Cerrado)
**Descripción**: Claim cerrado y archivado.

**Puede transicionar a**:
- UNDER_REVIEW (reapertura excepcional)

**Acciones automáticas**:
- Archivado de documentos
- Generación de reporte final
- Análisis para estadísticas

**Tiempo típico**: Permanente

---

## Flujos Principales

### Flujo Estándar (80% de los casos)

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → PAYMENT_PENDING → PAID → CLOSED
```

**Duración total**: 7-14 días

**Características**:
- Documentación completa desde el inicio
- Monto < €5,000
- Sin indicadores de fraude
- Cobertura clara

---

### Flujo con Documentos Adicionales (15% de los casos)

```
DRAFT → SUBMITTED → UNDER_REVIEW → PENDING_DOCUMENTS → UNDER_REVIEW → APPROVED → PAYMENT_PENDING → PAID → CLOSED
```

**Duración total**: 10-21 días

**Características**:
- Documentación inicial incompleta
- Se requieren facturas, reportes médicos, etc.
- Cliente responde en tiempo

---

### Flujo de Investigación (3% de los casos)

```
DRAFT → SUBMITTED → UNDER_REVIEW → INVESTIGATING → APPROVED → PAYMENT_PENDING → PAID → CLOSED
```

**Duración total**: 15-30 días

**Características**:
- Monto alto (> €10,000)
- Circunstancias inusuales
- Requiere verificación adicional

---

### Flujo de Rechazo (2% de los casos)

```
DRAFT → SUBMITTED → UNDER_REVIEW → REJECTED → CLOSED
```

**Duración total**: 3-7 días

**Características**:
- Exclusión de póliza
- Fraude detectado
- Evidencia insuficiente

---

## Transiciones Permitidas

### Matriz de Transiciones

| Desde \ Hacia | DRAFT | SUBMITTED | UNDER_REVIEW | PENDING_DOCS | INVESTIGATING | APPROVED | REJECTED | PAYMENT_PENDING | PAID | CLOSED |
|---------------|-------|-----------|--------------|--------------|---------------|----------|----------|-----------------|------|--------|
| DRAFT         | -     | ✅        | ❌           | ❌           | ❌            | ❌       | ❌       | ❌              | ❌   | ❌     |
| SUBMITTED     | ✅    | -         | ✅           | ❌           | ❌            | ❌       | ✅       | ❌              | ❌   | ❌     |
| UNDER_REVIEW  | ❌    | ❌        | -            | ✅           | ✅            | ✅       | ✅       | ❌              | ❌   | ❌     |
| PENDING_DOCS  | ❌    | ❌        | ✅           | -            | ❌            | ❌       | ✅       | ❌              | ❌   | ✅     |
| INVESTIGATING | ❌    | ❌        | ❌           | ✅           | -             | ✅       | ✅       | ❌              | ❌   | ❌     |
| APPROVED      | ❌    | ❌        | ❌           | ❌           | ❌            | -        | ✅       | ✅              | ❌   | ❌     |
| REJECTED      | ❌    | ❌        | ✅           | ❌           | ❌            | ❌       | -        | ❌              | ❌   | ✅     |
| PAYMENT_PEND. | ❌    | ❌        | ❌           | ❌           | ❌            | ❌       | ✅       | -               | ✅   | ❌     |
| PAID          | ❌    | ❌        | ❌           | ❌           | ❌            | ❌       | ❌       | ❌              | -    | ✅     |
| CLOSED        | ❌    | ❌        | ✅           | ❌           | ❌            | ❌       | ❌       | ❌              | ❌   | -      |

---

## Reglas de Negocio

### Aprobación

**Requisitos para aprobar**:
✅ Todos los documentos requeridos subidos
✅ Documentos validados con OCR
✅ Score de fraude < 70%
✅ Cobertura confirmada en póliza
✅ Aprobación multinivel completada (si aplica)

**No se puede aprobar si**:
❌ Faltan documentos requeridos
❌ Score de fraude crítico (> 80%)
❌ Póliza vencida al momento del incidente
❌ Claim duplicado
❌ Exclusión específica en póliza

---

### Documentos Requeridos por Tipo

**AUTO_ACCIDENT**:
- Reporte policial
- Fotografías de daños
- Licencia de conducir
- Registro del vehículo

**PROPERTY_DAMAGE**:
- Fotografías de daños
- Estimación de reparación
- Prueba de propiedad

**HEALTH**:
- Reporte médico
- Facturas de tratamiento
- Prescripciones

**THEFT**:
- Reporte policial
- Lista de artículos robados
- Pruebas de valor

---

### Automatización

**Auto-Aprobación** (Claims < €500):
```javascript
if (claim.estimatedAmount < 500 &&
    claim.hasRequiredDocuments &&
    claim.fraudScore < 30) {
  // Auto-aprobar
}
```

**Auto-Rechazo** (Fraude detectado):
```javascript
if (claim.fraudScore > 80) {
  // Auto-rechazar con razón FRAUD_DETECTED
}
```

**Auto-Cierre** (Sin actividad):
```javascript
if (claim.state === 'PENDING_DOCUMENTS' &&
    daysSinceLastUpdate > 7) {
  // Auto-cerrar
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Claim Simple

```typescript
// 1. Cliente reporta accidente menor
const claim = await claimService.create({
  type: ClaimType.AUTO_ACCIDENT,
  title: 'Daño en parachoques',
  estimatedAmount: 450,
  incidentDate: new Date('2026-01-20'),
});

// 2. Cliente sube fotos
await claimService.uploadDocument(claim.id, photoFile, DocumentType.PHOTO_DAMAGE);

// 3. Submit para revisión
await claimService.submit(claim.id);

// 4. Sistema automático:
// - Detección de fraude: Score 15 (LOW)
// - Validación de docs: OK
// - Auto-aprobación: SÍ (< €500)
// Estado final: APPROVED

// 5. Procesamiento de pago
await claimService.processPayment(claim.id, {
  amount: 450,
  paymentMethod: 'BANK_TRANSFER',
});

// 6. Auto-cierre después de pago
// Estado final: PAID → CLOSED
```

**Duración total**: 3-5 días

---

### Ejemplo 2: Claim Complejo

```typescript
// 1. Accidente grave con múltiples daños
const claim = await claimService.create({
  type: ClaimType.AUTO_ACCIDENT,
  title: 'Accidente múltiple con lesiones',
  estimatedAmount: 15000,
  incidentDate: new Date('2026-01-15'),
});

// 2. Submit
await claimService.submit(claim.id);
// → Estado: SUBMITTED

// 3. Revisión inicial
await claimService.review(claim.id, {
  reviewNotes: 'Caso complejo, requiere investigación',
});
// → Estado: UNDER_REVIEW

// 4. Sistema detecta alto valor → Escala automáticamente
// → claim.priority = URGENT

// 5. Ajustador solicita documentos adicionales
await claimService.requestDocuments(claim.id, [
  DocumentType.POLICE_REPORT,
  DocumentType.MEDICAL_REPORT,
  DocumentType.REPAIR_ESTIMATE,
]);
// → Estado: PENDING_DOCUMENTS

// 6. Cliente sube documentos (3 días después)
// → Estado: UNDER_REVIEW

// 7. Iniciar investigación
await claimService.investigate(claim.id, 'investigator_001');
// → Estado: INVESTIGATING

// 8. Después de 10 días de investigación
await claimService.approve(claim.id, {
  approvedAmount: 14500, // Ajustado después de evaluación
  approvalNotes: 'Aprobado después de investigación exhaustiva',
});
// → Estado: APPROVED

// 9-10. Pago y cierre
// → PAYMENT_PENDING → PAID → CLOSED
```

**Duración total**: 20-30 días

---

### Ejemplo 3: Claim con Fraude Detectado

```typescript
// 1. Claim sospechoso
const claim = await claimService.create({
  type: ClaimType.THEFT,
  title: 'Robo de vehículo',
  estimatedAmount: 35000,
  incidentDate: new Date(), // Reportado el mismo día del incidente
});

// 2. Submit
await claimService.submit(claim.id);

// 3. Sistema de detección de fraude
const fraudAnalysis = await claimService.detectFraud(claim);
// → Score: 85 (CRITICAL)
// → Flags: HIGH_AMOUNT, SUSPICIOUS_TIMING, MULTIPLE_CLAIMS

// 4. Auto-rechazo por fraude
// → Estado: REJECTED
// → Razón: FRAUD_DETECTED

// 5. Notificación al equipo de fraude
// 6. Posible reporte a autoridades

// 7. Cierre definitivo
await claimService.close(claim.id, 'Closed due to fraud detection');
// → Estado: CLOSED
```

**Duración total**: 1-2 días

---

## Mejores Prácticas

### Para Desarrollo

1. **Siempre usar ClaimStateMachine** para transiciones
2. **Validar estado actual** antes de operaciones
3. **Registrar todas las acciones** en stateHistory
4. **Manejar errores de transición** apropiadamente

```typescript
try {
  await stateMachine.transition(claim, ClaimState.APPROVED);
} catch (error) {
  // Manejar transición inválida
  console.error('Invalid state transition:', error.message);
}
```

### Para Operaciones

1. **Revisar SLA diariamente**
2. **Monitorear claims estancados**
3. **Analizar razones de rechazo**
4. **Optimizar tiempos de aprobación**

### Para Clientes

1. **Subir todos los documentos** desde el inicio
2. **Responder rápidamente** a solicitudes
3. **Proveer información completa** y veraz
4. **Seguir el estado** del claim regularmente

---

**Última actualización**: 28/01/2026
**Versión**: 1.0.0
