# 🎯 SISTEMA DE TRAZABILIDAD MÁXIMA

## Descripción General

El **Sistema de Trazabilidad Máxima** proporciona un tracking ultra detallado y en tiempo real de todos los scrapers, permitiendo saber exactamente:

### ✅ Qué hace
- Acción actual precisa (ej: "Extrayendo datos de pestaña: Pólizas")
- Descripción detallada de la operación en curso
- Tipo de operación (navegación, extracción, guardado, etc.)

### ✅ Dónde está
- URL exacta de la página actual
- Título de la página
- Selector CSS específico si aplica
- Screenshot de la pantalla actual

### ✅ Cuándo lo hace
- Timestamp preciso (con milisegundos)
- Hora local formateada
- Duración de cada paso
- Tiempo total transcurrido

### ✅ Por dónde va (Breadcrumb)
- Ruta completa de navegación desde el inicio
- Ejemplo: `Inicio → Login → Dashboard → Búsqueda Cliente → Ficha Cliente → Pestaña Pólizas`
- Actualizado en tiempo real

### ✅ Qué camino ha hecho (Historial)
- Lista completa de todos los pasos realizados
- Cada paso con su timestamp, duración, status
- Screenshots de cada paso (opcional)
- Datos extraídos en cada paso

### ✅ Cuánto camino queda
- **Progreso**: `X/Y (Z%)` - Pasos completados vs total
- **ETA**: Hora estimada de finalización
- **Tiempo restante**: Estimación precisa en horas/minutos
- **Velocidad**: Pasos por minuto en tiempo real

---

## 📊 Componentes del Sistema

### 1. TraceabilityManager (`lib/traceability.ts`)

**Motor central de trazabilidad**

```typescript
import { traceManager } from '@/lib/traceability';

// Iniciar tracking
await traceManager.startTracking(
  'scraper-id',
  'execution-id',
  totalSteps
);

// Registrar cada paso
await traceManager.recordStep(
  executionId,
  'Extrayendo datos del cliente',
  {
    url: 'https://portal.com/cliente/12345',
    title: 'Ficha de Cliente',
    selector: '.client-data',
  },
  { clientNIF: '12345678A' }, // datos opcionales
  '/path/to/screenshot.png' // screenshot opcional
);

// Crear checkpoint (punto de control)
await traceManager.checkpoint(
  executionId,
  'Procesamiento completado',
  { itemsProcessed: 50 }
);

// Actualizar metadata
await traceManager.updateMetadata(executionId, {
  clientNIF: '12345678A',
  clientName: 'Juan Pérez',
});

// Finalizar
await traceManager.endTracking(executionId, 'success');
```

**Características**:
- ✅ Cálculo automático de progreso y ETA
- ✅ Velocidad en tiempo real (pasos/minuto)
- ✅ Persistencia en base de datos
- ✅ Eventos en tiempo real (WebSocket)
- ✅ Logs ultra detallados en consola

### 2. TraceabilityViewer (Componente React)

**Visualización en tiempo real en el dashboard**

```tsx
import { TraceabilityViewer } from '@/components/TraceabilityViewer';

<TraceabilityViewer executionId="exec-123" />
```

**Características**:
- ✅ Conexión WebSocket para updates en vivo
- ✅ Barra de progreso animada
- ✅ Métricas en tiempo real (velocidad, ETA, tiempo restante)
- ✅ Acción actual destacada con badge de estado
- ✅ Breadcrumb visual con flechas
- ✅ Historial completo con timeline
- ✅ Screenshots embebidos
- ✅ Metadata del cliente actual
- ✅ Auto-scroll a último paso

### 3. API de Trazabilidad

**Endpoint REST para obtener estado**

```
GET /api/trace/[executionId]
```

