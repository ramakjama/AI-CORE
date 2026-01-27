# AI-CORE: Catalogo de Modulos

## Vision General

AI-CORE cuenta con mas de 55 modulos organizados en categorias funcionales. Este documento cataloga todos los modulos disponibles, sus dependencias y APIs principales.

## Diagrama de Modulos

```
+------------------------------------------------------------------+
|                        AI-CORE MODULES                            |
+------------------------------------------------------------------+
|                                                                  |
|  +--------------------+  +--------------------+                   |
|  |      AI-CORE       |  |     AI-AGENTS      |                   |
|  |   (Foundation)     |  |   (Intelligence)   |                   |
|  +--------------------+  +--------------------+                   |
|           |                       |                              |
|           +-----------+-----------+                              |
|                       |                                          |
|  +--------------------+--------------------+                      |
|  |                    |                    |                      |
|  v                    v                    v                      |
|  +----------+  +----------+  +----------+  +----------+           |
|  | AI-IAM   |  | AI-COMMS |  | AI-DATA  |  | AI-INTEG |           |
|  +----------+  +----------+  +----------+  +----------+           |
|                                                                  |
+------------------------------------------------------------------+
```

## Modulos Core

### AI-CORE (@ai-core/ai-core)

Modulo fundacional con utilidades compartidas.

```
+------------------------------------------------------------------+
|                          AI-CORE                                  |
+------------------------------------------------------------------+
|                                                                  |
|  ai-config       - Configuration management                      |
|  ai-logger       - Structured logging (Pino)                     |
|  ai-errors       - Error handling & exceptions                   |
|  ai-utils        - Common utilities                              |
|  ai-types        - Shared TypeScript types                       |
|  ai-validation   - Zod schemas & validators                      |
|  ai-crypto       - Encryption utilities                          |
|  ai-events       - Event bus abstraction                         |
|                                                                  |
+------------------------------------------------------------------+
```

| Submodulo | Descripcion | API Principal |
|-----------|-------------|---------------|
| `ai-config` | Gestion de configuracion | `ConfigService.get()` |
| `ai-logger` | Logging estructurado | `Logger.info()`, `Logger.error()` |
| `ai-errors` | Excepciones personalizadas | `AppException`, `ValidationException` |
| `ai-utils` | Utilidades comunes | `slugify()`, `retry()`, `debounce()` |
| `ai-types` | Tipos TypeScript | `IUser`, `IPolicy`, `ITenant` |
| `ai-validation` | Validadores Zod | `validateDto()`, schemas |
| `ai-crypto` | Encriptacion | `encrypt()`, `decrypt()`, `hash()` |
| `ai-events` | Bus de eventos | `EventBus.emit()`, `EventBus.on()` |

### AI-IAM (@ai-core/ai-iam)

Identity and Access Management.

```
+------------------------------------------------------------------+
|                          AI-IAM                                   |
+------------------------------------------------------------------+
|                                                                  |
|  ai-auth         - Authentication (JWT, OAuth)                   |
|  ai-authz        - Authorization (RBAC, ABAC)                    |
|  ai-users        - User management                               |
|  ai-roles        - Role management                               |
|  ai-permissions  - Permission management                         |
|  ai-sessions     - Session management                            |
|  ai-mfa          - Multi-factor authentication                   |
|  ai-sso          - Single Sign-On (SAML, OIDC)                   |
|  ai-tenants      - Multi-tenancy                                 |
|  ai-audit        - Audit logging                                 |
|                                                                  |
+------------------------------------------------------------------+
```

| Submodulo | Descripcion | API Principal |
|-----------|-------------|---------------|
| `ai-auth` | Autenticacion JWT/OAuth | `AuthService.login()`, `verify()` |
| `ai-authz` | Autorizacion RBAC | `@Permission()`, `canAccess()` |
| `ai-users` | Gestion de usuarios | `UserService.create()`, `findById()` |
| `ai-roles` | Gestion de roles | `RoleService.assign()`, `revoke()` |
| `ai-permissions` | Permisos granulares | `PermissionService.check()` |
| `ai-sessions` | Sesiones de usuario | `SessionService.create()`, `invalidate()` |
| `ai-mfa` | MFA con TOTP | `MfaService.enable()`, `verify()` |
| `ai-sso` | SSO empresarial | `SsoService.initiate()`, `callback()` |
| `ai-tenants` | Multi-tenancy | `TenantService.resolve()`, `switch()` |
| `ai-audit` | Logs de auditoria | `AuditService.log()`, `query()` |

