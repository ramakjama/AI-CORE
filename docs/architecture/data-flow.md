# AI-CORE: Flujo de Datos

## Vision General

Este documento describe como fluyen los datos a traves de los diferentes modulos y capas de AI-CORE, incluyendo patrones de comunicacion sincrona y asincrona.

## Diagrama de Flujo Principal

```
+------------------+     +------------------+     +------------------+
|    FRONTEND      |     |    API GATEWAY   |     |    SERVICES      |
|    (Next.js)     |     |    (GraphQL)     |     |    (Backend)     |
+------------------+     +------------------+     +------------------+
        |                        |                        |
        | 1. HTTP Request        |                        |
        |----------------------->|                        |
        |                        | 2. Auth Validation     |
        |                        |----------------------->|
        |                        |                        | AI-IAM
        |                        |<-----------------------|
        |                        | 3. JWT Token           |
        |                        |                        |
        |                        | 4. GraphQL Query       |
        |                        |----------------------->|
        |                        |                        | Federation
        |                        |                        |
        |                        | 5. Subgraph Queries    |
        |                        |----------------------->|
        |                        |                        |
        |                        |<-----------------------|
        |                        | 6. Aggregated Response |
        |<-----------------------|                        |
        | 7. JSON Response       |                        |
        |                        |                        |
+------------------+     +------------------+     +------------------+
```

## Flujo de Autenticacion

```
+----------+    +----------+    +----------+    +----------+    +----------+
|  Client  |    |   API    |    |  AI-IAM  |    |   DB     |    |  Cache   |
+----------+    +----------+    +----------+    +----------+    +----------+
     |               |               |               |               |
     | 1. Login      |               |               |               |
     |-------------->|               |               |               |
     |               | 2. Validate   |               |               |
     |               |-------------->|               |               |
     |               |               | 3. Query User |               |
     |               |               |-------------->|               |
     |               |               |<--------------|               |
     |               |               | 4. User Data  |               |
     |               |               |               |               |
     |               |               | 5. Verify Pwd |               |
     |               |               |-------------->|               |
     |               |               |               |               |
     |               |               | 6. Gen JWT    |               |
     |               |               |               |               |
     |               |               | 7. Cache Session               |
     |               |               |------------------------------>|
     |               |<--------------|               |               |
     |               | 8. JWT Token  |               |               |
     |<--------------|               |               |               |
     | 9. Response   |               |               |               |
     |               |               |               |               |
```

## Flujo de Agentes IA

```
+----------+    +----------+    +----------+    +----------+    +----------+
|  User    |    |  Agent   |    |   LLM    |    |   RAG    |    | Vector   |
| Interface|    | Service  |    | Provider |    | Service  |    |   DB     |
+----------+    +----------+    +----------+    +----------+    +----------+
     |               |               |               |               |
     | 1. Query      |               |               |               |
     |-------------->|               |               |               |
     |               | 2. Context    |               |               |
     |               |------------------------------>|               |
     |               |               |               | 3. Embedding  |
     |               |               |               |-------------->|
     |               |               |               |<--------------|
     |               |               |               | 4. Vectors    |
     |               |               |               |               |
     |               |               |               | 5. Search     |
     |               |               |               |-------------->|
     |               |               |               |<--------------|
     |               |<------------------------------|               |
     |               | 6. Relevant Docs              |               |
     |               |               |               |               |
     |               | 7. Prompt +   |               |               |
     |               |    Context    |               |               |
     |               |-------------->|               |               |
     |               |               | 8. Generate   |               |
     |               |               |    Response   |               |
     |               |<--------------|               |               |
     |               | 9. LLM Response               |               |
     |<--------------|               |               |               |
     | 10. Answer    |               |               |               |
     |               |               |               |               |
```

## Flujo de Comunicaciones (AI-COMMS)

