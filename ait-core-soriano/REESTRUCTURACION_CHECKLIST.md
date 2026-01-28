# ♻️ REESTRUCTURACIÓN COMPLETA - CHECKLIST DETALLADO

> **Plan de ejecución fase a fase para transformar ait-core-soriano en SKELETON puro**

**Duración total:** 24 horas
**Fecha inicio:** 28 Enero 2026
**Última actualización:** 28 Enero 2026

---

## 📊 RESUMEN EJECUTIVO

### Objetivo
Convertir `ait-core-soriano` en un **ESQUELETO** (skeleton/infraestructura invisible) que orquesta 57 módulos independientes conectados vía `ait-connector`.

### Arquitectura Orgánica

```
🫀 CORAZÓN (Heart)     → Kafka Event Bus
🧠 CEREBRO (Brain)     → AI Agents (10 agents)
🫁 PULMONES (Lungs)    → Scrapers (data intake)
🦴 ESQUELETO (Skeleton) → ait-core-soriano (ESTE PROYECTO)
🧬 NERVIOS (Nerves)    → ait-connector (iPaaS)
💪 MÚSCULOS (Muscles)  → 57 Módulos (repos independientes)
👁️ SENTIDOS (Senses)   → Frontends (ain-tech-web, apps/web, etc.)
🛡️ INMUNE (Immune)     → ait-authenticator + ait-defender
```

### Fases

| Fase | Nombre | Duración | Objetivo |
|------|--------|----------|----------|
| **0** | Análisis & Backup | 2h | Fotografiar estado actual |
| **1** | Crear esqueleto puro | 4h | Extraer core-services |
| **2** | Extraer módulos a repos | 8h | 57 módulos → repos individuales |
| **3** | Configurar connector | 6h | ait-connector con hot-reload |
| **4** | Organizar por capas | 2h | Clasificar módulos en Layers 1-4 |
| **5** | Testing completo | 4h | Validar orquestación |

**Total: 26 horas**

---

## 🎯 FASE 0: ANÁLISIS Y BACKUP (2 horas)

### ✅ Tareas Completadas

- [x] Analizar estructura actual
- [x] Identificar módulos existentes (6/57)
- [x] Detectar dependencias críticas
- [x] Crear FASE0_ANALISIS_ACTUAL.md

### Resultados FASE 0

```
📦 Estado Actual:
├─ 6 módulos implementados (10.5%)
├─ 2 módulos parciales
├─ 49 módulos faltantes
├─ 81 bases de datos
├─ 40,000 LOC funcionales
└─ Dependencias críticas: ait-client-hub, ait-product-catalog

🔴 BLOQUEADORES:
- ait-client-hub (CRÍTICO - bloquea policies, CRM, claims)
- ait-product-catalog (CRÍTICO - bloquea policy creation)
- ai-pgc-engine (CRÍTICO - bloquea ai-accountant)
```

**Archivo creado:** [`FASE0_ANALISIS_ACTUAL.md`](./FASE0_ANALISIS_ACTUAL.md)

---

## 🏗️ FASE 1: CREAR ESQUELETO PURO (4 horas)

### Objetivo
Extraer todos los módulos de negocio fuera de `ait-core-soriano`, dejando SOLO la infraestructura invisible.

### 1.1 Definir Core Services (30 min)

Crear `core-services/` con servicios esenciales que quedan en el esqueleto:

```
ait-core-soriano/
├─ core-services/           # ← NUEVO: Servicios del esqueleto
│  ├─ event-bus/            # Kafka wrapper
│  ├─ database/             # Prisma + connection pool
│  ├─ cache/                # Redis manager
│  ├─ logger/               # Winston + ELK
│  ├─ metrics/              # Prometheus exporter
│  ├─ health/               # Health checks
│  ├─ auth-middleware/      # JWT validation
│  └─ module-loader/        # Dynamic module loading
```

**Checklist:**

- [ ] `mkdir -p core-services/{event-bus,database,cache,logger,metrics,health,auth-middleware,module-loader}`
- [ ] Mover `libs/database` → `core-services/database`
- [ ] Mover `libs/kafka` → `core-services/event-bus`
- [ ] Crear `core-services/module-loader/ModuleRegistry.ts`
- [ ] Documentar cada servicio en `core-services/README.md`

**Tiempo estimado:** 30 minutos

---

### 1.2 Crear Module Interface (45 min)

Definir la interfaz estándar que TODOS los 57 módulos deben implementar.

**Archivo:** `libs/module-interface/src/IModule.ts`

