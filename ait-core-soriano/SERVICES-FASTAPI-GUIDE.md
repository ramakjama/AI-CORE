# 🐍 GUÍA DE SERVICIOS FASTAPI

**Integrados desde AI-Suite:** 28 Enero 2026
**Total servicios:** 21
**Stack:** FastAPI + Python 3.11+ + Pydantic + PostgreSQL + Redis

---

## 📊 ARQUITECTURA HÍBRIDA

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                            │
│       Next.js + React + TypeScript + Tailwind CSS           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│          FastAPI Gateway (8001) + NestJS Router (3001)      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────────────────┐                 ┌────────────────────┐
│  BUSINESS LOGIC   │                 │  UTILITY SERVICES  │
│    (NestJS)       │                 │    (FastAPI)       │
│  Ports 3000-3099  │                 │  Ports 8000-8099   │
└───────────────────┘                 └────────────────────┘
```

---

## 📦 SERVICIOS DISPONIBLES

### Categoría: Core Services

| Servicio | Puerto | Descripción | Database |
|----------|--------|-------------|----------|
| **auth** | 8000 | Autenticación (JWT, OAuth2, SSO, MFA) | auth_db |
| **gateway** | 8001 | API Gateway con routing y load balancing | - |
| **storage** | 8002 | Almacenamiento S3-compatible (MinIO) | - |

### Categoría: Collaboration

| Servicio | Puerto | Descripción | Database |
|----------|--------|-------------|----------|
| **documents** | 8003 | Gestión de documentos | documents_db |
| **mail** | 8004 | Envío de emails (SMTP) | - |
| **notifications** | 8005 | Push notifications (FCM, WebPush) | notifications_db |
| **calendar** | 8006 | Gestión de calendario y eventos | calendar_db |
| **tasks** | 8007 | Gestión de tareas y to-dos | tasks_db |
| **collaboration** | 8012 | Colaboración en tiempo real | collaboration_db |
| **whiteboard** | 8019 | Pizarra colaborativa | whiteboard_db |

### Categoría: Business

| Servicio | Puerto | Descripción | Database |
|----------|--------|-------------|----------|
| **crm** | 8008 | CRM básico | crm_db |
| **analytics** | 8009 | Analytics y reporting | analytics_db |
| **hr** | 8010 | RRHH básico | hr_db |
| **workflow** | 8011 | Motor de workflows | workflow_db |
| **forms** | 8015 | Formularios dinámicos | forms_db |
| **bookings** | 8017 | Reservas y citas | bookings_db |

### Categoría: Productivity

| Servicio | Puerto | Descripción | Database |
|----------|--------|-------------|----------|
| **spreadsheets** | 8013 | Hojas de cálculo (Excel-like) | spreadsheets_db |
| **presentations** | 8014 | Presentaciones (PowerPoint-like) | presentations_db |
| **notes** | 8016 | Notas (OneNote-like) | notes_db |

### Categoría: AI & Utilities

| Servicio | Puerto | Descripción | Database |
|----------|--------|-------------|----------|
| **assistant** | 8018 | Asistente virtual con LLM | assistant_db |
| **translator** | 8020 | Traducción automática | translator_db |
| **embedded-apps** | 8021 | Aplicaciones embebidas (iframes) | embedded_apps_db |

---

## 🚀 INICIO RÁPIDO

### 1. Configurar Variables de Entorno

```bash
# Copiar ejemplo
cp .env.services.example .env.services

# Editar variables
nano .env.services
```

**Variables críticas:**
- `JWT_SECRET_KEY` - Clave secreta para JWT (cambiar en producción)
- `SMTP_USER` y `SMTP_PASSWORD` - Credenciales de email
- `OPENAI_API_KEY` o `ANTHROPIC_API_KEY` - Para servicios AI
- `S3_*` - Configuración de almacenamiento

### 2. Iniciar Todos los Servicios

```bash
# Iniciar todos los servicios FastAPI + infraestructura
docker-compose -f docker-compose.services.yml up -d

# Ver logs
docker-compose -f docker-compose.services.yml logs -f

# Ver estado
docker-compose -f docker-compose.services.yml ps
```

### 3. Iniciar Servicios Específicos

```bash
# Solo auth + gateway + storage
docker-compose -f docker-compose.services.yml up -d auth-service gateway-service storage-service

# Solo servicios de colaboración
docker-compose -f docker-compose.services.yml up -d documents-service mail-service notifications-service calendar-service
```

### 4. Verificar Health Checks

```bash
# Auth service
curl http://localhost:8000/health

# Gateway
curl http://localhost:8001/health

# Storage
curl http://localhost:8002/health

# Script para verificar todos
for port in {8000..8021}; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/health 2>/dev/null && echo "✅ OK" || echo "❌ DOWN"
done
```

---

## 📚 USO DE SERVICIOS

### AUTH SERVICE (8000)

**Endpoints principales:**
```bash
# Registro de usuario
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "full_name": "Juan Pérez",
    "role": "user"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Refresh token
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJ..."
  }'