**Respuesta**:
```json
{
  "scraperId": "ultimate-client-scraper",
  "executionId": "exec-abc123",
  "startedAt": "2026-01-28T10:30:00.000Z",
  "currentStep": {
    "id": "step-42",
    "timestamp": "2026-01-28T10:45:30.123Z",
    "action": "Extrayendo datos de pestaña: Pólizas",
    "location": {
      "url": "https://portal.com/cliente/12345/polizas",
      "title": "Pólizas del Cliente",
      "breadcrumb": ["Inicio", "Login", "Dashboard", "Cliente", "Pólizas"]
    },
    "status": "in_progress"
  },
  "breadcrumb": ["Inicio", "Login", "Dashboard", "Cliente", "Pólizas"],
  "history": [...], // Array con todos los pasos
  "progress": {
    "current": 42,
    "total": 100,
    "percentage": 42.0,
    "eta": "2026-01-28T11:15:00.000Z",
    "speed": 2.5, // pasos por minuto
    "elapsed": 900000, // 15 minutos en ms
    "remaining": 1380000 // 23 minutos en ms
  },
  "metadata": {
    "clientNIF": "12345678A",
    "clientName": "Juan Pérez",
    "documentCount": 15
  }
}
```

---

## 🚀 Uso en Scrapers

### Ejemplo Completo

```typescript
import { traceManager } from '@/lib/traceability';
import { chromium } from 'playwright';

async function scrapearCliente(executionId: string, nif: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 1. Login
    await traceManager.recordStep(
      executionId,
      'Iniciando sesión en el portal',
      { url: 'https://portal.com/login', title: 'Login' }
    );
    await page.goto('https://portal.com/login');
    await page.fill('#username', 'user');
    await page.fill('#password', 'pass');

    await traceManager.recordStep(
      executionId,
      'Haciendo clic en botón de login',
      { url: page.url(), title: 'Login', selector: '#submit-btn' }
    );
    await page.click('#submit-btn');

    // 2. Buscar cliente
    await traceManager.recordStep(
      executionId,
      `Buscando cliente por NIF: ${nif}`,
      { url: page.url(), title: 'Búsqueda' },
      { nif }
    );
    await page.fill('#nif-input', nif);
    await page.click('#search-btn');

    // Checkpoint
    await traceManager.checkpoint(executionId, 'Cliente encontrado');

    // 3. Extraer datos
    const tabs = ['Datos Personales', 'Pólizas', 'Recibos', 'Documentos'];

    for (const tab of tabs) {
      // Tomar screenshot
      const screenshot = await page.screenshot({
        path: `/screenshots/${tab}.png`
      });

      await traceManager.recordStep(
        executionId,
        `Extrayendo datos de pestaña: ${tab}`,
        {
          url: page.url(),
          title: `Cliente - ${tab}`,
          selector: `#tab-${tab}`
        },
        undefined,
        screenshot
      );

      await page.click(`#tab-${tab}`);
      const data = await page.evaluate(() => {
        // Extraer datos...
        return { ... };
      });

      // Actualizar metadata
      await traceManager.updateMetadata(executionId, {
        [`${tab}Processed`]: true,
        [`${tab}FieldsCount`]: Object.keys(data).length,
      });
    }

    // Checkpoint final
    await traceManager.checkpoint(executionId, 'Extracción completada', {
      tabsProcessed: tabs.length,
    });

  } finally {
    await browser.close();
  }
}
```

---

## 📺 Visualización en Dashboard

### Vista Principal

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Trazabilidad en Tiempo Real                         │
├─────────────────────────────────────────────────────────┤
│ Progreso: 42/100 (42.0%) ████████░░░░░░░░░             │
├──────────────┬──────────────┬──────────────┬────────────┤
│ ⏱️ Transcurr. │ ⏳ Restante   │ 🎯 ETA       │ ⚡ Velocid. │
│ 15m 0s       │ 23m 0s       │ 11:15        │ 2.5 p/min  │
└──────────────┴──────────────┴──────────────┴────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🎯 Acción Actual                                        │
├─────────────────────────────────────────────────────────┤
│ 📋 Extrayendo datos de pestaña: Pólizas                │
│ ⏰ 28/01/2026 10:45:30                                  │
│ 🌐 https://portal.com/cliente/12345/polizas             │
│ 🏷️  IN_PROGRESS                                         │
│                                                         │
│ [Screenshot de la pantalla actual]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🧭 Camino Actual                                        │
├─────────────────────────────────────────────────────────┤
│ Inicio → Login → Dashboard → Cliente → Pólizas         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ✅ Historial de Pasos (42 completados)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✓ #42 Extrayendo datos de pestaña: Pólizas            │
│   📄 Pólizas del Cliente                                │
│   ⏰ 10:45:30  ⏱️ 2.3s                                  │
│                                                         │
│ ✓ #41 Haciendo clic en pestaña: Pólizas               │
│   📄 Ficha de Cliente                                   │
│   ⏰ 10:45:28  ⏱️ 0.5s                                  │
│                                                         │
│ ✓ #40 Checkpoint: Cliente encontrado                  │
│   📄 Búsqueda                                           │
│   ⏰ 10:45:20                                           │
│                                                         │
│ ... [Ver todos]                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📋 Metadata del Cliente                                │
├─────────────────────────────────────────────────────────┤
│ NIF: 12345678A       │ Nombre: Juan Pérez              │
│ Index: 42/100        │ Docs: 15                        │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Persistencia en Base de Datos

### Modelo ScraperExecution

```prisma
model ScraperExecution {
  id              String   @id @default(uuid())
  scraperId       String
  status          String   // 'pending', 'running', 'completed', 'failed'
  startedAt       DateTime
  finishedAt      DateTime?

  // Trazabilidad
  currentStep     String?  // JSON del paso actual
  breadcrumb      String[] // Array del camino
  progress        Float    // Porcentaje 0-100

  totalItems      Int
  itemsProcessed  Int
  itemsFailed     Int

  metadata        Json     // Metadata flexible

  logs            ScraperLog[]

  @@index([scraperId, status])
}