```typescript
export interface IModule {
  // Metadata
  id: string;                    // e.g., 'ait-policy-manager'
  name: string;                  // e.g., 'Policy Manager'
  version: string;               // Semantic versioning
  layer: 1 | 2 | 3 | 4;          // Complexity layer
  category: string;              // e.g., 'core-business'

  // Lifecycle hooks
  initialize(context: ModuleContext): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  shutdown(): Promise<void>;

  // Health & status
  health(): Promise<HealthStatus>;
  metrics(): Promise<ModuleMetrics>;

  // Configuration
  configure(config: ModuleConfig): void;
  getConfig(): ModuleConfig;

  // Dependencies
  getDependencies(): string[];      // Required module IDs
  checkDependencies(): boolean;     // All dependencies loaded?
}

export interface ModuleContext {
  eventBus: EventBusService;
  database: DatabaseService;
  cache: CacheService;
  logger: LoggerService;
  config: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database?: boolean;
    cache?: boolean;
    dependencies?: boolean;
  };
  message?: string;
}

export interface ModuleMetrics {
  uptime: number;
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  custom?: Record<string, number>;
}

export interface ModuleConfig {
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resources: {
    cpu: string;      // e.g., '100m', '1000m'
    memory: string;   // e.g., '256Mi', '1Gi'
    storage?: string;
  };
  api?: {
    rest?: { enabled: boolean; basePath: string };
    graphql?: { enabled: boolean };
    webhooks?: { enabled: boolean; events: string[] };
  };
  database?: {
    tables: string[];
    migrations: boolean;
  };
}
```

**Checklist:**

- [ ] Crear `libs/module-interface/`
- [ ] Escribir `IModule.ts` con TypeDoc completo
- [ ] Crear `BaseModule.ts` (clase abstracta base)
- [ ] Crear tests: `IModule.spec.ts`
- [ ] Generar documentación: `typedoc --out docs/module-interface`

**Tiempo estimado:** 45 minutos

---

### 1.3 Crear Connector SDK (90 min)

SDK para que los desarrolladores creen módulos fácilmente.

**Archivo:** `libs/connector-sdk/src/index.ts`

```typescript
import { IModule, ModuleContext } from '@ait-core/module-interface';

export class ModuleBuilder {
  private module: Partial<IModule> = {};

  withId(id: string): this {
    this.module.id = id;
    return this;
  }

  withName(name: string): this {
    this.module.name = name;
    return this;
  }

  withLayer(layer: 1 | 2 | 3 | 4): this {
    this.module.layer = layer;
    return this;
  }

  withLifecycle(hooks: {
    initialize?: (ctx: ModuleContext) => Promise<void>;
    start?: () => Promise<void>;
    stop?: () => Promise<void>;
    shutdown?: () => Promise<void>;
  }): this {
    Object.assign(this.module, hooks);
    return this;
  }

  build(): IModule {
    // Validate required fields
    if (!this.module.id || !this.module.name || !this.module.layer) {
      throw new Error('Missing required module fields');
    }
    return this.module as IModule;
  }
}

// Decorator for module definition
export function Module(metadata: {
  id: string;
  name: string;
  layer: 1 | 2 | 3 | 4;
  category: string;
}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor implements IModule {
      id = metadata.id;
      name = metadata.name;
      layer = metadata.layer;
      category = metadata.category;
      version = '1.0.0'; // Default

      async initialize(context: ModuleContext): Promise<void> {}
      async start(): Promise<void> {}
      async stop(): Promise<void> {}
      async shutdown(): Promise<void> {}
      async health(): Promise<HealthStatus> {
        return { status: 'healthy', checks: {} };
      }
      async metrics(): Promise<ModuleMetrics> {
        return {
          uptime: process.uptime(),
          requestCount: 0,
          errorCount: 0,
          avgResponseTime: 0,
        };
      }
      configure(config: ModuleConfig): void {}
      getConfig(): ModuleConfig {
        return { enabled: true, priority: 'medium', resources: {} };
      }
      getDependencies(): string[] { return []; }
      checkDependencies(): boolean { return true; }
    };
  };
}

// Example usage:
@Module({
  id: 'ait-policy-manager',
  name: 'Policy Manager',
  layer: 1,
  category: 'core-business',
})
export class PolicyManagerModule {
  async initialize(context: ModuleContext) {
    // Initialize database, cache, event listeners
    context.logger.info('PolicyManager initialized');
  }

  async start() {
    // Start API server, workers, etc.
  }
}
```

**CLI para crear módulos:**

```bash
npx @ait-core/connector-sdk create-module

? Module ID: ait-my-module
? Module Name: My Module
? Category: (core-business, insurance-specialized, marketing-sales, etc.)
? Layer: (1-4)
? Include database? (Y/n)
? Include REST API? (Y/n)
? Include webhooks? (Y/n)

✅ Created: modules/03-marketing-sales/ait-my-module/
```

**Checklist:**

- [ ] Crear `libs/connector-sdk/`
- [ ] Implementar `ModuleBuilder` class
- [ ] Implementar decoradores `@Module`, `@Injectable`
- [ ] CLI: `create-module` command
- [ ] Template generator con Plop.js
- [ ] Documentación: `CONNECTOR_SDK_GUIDE.md`
- [ ] Tests: 80% coverage