### AI-AGENTS (@codex/ai-agents)

Framework de agentes IA multi-modelo.

```
+------------------------------------------------------------------+
|                         AI-AGENTS                                 |
+------------------------------------------------------------------+
|                                                                  |
|  Providers:                                                      |
|  +------------------+  +------------------+  +------------------+ |
|  | OpenAI Provider  |  | Anthropic        |  | Google Gemini    | |
|  | (GPT-4, GPT-4o)  |  | (Claude 3.5)     |  | (Gemini Pro)     | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
|  Services:                                                       |
|  +------------------+  +------------------+  +------------------+ |
|  | ChatService      |  | EmbeddingService |  | CompletionSvc    | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
|  RAG:                                                            |
|  +------------------+  +------------------+  +------------------+ |
|  | VectorStore      |  | DocumentLoader   |  | TextSplitter     | |
|  | (pgvector)       |  | (PDF, DOC, etc)  |  | (Chunk/Overlap)  | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
|  Tools:                                                          |
|  +------------------+  +------------------+  +------------------+ |
|  | WebSearch        |  | Calculator       |  | CodeExec         | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                  |
+------------------------------------------------------------------+
```

| Submodulo | Descripcion | API Principal |
|-----------|-------------|---------------|
| `ai-openai` | Proveedor OpenAI | `OpenAIProvider.chat()`, `embed()` |
| `ai-anthropic` | Proveedor Anthropic | `AnthropicProvider.chat()` |
| `ai-gemini` | Proveedor Google | `GeminiProvider.generate()` |
| `ai-chat` | Servicio de chat | `ChatService.send()`, `stream()` |
| `ai-embeddings` | Embeddings vectoriales | `EmbeddingService.embed()` |
| `ai-completion` | Completions | `CompletionService.complete()` |
| `ai-rag` | RAG pipeline | `RagService.query()`, `ingest()` |
| `ai-vectorstore` | Vector database | `VectorStore.search()`, `upsert()` |
| `ai-documents` | Document loaders | `DocumentLoader.load()` |
| `ai-tools` | Agent tools | `ToolRegistry.register()`, `execute()` |

### AI-COMMS (@ai-core/ai-comms)

Comunicaciones multicanal.

```
+------------------------------------------------------------------+
|                         AI-COMMS                                  |
+------------------------------------------------------------------+
|                                                                  |
|  Channels:                                                       |
|  +----------+  +----------+  +----------+  +----------+          |
|  |  Email   |  |   SMS    |  | WhatsApp |  |  Voice   |          |
|  | SendGrid |  |  Twilio  |  |  Twilio  |  |  Twilio  |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                  |
|  +----------+  +----------+  +----------+                        |
|  |   Push   |  |  In-App  |  |  Slack   |                        |
|  | Firebase |  | WebSocket|  |  Webhook |                        |
|  +----------+  +----------+  +----------+                        |
|                                                                  |
|  Services:                                                       |
|  +------------------+  +------------------+                       |
|  | TemplateEngine   |  | NotificationSvc  |                       |
|  | (Handlebars)     |  | (Queue/Retry)    |                       |
|  +------------------+  +------------------+                       |
|                                                                  |
+------------------------------------------------------------------+
```

| Submodulo | Descripcion | API Principal |
|-----------|-------------|---------------|
| `ai-email` | Email via SendGrid | `EmailService.send()`, `sendBulk()` |
| `ai-sms` | SMS via Twilio | `SmsService.send()`, `verify()` |
| `ai-whatsapp` | WhatsApp Business | `WhatsAppService.send()`, `template()` |
| `ai-voice` | Llamadas de voz | `VoiceService.call()`, `tts()` |
| `ai-push` | Push notifications | `PushService.send()`, `topic()` |
| `ai-inapp` | Notificaciones in-app | `InAppService.notify()`, `read()` |
| `ai-slack` | Integracion Slack | `SlackService.post()`, `webhook()` |
| `ai-templates` | Motor de plantillas | `TemplateService.render()`, `compile()` |
| `ai-notifications` | Servicio unificado | `NotificationService.send()` |

