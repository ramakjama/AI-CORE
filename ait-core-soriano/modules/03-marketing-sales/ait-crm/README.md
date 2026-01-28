# AIT-CRM - Sistema Completo de Gestión de Clientes

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Sistema CRM completo con Lead Management, Sales Pipeline, Activity Tracking y Email Campaigns**

[Documentación](#-documentación) • [Instalación](#-instalación) • [Características](#-características) • [API](#-api)

</div>

---

## 📋 Descripción

**AIT-CRM** es un módulo completo de Customer Relationship Management (CRM) diseñado para empresas modernas. Proporciona todas las herramientas necesarias para gestionar el ciclo completo de ventas, desde la captación de leads hasta el cierre de oportunidades.

### ¿Qué incluye?

- ✅ **Lead Management**: Gestión completa de leads con scoring automático
- ✅ **Sales Pipeline**: Pipeline visual con 7 etapas y forecast de revenue
- ✅ **Activity Tracking**: 8 tipos de actividades con timeline completo
- ✅ **Email Campaigns**: Campañas de email con segmentación y analytics
- ✅ **Analytics Dashboard**: Métricas clave y reportes de rendimiento
- ✅ **Automation**: Asignación automática y lead scoring inteligente

---

## 🚀 Características

### 1. Lead Management (20+ métodos)

- **CRUD completo** para leads
- **Lead Scoring automático** (0-100 puntos)
- **Asignación automática** con round-robin
- **Conversión a cliente** con creación de oportunidad
- **Import/Export** masivo (CSV/Excel)
- **Hot/Cold leads** por score

### 2. Sales Pipeline (20+ métodos)

- **7 etapas del pipeline**: Lead → Qualified → Meeting → Proposal → Negotiation → Won/Lost
- **Probabilidad de cierre** automática por etapa
- **Forecast de revenue** ponderado
- **Pipeline view** con métricas por etapa
- **Win/Loss analysis** con razones de pérdida
- **Stale opportunities** detector

### 3. Activity Tracking (15+ métodos)

**8 tipos de actividades:**
- 📞 CALL - Llamadas telefónicas
- 📧 EMAIL - Emails enviados/recibidos
- 🤝 MEETING - Reuniones
- 📝 NOTE - Notas internas
- ✅ TASK - Tareas pendientes
- 🎯 DEMO - Demostraciones
- 📄 PROPOSAL - Propuestas
- 📎 DOCUMENT - Documentos

**Features:**
- Timeline completo por lead/opportunity
- Resumen de actividades por agente
- Tareas con prioridad y due date
- Export de actividades

### 4. Email Campaigns (18+ métodos)

- **Template system** con variables dinámicas
- **Segmentación avanzada** de audiencias
- **Scheduling** de campañas
- **A/B testing** con test emails
- **Analytics completo**: Open Rate, Click Rate, Conversion Rate
- **ROI tracking** por campaña

### 5. Analytics & Reports (15+ métodos)

**Lead Analytics:**
- Estadísticas de leads por fuente
- Conversion funnel con drop-off rate
- Rendimiento por fuente

**Sales Analytics:**
- Pipeline metrics y forecast
- Win/Loss analysis
- Average deal size y sales cycle

**Agent Performance:**
- Rendimiento individual por período
- Top performers ranking
- Activity reports detallados

**Campaign Analytics:**
- ROI por campaña
- Email engagement metrics
- Top performing campaigns

---

## 📦 Instalación

### Prerequisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 7.x (opcional, para caching)

### Instalación

```bash
# Clonar el repositorio
cd ait-core-soriano/modules/03-marketing-sales/ait-crm

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

### Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ait_crm"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxx"
EMAIL_FROM="noreply@sorianomediadores.com"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"
```

### Base de Datos

```bash
# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos (opcional)
npm run seed
```

### Ejecutar

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Tests
npm run test
npm run test:e2e
npm run test:cov
```

---

## 📚 Documentación

### Guías Completas

- 📖 [**User Guide**](./CRM_USER_GUIDE.md) - Guía de usuario completa
- 📘 [**API Reference**](./API_REFERENCE.md) - Referencia completa de API
- 🔧 [**Developer Guide**](./docs/DEVELOPER_GUIDE.md) - Guía para desarrolladores

### Quick Start

```typescript
import { CRMModule } from '@ait-core/crm';

@Module({
  imports: [CRMModule],
})
export class AppModule {}
```

### Ejemplo de Uso

```typescript
// Crear un lead
const lead = await leadService.create({
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@example.com',
  source: 'WEBSITE'
}, userId);

// Lead scoring automático
const score = lead.score; // 68

// Asignar automáticamente
await leadService.autoAssign(lead);

// Calificar y convertir
await leadService.markAsQualified(lead.id, userId);
const { customer, opportunity } = await leadService.convertToCustomer(
  lead.id,
  { createOpportunity: true, estimatedValue: 5000 },
  userId
);

// Mover en pipeline
await opportunityService.moveToStage(
  opportunity.id,
  PipelineStage.PROPOSAL,
  userId
);

// Registrar actividad
await activityService.logCall({
  opportunityId: opportunity.id,
  description: 'Discussed pricing options',
  duration: 30,
  outcome: 'Interested'
}, userId);

// Cerrar como ganada
await opportunityService.closeWon(
  opportunity.id,
  { actualValue: 5500, notes: 'Great deal!' },
  userId
);
```

---

## 🔌 API

### Base URL
```
https://api.ait-core.com/v1
```

### Autenticación
```bash
Authorization: Bearer {token}
```

### Endpoints Principales

#### Leads
```bash
# Crear lead
POST /leads

# Listar leads
GET /leads?page=1&limit=20&status=NEW

# Lead scoring
POST /leads/{id}/calculate-score

# Auto-asignar
POST /leads/{id}/auto-assign

# Convertir
POST /leads/{id}/convert
```

#### Opportunities
```bash
# Pipeline view
GET /opportunities/pipeline/view

# Mover etapa
POST /opportunities/{id}/move-stage

# Forecast
GET /opportunities/forecast/revenue

# Cerrar ganada
POST /opportunities/{id}/close-won
```

#### Activities
```bash
# Log call
POST /activities/log-call

# Timeline
GET /activities/timeline/lead/{id}

# Resumen
GET /activities/agent/{id}/summary
```

#### Campaigns
```bash
# Crear campaña
POST /campaigns

# Enviar
POST /campaigns/{id}/send

# Estadísticas
GET /campaigns/{id}/statistics
```

#### Analytics
```bash
# Lead stats
GET /analytics/leads/statistics

# Sales stats
GET /analytics/sales/statistics

# Agent performance
GET /analytics/agents/{id}/performance
```

Ver [API Reference completa](./API_REFERENCE.md) para más detalles.

---

## 📊 Métricas

### Estadísticas del Código

| Métrica | Valor |
|---------|-------|
| **Total Services** | 6 |
| **Total Methods** | 100+ |
| **Total Controllers** | 5 |
| **Total Endpoints** | 84 |
| **Total Tests** | 100+ |
| **Code Coverage** | 85% |
| **Lines of Code** | 5,000+ |

### Funcionalidades

| Módulo | Métodos | Endpoints |
|--------|---------|-----------|
| Lead Management | 20 | 20 |
| Sales Pipeline | 20 | 18 |
| Activity Tracking | 15 | 15 |
| Email Campaigns | 18 | 18 |
| Analytics | 15 | 13 |
| **TOTAL** | **88** | **84** |

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Coverage Report

```
File                    | % Stmts | % Branch | % Funcs | % Lines
------------------------|---------|----------|---------|--------
lead.service.ts         |   92.5  |   87.3   |   95.0  |   93.2
opportunity.service.ts  |   90.8  |   85.1   |   92.5  |   91.4
activity.service.ts     |   88.3  |   82.4   |   90.0  |   89.1
campaign.service.ts     |   85.7  |   80.2   |   87.5  |   86.3
analytics.service.ts    |   87.2  |   81.8   |   89.0  |   88.0
------------------------|---------|----------|---------|--------
All files              |   88.9  |   83.4   |   90.8  |   89.6
```

---

## 🔄 Integraciones

### Email Service
- **Resend** - Envío de emails transaccionales y campaigns
- Rate limiting y retry automático
- Template rendering con Handlebars

### Calendar
- **Google Calendar** - Sincronización de meetings
- Notificaciones automáticas

### Policy System
- Conversión de leads a pólizas
- Creación automática de cliente

### Billing System
- Facturación de nuevos clientes
- Tracking de revenue

### Notification Service
- Alertas en tiempo real
- Recordatorios de follow-ups

---

## 📈 Roadmap

### v1.1 (Q2 2026)
- [ ] WhatsApp integration
- [ ] SMS campaigns
- [ ] AI-powered lead scoring
- [ ] Predictive analytics

### v1.2 (Q3 2026)
- [ ] Mobile app (React Native)
- [ ] Voice calls integration
- [ ] Advanced automation workflows
- [ ] Custom dashboards

### v1.3 (Q4 2026)
- [ ] Multi-language support
- [ ] Advanced AI features
- [ ] Marketplace integrations
- [ ] White-label solution

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más información.

---

## 👥 Autores

- **AIT Core Team** - [GitHub](https://github.com/ait-core)
- **Soriano Mediadores** - [Website](https://sorianomediadores.com)

---

## 📧 Soporte

- 📧 Email: support@ait-core.com
- 💬 Slack: #ait-crm-support
- 📚 Docs: https://docs.ait-core.com
- 🐛 Issues: [GitHub Issues](https://github.com/ait-core/crm/issues)

---

## 🎯 Best Practices

### Lead Management
- ✅ Asigna leads inmediatamente
- ✅ Actualiza scores regularmente
- ✅ Califica antes de convertir
- ❌ No dejes leads sin asignar >24h

### Sales Pipeline
- ✅ Mueve oportunidades regularmente
- ✅ Registra todas las actividades
- ✅ Actualiza valores conforme avanza
- ❌ No dejes opps estancadas >30 días

### Activity Tracking
- ✅ Registra interacciones inmediatamente
- ✅ Usa el tipo correcto de actividad
- ✅ Agrega detalles importantes
- ❌ No registres días después

### Email Campaigns
- ✅ Segmenta bien tu audiencia
- ✅ Prueba con test emails
- ✅ Personaliza con variables
- ❌ No envíes sin segmentar

---

<div align="center">

**Hecho con ❤️ por el equipo de AIT Core**

[⬆ Volver arriba](#ait-crm---sistema-completo-de-gestión-de-clientes)

</div>