```
+----------+    +----------+    +----------+    +----------+    +----------+
| Trigger  |    | Comms    |    | Template |    | Provider |    | External |
| Event    |    | Service  |    | Engine   |    | Gateway  |    | Service  |
+----------+    +----------+    +----------+    +----------+    +----------+
     |               |               |               |               |
     | 1. Send       |               |               |               |
     |    Request    |               |               |               |
     |-------------->|               |               |               |
     |               | 2. Get        |               |               |
     |               |    Template   |               |               |
     |               |-------------->|               |               |
     |               |<--------------|               |               |
     |               | 3. Compiled   |               |               |
     |               |    Template   |               |               |
     |               |               |               |               |
     |               | 4. Select     |               |               |
     |               |    Channel    |               |               |
     |               |------------------------------>|               |
     |               |               |               |               |
     |               |               |               | 5. Deliver    |
     |               |               |               |-------------->|
     |               |               |               |     Email/    |
     |               |               |               |     SMS/      |
     |               |               |               |     WhatsApp  |
     |               |               |               |<--------------|
     |               |               |               | 6. Status     |
     |               |<------------------------------|               |
     |               | 7. Delivery   |               |               |
     |               |    Status     |               |               |
     |<--------------|               |               |               |
     | 8. Confirm    |               |               |               |
     |               |               |               |               |
```

## Flujo de Datos por Capa

### Capa de Presentacion

```
+------------------------------------------------------------------+
|                        Browser / Client                           |
+------------------------------------------------------------------+
                              |
                    HTTP/WebSocket
                              |
                              v
+------------------------------------------------------------------+
|                      Next.js Application                          |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+  +------------------+  +------------------+ |
|  |  Server Actions  |  |   API Routes     |  |  React Server   | |
|  |  (Mutations)     |  |  (/api/*)        |  |  Components     | |
|  +------------------+  +------------------+  +------------------+ |
|           |                    |                    |            |
|           +--------------------+--------------------+            |
|                                |                                 |
|                    +-----------v-----------+                     |
|                    |    TanStack Query     |                     |
|                    |   (Cache + State)     |                     |
|                    +-----------------------+                     |
|                                                                  |
+------------------------------------------------------------------+
```

### Capa de API Gateway

```
+------------------------------------------------------------------+
|                        API Gateway                                |
+------------------------------------------------------------------+
|                                                                  |
|  +---------------------+                                         |
|  |  Rate Limiting      |                                         |
|  +---------------------+                                         |
|           |                                                      |
|  +--------v------------+                                         |
|  |  Authentication     |----> AI-IAM Module                      |
|  +---------------------+                                         |
|           |                                                      |
|  +--------v------------+                                         |
|  |  Authorization      |----> RBAC Check                         |
|  +---------------------+                                         |
|           |                                                      |
|  +--------v------------+     +------------------+                 |
|  |  GraphQL Gateway    |---->| Apollo Federation|                 |
|  +---------------------+     +------------------+                 |
|           |                         |                            |
|           |              +----------+----------+                  |
|           |              |          |          |                  |
|           v              v          v          v                  |
|  +-------------+  +----------+ +----------+ +----------+          |
|  | REST APIs   |  |Subgraph 1| |Subgraph 2| |Subgraph N|          |
|  +-------------+  +----------+ +----------+ +----------+          |
|                                                                  |
+------------------------------------------------------------------+
```

### Capa de Servicios

