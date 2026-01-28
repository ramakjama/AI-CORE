# ELK Stack Logging Guide - AinTech Ecosystem

Guía completa para el sistema de logging centralizado con Elasticsearch, Logstash y Kibana (ELK Stack).

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Instalación y Setup](#instalación-y-setup)
4. [Uso por Aplicación](#uso-por-aplicación)
5. [Queries de Kibana (KQL)](#queries-de-kibana-kql)
6. [Dashboards](#dashboards)
7. [Alertas](#alertas)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)
10. [Retention Policy](#retention-policy)

---

## Introducción

El sistema de logging centralizado permite:
- **Agregación**: Todos los logs en un solo lugar
- **Búsqueda**: Queries potentes con KQL (Kibana Query Language)
- **Visualización**: Dashboards interactivos en tiempo real
- **Alertas**: Notificaciones automáticas de errores y anomalías
- **Performance**: Análisis de métricas de rendimiento

### Aplicaciones Integradas

- `ait-core` - Backend NestJS
- `ain-tech-web` - Frontend Next.js
- `soriano-ecliente` - Portal de clientes Next.js
- `ait-engines` - Motores de cálculo Python
- `kong` - API Gateway

---

## Arquitectura

```
┌─────────────────┐
│  Aplicaciones   │
│  (5 servicios)  │
└────────┬────────┘
         │ Logs (JSON)
         │ TCP:5000
         │ HTTP:8080
         ↓
    ┌────────┐
    │Logstash│ ← Procesa, enriquece, filtra
    └────┬───┘
         │ Índices por app
         ↓
  ┌──────────────┐
  │Elasticsearch │ ← Almacena logs
  └──────┬───────┘
         │
         ↓
    ┌────────┐
    │ Kibana │ ← Visualiza, busca, alerta
    └────────┘
```

### Componentes

1. **Elasticsearch** (`:9200`)
   - Motor de búsqueda y almacenamiento
   - Índices: `ait-{application}-YYYY.MM.DD`
   - Retention: 30 días

2. **Logstash** (`:5000`, `:8080`, `:9600`)
   - Pipeline de procesamiento de logs
   - Enriquecimiento (GeoIP, User Agent parsing)
   - Filtrado y normalización

3. **Kibana** (`:5601`)
   - Interfaz web de visualización
   - Discover, Dashboards, Alerts
   - KQL query interface

4. **Filebeat** (`:5044`)
   - Recolector de logs de Docker
   - Backup en caso de fallo en apps

---

## Instalación y Setup

### 1. Iniciar ELK Stack

**Windows:**
```bash
cd ait-core-soriano/infrastructure/logging
start-elk.bat
```

**Linux/Mac:**
```bash
cd ait-core-soriano/infrastructure/logging
chmod +x start-elk.sh
./start-elk.sh
```

El script:
- ✅ Inicia Elasticsearch, Logstash, Kibana, Filebeat
- ⏳ Espera a que todos los servicios estén healthy
- 🌐 Abre Kibana en el navegador

### 2. Configurar Index Patterns en Kibana

```bash
# Windows
setup-kibana.bat

# Linux/Mac
./setup-kibana.sh
```

Crea los siguientes index patterns:
- `ait-ait-core-*`
- `ait-ain-tech-web-*`
- `ait-soriano-ecliente-*`
- `ait-ait-engines-*`
- `ait-*` (todos)

### 3. Verificar Estado

```bash
# Windows
health-check.bat

# Linux/Mac
./health-check.sh
```

Muestra:
- Estado de contenedores Docker
- Health de Elasticsearch cluster
- Índices existentes
- Stats de Logstash

---

## Uso por Aplicación

### NestJS (ait-core-soriano)

#### 1. Instalar Dependencias

```bash
cd ait-core-soriano
pnpm add winston axios
```

#### 2. Configurar Variables de Entorno

```env
# .env
LOG_LEVEL=info
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

#### 3. Usar el Logger

```typescript
// main.ts
import { ELKLoggerService } from '@ait-core/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ELKLoggerService('ait-core'),
  });

  await app.listen(3000);
}

// service.ts
import { Injectable } from '@nestjs/common';
import { ELKLoggerService } from '@ait-core/logger';

@Injectable()
export class MyService {
  constructor(private readonly logger: ELKLoggerService) {}

  async myMethod() {
    this.logger.log('Method called', 'MyService');

    try {
      // Business logic
      this.logger.logEvent('user_created', { userId: '123' });
    } catch (error) {
      this.logger.logError(error, { method: 'myMethod' });
    }
  }
}
```

Ver: `libs/logger/README.md`

---

### Next.js (ain-tech-web, soriano-ecliente)

#### 1. Instalar Dependencias

```bash
cd ain-tech-web
pnpm add pino pino-pretty axios
```

#### 2. Configurar Variables de Entorno

```env
# .env.local
LOG_LEVEL=info
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
NEXT_PUBLIC_APP_NAME=ain-tech-web
```

#### 3. Server-side Logging

```typescript
// API route: app/api/users/route.ts
import logger, { logRequest } from '@/lib/logging/logger';

export const GET = logRequest(async (req, res) => {
  logger.info('Fetching users');
  // Your logic
});
```

#### 4. Client-side Logging

```typescript
'use client';

import clientLogger from '@/lib/logging/client-logger';

export default function MyComponent() {
  useEffect(() => {
    clientLogger.logPageView(window.location.pathname);
  }, []);

  const handleClick = () => {
    clientLogger.logClick('submit_button');
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

#### 5. API Route para Client Logs

Crear `app/api/logs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  const { logs } = await request.json();

  await axios.post(`http://localhost:5000`, logs.map(log => ({
    ...log,
    application: 'ain-tech-web',
    source: 'client',
  })));

  return NextResponse.json({ success: true });
}
```

Ver: `ain-tech-web/lib/logging/README.md`

---

### Python (ait-engines)

#### 1. Configurar Variables de Entorno

```env
# .env
PYTHON_ENV=production
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