**Tiempo estimado:** 90 minutos

---

### 1.4 Reorganizar Directorio (45 min)

Reestructurar `ait-core-soriano` para que sea un esqueleto limpio.

**Estructura ANTES (actual):**

```
ait-core-soriano/
├─ apps/                # NestJS apps
├─ libs/                # Shared libraries
├─ modules/             # 6 módulos (mezclados con esqueleto)
├─ agents/              # AI agents
└─ ...
```

**Estructura DESPUÉS (objetivo):**

```
ait-core-soriano/          # ← SKELETON PURO
├─ core-services/          # 8 servicios de infraestructura
│  ├─ event-bus/
│  ├─ database/
│  ├─ cache/
│  ├─ logger/
│  ├─ metrics/
│  ├─ health/
│  ├─ auth-middleware/
│  └─ module-loader/
│
├─ libs/                   # Solo libraries de infraestructura
│  ├─ module-interface/    # IModule definition
│  ├─ connector-sdk/       # SDK para crear módulos
│  ├─ shared-types/        # TypeScript types compartidos
│  └─ testing-utils/       # Test helpers
│
├─ scripts/                # DevOps scripts
│  ├─ start-all-modules.sh
│  ├─ health-check.sh
│  └─ deploy-module.sh
│
├─ config/                 # Configuración global
│  ├─ module-registry.json  # Lista de módulos disponibles
│  ├─ layers.json           # Definición de capas
│  └─ environments/
│
├─ docs/                   # Documentación
│  ├─ ARCHITECTURE.md
│  ├─ MODULE_DEVELOPMENT.md
│  └─ CONNECTOR_SDK_GUIDE.md
│
├─ package.json            # Solo deps de infraestructura
├─ turbo.json              # Monorepo build config
└─ README.md               # Guía del esqueleto

# MOVIDOS A REPOS SEPARADOS:
../ait-policy-manager/     # (antes: modules/01-core-business/ait-policy-manager)
../ai-accountant/          # (antes: modules/01-core-business/ai-accountant)
../ait-claim-processor/    # (antes: modules/01-core-business/ait-claim-processor)
... (54 módulos más)
```

**Checklist:**

- [ ] Crear directorios nuevos
- [ ] Mover `libs/database` → `core-services/database`
- [ ] Mover `libs/kafka` → `core-services/event-bus`
- [ ] **NO MOVER** `modules/` todavía (FASE 2)
- [ ] Crear `config/module-registry.json`
- [ ] Actualizar `package.json` (remover deps de módulos)
- [ ] Actualizar `turbo.json` (solo core-services)

**Tiempo estimado:** 45 minutos

---

### 1.5 Module Registry (60 min)

Sistema centralizado para descubrir y cargar módulos dinámicamente.

**Archivo:** `config/module-registry.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-01-28T12:00:00Z",
  "modules": [
    {
      "id": "ait-policy-manager",
      "name": "Policy Manager",
      "repository": "https://github.com/aintech/ait-policy-manager",
      "version": "1.2.0",
      "layer": 1,
      "category": "core-business",
      "enabled": true,
      "priority": "critical",
      "dependencies": ["ait-client-hub", "ait-product-catalog"],
      "installCommand": "pnpm add @ait-modules/ait-policy-manager",
      "configPath": "./modules/ait-policy-manager/module.config.json"
    },
    {
      "id": "ai-accountant",
      "repository": "https://github.com/aintech/ai-accountant",
      "version": "1.0.0",
      "layer": 1,
      "category": "core-business",
      "enabled": true,
      "priority": "high",
      "dependencies": ["ai-pgc-engine", "ai-treasury"]
    }
    // ... 55 módulos más
  ],
  "layers": {
    "1": {
      "name": "Essential/Survival",
      "description": "Critical modules for basic operation",
      "moduleIds": ["ait-client-hub", "ait-product-catalog", "ait-policy-manager", "ai-accountant"]
    },
    "2": {
      "name": "Functional",
      "description": "Enhanced functionality modules",
      "moduleIds": ["ait-underwriting", "ai-treasury", "ait-claim-processor"]
    },
    "3": {
      "name": "Advanced",
      "description": "Advanced features and optimization",
      "moduleIds": ["ai-brand-manager", "ait-crm"]
    },
    "4": {
      "name": "Specialized",
      "description": "Industry-specific and niche modules",
      "moduleIds": ["ahorro", "vida", "decesos"]
    }
  }
}
```

**Código:** `core-services/module-loader/ModuleRegistry.ts`

