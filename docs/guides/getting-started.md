# AI-CORE: Guia de Inicio Rapido

## Requisitos Previos

### Software Requerido

| Software | Version Minima | Verificar |
|----------|---------------|-----------|
| Node.js | 20.x LTS | `node --version` |
| pnpm | 8.x | `pnpm --version` |
| Docker | 24.x | `docker --version` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 2.40+ | `git --version` |
| PostgreSQL | 15.x | `psql --version` |
| Redis | 7.x | `redis-cli --version` |

### Recursos del Sistema

```
+------------------------------------------------------------------+
|                    Minimum System Requirements                    |
+------------------------------------------------------------------+
|                                                                  |
|  Development:                                                    |
|  +------------------+                                            |
|  | CPU: 4 cores     |                                            |
|  | RAM: 16 GB       |                                            |
|  | Disk: 50 GB SSD  |                                            |
|  +------------------+                                            |
|                                                                  |
|  Production (per node):                                          |
|  +------------------+                                            |
|  | CPU: 8 cores     |                                            |
|  | RAM: 32 GB       |                                            |
|  | Disk: 200 GB SSD |                                            |
|  +------------------+                                            |
|                                                                  |
+------------------------------------------------------------------+
```

## Instalacion

### Paso 1: Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/soriano-mediadores/ai-core.git
cd ai-core

# Verificar la estructura
ls -la
# apps/  docs/  infrastructure/  libs/  services/  tools/
```

### Paso 2: Instalar Dependencias

```bash
# Instalar pnpm globalmente (si no esta instalado)
npm install -g pnpm

# Instalar todas las dependencias del monorepo
pnpm install

# Verificar instalacion
pnpm ls --depth=0
```

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables de entorno
nano .env  # o tu editor preferido
```

#### Variables de Entorno Requeridas

```bash
# .env file
#------------------------------------------------------------------
# DATABASE
#------------------------------------------------------------------
DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_core"
DATABASE_SHADOW_URL="postgresql://postgres:password@localhost:5432/ai_core_shadow"

#------------------------------------------------------------------
# REDIS
#------------------------------------------------------------------
REDIS_URL="redis://localhost:6379"

#------------------------------------------------------------------
# AUTHENTICATION
#------------------------------------------------------------------
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-token-secret-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

#------------------------------------------------------------------
# AI PROVIDERS
#------------------------------------------------------------------
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_AI_API_KEY="AIza..."

#------------------------------------------------------------------
# COMMUNICATION SERVICES
#------------------------------------------------------------------
SENDGRID_API_KEY="SG...."
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"

#------------------------------------------------------------------
# APPLICATION
#------------------------------------------------------------------
NODE_ENV="development"
PORT="3000"
API_URL="http://localhost:3000"
WEB_URL="http://localhost:3001"

#------------------------------------------------------------------
# ENCRYPTION
#------------------------------------------------------------------
ENCRYPTION_KEY="32-byte-hex-string"
```

### Paso 4: Iniciar Servicios con Docker

```bash
# Iniciar servicios de infraestructura
docker compose up -d

# Verificar que los servicios esten corriendo
docker compose ps

# Output esperado:
# NAME                 STATUS
# ai-core-postgres     running
# ai-core-redis        running
# ai-core-elasticsearch running (opcional)
```

#### docker-compose.yml (Desarrollo)

```yaml
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: ai-core-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ai_core
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai-core-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: ai-core-elasticsearch
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

### Paso 5: Configurar la Base de Datos

```bash
# Generar el cliente Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# (Opcional) Cargar datos de prueba
pnpm db:seed
```

### Paso 6: Verificar la Instalacion

```bash
# Ejecutar tests para verificar la configuracion
pnpm test

# Iniciar el servidor de desarrollo
pnpm dev

# Abrir en el navegador
# API: http://localhost:3000
# Web: http://localhost:3001
# GraphQL Playground: http://localhost:3000/graphql
```

## Estructura del Proyecto

```
ai-core/
├── apps/
│   ├── api/                    # API Gateway (NestJS)
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── common/         # Shared utilities
│   │   │   └── main.ts         # Entry point
│   │   └── package.json
│   │
│   ├── web/                    # Web Application (Next.js)
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   └── lib/            # Utilities
│   │   └── package.json
│   │
│   ├── desktop/                # Desktop App (Electron)
│   ├── portal-customer/        # Customer Portal
│   └── portal-employee/        # Employee Portal
│
├── libs/
│   ├── ai-agents/              # AI Agent Framework
│   │   ├── src/
│   │   │   ├── agents/         # Agent implementations
│   │   │   ├── providers/      # LLM providers
│   │   │   ├── rag/            # RAG components
│   │   │   └── tools/          # Agent tools
│   │   └── package.json
│   │
│   ├── ai-comms/               # Communications Module
│   ├── ai-iam/                 # Identity & Access
│   ├── ai-core/                # Core Utilities
│   ├── database/               # Prisma Schemas
│   ├── integrations/           # External Integrations
│   ├── shared/                 # Shared Types/DTOs
│   └── ui/                     # UI Components
│
├── infrastructure/
│   ├── docker/                 # Dockerfiles
│   ├── kubernetes/             # K8s manifests
│   └── terraform/              # IaC
│
├── tools/                      # CLI tools & scripts
├── docs/                       # Documentation
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # pnpm workspace
└── package.json                # Root package.json
```

## Comandos Principales

### Desarrollo

```bash
# Iniciar todos los servicios en modo desarrollo
pnpm dev