## Modulos de Dominio (Insurance)

### AI-POLICIES

Gestion de polizas de seguros.

```
+------------------------------------------------------------------+
|                        AI-POLICIES                                |
+------------------------------------------------------------------+
|                                                                  |
|  ai-policy-core     - Core policy management                     |
|  ai-policy-auto     - Auto insurance                             |
|  ai-policy-home     - Home insurance                             |
|  ai-policy-life     - Life insurance                             |
|  ai-policy-health   - Health insurance                           |
|  ai-policy-business - Business insurance                         |
|  ai-policy-travel   - Travel insurance                           |
|  ai-renewals        - Policy renewals                            |
|  ai-endorsements    - Policy endorsements                        |
|  ai-cancellations   - Policy cancellations                       |
|                                                                  |
+------------------------------------------------------------------+
```

### AI-CLAIMS

Gestion de siniestros.

```
+------------------------------------------------------------------+
|                         AI-CLAIMS                                 |
+------------------------------------------------------------------+
|                                                                  |
|  ai-claim-core      - Core claim management                      |
|  ai-claim-auto      - Auto claims (FNOL)                         |
|  ai-claim-home      - Home claims                                |
|  ai-claim-life      - Life claims                                |
|  ai-claim-health    - Health claims                              |
|  ai-adjusters       - Adjuster assignment                        |
|  ai-investigations  - Fraud investigation                        |
|  ai-settlements     - Settlement processing                      |
|  ai-payments        - Claim payments                             |
|  ai-subrogation     - Subrogation management                     |
|                                                                  |
+------------------------------------------------------------------+
```

### AI-UNDERWRITING

Motor de suscripcion.

```
+------------------------------------------------------------------+
|                      AI-UNDERWRITING                              |
+------------------------------------------------------------------+
|                                                                  |
|  ai-risk-assessment   - Risk scoring                             |
|  ai-rating-engine     - Premium calculation                      |
|  ai-rules-engine      - Business rules                           |
|  ai-quotes            - Quote generation                         |
|  ai-proposals         - Proposal management                      |
|  ai-approval-workflow - Approval workflows                       |
|                                                                  |
+------------------------------------------------------------------+
```

### AI-CUSTOMERS

Gestion de clientes (CRM).

```
+------------------------------------------------------------------+
|                       AI-CUSTOMERS                                |
+------------------------------------------------------------------+
|                                                                  |
|  ai-customer-core    - Core customer management                  |
|  ai-contacts         - Contact management                        |
|  ai-addresses        - Address management                        |
|  ai-documents        - Document management                       |
|  ai-kyc              - Know Your Customer                        |
|  ai-leads            - Lead management                           |
|  ai-opportunities    - Sales opportunities                       |
|  ai-activities       - Activity tracking                         |
|                                                                  |
+------------------------------------------------------------------+
```

## Modulos de Integracion

### AI-INTEGRATIONS

Integraciones con sistemas externos.

```
+------------------------------------------------------------------+
|                     AI-INTEGRATIONS                               |
+------------------------------------------------------------------+
|                                                                  |
|  Insurance Carriers:                                             |
|  +----------+  +----------+  +----------+  +----------+          |
|  |  Allianz |  |   AXA    |  |  Mapfre  |  |  Zurich  |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                  |
|  +----------+  +----------+  +----------+  +----------+          |
|  | Generali |  |  Liberty |  |  Caser   |  | Catalana |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                  |
|  External Services:                                              |
|  +----------+  +----------+  +----------+  +----------+          |
|  |   DGT    |  | Catastro |  |   TIREA  |  |  CICOS   |          |
|  +----------+  +----------+  +----------+  +----------+          |
|                                                                  |
|  Payment Providers:                                              |
|  +----------+  +----------+  +----------+                        |
|  |  Stripe  |  |  PayPal  |  |   SEPA   |                        |
|  +----------+  +----------+  +----------+                        |
|                                                                  |
+------------------------------------------------------------------+
```