#### 2. Usar el Logger

```python
from logger import logger

# Básico
logger.info('Application started', version='1.0.0')
logger.error('Error occurred', error_code=500)

# HTTP Request (FastAPI)
from fastapi import FastAPI, Request
from time import time

app = FastAPI()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time()
    response = await call_next(request)
    duration = (time() - start) * 1000

    logger.log_request(
        method=request.method,
        url=str(request.url),
        status_code=response.status_code,
        duration=duration,
    )

    return response

# Cálculos de motores
def calculate_premium(data):
    start = time()
    result = perform_calculation(data)

    logger.log_calculation(
        calculation_type='premium_calculation',
        duration=(time() - start) * 1000,
        result=result,
        data_points=len(data),
    )

    return result

# Predicciones ML
logger.log_model_prediction(
    model='risk_assessment_v1',
    input_data=input_data,
    prediction=prediction,
    duration=duration,
)
```

Ver: `ait-engines/README_LOGGING.md`

---

## Queries de Kibana (KQL)

### Queries Básicos

```kql
# Todos los logs de una aplicación
application:ait-core

# Errores en las últimas 24h
level:error

# Requests lentos (>1 segundo)
duration > 1000

# Buscar por usuario específico
userId:"user-123"

# Errores de una URL específica
level:error AND url:*/api/policies*
```

### Queries Avanzados

```kql
# Errores de alta severidad
level:error AND severity:high

# Failed authentication attempts
authEvent:failed

# Slow database queries
query:* AND duration > 500

# Specific status codes
statusCode:(500 OR 502 OR 503)

# Performance category
performance_category:(slow OR very_slow)

# GeoIP filtering (users from Spain)
geoip.country_code2:ES

# Errors with stack trace
level:error AND stack:*

# Business events
event:(policy_created OR quote_requested)

# Time range with specific pattern
timestamp:[now-1h TO now] AND level:error
```

### Agregaciones

```kql
# Count by application
# Visualization: Pie chart
# Aggregation: Terms on "application"

# Average response time by endpoint
# Visualization: Line chart
# Aggregation: Avg on "duration", Break down by "url"

# Error rate over time
# Visualization: Area chart
# Aggregation: Date histogram on "timestamp", Filter: level:error
```

---

## Dashboards

### Dashboard 1: Application Health