# Iniciar un app especifico
pnpm dev --filter=@ai-core/api
pnpm dev --filter=@ai-core/web

# Construir todo el monorepo
pnpm build

# Construir un paquete especifico
pnpm build --filter=@ai-core/ai-agents
```

### Base de Datos

```bash
# Generar cliente Prisma
pnpm db:generate

# Crear nueva migracion
pnpm db:migrate:dev --name add_new_feature

# Aplicar migraciones en produccion
pnpm db:migrate:deploy

# Resetear base de datos (CUIDADO: borra todos los datos)
pnpm db:reset

# Abrir Prisma Studio
pnpm db:studio
```

### Testing

```bash
# Ejecutar todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en modo watch
pnpm test:watch

# Tests e2e
pnpm test:e2e

# Tests para un paquete especifico
pnpm test --filter=@ai-core/ai-agents
```

### Linting y Formateo

```bash
# Lint de todo el codigo
pnpm lint

# Fix automatico
pnpm lint:fix

# Formatear con Prettier
pnpm format

# Type check
pnpm typecheck
```

## Verificacion de la Instalacion

### Checklist

```
+------------------------------------------------------------------+
|                    Installation Verification                      |
+------------------------------------------------------------------+
|                                                                  |
|  [ ] Node.js 20.x instalado                                      |
|  [ ] pnpm 8.x instalado                                          |
|  [ ] Docker running                                              |
|  [ ] Repositorio clonado                                         |
|  [ ] Dependencias instaladas (pnpm install)                      |
|  [ ] Variables de entorno configuradas (.env)                    |
|  [ ] Docker Compose servicios running                            |
|  [ ] Base de datos migrada                                       |
|  [ ] Tests pasando                                               |
|  [ ] Servidor de desarrollo funcionando                          |
|                                                                  |
+------------------------------------------------------------------+
```

### Script de Verificacion

```bash
#!/bin/bash
# verify-installation.sh

echo "Verificando instalacion de AI-CORE..."

# Check Node.js
node_version=$(node --version 2>/dev/null)
if [[ $node_version == v20* ]]; then
  echo "✓ Node.js: $node_version"
else
  echo "✗ Node.js 20.x requerido"
  exit 1
fi

# Check pnpm
pnpm_version=$(pnpm --version 2>/dev/null)
if [[ $pnpm_version == 8* ]]; then
  echo "✓ pnpm: $pnpm_version"
else
  echo "✗ pnpm 8.x requerido"
  exit 1
fi

# Check Docker
if docker info > /dev/null 2>&1; then
  echo "✓ Docker running"
else
  echo "✗ Docker no esta corriendo"
  exit 1
fi

# Check PostgreSQL connection
if docker compose exec -T postgres pg_isready > /dev/null 2>&1; then
  echo "✓ PostgreSQL conectado"
else
  echo "✗ PostgreSQL no disponible"
fi

# Check Redis connection
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
  echo "✓ Redis conectado"
else
  echo "✗ Redis no disponible"
fi

echo ""
echo "Verificacion completada!"
```

## Troubleshooting

### Problemas Comunes

#### Error: Puerto en uso

```bash
# Ver que proceso usa el puerto
lsof -i :3000

# Matar el proceso
kill -9 <PID>

# O cambiar el puerto en .env
PORT=3001
```

#### Error: Connection refused (PostgreSQL)

```bash
# Verificar que el contenedor este corriendo
docker compose ps

# Ver logs del contenedor
docker compose logs postgres

# Reiniciar el servicio
docker compose restart postgres
```

#### Error: Prisma migrate failed

```bash
# Resetear la base de datos (desarrollo)
pnpm db:reset

# Si hay conflictos de migracion
pnpm prisma migrate resolve --applied "migration_name"
```

#### Error: Node modules corrupted

```bash
# Limpiar cache y reinstalar
pnpm store prune
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
pnpm install
```

## Proximos Pasos

1. Leer la [Guia de Desarrollo](./development.md)
2. Explorar la [Arquitectura](../architecture/overview.md)
3. Revisar el [Catalogo de Modulos](../api/modules.md)
4. Configurar tu [IDE](./development.md#ide-setup)

## Soporte

- **Documentacion**: `/docs`
- **Issues**: GitHub Issues
- **Slack**: #ai-core-dev
- **Email**: dev-team@soriano-mediadores.com
