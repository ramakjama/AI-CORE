# FASE 0: ANÁLISIS DE ESTRUCTURA ACTUAL

## Inventario Completo

### Estructura Actual de Directorios
```
ait-core-soriano/
├─ modules/               [❌ DEBE SALIR - Convertir a repos individuales]
│  ├─ 01-core-business/
│  │  ├─ ait-policy-manager/      ✅ Completo (1,200 LOC)
│  │  ├─ ait-claim-processor/     ✅ Completo (1,000 LOC)
│  │  ├─ ait-client-hub/          ❌ No existe (CREAR)
│  │  ├─ ait-product-catalog/     ❌ No existe (CREAR)
│  │  ├─ ai-accountant/           ⚠️ Existe parcial
│  │  └─ ai-treasury/             ⚠️ Existe parcial
│  │
│  ├─ 02-insurance-specialized/
│  │  └─ ait-underwriting/        ✅ Completo (350 LOC)
│  │
│  ├─ 03-marketing-sales/
│  │  └─ ait-crm/                 ✅ Completo (400 LOC)
│  │
│  ├─ 05-security-compliance/
│  │  └─ ait-audit-trail/         ✅ Completo (200 LOC)
│  │
│  ├─ 06-infrastructure/
│  │  └─ ait-cache-manager/       ✅ Completo (300 LOC)
│  │
│  └─ 07-integration-automation/
│     └─ ait-api-gateway/         🔄 80% completo
│
├─ agents/                [✅ MANTENER - Ya está separado]
│  ├─ interfaces/         ✅ 100%
│  ├─ specialists/        ✅ 8/8 completos
│  └─ executors/          ✅ 8/8 completos
│
├─ apps/                  [⚠️ MOVER - Parte de frontends]
│  ├─ api/                🔄 Backend (mantener temporalmente)
│  ├─ web/                ⚠️ Mover a repo independiente
│  ├─ admin/              ⚠️ Mover a repo independiente
│  └─ mobile/             ⚠️ Mover a repo independiente
│
├─ libs/                  [✅ MANTENER - Es parte del esqueleto]
│  ├─ database/           ✅ Schemas Prisma (40 DB)
│  ├─ shared/             ✅ Utilidades base
│  ├─ ui/                 ⚠️ Mover con frontends
│  └─ kafka/              🔄 Mover a core-services/
│
├─ k8s/                   [✅ MANTENER - Infraestructura]
│  ├─ deployments/        ✅ 61 deployments
│  ├─ services/           ✅ 61 services
│  └─ hpa/                ✅ 14 HPAs
│
└─ .github/workflows/     [✅ MANTENER - CI/CD]
   ├─ backend.yml         ✅
   ├─ frontend.yml        ✅
   └─ agents.yml          ✅
```

## Análisis de Módulos Existentes

### Módulos COMPLETOS (6) ✅
1. ait-policy-manager (1,200 LOC) - Layer 1
2. ait-claim-processor (1,000 LOC) - Layer 1
3. ait-underwriting (350 LOC) - Layer 2
4. ait-crm (400 LOC) - Layer 2
5. ait-cache-manager (300 LOC) - Core Service
6. ait-audit-trail (200 LOC) - Core Service

### Módulos PARCIALES (2) ⚠️
1. ai-accountant - Existe estructura, falta implementación completa
2. ai-treasury - Existe estructura, falta implementación completa

### Módulos FALTANTES (49) ❌
**Capa 1 (2 críticos):**
- ait-client-hub - CRÍTICO
- ait-product-catalog - CRÍTICO

**Capa 2 (4):**
- ait-commission-engine
- ait-document-vault
- ait-workflow-engine
- ait-notification-hub

**Resto:** 43 módulos adicionales

## Dependencias Entre Módulos

```
ait-client-hub (NUEVO)
  └─→ No depende de nadie (BASE)

ait-product-catalog (NUEVO)
  └─→ No depende de nadie (BASE)

ait-policy-manager ✅
  ├─→ ait-client-hub (BLOQUEO)
  └─→ ait-product-catalog (BLOQUEO)

ait-claim-processor ✅
  ├─→ ait-policy-manager
  └─→ ait-client-hub

ait-underwriting ✅
  ├─→ ait-client-hub
  └─→ ait-product-catalog

ait-crm ✅
  └─→ ait-client-hub

CONCLUSIÓN: ait-client-hub y ait-product-catalog BLOQUEAN TODO
```

## Plan de Acción Inmediata

### PRIORIDAD 1: Desbloquear Sistema
1. Crear ait-client-hub (45 min)
2. Crear ait-product-catalog (30 min)
3. Estos 2 módulos desbloquean los 4 existentes

### PRIORIDAD 2: Crear Esqueleto
1. Mover core-services fuera de modules/
2. Crear libs/module-interface
3. Crear libs/connector-sdk

### PRIORIDAD 3: Extraer Módulos
1. Crear repos individuales para 6 módulos existentes
2. Actualizar a usar connector-sdk
3. Validar funcionamiento

## Decisiones Arquitectónicas

### ✅ MANTENER COMO ESTÁN:
- `agents/` - Ya es repo independiente conceptualmente
- `libs/database/` - Parte del esqueleto
- `k8s/` - Infraestructura del esqueleto
- `.github/workflows/` - CI/CD del esqueleto

### 🔄 MOVER A CORE-SERVICES:
- `modules/06-infrastructure/ait-cache-manager/` → `core-services/cache-manager/`
- `modules/05-security-compliance/ait-audit-trail/` → `core-services/audit-trail/`
- `modules/07-integration-automation/ait-api-gateway/` → `core-services/api-gateway/`
- `libs/kafka/` → `core-services/event-bus/`

### 📦 EXTRAER A MÓDULOS INDIVIDUALES:
- Todos los módulos en `modules/01-core-business/`
- Todos los módulos en `modules/02-insurance-specialized/`
- Todos los módulos en `modules/03-marketing-sales/`
- Todos los módulos en `modules/04-analytics-intelligence/`

### 🌐 CONFIRMAR REPOS INDEPENDIENTES:
- `apps/web/` → Ya debe estar en repo propio
- `apps/admin/` → Ya debe estar en repo propio
- `apps/mobile/` → Ya debe estar en repo propio

## Próximos Pasos

1. ✅ Crear backup completo
2. ✅ Crear ait-client-hub (DESBLOQUEADOR)
3. ✅ Crear ait-product-catalog (DESBLOQUEADOR)
4. 🔄 Iniciar FASE 1: Crear esqueleto puro
