# AIT-CRM User Guide

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Lead Management](#lead-management)
3. [Sales Pipeline](#sales-pipeline)
4. [Activity Tracking](#activity-tracking)
5. [Email Campaigns](#email-campaigns)
6. [Analytics & Reports](#analytics--reports)
7. [Best Practices](#best-practices)

---

## Introducción

**AIT-CRM** es un sistema completo de gestión de relaciones con clientes diseñado para equipos de ventas modernos. Proporciona todas las herramientas necesarias para gestionar leads, oportunidades, actividades y campañas de email.

### Características Principales

- ✅ **Lead Management**: Captura, scoring y conversión de leads
- ✅ **Sales Pipeline**: Pipeline visual de ventas con 7 etapas
- ✅ **Activity Tracking**: 8 tipos de actividades con timeline completo
- ✅ **Email Campaigns**: Campañas de email con segmentación avanzada
- ✅ **Analytics**: Dashboard con métricas clave y reportes
- ✅ **Automation**: Asignación automática y lead scoring

---

## Lead Management

### 1. Crear un Lead

```typescript
POST /api/leads
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "company": "Empresa XYZ",
  "jobTitle": "CEO",
  "source": "WEBSITE",
  "notes": "Interesado en seguro de auto"
}
```

### 2. Lead Scoring

El sistema calcula automáticamente el score del lead (0-100) basado en:

- **Fuente** (20 puntos máx):
  - Referral: +20 puntos
  - Partner: +18 puntos
  - Event: +15 puntos
  - Website: +10 puntos

- **Perfil** (30 puntos máx):
  - Tiene empresa: +10 puntos
  - Tiene teléfono: +8 puntos
  - Cargo senior (CEO, CTO, Director): +12 puntos
  - Cargo regular: +5 puntos

- **Engagement** (30 puntos máx):
  - +5 puntos por cada actividad (máx 30)

- **Comportamiento** (20 puntos máx):
  - +10 puntos por actividad de alto valor (meeting, demo, proposal)

### 3. Asignación de Leads

**Asignación Manual:**
```typescript
POST /api/leads/{id}/assign
{
  "agentId": "agent_123"
}
```

**Asignación Automática (Round-Robin):**
```typescript
POST /api/leads/{id}/auto-assign
```

El sistema asigna automáticamente al agente con menos leads.

### 4. Conversión de Leads

Para convertir un lead a cliente:

1. **Calificar el lead:**
```typescript
POST /api/leads/{id}/qualify
```

2. **Convertir:**
```typescript
POST /api/leads/{id}/convert
{
  "createOpportunity": true,
  "estimatedValue": 5000
}
```

### 5. Estados de Lead

- **NEW**: Lead recién creado
- **CONTACTED**: Contactado por primera vez
- **QUALIFIED**: Calificado y listo para venta
- **UNQUALIFIED**: No cumple criterios
- **CONVERTED**: Convertido a cliente
- **LOST**: Perdido

---

## Sales Pipeline

### Etapas del Pipeline

1. **LEAD**: Lead inicial
2. **QUALIFIED**: Lead calificado
3. **MEETING_SCHEDULED**: Reunión agendada
4. **PROPOSAL**: Propuesta enviada
5. **NEGOTIATION**: En negociación
6. **CLOSED_WON**: Ganada ✅
7. **CLOSED_LOST**: Perdida ❌

### 1. Crear Oportunidad

```typescript
POST /api/opportunities
{
  "name": "Seguro Empresarial - Acme Corp",
  "leadId": "lead_123",
  "stage": "QUALIFIED",
  "value": 50000,
  "probability": 50,
  "expectedCloseDate": "2026-03-31T00:00:00Z"
}
```

### 2. Mover entre Etapas

```typescript
POST /api/opportunities/{id}/move-stage
{
  "stage": "PROPOSAL"
}
```

La probabilidad de cierre se actualiza automáticamente:
- LEAD: 10%
- QUALIFIED: 25%
- MEETING_SCHEDULED: 40%
- PROPOSAL: 60%
- NEGOTIATION: 75%
- CLOSED_WON: 100%

### 3. Cerrar Oportunidad

**Ganada:**
```typescript
POST /api/opportunities/{id}/close-won
{
  "actualValue": 55000,
  "notes": "Excelente negociación"
}
```

**Perdida:**
```typescript
POST /api/opportunities/{id}/close-lost
{
  "reason": "Eligió competidor",
  "notes": "Mejor precio de la competencia"
}
```

### 4. Vista de Pipeline

```typescript
GET /api/opportunities/pipeline/view?agentId=agent_123

Response:
{
  "stages": {
    "QUALIFIED": {
      "count": 5,
      "value": 150000,
      "opportunities": [...]
    },
    "PROPOSAL": {
      "count": 3,
      "value": 80000,
      "opportunities": [...]
    }
  },
  "totalValue": 230000,
  "totalCount": 8,
  "averageValue": 28750
}
```

### 5. Forecast de Revenue

```typescript
GET /api/opportunities/forecast/revenue

Response:
{
  "period": "Next 3 months",
  "predictedRevenue": 500000,
  "weightedRevenue": 275000,  // Ajustado por probabilidad
  "opportunities": 15
}
```

---

## Activity Tracking

### Tipos de Actividades

1. **CALL**: Llamada telefónica
2. **EMAIL**: Email enviado/recibido
3. **MEETING**: Reunión
4. **NOTE**: Nota interna
5. **TASK**: Tarea pendiente
6. **DEMO**: Demostración de producto
7. **PROPOSAL**: Propuesta enviada
8. **DOCUMENT**: Documento compartido

### 1. Registrar Llamada

```typescript
POST /api/activities/log-call
{
  "leadId": "lead_123",
  "description": "Discutimos opciones de cobertura",
  "duration": 30,
  "outcome": "Interesado en cotización"
}
```

### 2. Registrar Meeting

```typescript
POST /api/activities/log-meeting
{
  "opportunityId": "opp_123",
  "title": "Demo de producto",
  "scheduledFor": "2026-02-15T10:00:00Z",
  "duration": 60,
  "location": "Oficina"
}
```

### 3. Crear Tarea

```typescript
POST /api/activities/log-task
{
  "leadId": "lead_123",
  "title": "Enviar cotización",
  "dueDate": "2026-02-10T00:00:00Z",
  "priority": "high"
}
```

### 4. Timeline de Actividades

```typescript
GET /api/activities/timeline/lead/lead_123

Response: [
  {
    "id": "act_1",
    "type": "CALL",
    "description": "Primera llamada",
    "createdAt": "2026-01-28T10:00:00Z",
    "createdBy": { "name": "Juan Agent" }
  },
  {
    "id": "act_2",
    "type": "EMAIL",
    "description": "Enviada cotización",
    "createdAt": "2026-01-28T15:00:00Z",
    "createdBy": { "name": "Juan Agent" }
  }
]
```

### 5. Resumen de Actividades

```typescript
GET /api/activities/agent/agent_123/summary?period=week

Response:
{
  "totalActivities": 45,
  "byType": {
    "CALL": 15,
    "EMAIL": 20,
    "MEETING": 5,
    "PROPOSAL": 3,
    "DEMO": 2
  },
  "completedTasks": 12,
  "pendingTasks": 8,
  "upcomingMeetings": 3
}
```

---

## Email Campaigns

### 1. Crear Template de Email

```typescript
POST /api/email-templates
{
  "name": "Welcome Email",
  "subject": "Bienvenido a {{companyName}}",
  "htmlContent": "<html><body><h1>Hola {{firstName}}</h1><p>Gracias por tu interés...</p></body></html>",
  "variables": ["firstName", "companyName"]
}
```

### 2. Crear Segmento

```typescript
POST /api/campaigns/segments
{
  "name": "Hot Leads Q1",
  "description": "Leads con score > 70",
  "criteria": {
    "minScore": 70,
    "status": "NEW"
  }
}
```

### 3. Crear Campaña

```typescript
POST /api/campaigns
{
  "name": "Promoción Q1 2026",
  "description": "Oferta especial para Q1",
  "templateId": "tpl_123",
  "segmentIds": ["seg_hot_leads", "seg_active_customers"],
  "scheduledDate": "2026-02-15T10:00:00Z",
  "variables": {
    "companyName": "Soriano Mediadores",
    "offerDiscount": "15%"
  }
}
```

### 4. Enviar Test

```typescript
POST /api/campaigns/{id}/send-test
{
  "emails": ["test@example.com", "marketing@example.com"]
}
```

### 5. Enviar Campaña

```typescript
POST /api/campaigns/{id}/send

Response:
{
  "campaignId": "cmp_123",
  "totalRecipients": 150,
  "sent": 148,
  "failed": 2,
  "startedAt": "2026-02-15T10:00:00Z",
  "completedAt": "2026-02-15T10:15:00Z"
}
```

### 6. Estadísticas de Campaña

```typescript
GET /api/campaigns/{id}/statistics

Response:
{
  "totalSent": 148,
  "delivered": 145,
  "opened": 87,
  "clicked": 23,
  "bounced": 3,
  "unsubscribed": 2,
  "conversions": 5,
  "openRate": 60.14,
  "clickRate": 26.44,
  "conversionRate": 3.45,
  "bounceRate": 2.07,
  "unsubscribeRate": 1.38
}
```

---

## Analytics & Reports

### 1. Estadísticas de Leads

```typescript
GET /api/analytics/leads/statistics

Response:
{
  "total": 250,
  "new": 80,
  "contacted": 60,
  "qualified": 40,
  "converted": 70,
  "conversionRate": 28.0,
  "averageScore": 65.5,
  "bySource": {
    "WEBSITE": 100,
    "REFERRAL": 80,
    "SOCIAL_MEDIA": 50,
    "EMAIL_CAMPAIGN": 20
  }
}
```

### 2. Funnel de Conversión

```typescript
GET /api/analytics/leads/conversion-funnel?period=month

Response:
{
  "period": "Last 30 days",
  "stages": [
    { "name": "New Leads", "count": 200, "percentage": 100 },
    { "name": "Contacted", "count": 150, "percentage": 75 },
    { "name": "Qualified", "count": 80, "percentage": 40 },
    { "name": "Converted", "count": 25, "percentage": 12.5 }
  ],
  "dropOffRate": 87.5
}
```

### 3. Rendimiento por Fuente

```typescript
GET /api/analytics/leads/source-performance

Response: [
  {
    "source": "REFERRAL",
    "totalLeads": 80,
    "qualifiedLeads": 45,
    "convertedLeads": 20,
    "conversionRate": 25.0,
    "averageScore": 75.2
  },
  {
    "source": "WEBSITE",
    "totalLeads": 100,
    "qualifiedLeads": 35,
    "convertedLeads": 12,
    "conversionRate": 12.0,
    "averageScore": 58.5
  }
]
```

### 4. Estadísticas de Ventas

```typescript
GET /api/analytics/sales/statistics

Response:
{
  "totalOpportunities": 50,
  "openOpportunities": 30,
  "wonOpportunities": 15,
  "lostOpportunities": 5,
  "winRate": 75.0,
  "averageDealSize": 45000,
  "totalValue": 2250000,
  "totalWonValue": 675000
}
```

### 5. Performance de Agente

```typescript
GET /api/analytics/agents/agent_123/performance?period=month

Response:
{
  "agentId": "agent_123",
  "agentName": "Juan Vendedor",
  "period": "Last 30 days",
  "leadsAssigned": 45,
  "leadsConverted": 12,
  "opportunitiesWon": 8,
  "opportunitiesLost": 2,
  "totalRevenue": 360000,
  "winRate": 80.0,
  "averageDealSize": 45000,
  "activitiesLogged": 120
}
```

### 6. Top Performers

```typescript
GET /api/analytics/agents/top-performers?period=month&limit=5

Response: [
  {
    "agentName": "María López",
    "totalRevenue": 450000,
    "opportunitiesWon": 10,
    "winRate": 83.3
  },
  {
    "agentName": "Juan Vendedor",
    "totalRevenue": 360000,
    "opportunitiesWon": 8,
    "winRate": 80.0
  }
]
```

---

## Best Practices

### 1. Lead Management

✅ **DO:**
- Asigna leads inmediatamente cuando lleguen
- Actualiza el score regularmente (sistema lo hace automático)
- Agrega notas detalladas en cada interacción
- Califica leads antes de convertir

❌ **DON'T:**
- No dejes leads sin asignar más de 24 horas
- No conviertas leads sin calificar primero
- No olvides actualizar el estado después de cada contacto

### 2. Sales Pipeline

✅ **DO:**
- Mueve oportunidades regularmente entre etapas
- Registra actividades en cada oportunidad
- Actualiza el valor estimado conforme avanza la negociación
- Cierra oportunidades perdidas con razón clara

❌ **DON'T:**
- No dejes oportunidades estancadas más de 30 días
- No muevas directamente de QUALIFIED a CLOSED_WON
- No olvides actualizar la fecha de cierre esperada

### 3. Activity Tracking

✅ **DO:**
- Registra todas las interacciones inmediatamente
- Usa el tipo de actividad correcto
- Agrega detalles importantes (duración, outcome)
- Programa follow-ups después de cada meeting

❌ **DON'T:**
- No registres actividades días después
- No uses solo NOTES, especifica el tipo
- No olvides completar las tareas programadas

### 4. Email Campaigns

✅ **DO:**
- Segmenta bien tu audiencia
- Prueba con emails de test antes de enviar
- Personaliza con variables {{firstName}}, etc.
- Analiza métricas después de cada campaña

❌ **DON'T:**
- No envíes a toda tu lista sin segmentar
- No ignores las tasas de unsubscribe altas
- No envíes más de 2 campañas por semana

### 5. Analytics

✅ **DO:**
- Revisa métricas semanalmente
- Compara rendimiento entre agentes
- Identifica fuentes de leads más efectivas
- Ajusta estrategia basado en datos

❌ **DON'T:**
- No ignores el drop-off rate en el funnel
- No compares períodos muy diferentes
- No tomes decisiones sin datos suficientes

---

## Soporte

Para ayuda adicional:
- 📧 Email: support@ait-core.com
- 📚 Documentación: https://docs.ait-core.com
- 💬 Slack: #ait-crm-support

---

**Versión:** 1.0.0
**Última actualización:** 28 Enero 2026
