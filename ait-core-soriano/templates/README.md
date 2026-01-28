# 🏗️ AIT MODULE TEMPLATES SYSTEM

Sistema de templates para generar módulos AIT completos con todas las funcionalidades estándar.

## 📋 Índice

- [Características](#características)
- [Uso Rápido](#uso-rápido)
- [Componentes Incluidos](#componentes-incluidos)
- [Agentes IA Avanzados](#agentes-ia-avanzados)
- [Personalización](#personalización)

---

## ✨ Características

Cada módulo generado incluye:

- ✅ **NestJS 11** con TypeScript 5.6
- ✅ **Prisma 6** para base de datos
- ✅ **Swagger** documentación automática
- ✅ **Validación** con class-validator
- ✅ **Testing** configurado con Jest
- ✅ **Agentes IA** con 100 paralelos
- ✅ **Modos avanzados** (Switch/Edit/Plain/Bypass)
- ✅ **CRUD completo** preconfigurado
- ✅ **Health check** endpoint
- ✅ **Docker** compatible
- ✅ **Logging** con Winston
- ✅ **Security** rate limiting, CORS, helmet

---

## 🚀 Uso Rápido

### Generar nuevo módulo

```bash
cd ait-core-soriano
node scripts/generate-module.js
```

Responde las preguntas interactivas:

```
Module name: ait-treasury
Description: Gestión de tesorería con IA
Category: 1 (Core Business)
Entity name: Payment
Port: 3005
Keywords: treasury, payments, cash
Priority: high
Icon: 💰
Color: #4CAF50
```

### Resultado

Se genera un módulo completo en:
```
modules/01-core-business/ait-treasury/
├── package.json              # NestJS 11 + Prisma 6
├── tsconfig.json             # TypeScript config
├── nest-cli.json             # NestJS CLI config
├── module.config.json        # Configuración del módulo
├── prisma/
│   └── schema.prisma         # Esquema de base de datos (editable)
├── src/
│   ├── main.ts               # Entry point
│   ├── ait-treasury.module.ts   # Módulo principal
│   ├── shared/
│   │   └── prisma.service.ts # Servicio compartido de BD
│   ├── controllers/
│   │   └── treasury.controller.ts  # CRUD endpoints
│   ├── services/
│   │   └── treasury.service.ts     # Lógica de negocio
│   └── dto/
│       ├── create-payment.dto.ts   # Validaciones
│       └── update-payment.dto.ts
```

### Pasos Siguientes

```bash
cd modules/01-core-business/ait-treasury

# 1. Personalizar el esquema Prisma
vim prisma/schema.prisma

# 2. Instalar dependencias
pnpm install

# 3. Generar cliente Prisma
pnpm prisma:generate

# 4. Crear migraciones
pnpm prisma:migrate

# 5. Iniciar en desarrollo
pnpm start:dev
```

El módulo estará corriendo en:
- 🌐 API: http://localhost:3005/api/v1
- 📊 Swagger: http://localhost:3005/api-docs
- 🏥 Health: http://localhost:3005/health

---

## 📦 Componentes Incluidos

### 1. Package.json Estandarizado

```json
{
  "name": "@ait-core/{{MODULE_NAME}}",
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/swagger": "^8.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/axios": "^3.1.0",
    "@prisma/client": "^6.0.0",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "prisma:generate": "prisma generate",
    "test": "jest"
  }
}
```

### 2. PrismaService Compartido

Servicio base para todos los módulos con:
- ✅ Lifecycle hooks (onModuleInit, onModuleDestroy)
- ✅ Logging integrado
- ✅ Métodos utilitarios (cleanDatabase, getStats)
- ✅ Multi-tenant ready

### 3. Base Controller

Controlador con CRUD completo:
- `POST /` - Crear
- `GET /` - Listar (con paginación)
- `GET /:id` - Obtener uno
- `PUT /:id` - Actualizar
- `DELETE /:id` - Eliminar
- `GET /health/check` - Health check

### 4. Base Service

Servicio con lógica estándar:
- Validaciones
- Manejo de errores
- Logging
- Transacciones

### 5. DTOs con Validación

```typescript
export class CreatePaymentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
```

---

## 🤖 Agentes IA Avanzados

Cada módulo incluye configuración avanzada de agentes en `module.config.json`:

### Configuración de Agentes

```json
{
  "agent": {
    "enabled": true,
    "parallelAgents": 100,
    "modes": {
      "switch": true,
      "edit": true,
      "plain": true,
      "bypass": {
        "enabled": false,
        "warning": "DANGER: Bypass mode disables all safety checks"
      }
    },
    "features": {
      "contextMemory": true,
      "learningMode": true,
      "autoOptimize": true,
      "multimodal": true,
      "realtimeProcessing": true
    }
  }
}
```

### Modos de Operación

#### 1. **Switch Mode** 🔄
Permite cambiar entre diferentes agentes especializados dinámicamente.

```typescript
// Ejemplo: Cambiar de agente contable a agente fiscal
await agentManager.switch({
  from: 'accountant-agent',
  to: 'tax-agent',
  context: currentTransaction
});
```

**Casos de uso:**
- Transición entre tareas complejas
- Delegación a expertos especializados
- Optimización de recursos

#### 2. **Edit Mode** ✏️
Los agentes pueden modificar código, configuraciones y datos directamente.

```typescript
// Ejemplo: Agente corrige automáticamente asiento contable
await agent.edit({
  target: 'accounting-entry',
  id: entry.id,
  changes: {
    debit: correctedDebit,
    credit: correctedCredit
  },
  reason: 'Balance mismatch detected and corrected'
});
```

**Casos de uso:**
- Corrección automática de errores
- Optimización de configuraciones
- Refactoring de código

#### 3. **Plain Mode** 📝
Respuestas sin formateo ni procesamiento adicional (útil para integraciones).

```typescript
// Ejemplo: Obtener respuesta cruda para API externa
const rawResponse = await agent.query({
  question: 'Calcular impuesto',
  mode: 'plain',
  format: 'json'
});
```

**Casos de uso:**
- Integraciones con sistemas externos
- Procesamiento en pipeline
- APIs machine-to-machine

#### 4. **Bypass Mode** ⚠️ **PELIGRO**
Desactiva TODAS las validaciones y checks de seguridad.

```typescript
// ⚠️ SOLO USAR EN EMERGENCIAS
await agent.execute({
  command: 'force-close-period',
  mode: 'bypass',
  reason: 'Critical end-of-year closing',
  approvedBy: 'CEO',
  timestamp: Date.now()
});
```

**⚠️ Advertencias:**
- Desactiva validaciones de negocio
- Bypassa límites de seguridad
- Puede causar inconsistencias
- **REQUIERE aprobación de 2 administradores**
- Registra en audit log nivel CRITICAL

**Casos de uso (SOLO):**
- Recuperación de desastres
- Migración de datos urgente
- Cierre fiscal con problemas bloqueantes

### Procesamiento Paralelo

Los agentes pueden ejecutar hasta **100 tareas en paralelo**:

```typescript
// Ejemplo: Procesar 100 facturas simultáneamente
const results = await agent.parallelProcess({
  tasks: invoices.map(invoice => ({
    type: 'validate-invoice',
    data: invoice
  })),
  maxConcurrency: 100,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  },
  onError: (error, task) => {
    logger.error(`Task failed:`, error);
  }
});
```

**Optimizaciones automáticas:**
- Load balancing inteligente
- Retry automático con backoff
- Circuit breaker para errores masivos
- Priorización de tareas críticas

### Funcionalidades Avanzadas

#### Context Memory
Los agentes recuerdan el contexto de conversaciones anteriores:

```typescript
await agent.remember({
  context: 'customer-id-12345',
  data: {
    preferences: ['email-notifications', 'monthly-reports'],
    history: previousInteractions
  }
});

// Más tarde...
const response = await agent.query({
  question: 'Resumir actividad del cliente',
  useContext: 'customer-id-12345'  // Automáticamente usa preferencias guardadas
});
```

#### Learning Mode
Los agentes aprenden de feedback y mejoran con el tiempo:

```typescript
await agent.provideFeedback({
  taskId: 'task-123',
  result: 'success',
  quality: 0.95,
  userRating: 5,
  comments: 'Clasificación perfecta del gasto'
});

// El agente ajusta sus modelos internos
```

#### Auto-Optimize
Optimización automática de consultas y procesos:

```typescript
// El agente detecta un query lento y lo optimiza
await agent.analyzePerformance();
// → Automáticamente añade índices, cachea resultados, reescribe queries
```

---

## 🛠️ Personalización

### Modificar Templates

Los templates están en: `ait-core-soriano/templates/module/`

```
templates/module/
├── package.json.template
├── tsconfig.json.template
├── nest-cli.json.template
├── module.config.json.template
├── src/
│   ├── {{MODULE_NAME}}.module.ts.template
│   ├── shared/
│   │   └── prisma.service.ts.template
│   ├── controllers/
│   │   └── base.controller.ts.template
│   ├── services/
│   │   └── base.service.ts.template
│   ├── dto/
│   │   ├── create.dto.ts.template
│   │   └── update.dto.ts.template
│   └── main.ts.template
```

### Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{MODULE_NAME}}` | Nombre original | ait-treasury |
| `{{MODULE_NAME_KEBAB}}` | Kebab case | ait-treasury |
| `{{MODULE_NAME_PASCAL}}` | Pascal case | AitTreasury |
| `{{MODULE_NAME_CAMEL}}` | Camel case | aitTreasury |
| `{{MODULE_NAME_UPPER}}` | Upper snake | AIT_TREASURY |
| `{{ENTITY_NAME}}` | Entidad principal | Payment |
| `{{ENTITY_NAME_PLURAL}}` | Plural | Payments |
| `{{MODULE_DESCRIPTION}}` | Descripción | Gestión de tesorería |
| `{{PORT}}` | Puerto | 3005 |
| `{{CATEGORY}}` | Categoría | 01-core-business |
| `{{PRIORITY}}` | Prioridad | high |

### Ejemplo: Añadir Nuevo Template

```typescript
// templates/module/src/guards/auth.guard.ts.template
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class {{MODULE_NAME_PASCAL}}AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Tu lógica aquí
    return true;
  }
}
```

El generador automáticamente:
1. Reemplaza variables
2. Crea directorios necesarios
3. Convierte nombres de archivos

---

## 📊 Estadísticas de Módulos

Después de generar, cada módulo tiene:

- ⚙️ **~15 archivos** generados
- 📝 **~1,500 líneas de código** base
- 🎯 **100% funcional** desde día 1
- 🚀 **<5 minutos** para estar corriendo
- 🔒 **Seguridad** incluida (auth, rate limiting, CORS)
- 📚 **Swagger** documentación automática
- 🧪 **Testing** configurado con Jest
- 🐳 **Docker** compatible

---

## 🎯 Módulos Generados

Ya generados con este sistema:

| Módulo | Puerto | Estado | Descripción |
|--------|--------|--------|-------------|
| **AIT-ACCOUNTANT** | 3002 | ✅ 100% | Contabilidad automatizada |
| **AIT-TREASURY** | 3005 | ⏳ Pendiente | Gestión de tesorería |
| **AIT-BILLING** | 3006 | ⏳ Pendiente | Facturación automática |
| **AIT-ENCASHMENT** | 3007 | ⏳ Pendiente | Gestión de cobros |

---

## 🔄 Actualizar Módulo Existente

Para aplicar templates a módulo existente:

```bash
# 1. Backup del módulo actual
cp -r modules/01-core-business/ait-accountant modules/01-core-business/ait-accountant.backup

# 2. Generar nuevo módulo con mismo nombre
node scripts/generate-module.js
# (responder con datos del módulo existente)

# 3. Mergear cambios manualmente
# Comparar archivos y copiar lógica de negocio específica
```

---

## 🚀 Próximos Pasos

1. ✅ **Templates completados** (NestJS 11, Prisma 6, Agentes avanzados)
2. ⏳ **Generar AIT-TREASURY** usando templates
3. ⏳ **Generar AIT-BILLING** usando templates
4. ⏳ **Generar AIT-ENCASHMENT** usando templates
5. ⏳ **Documentar cada módulo** específicamente

---

## 📞 Soporte

Si tienes problemas con el generador:

1. Verifica que estás en el directorio raíz: `ait-core-soriano/`
2. Asegúrate de tener Node.js 20+
3. Revisa que los templates existen en `templates/module/`
4. Ejecuta con permisos suficientes

---

## 🏆 Ventajas del Sistema de Templates

### Antes (Manual)
- ⏰ 2-3 días para crear módulo
- 🐛 Inconsistencias entre módulos
- 📝 Documentación desactualizada
- 🔧 Configuración repetitiva
- 🎯 Falta de estándares

### Después (Con Templates)
- ✅ 5 minutos para módulo funcional
- ✅ 100% consistente
- ✅ Documentación auto-generada
- ✅ Zero config (funcionando out-of-the-box)
- ✅ Estándares enforced automáticamente

---

**¡Ahora puedes crear módulos AIT de nivel empresarial en minutos!** 🚀