| Submodulo | Descripcion | API Principal |
|-----------|-------------|---------------|
| `ai-carrier-allianz` | Integracion Allianz | `AllianzService.quote()`, `bind()` |
| `ai-carrier-axa` | Integracion AXA | `AxaService.quote()`, `bind()` |
| `ai-carrier-mapfre` | Integracion Mapfre | `MapfreService.quote()`, `bind()` |
| `ai-dgt` | Direccion General de Trafico | `DgtService.verify()`, `history()` |
| `ai-catastro` | Catastro inmobiliario | `CatastroService.lookup()` |
| `ai-tirea` | Pool de seguros | `TireaService.query()` |
| `ai-stripe` | Pagos Stripe | `StripeService.charge()`, `subscribe()` |
| `ai-sepa` | Domiciliacion SEPA | `SepaService.mandate()`, `debit()` |

## Modulos de Reporting

### AI-REPORTING

Business Intelligence y reporting.

```
+------------------------------------------------------------------+
|                       AI-REPORTING                                |
+------------------------------------------------------------------+
|                                                                  |
|  ai-reports         - Report generation                          |
|  ai-dashboards      - Dashboard builder                          |
|  ai-analytics       - Analytics engine                           |
|  ai-exports         - Data exports (Excel, PDF)                  |
|  ai-scheduling      - Report scheduling                          |
|  ai-kpis            - KPI tracking                               |
|                                                                  |
+------------------------------------------------------------------+
```

### AI-BI

Business Intelligence avanzado.

```
+------------------------------------------------------------------+
|                          AI-BI                                    |
+------------------------------------------------------------------+
|                                                                  |
|  ai-etl            - ETL pipelines                               |
|  ai-datawarehouse  - Data warehouse                              |
|  ai-cubes          - OLAP cubes                                  |
|  ai-forecasting    - ML forecasting                              |
|  ai-anomaly        - Anomaly detection                           |
|                                                                  |
+------------------------------------------------------------------+
```

## Modulos de Workflow

### AI-WORKFLOW

Motor de workflows.

```
+------------------------------------------------------------------+
|                       AI-WORKFLOW                                 |
+------------------------------------------------------------------+
|                                                                  |
|  ai-bpm            - Business Process Management                 |
|  ai-tasks          - Task management                             |
|  ai-approvals      - Approval workflows                          |
|  ai-escalations    - Escalation rules                            |
|  ai-sla            - SLA management                              |
|  ai-automation     - Process automation                          |
|                                                                  |
+------------------------------------------------------------------+
```

## Catalogo Completo (55+ Modulos)

### Por Categoria

```
+------------------------------------------------------------------+
|                    COMPLETE MODULE CATALOG                        |
+------------------------------------------------------------------+
|                                                                  |
|  FOUNDATION (8 modules):                                         |
|  ├── ai-config                                                   |
|  ├── ai-logger                                                   |
|  ├── ai-errors                                                   |
|  ├── ai-utils                                                    |
|  ├── ai-types                                                    |
|  ├── ai-validation                                               |
|  ├── ai-crypto                                                   |
|  └── ai-events                                                   |
|                                                                  |
|  IDENTITY (10 modules):                                          |
|  ├── ai-auth                                                     |
|  ├── ai-authz                                                    |
|  ├── ai-users                                                    |
|  ├── ai-roles                                                    |
|  ├── ai-permissions                                              |
|  ├── ai-sessions                                                 |
|  ├── ai-mfa                                                      |
|  ├── ai-sso                                                      |
|  ├── ai-tenants                                                  |
|  └── ai-audit                                                    |
|                                                                  |
|  AI/ML (10 modules):                                             |
|  ├── ai-openai                                                   |
|  ├── ai-anthropic                                                |
|  ├── ai-gemini                                                   |
|  ├── ai-chat                                                     |
|  ├── ai-embeddings                                               |
|  ├── ai-completion                                               |
|  ├── ai-rag                                                      |
|  ├── ai-vectorstore                                              |
|  ├── ai-documents                                                |
|  └── ai-tools                                                    |
|                                                                  |
|  COMMUNICATIONS (9 modules):                                     |
|  ├── ai-email                                                    |
|  ├── ai-sms                                                      |
|  ├── ai-whatsapp                                                 |
|  ├── ai-voice                                                    |
|  ├── ai-push                                                     |
|  ├── ai-inapp                                                    |
|  ├── ai-slack                                                    |
|  ├── ai-templates                                                |
|  └── ai-notifications                                            |
|                                                                  |
|  INSURANCE DOMAIN (20 modules):                                  |
|  ├── ai-policy-core                                              |
|  ├── ai-policy-auto                                              |
|  ├── ai-policy-home                                              |
|  ├── ai-policy-life                                              |
|  ├── ai-policy-health                                            |
|  ├── ai-claim-core                                               |
|  ├── ai-claim-auto                                               |
|  ├── ai-claim-home                                               |
|  ├── ai-underwriting                                             |
|  ├── ai-rating                                                   |
|  ├── ai-quotes                                                   |
|  ├── ai-renewals                                                 |
|  ├── ai-endorsements                                             |
|  ├── ai-customers                                                |
|  ├── ai-leads                                                    |
|  ├── ai-commissions                                              |
|  ├── ai-payments                                                 |
|  ├── ai-billing                                                  |
|  ├── ai-receipts                                                 |
|  └── ai-collections                                              |
|                                                                  |
|  INTEGRATIONS (8 modules):                                       |
|  ├── ai-carriers                                                 |
|  ├── ai-dgt                                                      |
|  ├── ai-catastro                                                 |
|  ├── ai-tirea                                                    |
|  ├── ai-stripe                                                   |
|  ├── ai-sepa                                                     |
|  ├── ai-webhooks                                                 |
|  └── ai-api-gateway                                              |
|                                                                  |
+------------------------------------------------------------------+
```

