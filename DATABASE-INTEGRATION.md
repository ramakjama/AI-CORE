# 🗄️ AI-CORE - INTEGRACIÓN COMPLETA DE BASES DE DATOS

## 📊 RESUMEN EJECUTIVO

AI-CORE integra **40+ bases de datos PostgreSQL** organizadas por áreas de negocio, siguiendo una arquitectura de microservicios con MDM (Master Data Management) centralizado.

---

## 🏗️ ARQUITECTURA DE DATOS

### Modelo de Integración

```
┌─────────────────────────────────────────────────────────────┐
│                    SM_GLOBAL (MDM)                          │
│              Master Data Management Central                  │
│  • Party (Clientes canónicos)                               │
│  • Deduplicación y Golden Record                            │
│  • Consolidación de hechos                                  │
│  • Feature Store (Scores/KPIs)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│ SS_INSURANCE ││  SE_ENERGY   ││  ST_TELECOM  │
│   8 DBs      ││   1 DB       ││   1 DB       │
└──────────────┘└──────────────┘└──────────────┘
        │
        ▼
┌──────────────┐┌──────────────┐┌──────────────┐
│  SF_FINANCE  ││  SR_REPAIRS  ││ SW_WORKSHOPS │
│   1 DB       ││   1 DB       ││   1 DB       │
└──────────────┘└──────────────┘└──────────────┘
```

---

## 📋 INVENTARIO COMPLETO DE BASES DE DATOS

### 1. CORE SYSTEM (5 DBs)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Global MDM | `sm_global` | Master Data Management, Party canónica |
| System | `sm_system` | Configuración del sistema |
| Auth | `sm_auth` | Autenticación y autorización |
| Audit | `sm_audit` | Auditoría inmutable |
| Logs | `sm_logs` | Logs del sistema |

### 2. INSURANCE - SEGUROS (8 DBs)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Insurance Core | `ss_insurance` | Pólizas, recibos, siniestros |
| Policies | `ss_policies` | Gestión de pólizas |
| Claims | `ss_claims` | Tramitación de siniestros |
| Commissions | `ss_commissions` | Comisiones y liquidaciones |
| Carriers | `ss_carriers` | Compañías aseguradoras |
| Endorsements | `ss_endorsements` | Suplementos y anexos |
| Retention | `ss_retention` | Retención de clientes |
| Vigilance | `ss_vigilance` | Vigilancia y fraude |

### 3. ENERGY - ENERGÍA (1 DB)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Energy | `se_energy` | Contratos luz/gas, Black Energy |

### 4. TELECOM - TELECOMUNICACIONES (1 DB)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Telecom | `st_telecom` | Fibra, móvil, Black Telecom |

### 5. FINANCE - FINANZAS (1 DB)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Finance | `sf_finance` | Hipotecas, préstamos, Eurocaja Rural |

### 6. REPAIRS - REPARADORES (1 DB)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Repairs | `sr_repairs` | Reparaciones hogar/comercio |

### 7. WORKSHOPS - TALLERES (1 DB)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| Workshops | `sw_workshops` | Reparación vehículos |

### 8. SUPPORT MODULES (20+ DBs)

| Área | Bases de Datos | Propósito |
|------|----------------|-----------|
| **HR** | `sm_hr`, `sm_hr_payroll`, `sm_hr_recruitment`, `sm_hr_training`, `sm_hr_performance` | Recursos Humanos |
| **Analytics** | `sm_analytics`, `sm_analytics_reports`, `sm_analytics_dashboards`, `sm_analytics_metrics` | Business Intelligence |
| **AI** | `sm_ai_agents`, `sm_ai_models`, `sm_ai_training`, `sm_ai_prompts` | Inteligencia Artificial |
| **Communications** | `sm_communications`, `sm_comms_email`, `sm_comms_sms`, `sm_comms_whatsapp`, `sm_comms_voice` | Comunicaciones |
| **Finance** | `sm_finance`, `sm_finance_accounting`, `sm_finance_invoicing`, `sm_finance_treasury`, `sm_accounting` | Finanzas Corporativas |
| **CRM** | `sm_crm`, `sm_leads`, `sm_customers`, `sm_commercial` | CRM y Ventas |
| **Documents** | `sm_documents`, `sm_storage` | Gestión Documental |
| **Workflows** | `sm_workflows`, `sm_tasks` | Automatización |
| **Others** | `sm_compliance`, `sm_data_quality`, `sm_integrations`, `sm_inventory`, `sm_legal`, `sm_marketing`, `sm_notifications`, `sm_objectives`, `sm_products`, `sm_projects`, `sm_quality`, `sm_scheduling`, `sm_strategy`, `sm_techteam`, `sm_tickets` | Módulos adicionales |