**URL**: `http://localhost:5601/app/dashboards#/view/ait-application-health`

**Visualizaciones**:
1. Request Rate (Line chart)
   - Query: `level:info AND method:*`
   - Group by: `application`

2. Error Rate (Bar chart)
   - Query: `level:error`
   - Group by: `application`

3. Avg Response Time (Metric)
   - Aggregation: `avg(duration)`

4. Status Codes (Pie chart)
   - Group by: `statusCode`

5. Total Requests (Metric)
   - Count all logs

6. Error Rate % (Metric)
   - `(level:error) / (all logs) * 100`

### Dashboard 2: Error Tracking

**Visualizaciones**:
1. Recent Errors (Data table)
   - Columns: timestamp, application, message, statusCode, url, userId
   - Sort: timestamp DESC
   - Limit: 100

2. Error Types (Bar chart)
   - Group by: `error_type`

3. Errors Timeline (Area chart)
   - Date histogram: 5m interval

4. Error Messages (Tag cloud)
   - Top 50 error messages

5. Error Heatmap (Heatmap)
   - X-axis: Time (1h interval)
   - Y-axis: Application

### Dashboard 3: Performance Metrics

**Visualizaciones**:
1. Response Time Distribution (Histogram)
   - Bucket size: 50ms

2. Peak Traffic Hours (Heatmap)
   - Hour of day vs Day of week

3. Database Query Time (Line chart)
   - Avg duration by query type

4. P95 Response Time (Metric)
   - 95th percentile of duration

5. P99 Response Time (Metric)
   - 99th percentile of duration

6. Percentiles Over Time (Multi-line chart)
   - P50, P95, P99

---

## Alertas

### Alert 1: High Error Rate

**Trigger**: Error rate > 10% in last 5 minutes

**Actions**:
- Email to ops@aintech.com
- Slack notification to #alerts
- Severity: HIGH

**Configuration**:
```json
{
  "threshold": 10,
  "window": "5m",
  "query": "level:error",
  "calculation": "percentage"
}
```

### Alert 2: Slow Response Time

**Trigger**: P95 response time > 1000ms in last 10 minutes

**Actions**:
- Slack notification to #performance
- Severity: MEDIUM

### Alert 3: Application Down

**Trigger**: No logs received from app in 5 minutes

**Actions**:
- PagerDuty alert
- Email to ops@aintech.com
- Slack to #critical-alerts with @channel
- Severity: CRITICAL

### Alert 4: Database Error Spike

**Trigger**: Anomaly in database errors (ML detection)

**Actions**:
- Slack to #database
- Severity: HIGH

### Alert 5: Brute Force Attack

**Trigger**: >10 failed auth attempts from same IP in 5min

**Actions**:
- Slack to #security
- Severity: HIGH

**Setup en Kibana**:
1. Stack Management > Rules and Connectors
2. Create connector (Email, Slack, PagerDuty)
3. Create rule usando definiciones en `kibana/alerts.json`
4. Test rule

---

## Troubleshooting

### Problema: Logs no aparecen en Kibana

**Soluciones**:

1. Verificar ELK Stack:
```bash
health-check.bat
```

2. Verificar conectividad:
```bash
curl http://localhost:9200/_cluster/health
curl http://localhost:5601/api/status
curl http://localhost:9600
```

3. Ver logs de Logstash:
```bash
docker logs ait-logstash
```

4. Verificar variables de entorno:
```env
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

5. Test manual de log:
```bash
curl -X POST http://localhost:5000 \
  -H "Content-Type: application/json" \
  -d '{"message":"test","application":"test","level":"info","timestamp":"2026-01-28T12:00:00Z"}'
```

### Problema: Elasticsearch memory errors

**Solución**: Aumentar heap size en `docker-compose.elk.yml`:

```yaml
environment:
  - ES_JAVA_OPTS=-Xms4g -Xmx4g  # Cambiar de 2g a 4g