# Get user profile
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer eyJ..."

# MFA enrollment
curl -X POST http://localhost:8000/api/v1/auth/mfa/enroll \
  -H "Authorization: Bearer eyJ..."

# OAuth2 login (Google)
curl http://localhost:8000/api/v1/auth/oauth/google
```

**Swagger UI:**
```
http://localhost:8000/docs
```

### STORAGE SERVICE (8002)

**Endpoints principales:**
```bash
# Upload file
curl -X POST http://localhost:8002/api/v1/storage/upload \
  -H "Authorization: Bearer eyJ..." \
  -F "file=@document.pdf" \
  -F "folder=documents"

# Download file
curl http://localhost:8002/api/v1/storage/download/file-id \
  -H "Authorization: Bearer eyJ..." \
  -o downloaded-file.pdf

# List files
curl http://localhost:8002/api/v1/storage/files?folder=documents \
  -H "Authorization: Bearer eyJ..."

# Delete file
curl -X DELETE http://localhost:8002/api/v1/storage/files/file-id \
  -H "Authorization: Bearer eyJ..."

# Get file metadata
curl http://localhost:8002/api/v1/storage/files/file-id/metadata \
  -H "Authorization: Bearer eyJ..."
```

### MAIL SERVICE (8004)

**Endpoints principales:**
```bash
# Send email
curl -X POST http://localhost:8004/api/v1/mail/send \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "body": "This is a test email",
    "html": "<h1>Test Email</h1><p>This is a test email</p>",
    "attachments": []
  }'

# Send template email
curl -X POST http://localhost:8004/api/v1/mail/send-template \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["recipient@example.com"],
    "template": "welcome",
    "data": {
      "name": "Juan",
      "activation_link": "https://..."
    }
  }'

# Get sent emails history
curl http://localhost:8004/api/v1/mail/sent \
  -H "Authorization: Bearer eyJ..."
```

### DOCUMENTS SERVICE (8003)

**Endpoints principales:**
```bash
# Create document
curl -X POST http://localhost:8003/api/v1/documents \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Document",
    "content": "Document content...",
    "type": "text",
    "folder_id": "folder-uuid"
  }'

# Get document
curl http://localhost:8003/api/v1/documents/doc-id \
  -H "Authorization: Bearer eyJ..."

# Update document
curl -X PUT http://localhost:8003/api/v1/documents/doc-id \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content..."
  }'

# Share document
curl -X POST http://localhost:8003/api/v1/documents/doc-id/share \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "permission": "edit"
  }'

# Search documents
curl "http://localhost:8003/api/v1/documents/search?q=test" \
  -H "Authorization: Bearer eyJ..."
```

### NOTIFICATIONS SERVICE (8005)

**Endpoints principales:**
```bash
# Send notification
curl -X POST http://localhost:8005/api/v1/notifications/send \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "title": "New Message",
    "body": "You have a new message",
    "type": "info",
    "action_url": "/messages/123"
  }'

# Get user notifications
curl http://localhost:8005/api/v1/notifications \
  -H "Authorization: Bearer eyJ..."

# Mark as read
curl -X PUT http://localhost:8005/api/v1/notifications/notif-id/read \
  -H "Authorization: Bearer eyJ..."

# Delete notification
curl -X DELETE http://localhost:8005/api/v1/notifications/notif-id \
  -H "Authorization: Bearer eyJ..."

# Register FCM token (mobile)
curl -X POST http://localhost:8005/api/v1/notifications/register-device \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "fcm_token": "fcm-token...",
    "device_type": "android"
  }'