### 9. CUSTOMER PORTALS (2 DBs)

| Base de Datos | Código | Propósito |
|---------------|--------|-----------|
| e-Cliente | `soriano_ecliente` | Portal de clientes |
| Web Premium | `soriano_web_premium` | Web corporativa |

---

## 🔧 CONFIGURACIÓN DE PRODUCCIÓN

### 1. Crear Bases de Datos en PostgreSQL

```sql
-- Core System
CREATE DATABASE sm_global;
CREATE DATABASE sm_system;
CREATE DATABASE sm_auth;
CREATE DATABASE sm_audit;
CREATE DATABASE sm_logs;

-- Insurance
CREATE DATABASE ss_insurance;
CREATE DATABASE ss_policies;
CREATE DATABASE ss_claims;
CREATE DATABASE ss_commissions;
CREATE DATABASE ss_carriers;
CREATE DATABASE ss_endorsements;
CREATE DATABASE ss_retention;
CREATE DATABASE ss_vigilance;

-- Business Areas
CREATE DATABASE se_energy;
CREATE DATABASE st_telecom;
CREATE DATABASE sf_finance;
CREATE DATABASE sr_repairs;
CREATE DATABASE sw_workshops;

-- Support Modules
CREATE DATABASE sm_hr;
CREATE DATABASE sm_analytics;
CREATE DATABASE sm_ai_agents;
CREATE DATABASE sm_communications;
CREATE DATABASE sm_documents;
CREATE DATABASE sm_workflows;
CREATE DATABASE sm_crm;
CREATE DATABASE sm_leads;
CREATE DATABASE sm_compliance;
CREATE DATABASE sm_integrations;
CREATE DATABASE sm_marketing;
CREATE DATABASE sm_notifications;
CREATE DATABASE sm_products;
CREATE DATABASE sm_projects;
CREATE DATABASE sm_legal;
CREATE DATABASE sm_accounting;
CREATE DATABASE sm_commercial;
CREATE DATABASE sm_data_quality;
CREATE DATABASE sm_inventory;
CREATE DATABASE sm_objectives;
CREATE DATABASE sm_quality;
CREATE DATABASE sm_scheduling;
CREATE DATABASE sm_strategy;
CREATE DATABASE sm_techteam;
CREATE DATABASE sm_tickets;

-- Customer Portals
CREATE DATABASE soriano_ecliente;
CREATE DATABASE soriano_web_premium;
```

### 2. Generar Clientes Prisma

**Windows:**
```bash
cd ai-core
scripts\generate-all-prisma-clients.bat
```

**Linux/Mac:**
```bash
cd ai-core
chmod +x scripts/generate-all-prisma-clients.sh
./scripts/generate-all-prisma-clients.sh
```

### 3. Ejecutar Migraciones

```bash
# Para cada base de datos
cd databases/sm_global
npx prisma migrate deploy

cd ../ss_insurance
npx prisma migrate deploy

# ... repetir para todas las bases de datos
```

---

## 🚀 USO DEL SERVICIO DE BASES DE DATOS

### Importar el Servicio

```typescript
import { db } from '@ai-core/database';

// Acceder a cualquier base de datos
const parties = await db.global.party.findMany();
const policies = await db.insurance.policy.findMany();
const contracts = await db.energy.energyContract.findMany();
```