```
+------------------------------------------------------------------+
|                        Service Layer                              |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+     +------------------+                    |
|  |  Business Logic  |     |  Domain Events   |                    |
|  +------------------+     +------------------+                    |
|           |                       |                              |
|           v                       v                              |
|  +------------------+     +------------------+                    |
|  |  Use Cases       |     |  Event Handlers  |                    |
|  +------------------+     +------------------+                    |
|           |                       |                              |
|           +----------+------------+                              |
|                      |                                           |
|           +----------v-----------+                               |
|           |    Repository        |                               |
|           |    Interfaces        |                               |
|           +----------------------+                               |
|                      |                                           |
+------------------------------------------------------------------+
                       |
                       v
+------------------------------------------------------------------+
|                     Data Access Layer                             |
+------------------------------------------------------------------+
|                                                                  |
|  +------------------+  +------------------+  +------------------+ |
|  |  Prisma ORM      |  |    Redis         |  |  Elasticsearch   | |
|  +------------------+  +------------------+  +------------------+ |
|           |                    |                    |            |
|           v                    v                    v            |
|  +------------------+  +------------------+  +------------------+ |
|  |   PostgreSQL     |  |   Redis Server   |  |   ES Cluster     | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

## Flujos de Eventos

### Event Bus Architecture

```
+------------------------------------------------------------------+
|                         Event Bus (Redis)                         |
+------------------------------------------------------------------+
|                                                                  |
|  +-------------+  +-------------+  +-------------+                |
|  | user.*      |  | policy.*    |  | claim.*     |                |
|  | events      |  | events      |  | events      |                |
|  +-------------+  +-------------+  +-------------+                |
|        |               |               |                         |
|        v               v               v                         |
|  +----------------------------------------------------------+    |
|  |                    Event Router                          |    |
|  +----------------------------------------------------------+    |
|        |               |               |               |         |
|        v               v               v               v         |
|  +-----------+  +-----------+  +-----------+  +-----------+      |
|  | AI-IAM    |  | AI-COMMS  |  | AI-AGENTS |  | Analytics |      |
|  | Handler   |  | Handler   |  | Handler   |  | Handler   |      |
|  +-----------+  +-----------+  +-----------+  +-----------+      |
|                                                                  |
+------------------------------------------------------------------+
```

### Tipos de Eventos

| Dominio | Evento | Descripcion | Consumidores |
|---------|--------|-------------|--------------|
| `user` | `user.created` | Nuevo usuario registrado | AI-COMMS, Analytics |
| `user` | `user.updated` | Usuario actualizado | Cache, Search |
| `user` | `user.deleted` | Usuario eliminado | GDPR Handler |
| `auth` | `auth.login` | Login exitoso | Audit, Security |
| `auth` | `auth.failed` | Login fallido | Security, Alert |
| `policy` | `policy.created` | Nueva poliza | AI-COMMS, Billing |
| `policy` | `policy.renewed` | Poliza renovada | AI-COMMS, Reports |
| `claim` | `claim.submitted` | Siniestro reportado | AI-AGENTS, Workflow |
| `claim` | `claim.approved` | Siniestro aprobado | AI-COMMS, Payment |
| `comms` | `email.sent` | Email enviado | Analytics |
| `comms` | `sms.delivered` | SMS entregado | Analytics |

## Flujo de Datos Multi-Tenant

```
+------------------------------------------------------------------+
|                     Multi-Tenant Data Flow                        |
+------------------------------------------------------------------+
|                                                                  |
|    Request                                                       |
|       |                                                          |
|       v                                                          |
|  +------------------+                                            |
|  | Extract Tenant   |  <-- From JWT / Header / Subdomain         |
|  | Identifier       |                                            |
|  +------------------+                                            |
|       |                                                          |
|       v                                                          |
|  +------------------+                                            |
|  | Tenant Context   |  <-- Set in AsyncLocalStorage              |
|  | Middleware       |                                            |
|  +------------------+                                            |
|       |                                                          |
|       +--------------------+--------------------+                 |
|       |                    |                    |                 |
|       v                    v                    v                 |
|  +----------+        +----------+        +----------+            |
|  | Tenant A |        | Tenant B |        | Tenant C |            |
|  | Schema   |        | Schema   |        | Schema   |            |
|  +----------+        +----------+        +----------+            |
|       |                    |                    |                 |
|       v                    v                    v                 |
|  +----------------------------------------------------------+    |
|  |                 PostgreSQL (Row-Level Security)          |    |
|  +----------------------------------------------------------+    |
|                                                                  |
+------------------------------------------------------------------+
```

## Flujo de Cache

```
+------------------------------------------------------------------+
|                       Caching Strategy                            |
+------------------------------------------------------------------+
|                                                                  |
|  Request                                                         |
|     |                                                            |
|     v                                                            |
|  +------------------+                                            |
|  | Check L1 Cache   | <-- In-Memory (Map/LRU)                    |
|  | (Application)    |                                            |
|  +------------------+                                            |
|     |                                                            |
|     | Miss                                                       |
|     v                                                            |
|  +------------------+                                            |
|  | Check L2 Cache   | <-- Redis Cluster                          |
|  | (Distributed)    |                                            |
|  +------------------+                                            |
|     |                                                            |
|     | Miss                                                       |
|     v                                                            |
|  +------------------+                                            |
|  | Query Database   | <-- PostgreSQL                             |
|  +------------------+                                            |
|     |                                                            |
|     v                                                            |
|  +------------------+                                            |
|  | Populate Caches  | --> L1 & L2                                |
|  +------------------+                                            |
|     |                                                            |
|     v                                                            |
|  Response                                                        |
|                                                                  |
+------------------------------------------------------------------+

