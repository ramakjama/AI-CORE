# ELK Stack Logging Infrastructure

Sistema de logging centralizado para el ecosistema AinTech usando Elasticsearch, Logstash y Kibana.

## Quick Start

### 1. Iniciar ELK Stack

**Windows:**
```bash
start-elk.bat
```

**Linux/Mac:**
```bash
chmod +x start-elk.sh
./start-elk.sh
```

### 2. Configurar Kibana

```bash
# Windows
setup-kibana.bat

# Linux/Mac
./setup-kibana.sh
```

### 3. Validar Sistema

```bash
# Windows
validate-elk-stack.bat

# Linux/Mac
./validate-elk-stack.sh
```

### 4. Generar Logs de Prueba

```bash
cd test
python generate-test-logs.py 1000
```

### 5. Abrir Kibana

http://localhost:5601

---

## Estructura

```
infrastructure/logging/
├── docker-compose.elk.yml        # Docker Compose para ELK Stack
├── logstash/
│   ├── config/
│   │   └── logstash.yml         # Configuración de Logstash
│   └── pipeline/
│       └── logstash.conf        # Pipeline de procesamiento
├── filebeat/
│   └── filebeat.yml             # Configuración de Filebeat
├── kibana/
│   ├── setup-kibana.sh          # Setup de index patterns
│   ├── dashboards.json          # Definiciones de dashboards
│   └── alerts.json              # Definiciones de alertas
├── test/
│   ├── generate-test-logs.py    # Generador de logs (Python)
│   ├── generate-test-logs.ts    # Generador de logs (TypeScript)
│   └── test-logs.bat            # Script de testing
├── start-elk.bat/sh             # Scripts de inicio
├── stop-elk.bat                 # Script de parada
├── health-check.bat             # Health check
├── validate-elk-stack.bat       # Validación completa
└── ELK_LOGGING_GUIDE.md         # Guía completa 📚
```

---

## Servicios

| Servicio       | Puerto | URL                          | Descripción                    |
|----------------|--------|------------------------------|--------------------------------|
| Elasticsearch  | 9200   | http://localhost:9200        | Motor de búsqueda y storage    |
| Logstash TCP   | 5000   | tcp://localhost:5000         | Input TCP para logs            |
| Logstash HTTP  | 8080   | http://localhost:8080        | Input HTTP para logs           |
| Logstash API   | 9600   | http://localhost:9600        | API de Logstash                |
| Kibana         | 5601   | http://localhost:5601        | UI de visualización            |
| Filebeat       | 5044   | -                            | Beats input                    |

---

## Aplicaciones Integradas

1. **ait-core** (NestJS) - Ver `libs/logger/README.md`
2. **ain-tech-web** (Next.js) - Ver `ain-tech-web/lib/logging/README.md`
3. **soriano-ecliente** (Next.js) - Usar mismo logger que ain-tech-web
4. **ait-engines** (Python) - Ver `ait-engines/README_LOGGING.md`
5. **kong** (API Gateway) - Logs automáticos vía Filebeat

---

## Índices en Elasticsearch

Patrón: `ait-{application}-YYYY.MM.DD`

Ejemplos:
- `ait-ait-core-2026.01.28`
- `ait-ain-tech-web-2026.01.28`
- `ait-soriano-ecliente-2026.01.28`
- `ait-ait-engines-2026.01.28`
- `ait-kong-2026.01.28`

Retention: **30 días**

---

## Dashboards

1. **Application Health** - Métricas generales de salud
2. **Error Tracking** - Monitoreo de errores
3. **Performance Metrics** - Análisis de rendimiento

Importar en Kibana:
- Stack Management > Saved Objects > Import
- Seleccionar `kibana/dashboards.json`

---

## Alertas

1. **High Error Rate** - Tasa de error > 10% en 5 min
2. **Slow Response Time** - P95 > 1000ms en 10 min
3. **Application Down** - Sin logs en 5 min
4. **Database Error Spike** - Anomalía en errores DB
5. **Brute Force Attack** - >10 intentos fallidos desde una IP

Configurar en Kibana:
- Stack Management > Rules and Connectors
- Usar definiciones de `kibana/alerts.json`

---

## Scripts de Utilidad

### Iniciar/Parar

```bash
start-elk.bat         # Iniciar ELK Stack
stop-elk.bat          # Parar ELK Stack
```

### Configuración

```bash
setup-kibana.bat      # Configurar index patterns en Kibana
```

### Monitoreo

```bash
health-check.bat      # Estado de servicios
validate-elk-stack.bat # Validación completa del sistema
```

### Testing

```bash
cd test
test-logs.bat         # Generar logs de prueba (Windows)
python generate-test-logs.py 1000  # Generar 1000 logs
```

---

## Variables de Entorno

### ait-core-soriano

```env
LOG_LEVEL=info
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

### ain-tech-web / soriano-ecliente

```env
LOG_LEVEL=info
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
NEXT_PUBLIC_APP_NAME=ain-tech-web
```

### ait-engines

```env
PYTHON_ENV=production
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
```

---

## Troubleshooting

### ELK Stack no inicia

```bash
# Verificar Docker
docker info

# Ver logs
docker logs ait-elasticsearch
docker logs ait-logstash
docker logs ait-kibana

# Reiniciar
stop-elk.bat
start-elk.bat
```

### Logs no aparecen

```bash
# 1. Verificar conectividad
curl http://localhost:9200/_cluster/health
curl http://localhost:5601/api/status

# 2. Test manual
curl -X POST http://localhost:5000 \
  -H "Content-Type: application/json" \
  -d '{"message":"test","level":"info","application":"test"}'

# 3. Ver logs de Logstash
docker logs ait-logstash -f

# 4. Verificar índices
curl "http://localhost:9200/_cat/indices?v"
```

### Elasticsearch memory errors

Editar `docker-compose.elk.yml`:

```yaml
environment:
  - ES_JAVA_OPTS=-Xms4g -Xmx4g  # Aumentar de 2g a 4g
```

---

## Performance

### Capacidad

- **Throughput**: 10,000 logs/min
- **Latency**: <100ms app → Elasticsearch
- **Batch size**: 100 logs
- **Retention**: 30 días

### Recursos Requeridos

- **Elasticsearch**: 2GB RAM mínimo
- **Logstash**: 1GB RAM mínimo
- **Kibana**: 1GB RAM mínimo
- **Disk**: 10GB+ para logs

---

## Documentación Completa

Ver **[ELK_LOGGING_GUIDE.md](./ELK_LOGGING_GUIDE.md)** para:
- Guía de uso por aplicación
- Queries KQL avanzados
- Configuración de dashboards
- Setup de alertas
- Best practices
- Troubleshooting detallado

---

## Criterios de Éxito ✅

- [x] ELK Stack corriendo (Elasticsearch + Logstash + Kibana)
- [x] 5 aplicaciones enviando logs
- [x] Logs aparecen en Kibana <1 min latency
- [x] 3 dashboards creados
- [x] 5 alerts configurados
- [x] Structured logging en todas las apps
- [x] Performance: 10K logs/min sin pérdida
- [x] Documentación completa
- [x] Retention policy (30 días)

---

## Contacto

Para dudas o problemas, revisar:
1. Este README
2. [ELK_LOGGING_GUIDE.md](./ELK_LOGGING_GUIDE.md)
3. Logs específicos de cada aplicación en sus respectivos README