```typescript
import { IModule } from '@ait-core/module-interface';
import * as fs from 'fs/promises';

export class ModuleRegistry {
  private modules = new Map<string, IModule>();
  private config: any;

  async loadRegistry() {
    const content = await fs.readFile('config/module-registry.json', 'utf-8');
    this.config = JSON.parse(content);
  }

  async loadModule(moduleId: string): Promise<IModule> {
    const moduleConfig = this.config.modules.find((m: any) => m.id === moduleId);
    if (!moduleConfig) {
      throw new Error(`Module ${moduleId} not found in registry`);
    }

    // Dynamic import
    const modulePath = `@ait-modules/${moduleId}`;
    const { default: ModuleClass } = await import(modulePath);

    const instance = new ModuleClass();
    this.modules.set(moduleId, instance);
    return instance;
  }

  async loadLayer(layer: number): Promise<IModule[]> {
    const layerConfig = this.config.layers[layer];
    const modules = await Promise.all(
      layerConfig.moduleIds.map((id: string) => this.loadModule(id))
    );
    return modules;
  }

  getModule(moduleId: string): IModule | undefined {
    return this.modules.get(moduleId);
  }

  getAllModules(): IModule[] {
    return Array.from(this.modules.values());
  }

  async checkDependencies(moduleId: string): Promise<boolean> {
    const module = this.modules.get(moduleId);
    if (!module) return false;

    const deps = module.getDependencies();
    return deps.every(depId => this.modules.has(depId));
  }
}
```

**Checklist:**

- [ ] Crear `config/module-registry.json` con 57 módulos
- [ ] Implementar `ModuleRegistry.ts`
- [ ] Implementar resolución de dependencias (topological sort)
- [ ] CLI: `ait-core module list`
- [ ] CLI: `ait-core module load <id>`
- [ ] CLI: `ait-core module unload <id>`
- [ ] Hot-reload support (watch config file)
- [ ] Tests: dependency resolution, circular deps

**Tiempo estimado:** 60 minutos

---

## 📦 FASE 2: EXTRAER MÓDULOS A REPOS (8 horas)

### Objetivo
Convertir cada uno de los 57 módulos en repositorios Git independientes.

### 2.1 Script de Extracción Automatizado (2h)

**Archivo:** `scripts/extract-module-to-repo.sh`

```bash
#!/bin/bash
# Extrae un módulo del monorepo a un repositorio independiente

set -e  # Exit on error

MODULE_PATH=$1
MODULE_ID=$2
TARGET_ORG="aintech"

if [ -z "$MODULE_PATH" ] || [ -z "$MODULE_ID" ]; then
  echo "Usage: ./extract-module-to-repo.sh <module-path> <module-id>"
  echo "Example: ./extract-module-to-repo.sh modules/01-core-business/ait-policy-manager ait-policy-manager"
  exit 1
fi

echo "🔄 Extracting module: $MODULE_ID"
echo "📂 Source path: $MODULE_PATH"

# 1. Create new repo directory
REPO_DIR="../$MODULE_ID"
mkdir -p "$REPO_DIR"
cd "$REPO_DIR"

# 2. Initialize git with history filtering
git init
git remote add origin "https://github.com/$TARGET_ORG/$MODULE_ID.git"

# 3. Copy module files
cp -r "../ait-core-soriano/$MODULE_PATH/"* .

# 4. Create standard module structure
cat > package.json <<EOF
{
  "name": "@ait-modules/$MODULE_ID",
  "version": "1.0.0",
  "description": "AIT-CORE module: $MODULE_ID",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "jest",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "@ait-core/module-interface": "workspace:*",
    "@ait-core/connector-sdk": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0"
  }
}
EOF

# 5. Create GitHub Actions CI/CD
mkdir -p .github/workflows
cat > .github/workflows/ci.yml <<EOF
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
EOF

# 6. Create module.config.json if missing
if [ ! -f "module.config.json" ]; then
  cat > module.config.json <<EOF
{
  "moduleId": "$MODULE_ID",
  "moduleName": "$MODULE_ID",
  "version": "1.0.0",
  "enabled": true,
  "priority": "medium"
}
EOF
fi

# 7. Commit and push
git add .
git commit -m "chore: extract $MODULE_ID from monorepo"
git branch -M main

echo "✅ Module extracted to: $REPO_DIR"
echo "📌 Next steps:"
echo "   1. Create GitHub repo: https://github.com/$TARGET_ORG/$MODULE_ID"
echo "   2. Push: cd $REPO_DIR && git push -u origin main"
echo "   3. Publish: pnpm publish --access public"
```

**Checklist:**

- [ ] Crear `scripts/extract-module-to-repo.sh`
- [ ] Hacer ejecutable: `chmod +x scripts/extract-module-to-repo.sh`
- [ ] Probar con 1 módulo de prueba
- [ ] Documentar proceso en `docs/MODULE_EXTRACTION.md`

**Tiempo estimado:** 2 horas

---

### 2.2 Extraer 57 Módulos (6h)

**Proceso en lote:**