Cache TTL Configuration:
+------------------+----------+----------+
| Data Type        | L1 TTL   | L2 TTL   |
+------------------+----------+----------+
| User Session     | 5 min    | 30 min   |
| Config/Settings  | 1 hour   | 24 hours |
| Reference Data   | 15 min   | 1 hour   |
| Search Results   | 2 min    | 10 min   |
| AI Responses     | N/A      | 1 hour   |
+------------------+----------+----------+
```

## Sincronizacion de Datos

### Patron Saga para Transacciones Distribuidas

```
+------------------------------------------------------------------+
|                    Saga Pattern (Choreography)                    |
+------------------------------------------------------------------+
|                                                                  |
|  Step 1: Create Order                                            |
|  +-----------+                                                   |
|  | Order     |----> order.created event                          |
|  | Service   |                                                   |
|  +-----------+                                                   |
|                    |                                             |
|                    v                                             |
|  Step 2: Reserve Payment                                         |
|  +-----------+                                                   |
|  | Payment   |----> payment.reserved event                       |
|  | Service   |                                                   |
|  +-----------+                                                   |
|                    |                                             |
|                    v                                             |
|  Step 3: Generate Policy                                         |
|  +-----------+                                                   |
|  | Policy    |----> policy.created event                         |
|  | Service   |                                                   |
|  +-----------+                                                   |
|                    |                                             |
|                    v                                             |
|  Step 4: Send Confirmation                                       |
|  +-----------+                                                   |
|  | Comms     |----> notification.sent event                      |
|  | Service   |                                                   |
|  +-----------+                                                   |
|                                                                  |
|  Compensation (on failure):                                      |
|  notification.failed -> policy.cancelled -> payment.refunded     |
|                                                                  |
+------------------------------------------------------------------+
```

## Data Consistency

```
+------------------------------------------------------------------+
|                    Consistency Guarantees                         |
+------------------------------------------------------------------+

+-------------------+-------------------+-------------------+
| Operation Type    | Consistency Level | Mechanism         |
+-------------------+-------------------+-------------------+
| User Auth         | Strong            | Sync + Redis Lock |
| Policy Creation   | Eventual          | Saga + Events     |
| Search Index      | Eventual          | Async Sync        |
| Analytics         | Eventual          | Batch Processing  |
| Audit Logs        | Strong            | Sync Write        |
| Cache Updates     | Eventual          | Pub/Sub           |
+-------------------+-------------------+-------------------+

Conflict Resolution:
- Last-Write-Wins (LWW) for most entities
- Merge strategy for concurrent document edits
- Version vectors for distributed counters
```

## Referencias

- [Architecture Overview](./overview.md)
- [Security Model](./security.md)
- [GraphQL Federation](../api/graphql.md)