```

---

## 🔗 INTEGRACIÓN CON NESTJS

### Desde un Módulo NestJS

```typescript
// ait-policy-manager/src/services/document.service.ts

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DocumentService {
  private readonly documentsServiceUrl = 'http://documents-service:8003';

  constructor(private readonly httpService: HttpService) {}

  async createPolicyDocument(policyId: string, content: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.documentsServiceUrl}/api/v1/documents`,
        {
          title: `Póliza ${policyId}`,
          content,
          type: 'policy',
          metadata: { policyId },
        },
        {
          headers: {
            Authorization: `Bearer ${this.getServiceToken()}`,
          },
        },
      ),
    );

    return response.data;
  }

  async uploadPolicyPDF(policyId: string, file: Buffer): Promise<any> {
    const formData = new FormData();
    formData.append('file', file, `policy-${policyId}.pdf`);
    formData.append('folder', 'policies');

    const response = await firstValueFrom(
      this.httpService.post(
        'http://storage-service:8002/api/v1/storage/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.getServiceToken()}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      ),
    );

    return response.data;
  }

  async sendPolicyEmail(customerId: string, policyData: any): Promise<void> {
    await firstValueFrom(
      this.httpService.post(
        'http://mail-service:8004/api/v1/mail/send-template',
        {
          to: [policyData.customerEmail],
          template: 'policy-created',
          data: {
            customerName: policyData.customerName,
            policyNumber: policyData.policyNumber,
            downloadLink: policyData.documentUrl,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.getServiceToken()}`,
          },
        },
      ),
    );
  }

  private getServiceToken(): string {
    // Service-to-service authentication token
    // Implementar lógica de token de servicio
    return process.env.SERVICE_AUTH_TOKEN || '';
  }
}
```

### Módulo de Integración

```typescript
// shared/fastapi-client/fastapi-client.module.ts

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthClient } from './clients/auth.client';
import { StorageClient } from './clients/storage.client';
import { MailClient } from './clients/mail.client';
import { DocumentsClient } from './clients/documents.client';
import { NotificationsClient } from './clients/notifications.client';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [
    AuthClient,
    StorageClient,
    MailClient,
    DocumentsClient,
    NotificationsClient,
  ],
  exports: [
    AuthClient,
    StorageClient,
    MailClient,
    DocumentsClient,
    NotificationsClient,
  ],
})
export class FastApiClientModule {}
```

---

## 🐛 DEBUGGING

### Ver logs de un servicio

```bash
# Logs en tiempo real
docker-compose -f docker-compose.services.yml logs -f auth-service

# Últimas 100 líneas
docker-compose -f docker-compose.services.yml logs --tail=100 auth-service

# Todos los servicios
docker-compose -f docker-compose.services.yml logs -f
```

### Ejecutar comandos dentro del contenedor

```bash
# Shell interactivo
docker exec -it ait-auth-service /bin/bash

# Verificar base de datos
docker exec -it ait-postgres psql -U postgres -d auth_db

# Ver logs de Python
docker exec -it ait-auth-service cat /var/log/app.log
```

### Reiniciar un servicio

```bash
# Reiniciar servicio específico
docker-compose -f docker-compose.services.yml restart auth-service

# Reiniciar todos
docker-compose -f docker-compose.services.yml restart
```

---

## 🧪 TESTING

### Tests de integración

```bash
# Desde el host
cd services/auth
python -m pytest tests/

# Dentro del contenedor
docker exec -it ait-auth-service python -m pytest tests/
```

### Load testing con k6

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:8000/health');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

```bash
k6 run load-test.js
```

---

## 📊 MONITOREO

### Prometheus Metrics

Cada servicio expone métricas en `/metrics`:

```bash
curl http://localhost:8000/metrics
```

### Grafana Dashboards

```bash
# Agregar datasource de Prometheus
# Importar dashboard: FastAPI Application Metrics
```

### Health Checks

```bash
# Script de monitoreo
#!/bin/bash
services=(8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 8010 8011 8012 8013 8014 8015 8016 8017 8018 8019 8020 8021)

for port in "${services[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  if [ "$status" = "200" ]; then
    echo "✅ Port $port: OK"
  else
    echo "❌ Port $port: DOWN"
  fi
done
```

---

## 🔧 TROUBLESHOOTING

### Problema: Servicio no inicia

```bash
# Ver logs
docker-compose -f docker-compose.services.yml logs auth-service

# Verificar variables de entorno
docker-compose -f docker-compose.services.yml config

# Verificar puerto no esté ocupado
netstat -ano | findstr :8000
```

### Problema: No se puede conectar a PostgreSQL

```bash
# Verificar que PostgreSQL esté corriendo
docker-compose -f docker-compose.services.yml ps postgres

# Conectar manualmente
docker exec -it ait-postgres psql -U postgres -d auth_db

# Verificar network
docker network ls
docker network inspect ait-network
```

### Problema: Error de permisos en MinIO

```bash
# Resetear MinIO
docker-compose -f docker-compose.services.yml down minio
docker volume rm ait-core-soriano_minio-data
docker-compose -f docker-compose.services.yml up -d minio
```

---

## 🚀 DEPLOYMENT A PRODUCCIÓN

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.services.yml ait-services

# Escalar servicio
docker service scale ait-services_auth-service=3
```

### Kubernetes

```bash
# Ver configuración en infrastructure/kubernetes/
kubectl apply -f infrastructure/kubernetes/namespaces/
kubectl apply -f infrastructure/kubernetes/configmaps/
kubectl apply -f infrastructure/kubernetes/secrets/
kubectl apply -f infrastructure/kubernetes/deployments/
kubectl apply -f infrastructure/kubernetes/services/
kubectl apply -f infrastructure/kubernetes/ingress/
```

---

## 📖 RECURSOS

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)

---

**¿Preguntas?** Consulta el [README principal](README.md) o los READMEs individuales de cada servicio.