## Dependencias entre Modulos

```
+------------------------------------------------------------------+
|                    MODULE DEPENDENCIES                            |
+------------------------------------------------------------------+
|                                                                  |
|  ai-core (no dependencies)                                       |
|      |                                                           |
|      +---> ai-iam                                                |
|      |         |                                                 |
|      |         +---> ai-users                                    |
|      |         +---> ai-roles                                    |
|      |         +---> ai-permissions                              |
|      |                                                           |
|      +---> ai-agents                                             |
|      |         |                                                 |
|      |         +---> ai-openai                                   |
|      |         +---> ai-anthropic                                |
|      |         +---> ai-vectorstore                              |
|      |                                                           |
|      +---> ai-comms                                              |
|      |         |                                                 |
|      |         +---> ai-email                                    |
|      |         +---> ai-sms                                      |
|      |         +---> ai-templates                                |
|      |                                                           |
|      +---> ai-policies                                           |
|                |                                                 |
|                +---> ai-customers                                |
|                +---> ai-underwriting                             |
|                +---> ai-billing                                  |
|                                                                  |
+------------------------------------------------------------------+
```

## Ejemplo de Uso

```typescript
// Importar modulos
import { AuthService } from '@ai-core/ai-iam';
import { ChatService } from '@codex/ai-agents';
import { EmailService } from '@ai-core/ai-comms';
import { PolicyService } from '@ai-core/ai-policies';

// Configurar servicios
const auth = new AuthService(config);
const chat = new ChatService({ provider: 'openai' });
const email = new EmailService({ provider: 'sendgrid' });
const policies = new PolicyService(prisma);

// Flujo de ejemplo: Cotizacion asistida por IA
async function processQuoteRequest(userId: string, request: QuoteRequest) {
  // 1. Verificar autenticacion
  const user = await auth.verify(userId);

  // 2. Obtener recomendacion IA
  const recommendation = await chat.send({
    messages: [
      { role: 'system', content: 'Eres un experto en seguros...' },
      { role: 'user', content: `Necesito seguro para: ${JSON.stringify(request)}` }
    ]
  });

  // 3. Crear cotizacion
  const quote = await policies.createQuote({
    customerId: user.id,
    type: request.type,
    coverage: recommendation.suggestedCoverage,
    premium: await policies.calculatePremium(request)
  });

  // 4. Enviar email con cotizacion
  await email.send({
    to: user.email,
    template: 'quote-ready',
    data: { quote, recommendation: recommendation.explanation }
  });

  return quote;
}
```

## Referencias

- [GraphQL API](./graphql.md)
- [Database Schemas](../database/schemas.md)
- [Architecture Overview](../architecture/overview.md)