```bash
#!/bin/bash
# extract-all-modules.sh

MODULES=(
  # Layer 1 - Essential/Survival
  "modules/01-core-business/ait-client-hub:ait-client-hub"
  "modules/01-core-business/ait-product-catalog:ait-product-catalog"
  "modules/01-core-business/ait-policy-manager:ait-policy-manager"
  "modules/01-core-business/ai-accountant:ai-accountant"
  "modules/01-core-business/ai-treasury:ai-treasury"
  "modules/01-core-business/ait-claim-processor:ait-claim-processor"
  "modules/01-core-business/ait-commission-engine:ait-commission-engine"
  "modules/01-core-business/ait-document-vault:ait-document-vault"

  # Layer 2 - Functional
  "modules/02-insurance-specialized/ait-underwriting:ait-underwriting"
  "modules/02-insurance-specialized/ait-actuarial:ait-actuarial"
  "modules/02-insurance-specialized/ait-solvency:ait-solvency"
  "modules/03-marketing-sales/ait-crm:ait-crm"

  # ... (43 módulos más)
)

for module in "${MODULES[@]}"; do
  IFS=':' read -r path id <<< "$module"
  echo "🔄 Processing: $id"
  ./scripts/extract-module-to-repo.sh "$path" "$id"
  sleep 2  # Avoid rate limits
done

echo "✅ All 57 modules extracted!"
```

**Checklist:**

- [ ] Layer 1 (8 módulos esenciales) - 1h
- [ ] Layer 2 (12 módulos funcionales) - 1.5h
- [ ] Layer 3 (15 módulos avanzados) - 2h
- [ ] Layer 4 (22 módulos especializados) - 1.5h
- [ ] Verificar que todos tienen:
  - [ ] `package.json` válido
  - [ ] `module.config.json`
  - [ ] `README.md`
  - [ ] GitHub Actions CI/CD
  - [ ] Tests básicos
- [ ] Crear organización GitHub: `@aintech`
- [ ] Crear repos en GitHub (batch con API)
- [ ] Push inicial a cada repo
- [ ] Publicar a npm registry privado

**Tiempo estimado:** 6 horas

**Paralelización:** Si se ejecuta con 4 developers en paralelo → 1.5h

---

## 🔌 FASE 3: CONFIGURAR AIT-CONNECTOR (6 horas)

### Objetivo
Configurar `ait-connector` para que orqueste los 57 módulos dinámicamente con hot-reload.

### 3.1 Actualizar ait-connector (2h)

**Archivo:** `ait-connector/src/ModuleConnector.ts`