### Health Check

```typescript
import { db } from '@ai-core/database';

const health = await db.healthCheck();
console.log(health);
// {
//   global: true,
//   auth: true,
//   insurance: true,
//   energy: true,
//   ...
// }
```

### Transacciones Multi-Base de Datos

```typescript
// Ejemplo: Crear cliente en Global y póliza en Insurance
async function createClientWithPolicy(clientData, policyData) {
  // 1. Crear Party en Global
  const party = await db.global.party.create({
    data: clientData
  });

  // 2. Crear Policy en Insurance con referencia al Party
  const policy = await db.insurance.policy.create({
    data: {
      ...policyData,
      partyId: party.id
    }
  });

  // 3. Publicar evento para consolidación
  await db.insurance.outboxEvent.create({
    data: {
      aggregateType: 'Policy',
      aggregateId: policy.id,
      eventType: 'PolicyIssued',
      payload: { partyId: party.id, policyId: policy.id },
      status: 'PENDING'
    }
  });

  return { party, policy };
}
```

---

## 📊 PATRÓN OUTBOX PARA EVENTOS

Cada base de datos de área tiene una tabla `OutboxEvent` para publicar eventos:

```typescript
// Publicar evento desde Insurance
await db.insurance.outboxEvent.create({
  data: {
    aggregateType: 'Policy',
    aggregateId: policyId,
    eventType: 'PolicyIssued',
    payload: { /* datos del evento */ },
    status: 'PENDING'
  }
});

// Un worker procesa estos eventos y los publica a NATS
// Un consumidor en sm_global los recibe y actualiza hechos consolidados
```

---

## 🔐 SEGURIDAD Y PERMISOS

### Connection Pooling

```typescript
// Configurado en database.service.ts
{
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000
  }
}
```

### Encriptación

- Todas las conexiones usan SSL en producción
- Credenciales almacenadas en variables de entorno
- Secrets management con AWS Secrets Manager / Azure Key Vault

---

## 📈 MONITORIZACIÓN

### Métricas Clave

- **Connection Pool Usage**: Conexiones activas/disponibles
- **Query Performance**: Tiempo de respuesta por query
- **Error Rate**: Errores de conexión/query
- **Throughput**: Queries por segundo

### Herramientas

- **Prisma Studio**: Exploración de datos
- **pgAdmin**: Administración PostgreSQL
- **Grafana**: Dashboards de métricas
- **Sentry**: Tracking de errores

---

## 🔄 BACKUP Y RECUPERACIÓN

### Estrategia de Backup

```bash
# Backup diario automático
0 2 * * * /scripts/backup-all-databases.sh

# Retención: 30 días
# Almacenamiento: AWS S3 / Azure Blob
```

### Restauración

```bash
# Restaurar base de datos específica
psql -U postgres -d sm_global < backup_sm_global_2024-01-25.sql
```

---

## 📝 CHECKLIST DE PRODUCCIÓN

- [ ] Todas las bases de datos creadas en PostgreSQL
- [ ] Variables de entorno configuradas (.env.production)
- [ ] Clientes Prisma generados
- [ ] Migraciones ejecutadas
- [ ] Seeds de datos iniciales
- [ ] Connection pooling configurado
- [ ] SSL habilitado
- [ ] Backups automáticos configurados
- [ ] Monitorización activa
- [ ] Health checks funcionando
- [ ] Documentación actualizada

---

## 🎯 PRÓXIMOS PASOS

1. **Configurar PostgreSQL en producción**
2. **Ejecutar script de generación de clientes**
3. **Aplicar migraciones**
4. **Configurar workers de eventos (Outbox → NATS)**
5. **Implementar consolidación en sm_global**
6. **Configurar backups automáticos**
7. **Activar monitorización**
8. **Realizar pruebas de carga**

---

**Documentación generada:** 2024-01-25  
**Versión:** 1.0.0  
**Plataforma:** AI-CORE Production