```

### Problema: Logstash not processing logs

**Soluciones**:

1. Ver Logstash pipeline stats:
```bash
curl http://localhost:9600/_node/stats/pipelines?pretty
```

2. Verificar configuración de pipeline:
```bash
docker exec -it ait-logstash cat /usr/share/logstash/pipeline/logstash.conf
```

3. Reiniciar Logstash:
```bash
docker restart ait-logstash
```

### Problema: Kibana index pattern not found

**Solución**:
```bash
setup-kibana.bat
```

O manualmente:
1. Kibana > Stack Management > Index Patterns
2. Create index pattern
3. Pattern: `ait-*`
4. Time field: `timestamp`

---

## Best Practices

### 1. Structured Logging

❌ **Mal**:
```typescript
logger.log('User 123 created policy POL-456');
```

✅ **Bien**:
```typescript
logger.logEvent('policy_created', {
  userId: '123',
  policyId: 'POL-456',
  premium: 1500,
});
```

### 2. Log Levels

- **debug**: Información detallada para debugging
- **info**: Operaciones normales, eventos de negocio
- **warn**: Situaciones anormales pero recuperables
- **error**: Errores que requieren atención

### 3. Correlation IDs

Incluir correlation ID en todos los logs de una request:

```typescript
const correlationId = req.headers['x-correlation-id'] || generateId();
logger.info('Processing request', { correlationId });
```

### 4. Sensitive Data

**NUNCA** loguear:
- Contraseñas
- Tokens de autenticación
- Números de tarjeta de crédito
- Información personal sensible

### 5. Performance

- No loguear en loops intensivos
- Usar niveles apropiados (debug solo en dev)
- Batch logs cuando sea posible

### 6. Error Context

Siempre incluir contexto en errors:

```typescript
logger.logError(error, {
  userId,
  operation: 'create_policy',
  input: sanitizedInput,
});
```

---

## Retention Policy

### Configuración Actual

- **Retention**: 30 días
- **Rotation**: Diaria (índices por día)
- **Backup**: Deshabilitado (opcional configurar)

### Índices

Patrón: `ait-{application}-YYYY.MM.DD`

Ejemplos:
- `ait-ait-core-2026.01.28`
- `ait-ain-tech-web-2026.01.28`
- `ait-ait-engines-2026.01.28`

### Limpieza Automática

Los índices más antiguos de 30 días se eliminan automáticamente.

Para cambiar retention, editar ILM policy en Elasticsearch:

```bash
curl -X PUT "localhost:9200/_ilm/policy/ait-logs-policy" \
  -H 'Content-Type: application/json' \
  -d '{
    "policy": {
      "phases": {
        "delete": {
          "min_age": "30d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'
```

---

## Testing

### Generar Logs de Prueba

**Python**:
```bash
cd infrastructure/logging/test
python generate-test-logs.py 1000 100
```

**TypeScript**:
```bash
cd infrastructure/logging/test
pnpm install
pnpm test:logs:1k
```

**Batch (Windows)**:
```bash
test-logs.bat
```

Genera:
- 50% HTTP requests
- 15% Errors
- 15% Business events
- 10% Performance metrics
- 10% Auth events

### Validar en Kibana

1. Abrir Kibana: http://localhost:5601
2. Analytics > Discover
3. Seleccionar index pattern: `ait-*`
4. Verificar que aparecen logs (<1 min latency)

---

## Performance Benchmark

### Throughput

- **Target**: 10,000 logs/min
- **Latency**: <100ms desde app a Elasticsearch
- **Batch size**: 100 logs
- **Timeout**: 5s

### Recursos

- **Elasticsearch**: 2GB RAM mínimo
- **Logstash**: 1GB RAM mínimo
- **Kibana**: 1GB RAM mínimo

---

## Contacto y Soporte

- **Documentación**: Este archivo
- **Logs de aplicación**: `libs/logger/README.md` (NestJS)
- **Logs de frontend**: `ain-tech-web/lib/logging/README.md`
- **Logs de engines**: `ait-engines/README_LOGGING.md`

Para preguntas o problemas, abrir issue en el repositorio.

---

## Changelog

- **2026-01-28**: Implementación inicial ELK Stack
  - Elasticsearch 8.11.0
  - Logstash 8.11.0
  - Kibana 8.11.0
  - Filebeat 8.11.0
  - 5 aplicaciones integradas
  - 3 dashboards configurados
  - 5 alertas configuradas
  - Retention de 30 días