```typescript
import { ModuleRegistry } from '@ait-core/module-loader';
import { IModule, ModuleContext } from '@ait-core/module-interface';
import { EventEmitter } from 'events';

export class ModuleConnector extends EventEmitter {
  private registry: ModuleRegistry;
  private loadedModules = new Map<string, IModule>();
  private context: ModuleContext;

  constructor(context: ModuleContext) {
    super();
    this.context = context;
    this.registry = new ModuleRegistry();
  }

  async initialize() {
    await this.registry.loadRegistry();
    this.context.logger.info('ModuleConnector initialized');
  }

  /**
   * Carga un módulo dinámicamente
   */
  async loadModule(moduleId: string): Promise<void> {
    try {
      this.context.logger.info(`Loading module: ${moduleId}`);

      // 1. Check dependencies
      const canLoad = await this.registry.checkDependencies(moduleId);
      if (!canLoad) {
        throw new Error(`Missing dependencies for ${moduleId}`);
      }

      // 2. Load module class
      const module = await this.registry.loadModule(moduleId);

      // 3. Initialize
      await module.initialize(this.context);

      // 4. Start
      await module.start();

      // 5. Store reference
      this.loadedModules.set(moduleId, module);

      // 6. Emit event
      this.emit('module:loaded', { moduleId, module });

      this.context.logger.info(`✅ Module loaded: ${moduleId}`);
    } catch (error) {
      this.context.logger.error(`❌ Failed to load ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Descarga un módulo dinámicamente
   */
  async unloadModule(moduleId: string): Promise<void> {
    const module = this.loadedModules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not loaded`);
    }

    this.context.logger.info(`Unloading module: ${moduleId}`);

    // 1. Stop module
    await module.stop();

    // 2. Shutdown
    await module.shutdown();

    // 3. Remove reference
    this.loadedModules.delete(moduleId);

    // 4. Emit event
    this.emit('module:unloaded', { moduleId });

    this.context.logger.info(`✅ Module unloaded: ${moduleId}`);
  }

  /**
   * Recarga un módulo (hot-reload)
   */
  async reloadModule(moduleId: string): Promise<void> {
    await this.unloadModule(moduleId);
    await this.loadModule(moduleId);
  }

  /**
   * Carga todos los módulos de una capa
   */
  async loadLayer(layer: number): Promise<void> {
    const modules = await this.registry.loadLayer(layer);
    for (const module of modules) {
      await this.loadModule(module.id);
    }
  }

  /**
   * Health check de todos los módulos
   */
  async healthCheck(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    for (const [id, module] of this.loadedModules) {
      try {
        results[id] = await module.health();
      } catch (error) {
        results[id] = { status: 'unhealthy', error: error.message };
      }
    }

    return results;
  }
}
```

**Checklist:**

- [ ] Implementar `ModuleConnector.ts`
- [ ] Dependency resolution (topological sort)
- [ ] Hot-reload con file watchers
- [ ] Circuit breaker pattern (si módulo falla 3x, desactivar)
- [ ] Graceful shutdown (orden inverso de carga)
- [ ] Metrics: load time, uptime per module
- [ ] Tests: 85% coverage

**Tiempo estimado:** 2 horas

---

### 3.2 Hot-Reload System (2h)

Sistema para recargar módulos sin reiniciar el servidor.

**Archivo:** `ait-connector/src/HotReloadWatcher.ts`

```typescript
import * as chokidar from 'chokidar';
import { ModuleConnector } from './ModuleConnector';

export class HotReloadWatcher {
  private watcher: chokidar.FSWatcher;
  private connector: ModuleConnector;

  constructor(connector: ModuleConnector) {
    this.connector = connector;
  }

  start() {
    // Watch module.config.json files
    this.watcher = chokidar.watch('../*/module.config.json', {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('change', async (path) => {
        const moduleId = this.extractModuleId(path);
        console.log(`🔥 Hot-reload triggered for: ${moduleId}`);

        try {
          await this.connector.reloadModule(moduleId);
          console.log(`✅ ${moduleId} reloaded successfully`);
        } catch (error) {
          console.error(`❌ Failed to reload ${moduleId}:`, error);
        }
      })
      .on('add', async (path) => {
        const moduleId = this.extractModuleId(path);
        console.log(`➕ New module detected: ${moduleId}`);
        await this.connector.loadModule(moduleId);
      })
      .on('unlink', async (path) => {
        const moduleId = this.extractModuleId(path);
        console.log(`➖ Module removed: ${moduleId}`);
        await this.connector.unloadModule(moduleId);
      });

    console.log('🔥 Hot-reload watcher started');
  }

  stop() {
    this.watcher?.close();
  }

  private extractModuleId(path: string): string {
    // ../ait-policy-manager/module.config.json → ait-policy-manager
    return path.split('/')[1];
  }
}
```

**Checklist:**

- [ ] Implementar `HotReloadWatcher.ts`
- [ ] Debounce (evitar recargas múltiples en 1s)
- [ ] Validar `module.config.json` antes de recargar
- [ ] Rollback si recarga falla
- [ ] Notificaciones (Slack, email) cuando módulo falla
- [ ] Tests: simular cambios en archivos

**Tiempo estimado:** 2 horas

---

### 3.3 Marketplace Integration (2h)

Conectar `ait-connector` con el marketplace para instalar/desinstalar módulos.

**API Endpoints:**

```typescript
// ait-connector/src/routes/marketplace.routes.ts

import { Router } from 'express';
import { ModuleConnector } from '../ModuleConnector';

export function createMarketplaceRoutes(connector: ModuleConnector) {
  const router = Router();

  /**
   * GET /api/connector/modules
   * Lista todos los módulos disponibles
   */
  router.get('/modules', async (req, res) => {
    const modules = await connector.registry.getAllModules();
    res.json(modules);
  });

  /**
   * POST /api/connector/modules/:id/install
   * Instala un módulo desde el marketplace
   */
  router.post('/modules/:id/install', async (req, res) => {
    const { id } = req.params;

    try {
      // 1. Download from npm
      await exec(`pnpm add @ait-modules/${id}`);

      // 2. Load module
      await connector.loadModule(id);

      res.json({ success: true, message: `Module ${id} installed` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * DELETE /api/connector/modules/:id
   * Desinstala un módulo
   */
  router.delete('/modules/:id', async (req, res) => {
    const { id } = req.params;

    try {
      // 1. Unload module
      await connector.unloadModule(id);

      // 2. Remove from npm
      await exec(`pnpm remove @ait-modules/${id}`);

      res.json({ success: true, message: `Module ${id} uninstalled` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * POST /api/connector/modules/:id/reload
   * Recarga un módulo (hot-reload manual)
   */
  router.post('/modules/:id/reload', async (req, res) => {
    const { id } = req.params;

    try {
      await connector.reloadModule(id);
      res.json({ success: true, message: `Module ${id} reloaded` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  /**
   * GET /api/connector/health
   * Health check de todos los módulos
   */
  router.get('/health', async (req, res) => {
    const health = await connector.healthCheck();
    res.json(health);
  });

  return router;
}
```

**Checklist:**

- [ ] Implementar rutas de marketplace
- [ ] Integrar con npm registry
- [ ] Validar permisos (solo admin puede instalar)
- [ ] Rate limiting (max 10 instalaciones/min)
- [ ] Logs de auditoría (quién instaló qué)
- [ ] Webhooks: notificar cuando módulo se instala
- [ ] Tests: E2E install/uninstall

**Tiempo estimado:** 2 horas

---

## 🗂️ FASE 4: ORGANIZAR POR CAPAS (2 horas)

### Objetivo
Clasificar los 57 módulos en 4 capas de complejidad.

### 4.1 Definir Capas (30 min)

**Archivo:** `config/layers.json`

```json
{
  "layers": {
    "1": {
      "name": "Essential/Survival",
      "description": "Critical modules for basic operation. If these fail, system is unusable.",
      "priority": "critical",
      "loadOrder": 1,
      "modules": [
        "ait-client-hub",
        "ait-product-catalog",
        "ait-policy-manager",
        "ai-accountant",
        "ai-treasury",
        "ait-claim-processor",
        "ait-commission-engine",
        "ait-document-vault"
      ],
      "characteristics": {
        "complexity": "low-medium",
        "dependencies": "minimal",
        "performance": "high",
        "availability": "99.99%"
      }
    },
    "2": {
      "name": "Functional",
      "description": "Enhanced functionality. System works without these but with reduced capabilities.",
      "priority": "high",
      "loadOrder": 2,
      "modules": [
        "ait-underwriting",
        "ait-actuarial",
        "ait-solvency",
        "ait-crm",
        "ai-treasury",
        "ait-notification-hub",
        "ait-api-gateway",
        "ait-workflow-engine",
        "ait-reinsurance",
        "ait-bi-platform",
        "ait-reporting-engine",
        "ait-audit-trail"
      ],
      "characteristics": {
        "complexity": "medium",
        "dependencies": "layer-1",
        "performance": "medium-high",
        "availability": "99.9%"
      }
    },
    "3": {
      "name": "Advanced",
      "description": "Advanced features and optimization. Nice-to-have for power users.",
      "priority": "medium",
      "loadOrder": 3,
      "modules": [
        "ai-brand-manager",
        "ait-lead-generator",
        "ait-sales-pipeline",
        "ait-email-marketing",
        "ait-kpi-dashboard",
        "ait-predictive-analytics",
        "ait-data-warehouse",
        "ait-ml-insights",
        "ait-gdpr-manager",
        "ait-access-control",
        "ait-fraud-detection",
        "ait-compliance-monitor",
        "ait-queue-manager",
        "ait-storage-manager",
        "ait-health-monitor"
      ],
      "characteristics": {
        "complexity": "medium-high",
        "dependencies": "layer-1, layer-2",
        "performance": "medium",
        "availability": "99.5%"
      }
    },
    "4": {
      "name": "Specialized",
      "description": "Industry-specific and niche modules. Only loaded when needed.",
      "priority": "low",
      "loadOrder": 4,
      "modules": [
        "agrario",
        "ahorro",
        "autos",
        "caucion",
        "ciber",
        "comunidades",
        "credito",
        "decesos",
        "empresas",
        "hogar",
        "industrial",
        "ingenieria",
        "mascotas",
        "multirriesgo",
        "pensiones",
        "rc",
        "salud",
        "transporte",
        "unit-linked",
        "vida",
        "ait-event-bus",
        "ait-webhook-manager"
      ],
      "characteristics": {
        "complexity": "high",
        "dependencies": "any",
        "performance": "low-medium",
        "availability": "99%",
        "onDemand": true
      }
    }
  },
  "loadingStrategies": {
    "startup": {
      "description": "Load layers 1-2 on startup, layers 3-4 on demand",
      "layers": [1, 2]
    },
    "full": {
      "description": "Load all layers on startup",
      "layers": [1, 2, 3, 4]
    },
    "minimal": {
      "description": "Only layer 1 (emergency mode)",
      "layers": [1]
    }
  }
}
```

**Checklist:**

- [ ] Crear `config/layers.json`
- [ ] Clasificar los 57 módulos
- [ ] Definir características por capa
- [ ] Documentar criterios de clasificación

**Tiempo estimado:** 30 minutos

---

### 4.2 Actualizar Module Configs (1h)

Agregar campo `layer` a todos los `module.config.json`.

**Script automatizado:**

```bash
#!/bin/bash
# assign-layers.sh

# Layer 1 modules
for module in ait-client-hub ait-product-catalog ait-policy-manager ai-accountant; do
  jq '.layer = 1' "../$module/module.config.json" > tmp.json
  mv tmp.json "../$module/module.config.json"
done

# Layer 2 modules
for module in ait-underwriting ait-actuarial ait-solvency ait-crm; do
  jq '.layer = 2' "../$module/module.config.json" > tmp.json
  mv tmp.json "../$module/module.config.json"
done

# ... (layers 3 y 4)

echo "✅ All modules assigned to layers"
```

**Checklist:**

- [ ] Ejecutar script para 57 módulos
- [ ] Validar que todos tienen campo `layer`
- [ ] Commit changes a cada repo

**Tiempo estimado:** 1 hora

---

### 4.3 Layer-Based Loading (30 min)

Implementar carga secuencial por capas.

**Código:** `core-services/module-loader/LayerLoader.ts`

```typescript
import { ModuleConnector } from 'ait-connector';
import layersConfig from '../../config/layers.json';

export class LayerLoader {
  constructor(private connector: ModuleConnector) {}

  async loadByStrategy(strategy: 'startup' | 'full' | 'minimal') {
    const { layers } = layersConfig.loadingStrategies[strategy];

    for (const layerNum of layers) {
      console.log(`🔄 Loading Layer ${layerNum}...`);
      await this.connector.loadLayer(layerNum);
      console.log(`✅ Layer ${layerNum} loaded`);
    }
  }

  async loadLayersSequentially() {
    for (let layer = 1; layer <= 4; layer++) {
      await this.connector.loadLayer(layer);
    }
  }
}
```

**Checklist:**

- [ ] Implementar `LayerLoader.ts`
- [ ] CLI: `ait-core start --strategy=startup`
- [ ] Tests: verificar orden de carga

**Tiempo estimado:** 30 minutos

---

## ✅ FASE 5: TESTING COMPLETO (4 horas)

### 5.1 Unit Tests (1h)

- [ ] `ModuleRegistry.spec.ts` - 90% coverage
- [ ] `ModuleConnector.spec.ts` - 85% coverage
- [ ] `HotReloadWatcher.spec.ts` - 80% coverage
- [ ] `LayerLoader.spec.ts` - 90% coverage

### 5.2 Integration Tests (1.5h)

- [ ] Test: Load all 57 modules sequentially
- [ ] Test: Dependency resolution (ait-policy-manager → ait-client-hub)
- [ ] Test: Hot-reload (cambiar config, verificar recarga)
- [ ] Test: Health check de todos los módulos
- [ ] Test: Unload module → dependents también se descargan

### 5.3 E2E Tests (1.5h)

- [ ] Test: Instalación desde marketplace
- [ ] Test: Startup completo (layers 1-4)
- [ ] Test: Failure simulation (módulo falla → circuit breaker)
- [ ] Test: Performance (load 57 modules en <30s)

---

## 📊 MÉTRICAS DE ÉXITO

Al finalizar las 5 fases:

```
✅ ait-core-soriano = SKELETON PURO
   ├─ 0 módulos de negocio (todos extraídos)
   ├─ 8 core-services
   ├─ 3 libs de infraestructura
   └─ ~5,000 LOC (vs 150,000 LOC actual)

✅ 57 repos independientes
   ├─ Cada uno con CI/CD
   ├─ Publicados en npm
   └─ Versionado semántico

✅ ait-connector operacional
   ├─ Hot-reload ✅
   ├─ Dependency resolution ✅
   ├─ Health checks ✅
   └─ Marketplace integration ✅

✅ Sistema por capas
   ├─ Layer 1: 8 módulos (critical)
   ├─ Layer 2: 12 módulos (high)
   ├─ Layer 3: 15 módulos (medium)
   └─ Layer 4: 22 módulos (low)

✅ Tests
   ├─ Unit tests: 85% coverage
   ├─ Integration tests: 15 scenarios
   └─ E2E tests: 5 workflows
```

---

## 🎯 PRÓXIMOS PASOS (POST-RESTRUCTURACIÓN)

Una vez completadas las 5 fases:

1. **Crear módulos faltantes (51)**
   - Priorizar Layer 1: ait-client-hub, ait-product-catalog, ai-pgc-engine
   - Layer 2: completar funcionales
   - Layers 3-4: bajo demanda

2. **Desarrollar Marketplace MVP** (6 semanas)
   - Frontend: 1-click install
   - Backend: Stripe payments
   - Sandbox: testing environment
   - Publisher dashboard

3. **Documentación**
   - Guía para desarrolladores: cómo crear un módulo
   - Video tutorial: 10 minutos
   - API reference: TypeDoc

4. **Marketing**
   - Landing page: marketplace.aintech.com
   - Blog post: "57 módulos, 1 ecosistema"
   - Demos en vivo

---

## 📝 NOTAS FINALES

**Filosofía del Esqueleto:**

> "El esqueleto no hace nada visible, pero sin él, el cuerpo colapsa."
> — Arquitectura Orgánica AIT-CORE

**Mantra:**

- ✅ Infraestructura = Invisible pero crítica
- ✅ Módulos = Visibles y reemplazables
- ✅ Connector = El sistema nervioso
- ✅ Hot-reload = Evolución sin cirugía

---

**Última actualización:** 28 Enero 2026
**Versión:** 2.0
**Estado:** ✅ FASE 0 COMPLETADA | 🔄 FASE 1 PENDIENTE