model ScraperLog {
  id           String   @id @default(uuid())
  executionId  String
  level        String   // 'info', 'warning', 'error', 'debug'
  message      String
  timestamp    DateTime
  metadata     Json?    // Step info, location, breadcrumb, etc.

  execution    ScraperExecution @relation(fields: [executionId], references: [id])

  @@index([executionId, timestamp])
}
```

---

## 🔄 Flujo de Datos en Tiempo Real

```
Scraper
  ↓
  ├─→ traceManager.recordStep()
  │     ↓
  │     ├─→ Actualiza estado en memoria
  │     ├─→ Calcula progreso y ETA
  │     ├─→ Guarda en PostgreSQL
  │     └─→ Emite evento WebSocket
  │           ↓
  │           └─→ Dashboard (React)
  │                 ↓
  │                 └─→ Actualiza UI en vivo
  │
  ├─→ traceManager.checkpoint()
  │     ↓
  │     └─→ Guarda punto de control
  │
  └─→ traceManager.endTracking()
        ↓
        └─→ Estado final + resumen
```

---

## 📊 Logs en Consola

Cada paso genera un log ultra detallado:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 TRAZABILIDAD | 2026-01-28T10:45:30.123Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUÉ HACE:    Extrayendo datos de pestaña: Pólizas
🌐 DÓNDE:       https://portal.com/cliente/12345/polizas
📄 PÁGINA:      Pólizas del Cliente
🧭 CAMINO:      Inicio → Login → Dashboard → Cliente → Pólizas
⏱️  CUÁNDO:      28/1/2026 10:45:30
📊 PROGRESO:    42/100 (42.0%)
⏳ QUEDA:       23m 0s
🎯 ETA:         28/1/2026 11:08:30
⚡ VELOCIDAD:   2.50 pasos/min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Ventajas del Sistema

1. **Transparencia Total**: Sabes exactamente qué está haciendo el scraper en cada momento
2. **Debugging Simplificado**: Historial completo para identificar errores
3. **Monitoreo en Vivo**: Ver el progreso en tiempo real sin tocar la consola
4. **Estimaciones Precisas**: ETA calculado dinámicamente según velocidad real
5. **Trazabilidad Completa**: Auditoría completa de todas las operaciones
6. **Screenshots Automáticos**: Evidencia visual de cada paso
7. **Metadata Flexible**: Datos contextuales de cada operación
8. **Checkpoints**: Puntos de control para reinicio inteligente

---

## 🚀 Próximas Mejoras

- [ ] Replay de ejecuciones (ver scraping anterior paso a paso)
- [ ] Comparación de ejecuciones
- [ ] Alertas inteligentes (si tarda más de lo esperado)
- [ ] Exportar trazabilidad a PDF/Excel
- [ ] Machine Learning para predecir duración
- [ ] Dashboard 3D con visualización de árbol de navegación

---

**Estado**: ✅ IMPLEMENTADO Y FUNCIONANDO
**Ubicación**: `C:\Users\rsori\codex\scraper-manager\`
**Documentación**: TRAZABILIDAD.md (este archivo)
