# 🔬 ANÁLISIS DE IMPLEMENTACIÓN 100% COMPLETO

## 📋 ÍNDICE EJECUTIVO

Este documento contiene el **análisis EXHAUSTIVO** de implementación de los 52 módulos pendientes del ecosistema AIT-CORE, con:

1. ✅ Especificación técnica completa de cada módulo
2. ✅ Schemas Prisma detallados (todos los modelos)
3. ✅ API endpoints completos con DTOs
4. ✅ Servicios y lógica de negocio
5. ✅ Dependencias e integraciones
6. ✅ Workflows y procesos
7. ✅ Tests requeridos
8. ✅ Estimación de complejidad

**TOTAL:** ~150 páginas de especificaciones técnicas

---

# PARTE 1: CORE BUSINESS (4 módulos pendientes)

---

## MÓDULO 5: AIT-SALES

### 📍 Información Básica
```json
{
  "moduleId": "ait-sales",
  "moduleName": "AIT Sales",
  "category": "01-core-business",
  "port": 3008,
  "database": "sales_db",
  "icon": "💼",
  "color": "#9C27B0",
  "priority": "critical"
}
```

### 🎯 Descripción Completa
Sistema de gestión de ventas con IA que incluye:
- Pipeline de ventas con stages personalizables
- Oportunidades de negocio con scoring ML
- Cotizaciones inteligentes
- Forecasting de ventas con modelos predictivos
- Gestión de territorios y zonas
- Comisiones automáticas
- Workflow de aprobaciones
- Integración total con CRM

### 📦 Dependencias
```typescript
{
  required: [
    'ait-crm',              // Clientes y contactos
    'ait-quotes',           // Cotizaciones
    'ait-accountant',       // Contabilidad
    'ait-billing'           // Facturación
  ],
  optional: [
    'ait-marketing',        // Campañas
    'ait-analytics'         // Reporting
  ]
}
```

### 🗄️ Schema Prisma COMPLETO

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// CORE MODELS
// ==========================================

model Opportunity {
  id                String    @id @default(uuid())
  opportunityNumber String    @unique // OPP-2026-00001
  name              String    // "Seguro Auto - Acme Corp"
  description       String?   @db.Text

  // Relaciones
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id])
  contactId         String?
  contact           Contact?  @relation(fields: [contactId], references: [id])
  ownerId           String    // Usuario asignado
  owner             User      @relation(fields: [ownerId], references: [id])

  // Pipeline
  stageId           String
  stage             Stage     @relation(fields: [stageId], references: [id])
  pipelineId        String
  pipeline          Pipeline  @relation(fields: [pipelineId], references: [id])

  // Valores
  estimatedValue    Decimal   @db.Decimal(12, 2)
  probability       Float     @default(0.5) // 0-1
  expectedCloseDate DateTime
  actualCloseDate   DateTime?

  // Scoring ML
  aiScore           Float?    // 0-1 calculado por IA
  aiRecommendation  String?   // "HIGH_PRIORITY", "MEDIUM", "LOW"
  aiReasoning       String?   @db.Text

  // Estado
  status            OpportunityStatus @default(OPEN)
  lostReason        String?
  wonDate           DateTime?

  // Producto/Servicio
  productType       String    // "AUTO_INSURANCE", "HOME_INSURANCE", etc.
  productDetails    Json?

  // Seguimiento
  lastActivityDate  DateTime?
  nextFollowUpDate  DateTime?

  // Comisiones
  commissionRate    Decimal?  @db.Decimal(5, 2) // 2.50%
  commissionAmount  Decimal?  @db.Decimal(12, 2)

  // Relaciones
  activities        Activity[]
  quotes            Quote[]
  tasks             Task[]
  notes             Note[]
  documents         Document[]

  // Auditoría
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  deletedAt         DateTime?
  companyId         String
  tenantId          String

  @@index([customerId])
  @@index([ownerId])
  @@index([stageId])
  @@index([status])
  @@index([expectedCloseDate])
  @@index([createdAt])
}

enum OpportunityStatus {
  OPEN
  IN_PROGRESS
  WON
  LOST
  ON_HOLD
  CANCELLED
}

model Pipeline {
  id            String    @id @default(uuid())
  name          String    // "Ventas Seguros Auto"
  description   String?
  isDefault     Boolean   @default(false)
  isActive      Boolean   @default(true)

  stages        Stage[]
  opportunities Opportunity[]

  createdAt     DateTime  @default(now())
  companyId     String
  tenantId      String

  @@index([companyId])
}

model Stage {
  id              String    @id @default(uuid())
  name            String    // "Prospección", "Cotización", "Negociación", "Cierre"
  description     String?
  order           Int       // 1, 2, 3, 4
  probability     Float     // Probabilidad por defecto de esta etapa
  color           String?   // #4CAF50

  pipelineId      String
  pipeline        Pipeline  @relation(fields: [pipelineId], references: [id])

  isWon           Boolean   @default(false)
  isLost          Boolean   @default(false)

  opportunities   Opportunity[]

  createdAt       DateTime  @default(now())

  @@index([pipelineId, order])
}

model Activity {
  id              String    @id @default(uuid())
  type            ActivityType // CALL, EMAIL, MEETING, TASK, NOTE
  subject         String
  description     String?   @db.Text

  opportunityId   String?
  opportunity     Opportunity? @relation(fields: [opportunityId], references: [id])
  customerId      String?
  customer        Customer? @relation(fields: [customerId], references: [id])

  ownerId         String
  owner           User      @relation(fields: [ownerId], references: [id])

  scheduledAt     DateTime?
  completedAt     DateTime?
  duration        Int?      // minutos

  status          ActivityStatus @default(PENDING)
  outcome         String?   // "CONNECTED", "LEFT_VOICEMAIL", etc.

  createdAt       DateTime  @default(now())
  createdBy       String
  companyId       String
  tenantId        String

  @@index([opportunityId])
  @@index([customerId])
  @@index([ownerId])
  @@index([scheduledAt])
}

enum ActivityType {
  CALL
  EMAIL
  MEETING
  TASK
  NOTE
  SMS
  WHATSAPP
}

enum ActivityStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Task {
  id              String    @id @default(uuid())
  title           String
  description     String?   @db.Text

  opportunityId   String?
  opportunity     Opportunity? @relation(fields: [opportunityId], references: [id])

  assignedToId    String
  assignedTo      User      @relation(fields: [assignedToId], references: [id])

  dueDate         DateTime
  completedAt     DateTime?

  priority        TaskPriority @default(MEDIUM)
  status          TaskStatus @default(TODO)

  createdAt       DateTime  @default(now())
  createdBy       String

  @@index([opportunityId])
  @@index([assignedToId])
  @@index([dueDate])
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
  CANCELLED
}

model Forecast {
  id              String    @id @default(uuid())
  name            String    // "Q1 2026 Forecast"
  period          String    // "2026-Q1"
  startDate       DateTime
  endDate         DateTime

  ownerId         String
  owner           User      @relation(fields: [ownerId], references: [id])

  // Valores
  pipelineValue   Decimal   @db.Decimal(12, 2)
  bestCase        Decimal   @db.Decimal(12, 2)
  committed       Decimal   @db.Decimal(12, 2)
  closed          Decimal   @db.Decimal(12, 2)

  // ML Prediction
  aiPrediction    Decimal?  @db.Decimal(12, 2)
  aiConfidence    Float?    // 0-1

  createdAt       DateTime  @default(now())
  companyId       String
  tenantId        String

  @@index([period])
  @@index([ownerId])
}

model Commission {
  id              String    @id @default(uuid())

  opportunityId   String
  opportunity     Opportunity @relation(fields: [opportunityId], references: [id])

  salesRepId      String
  salesRep        User      @relation(fields: [salesRepId], references: [id])

  amount          Decimal   @db.Decimal(12, 2)
  rate            Decimal   @db.Decimal(5, 2)

  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?

  createdAt       DateTime  @default(now())
  companyId       String

  @@index([opportunityId])
  @@index([salesRepId])
  @@index([status])
}

enum CommissionStatus {
  PENDING
  APPROVED
  PAID
  CANCELLED
}

model Territory {
  id              String    @id @default(uuid())
  name            String    // "Madrid Centro"
  description     String?
  code            String    @unique // "MAD-CENTRO"

  type            TerritoryType // GEOGRAPHIC, INDUSTRY, ACCOUNT

  // Geographic
  postalCodes     String[]  // ["28001", "28002", "28003"]
  cities          String[]
  regions         String[]

  // Account-based
  accountIds      String[]

  ownerId         String
  owner           User      @relation(fields: [ownerId], references: [id])

  isActive        Boolean   @default(true)

  createdAt       DateTime  @default(now())
  companyId       String
  tenantId        String

  @@index([code])
  @@index([ownerId])
}

enum TerritoryType {
  GEOGRAPHIC
  INDUSTRY
  ACCOUNT
  HYBRID
}

// ==========================================
// SUPPORTING MODELS
// ==========================================

model Quote {
  id              String    @id @default(uuid())
  quoteNumber     String    @unique

  opportunityId   String
  opportunity     Opportunity @relation(fields: [opportunityId], references: [id])

  total           Decimal   @db.Decimal(12, 2)
  status          QuoteStatus @default(DRAFT)

  validUntil      DateTime
  sentAt          DateTime?
  acceptedAt      DateTime?

  createdAt       DateTime  @default(now())

  @@index([opportunityId])
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

model Note {
  id              String    @id @default(uuid())
  content         String    @db.Text

  opportunityId   String
  opportunity     Opportunity @relation(fields: [opportunityId], references: [id])

  createdBy       String
  createdAt       DateTime  @default(now())

  @@index([opportunityId])
}

model Document {
  id              String    @id @default(uuid())
  name            String
  type            String
  url             String
  size            Int

  opportunityId   String
  opportunity     Opportunity @relation(fields: [opportunityId], references: [id])

  uploadedBy      String
  uploadedAt      DateTime  @default(now())

  @@index([opportunityId])
}

// ==========================================
// RELATIONSHIPS TO OTHER MODULES
// ==========================================

// Customer from AIT-CRM
model Customer {
  id            String    @id
  name          String
  // ... otros campos del CRM

  opportunities Opportunity[]
  activities    Activity[]
}

model Contact {
  id            String    @id
  name          String
  // ... otros campos

  opportunities Opportunity[]
}

model User {
  id            String    @id
  name          String
  email         String

  opportunities Opportunity[]
  activities    Activity[]
  tasks         Task[]
  forecasts     Forecast[]
  commissions   Commission[]
  territories   Territory[]
}
```

### 🔌 API Endpoints COMPLETOS

```typescript
// ==========================================
// OPPORTUNITIES ENDPOINTS
// ==========================================

POST   /api/v1/sales/opportunities
GET    /api/v1/sales/opportunities
GET    /api/v1/sales/opportunities/:id
PUT    /api/v1/sales/opportunities/:id
DELETE /api/v1/sales/opportunities/:id

// Stage management
PUT    /api/v1/sales/opportunities/:id/stage
POST   /api/v1/sales/opportunities/:id/convert-to-policy

// AI features
POST   /api/v1/sales/opportunities/:id/score
GET    /api/v1/sales/opportunities/:id/recommendations

// Activities
POST   /api/v1/sales/opportunities/:id/activities
GET    /api/v1/sales/opportunities/:id/activities

// ==========================================
// PIPELINE ENDPOINTS
// ==========================================

POST   /api/v1/sales/pipelines
GET    /api/v1/sales/pipelines
GET    /api/v1/sales/pipelines/:id
PUT    /api/v1/sales/pipelines/:id
DELETE /api/v1/sales/pipelines/:id

// Stages
POST   /api/v1/sales/pipelines/:id/stages
PUT    /api/v1/sales/pipelines/:id/stages/:stageId
DELETE /api/v1/sales/pipelines/:id/stages/:stageId

// Analytics
GET    /api/v1/sales/pipelines/:id/analytics
GET    /api/v1/sales/pipelines/:id/conversion-rates

// ==========================================
// ACTIVITIES ENDPOINTS
// ==========================================

POST   /api/v1/sales/activities
GET    /api/v1/sales/activities
GET    /api/v1/sales/activities/:id
PUT    /api/v1/sales/activities/:id
DELETE /api/v1/sales/activities/:id

// Bulk operations
POST   /api/v1/sales/activities/batch
PUT    /api/v1/sales/activities/:id/complete

// ==========================================
// FORECASTING ENDPOINTS
// ==========================================

POST   /api/v1/sales/forecasts
GET    /api/v1/sales/forecasts
GET    /api/v1/sales/forecasts/:id

// AI predictions
POST   /api/v1/sales/forecasts/:id/predict
GET    /api/v1/sales/forecasts/:id/accuracy

// ==========================================
// COMMISSIONS ENDPOINTS
// ==========================================

GET    /api/v1/sales/commissions
GET    /api/v1/sales/commissions/:id
POST   /api/v1/sales/commissions/calculate
PUT    /api/v1/sales/commissions/:id/approve
POST   /api/v1/sales/commissions/:id/pay

// Reports
GET    /api/v1/sales/commissions/report/:period

// ==========================================
// TERRITORIES ENDPOINTS
// ==========================================

POST   /api/v1/sales/territories
GET    /api/v1/sales/territories
GET    /api/v1/sales/territories/:id
PUT    /api/v1/sales/territories/:id
DELETE /api/v1/sales/territories/:id

// Assignment
POST   /api/v1/sales/territories/:id/assign
GET    /api/v1/sales/territories/:id/opportunities

// ==========================================
// ANALYTICS & REPORTING
// ==========================================

GET    /api/v1/sales/dashboard
GET    /api/v1/sales/reports/conversion-funnel
GET    /api/v1/sales/reports/win-loss-analysis
GET    /api/v1/sales/reports/sales-velocity
GET    /api/v1/sales/reports/rep-performance
GET    /api/v1/sales/reports/forecast-accuracy
```

### 📝 DTOs Principales

```typescript
// ==========================================
// CREATE OPPORTUNITY DTO
// ==========================================

export class CreateOpportunityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsUUID()
  stageId: string;

  @IsNumber()
  @Min(0)
  estimatedValue: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  probability: number;

  @IsDateString()
  expectedCloseDate: string;

  @IsString()
  productType: string;

  @IsOptional()
  @IsObject()
  productDetails?: any;
}

// ==========================================
// UPDATE STAGE DTO
// ==========================================

export class UpdateStageDto {
  @IsUUID()
  stageId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

// ==========================================
// CREATE ACTIVITY DTO
// ==========================================

export class CreateActivityDto {
  @IsEnum(ActivityType)
  type: ActivityType;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

// ==========================================
// FORECAST PREDICTION DTO
// ==========================================

export class ForecastPredictionDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsArray()
  @IsUUID({}, { each: true })
  opportunityIds?: string[];

  @IsOptional()
  @IsObject()
  filters?: {
    stageIds?: string[];
    ownerIds?: string[];
    minProbability?: number;
  };
}
```

### 🔧 Servicios Principales

```typescript
// ==========================================
// OPPORTUNITY SERVICE
// ==========================================

@Injectable()
export class OpportunityService {
  constructor(
    private prisma: PrismaService,
    private aiScoringService: AIScoringService,
    private activityService: ActivityService,
    private notificationService: NotificationService,
  ) {}

  async create(dto: CreateOpportunityDto, userId: string) {
    // 1. Validar cliente existe
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // 2. Generar número de oportunidad
    const opportunityNumber = await this.generateOpportunityNumber();

    // 3. Obtener scoring IA
    const aiScore = await this.aiScoringService.scoreOpportunity({
      customerProfile: customer,
      productType: dto.productType,
      estimatedValue: dto.estimatedValue,
      probability: dto.probability,
    });

    // 4. Crear oportunidad
    const opportunity = await this.prisma.opportunity.create({
      data: {
        ...dto,
        opportunityNumber,
        ownerId: userId,
        aiScore: aiScore.score,
        aiRecommendation: aiScore.recommendation,
        aiReasoning: aiScore.reasoning,
        status: OpportunityStatus.OPEN,
        createdBy: userId,
        updatedBy: userId,
        companyId: 'default',
        tenantId: 'default',
      },
      include: {
        customer: true,
        stage: true,
        pipeline: true,
      }
    });

    // 5. Crear actividad inicial
    await this.activityService.create({
      type: ActivityType.NOTE,
      subject: 'Oportunidad creada',
      description: `Oportunidad ${opportunity.name} creada`,
      opportunityId: opportunity.id,
      ownerId: userId,
    });

    // 6. Notificar al equipo
    await this.notificationService.send({
      type: 'OPPORTUNITY_CREATED',
      recipientIds: [userId],
      data: opportunity,
    });

    return opportunity;
  }

  async updateStage(
    opportunityId: string,
    stageId: string,
    reason?: string,
  ) {
    const opportunity = await this.findOne(opportunityId);

    // Obtener stage anterior y nuevo
    const oldStage = await this.prisma.stage.findUnique({
      where: { id: opportunity.stageId }
    });

    const newStage = await this.prisma.stage.findUnique({
      where: { id: stageId }
    });

    // Actualizar probabilidad automáticamente
    const updatedProbability = newStage.probability;

    // Actualizar oportunidad
    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        stageId,
        probability: updatedProbability,
        ...(newStage.isWon && { status: OpportunityStatus.WON, wonDate: new Date() }),
        ...(newStage.isLost && { status: OpportunityStatus.LOST, lostReason: reason }),
      },
      include: {
        stage: true,
        pipeline: true,
      }
    });

    // Registrar cambio en actividades
    await this.activityService.create({
      type: ActivityType.NOTE,
      subject: 'Cambio de etapa',
      description: `Movida de "${oldStage.name}" a "${newStage.name}"${reason ? `: ${reason}` : ''}`,
      opportunityId,
      ownerId: opportunity.ownerId,
    });

    // Si ganada → Crear póliza automáticamente
    if (newStage.isWon) {
      await this.convertToPolicy(opportunityId);
    }

    return updated;
  }

  async convertToPolicy(opportunityId: string) {
    const opportunity = await this.findOne(opportunityId);

    // Llamar a AIT-POLICIES para crear póliza
    const policy = await this.httpService.post('http://ait-policies:3011/api/v1/policies', {
      customerId: opportunity.customerId,
      productType: opportunity.productType,
      premium: opportunity.estimatedValue,
      startDate: new Date(),
      // ... más campos
    }).toPromise();

    // Actualizar oportunidad con referencia a póliza
    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        productDetails: {
          ...opportunity.productDetails,
          policyId: policy.data.id,
        }
      }
    });

    return policy.data;
  }

  private async generateOpportunityNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.opportunity.count({
      where: {
        opportunityNumber: {
          startsWith: `OPP-${year}-`
        }
      }
    });

    return `OPP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}

// ==========================================
// AI SCORING SERVICE
// ==========================================

@Injectable()
export class AIScoringService {
  constructor(
    private readonly anthropicService: AnthropicService,
  ) {}

  async scoreOpportunity(data: {
    customerProfile: any;
    productType: string;
    estimatedValue: number;
    probability: number;
  }): Promise<{
    score: number;
    recommendation: string;
    reasoning: string;
  }> {
    // Usar Claude Sonnet 4.5 para scoring
    const prompt = `
      Analiza esta oportunidad de venta y proporciona un score de 0-1:

      Cliente:
      - Nombre: ${data.customerProfile.name}
      - Tipo: ${data.customerProfile.type}
      - Historial: ${data.customerProfile.purchaseHistory?.length || 0} compras previas
      - Valor total histórico: €${data.customerProfile.totalValue || 0}

      Oportunidad:
      - Producto: ${data.productType}
      - Valor estimado: €${data.estimatedValue}
      - Probabilidad actual: ${data.probability * 100}%

      Proporciona:
      1. Score de 0-1 (probabilidad real de cierre)
      2. Recomendación: HIGH_PRIORITY, MEDIUM, LOW
      3. Razonamiento breve

      Formato JSON:
      {
        "score": 0.85,
        "recommendation": "HIGH_PRIORITY",
        "reasoning": "Cliente recurrente con historial positivo..."
      }
    `;

    const response = await this.anthropicService.complete({
      prompt,
      model: 'claude-sonnet-4.5',
      maxTokens: 500,
    });

    return JSON.parse(response.completion);
  }
}

// ==========================================
// FORECAST SERVICE
// ==========================================

@Injectable()
export class ForecastService {
  constructor(
    private prisma: PrismaService,
    private mlService: MLPredictionService,
  ) {}

  async predict(dto: ForecastPredictionDto) {
    // 1. Obtener oportunidades del periodo
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        expectedCloseDate: {
          gte: new Date(dto.startDate),
          lte: new Date(dto.endDate),
        },
        status: OpportunityStatus.OPEN,
        ...(dto.filters?.stageIds && {
          stageId: { in: dto.filters.stageIds }
        }),
        ...(dto.filters?.minProbability && {
          probability: { gte: dto.filters.minProbability }
        }),
      },
      include: {
        stage: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        }
      }
    });

    // 2. Calcular forecasts por categoría
    const pipelineValue = opportunities.reduce((sum, opp) =>
      sum + Number(opp.estimatedValue), 0
    );

    const committed = opportunities
      .filter(opp => opp.probability >= 0.8)
      .reduce((sum, opp) => sum + Number(opp.estimatedValue), 0);

    const bestCase = opportunities
      .filter(opp => opp.probability >= 0.5)
      .reduce((sum, opp) => sum + Number(opp.estimatedValue), 0);

    // 3. Predicción ML
    const aiPrediction = await this.mlService.predictRevenue({
      opportunities: opportunities.map(opp => ({
        value: Number(opp.estimatedValue),
        probability: opp.probability,
        daysToClose: this.calculateDaysToClose(opp.expectedCloseDate),
        stage: opp.stage.name,
        activityCount: opp.activities.length,
        lastActivityDays: this.calculateDaysSinceLastActivity(opp.lastActivityDate),
      })),
      historicalData: await this.getHistoricalData(),
    });

    // 4. Crear forecast
    const forecast = await this.prisma.forecast.create({
      data: {
        name: `Forecast ${dto.startDate} - ${dto.endDate}`,
        period: this.calculatePeriod(dto.startDate),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        ownerId: 'system',
        pipelineValue,
        bestCase,
        committed,
        closed: 0,
        aiPrediction: aiPrediction.predictedRevenue,
        aiConfidence: aiPrediction.confidence,
        companyId: 'default',
        tenantId: 'default',
      }
    });

    return {
      ...forecast,
      breakdown: {
        totalOpportunities: opportunities.length,
        averageValue: pipelineValue / opportunities.length,
        byStage: this.groupByStage(opportunities),
        topOpportunities: opportunities
          .sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue))
          .slice(0, 10),
      }
    };
  }

  private calculateDaysToClose(date: DateTime): number {
    return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysSinceLastActivity(date?: DateTime): number {
    if (!date) return 999;
    return Math.ceil((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getHistoricalData() {
    // Obtener datos históricos de los últimos 12 meses
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    return await this.prisma.opportunity.findMany({
      where: {
        status: OpportunityStatus.WON,
        wonDate: {
          gte: twelveMonthsAgo,
        }
      },
      select: {
        estimatedValue: true,
        actualCloseDate: true,
        probability: true,
        stage: true,
      }
    });
  }
}
```

### 🔄 Workflows de Integración

```typescript
// ==========================================
// WORKFLOW 1: Nueva Oportunidad desde Lead
// ==========================================

@OnEvent('lead.qualified')
async handleLeadQualified(event: LeadQualifiedEvent) {
  // 1. Crear oportunidad automáticamente
  const opportunity = await this.opportunityService.create({
    name: `Oportunidad - ${event.lead.company}`,
    customerId: event.lead.customerId,
    contactId: event.lead.contactId,
    stageId: await this.getFirstStageId(),
    estimatedValue: event.lead.estimatedBudget || 5000,
    probability: 0.3,
    expectedCloseDate: this.addDays(new Date(), 30),
    productType: event.lead.productInterest,
  }, 'system');

  // 2. Asignar a comercial según territorio
  const assignedRep = await this.territoryService.findRepForCustomer(
    event.lead.customerId
  );

  await this.opportunityService.assign(opportunity.id, assignedRep.id);

  // 3. Crear tarea de seguimiento
  await this.taskService.create({
    title: `Primera llamada - ${event.lead.company}`,
    opportunityId: opportunity.id,
    assignedToId: assignedRep.id,
    dueDate: this.addHours(new Date(), 24),
    priority: TaskPriority.HIGH,
  });

  // 4. Enviar notificación
  await this.notificationService.send({
    type: 'NEW_OPPORTUNITY',
    recipientIds: [assignedRep.id],
    data: opportunity,
  });
}

// ==========================================
// WORKFLOW 2: Oportunidad Ganada → Póliza
// ==========================================

@OnEvent('opportunity.won')
async handleOpportunityWon(event: OpportunityWonEvent) {
  const opportunity = event.opportunity;

  // 1. Crear póliza en AIT-POLICIES
  const policy = await this.httpService.post(
    'http://ait-policies:3011/api/v1/policies',
    {
      customerId: opportunity.customerId,
      productType: opportunity.productType,
      premium: opportunity.estimatedValue,
      startDate: new Date(),
      duration: 12,
      paymentFrequency: 'ANNUAL',
      metadata: {
        opportunityId: opportunity.id,
        opportunityNumber: opportunity.opportunityNumber,
      }
    }
  ).toPromise();

  // 2. Crear factura en AIT-BILLING
  await this.httpService.post(
    'http://ait-billing:3006/api/v1/billing/invoices',
    {
      customerId: opportunity.customerId,
      policyId: policy.data.id,
      amount: opportunity.estimatedValue,
      dueDate: this.addDays(new Date(), 30),
    }
  ).toPromise();

  // 3. Calcular comisión
  await this.commissionService.calculate({
    opportunityId: opportunity.id,
    salesRepId: opportunity.ownerId,
    amount: opportunity.estimatedValue,
  });

  // 4. Actualizar forecast
  await this.forecastService.recordClosedDeal({
    opportunityId: opportunity.id,
    actualValue: opportunity.estimatedValue,
    closeDate: new Date(),
  });

  // 5. Notificar
  await this.notificationService.send({
    type: 'DEAL_WON',
    recipientIds: [opportunity.ownerId],
    data: { opportunity, policy: policy.data },
  });
}

// ==========================================
// WORKFLOW 3: Recordatorio Automático
// ==========================================

@Cron('0 9 * * *') // Cada día a las 9 AM
async checkStaleOpportunities() {
  const sevenDaysAgo = this.addDays(new Date(), -7);

  // Buscar oportunidades sin actividad en 7 días
  const staleOpportunities = await this.prisma.opportunity.findMany({
    where: {
      status: OpportunityStatus.OPEN,
      lastActivityDate: {
        lte: sevenDaysAgo,
      },
      OR: [
        { nextFollowUpDate: null },
        { nextFollowUpDate: { lte: new Date() } },
      ]
    },
    include: {
      owner: true,
      customer: true,
    }
  });

  for (const opportunity of staleOpportunities) {
    // Crear tarea automática
    await this.taskService.create({
      title: `Seguimiento pendiente - ${opportunity.name}`,
      description: `Esta oportunidad no ha tenido actividad en ${this.calculateDaysSince(opportunity.lastActivityDate)} días`,
      opportunityId: opportunity.id,
      assignedToId: opportunity.ownerId,
      dueDate: new Date(),
      priority: TaskPriority.HIGH,
    });

    // Notificar al comercial
    await this.notificationService.send({
      type: 'STALE_OPPORTUNITY',
      recipientIds: [opportunity.ownerId],
      data: opportunity,
    });
  }
}
```

### 📊 Analytics y Métricas

```typescript
// ==========================================
// DASHBOARD SERVICE
// ==========================================

@Injectable()
export class SalesDashboardService {
  async getDashboard(userId: string, filters: any) {
    return {
      overview: await this.getOverview(userId, filters),
      pipeline: await this.getPipelineMetrics(userId, filters),
      activities: await this.getActivityMetrics(userId, filters),
      forecast: await this.getForecastMetrics(userId, filters),
      performance: await this.getPerformanceMetrics(userId, filters),
    };
  }

  private async getOverview(userId: string, filters: any) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        ownerId: userId,
        status: OpportunityStatus.OPEN,
      }
    });

    const totalValue = opportunities.reduce((sum, opp) =>
      sum + Number(opp.estimatedValue), 0
    );

    const weightedValue = opportunities.reduce((sum, opp) =>
      sum + (Number(opp.estimatedValue) * opp.probability), 0
    );

    return {
      totalOpportunities: opportunities.length,
      totalValue,
      weightedValue,
      averageValue: totalValue / opportunities.length,
      avgProbability: opportunities.reduce((sum, opp) =>
        sum + opp.probability, 0
      ) / opportunities.length,
    };
  }

  private async getPipelineMetrics(userId: string, filters: any) {
    // Agrupar por stage
    const byStage = await this.prisma.opportunity.groupBy({
      by: ['stageId'],
      where: {
        ownerId: userId,
        status: OpportunityStatus.OPEN,
      },
      _count: true,
      _sum: {
        estimatedValue: true,
      }
    });

    // Enriquecer con información de stages
    const stages = await this.prisma.stage.findMany({
      where: {
        id: { in: byStage.map(s => s.stageId) }
      }
    });

    return byStage.map(stage => {
      const stageInfo = stages.find(s => s.id === stage.stageId);
      return {
        stageId: stage.stageId,
        stageName: stageInfo?.name,
        count: stage._count,
        value: Number(stage._sum.estimatedValue || 0),
      };
    });
  }

  private async getActivityMetrics(userId: string, filters: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activities = await this.prisma.activity.groupBy({
      by: ['type'],
      where: {
        ownerId: userId,
        createdAt: {
          gte: today,
        }
      },
      _count: true,
    });

    return activities.map(activity => ({
      type: activity.type,
      count: activity._count,
    }));
  }

  // ... más métricas
}
```

### 🧪 Tests Requeridos

```typescript
// ==========================================
// UNIT TESTS
// ==========================================

describe('OpportunityService', () => {
  let service: OpportunityService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OpportunityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OpportunityService>(OpportunityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create opportunity with AI scoring', async () => {
      const dto = {
        name: 'Test Opportunity',
        customerId: 'customer-123',
        stageId: 'stage-123',
        estimatedValue: 5000,
        probability: 0.5,
        expectedCloseDate: '2026-03-01',
        productType: 'AUTO_INSURANCE',
      };

      const result = await service.create(dto, 'user-123');

      expect(result).toHaveProperty('id');
      expect(result.aiScore).toBeGreaterThan(0);
      expect(result.aiScore).toBeLessThanOrEqual(1);
    });

    it('should throw NotFoundException if customer not found', async () => {
      const dto = {
        name: 'Test',
        customerId: 'invalid-customer',
        // ... resto
      };

      await expect(service.create(dto, 'user-123'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateStage', () => {
    it('should update stage and probability', async () => {
      const result = await service.updateStage(
        'opp-123',
        'new-stage-123'
      );

      expect(result.stageId).toBe('new-stage-123');
    });

    it('should mark as won when moved to won stage', async () => {
      const result = await service.updateStage(
        'opp-123',
        'won-stage-123'
      );

      expect(result.status).toBe(OpportunityStatus.WON);
      expect(result.wonDate).toBeDefined();
    });

    it('should create policy when won', async () => {
      const spy = jest.spyOn(service, 'convertToPolicy');

      await service.updateStage('opp-123', 'won-stage-123');

      expect(spy).toHaveBeenCalledWith('opp-123');
    });
  });
});

// ==========================================
// INTEGRATION TESTS
// ==========================================

describe('Sales Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AitSalesModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/sales/opportunities', () => {
    it('should create opportunity', () => {
      return request(app.getHttpServer())
        .post('/api/v1/sales/opportunities')
        .send({
          name: 'Test Opportunity',
          customerId: 'customer-123',
          // ... resto
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.opportunityNumber).toMatch(/OPP-\d{4}-\d{5}/);
        });
    });
  });

  describe('PUT /api/v1/sales/opportunities/:id/stage', () => {
    it('should update stage', () => {
      return request(app.getHttpServer())
        .put('/api/v1/sales/opportunities/opp-123/stage')
        .send({ stageId: 'stage-456' })
        .expect(200);
    });
  });
});

// ==========================================
// E2E TESTS
// ==========================================

describe('Sales Flow E2E', () => {
  it('should complete full sales cycle', async () => {
    // 1. Create opportunity
    const opportunity = await createOpportunity();

    // 2. Add activities
    await addActivity(opportunity.id, { type: 'CALL' });
    await addActivity(opportunity.id, { type: 'MEETING' });

    // 3. Move through stages
    await moveToStage(opportunity.id, 'QUOTATION');
    await moveToStage(opportunity.id, 'NEGOTIATION');
    await moveToStage(opportunity.id, 'WON');

    // 4. Verify policy created
    const policy = await getPolicy(opportunity.customerId);
    expect(policy).toBeDefined();

    // 5. Verify invoice created
    const invoice = await getInvoice(opportunity.customerId);
    expect(invoice).toBeDefined();

    // 6. Verify commission calculated
    const commission = await getCommission(opportunity.id);
    expect(commission.amount).toBeGreaterThan(0);
  });
});
```

### 📈 Complejidad Estimada

```yaml
Complejidad Total: ALTA
Tiempo Estimado: 40 horas
Líneas de Código: ~8,000

Breakdown:
  - Models Prisma: 3 horas
  - Services: 12 horas
  - Controllers: 5 horas
  - DTOs: 3 horas
  - AI Integration: 6 horas
  - Workflows: 5 horas
  - Tests: 6 horas

Dependencias Críticas:
  - AIT-CRM (debe estar antes)
  - AIT-QUOTES (puede ir en paralelo)
  - AIT-POLICIES (integración al final)

Riesgos:
  - Complejidad del scoring ML
  - Performance con muchas oportunidades
  - Sincronización con CRM
```

---

## MÓDULO 6: AIT-CRM

### 📍 Información Básica
```json
{
  "moduleId": "ait-crm",
  "moduleName": "AIT CRM",
  "category": "01-core-business",
  "port": 3009,
  "database": "crm_db",
  "icon": "👥",
  "color": "#2196F3",
  "priority": "critical"
}
```

### 🎯 Descripción Completa
CRM (Customer Relationship Management) completo con IA que incluye:
- Gestión 360° de clientes (personas y empresas)
- Segmentación inteligente con ML
- Scoring de clientes (valor, riesgo, churn)
- Historial completo de interacciones
- Gestión de leads con nurturing automático
- Customer journey mapping
- NPS y satisfacción del cliente
- Integración con todos los módulos

### 📦 Dependencias
```typescript
{
  required: [
    'ait-authenticator',    // Usuarios y permisos
    'ait-datahub'          // Data warehouse
  ],
  optional: [
    'ait-marketing',        // Campañas
    'ait-sales',           // Ventas
    'ait-support',         // Tickets
    'ait-analytics'        // Reporting
  ]
}
```

### 🗄️ Schema Prisma COMPLETO

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// CUSTOMER MODELS
// ==========================================

model Customer {
  id                String    @id @default(uuid())
  customerNumber    String    @unique // CLI-2026-00001
  customerType      CustomerType  // PERSON, COMPANY
  status            CustomerStatus  // LEAD, PROSPECT, ACTIVE, INACTIVE, CHURNED

  // Basic Info
  firstName         String?
  lastName          String?
  companyName       String?
  displayName       String    // Computed: firstName + lastName OR companyName
  taxId             String?   @unique // NIF/CIF
  email             String?
  phone             String?
  mobile            String?
  website           String?

  // Address
  address           String?
  city              String?
  state             String?
  postalCode        String?
  country           String    @default("ES")

  // Segmentation
  segmentId         String?
  segment           Segment?  @relation(fields: [segmentId], references: [id])
  industry          String?
  companySize       CompanySize?  // MICRO, SMALL, MEDIUM, LARGE

  // Scoring & Analytics
  scoreValue        Float     @default(0)  // 0-100 customer value score
  scoreRisk         Float     @default(0)  // 0-100 risk score
  scoreChurn        Float     @default(0)  // 0-100 churn probability
  lifetimeValue     Decimal   @default(0)
  totalRevenue      Decimal   @default(0)
  averageOrderValue Decimal   @default(0)

  // Dates
  firstContactDate  DateTime?
  lastContactDate   DateTime?
  lastPurchaseDate  DateTime?
  nextFollowUpDate  DateTime?

  // Owner
  ownerId           String?
  owner             User?     @relation(fields: [ownerId], references: [id])

  // Relations
  contacts          Contact[]
  interactions      Interaction[]
  policies          Policy[]
  opportunities     Opportunity[]
  invoices          Invoice[]
  tickets           Ticket[]
  documents         Document[]
  notes             Note[]
  tags              CustomerTag[]

  // Audit fields
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  deletedAt         DateTime?
  deletedBy         String?
  companyId         String
  tenantId          String

  @@index([customerNumber])
  @@index([email])
  @@index([taxId])
  @@index([segmentId])
  @@index([ownerId])
  @@index([status])
  @@index([companyId, tenantId])
}

model Contact {
  id                String    @id @default(uuid())
  contactNumber     String    @unique // CON-2026-00001

  // Basic Info
  firstName         String
  lastName          String
  fullName          String    // Computed
  email             String
  phone             String?
  mobile            String?
  position          String?   // "CEO", "CFO", etc.
  department        String?

  // Customer relation
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  isPrimary         Boolean   @default(false)

  // Social
  linkedinUrl       String?
  twitterHandle     String?

  // Preferences
  preferredChannel  ContactChannel  // EMAIL, PHONE, WHATSAPP, etc.
  acceptsMarketing  Boolean   @default(true)

  // Relations
  interactions      Interaction[]
  opportunities     Opportunity[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([customerId])
  @@index([email])
  @@index([companyId, tenantId])
}

model Segment {
  id                String    @id @default(uuid())
  segmentNumber     String    @unique // SEG-2026-00001
  name              String
  description       String?   @db.Text
  color             String?   @default("#2196F3")

  // Segmentation rules (JSON)
  rules             Json      // { "industry": ["insurance"], "revenue": { "gt": 100000 } }
  isDynamic         Boolean   @default(false)  // Auto-update members

  // Stats
  memberCount       Int       @default(0)
  totalRevenue      Decimal   @default(0)
  averageLTV        Decimal   @default(0)

  // Relations
  customers         Customer[]
  campaigns         Campaign[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([companyId, tenantId])
}

// ==========================================
// INTERACTION MODELS
// ==========================================

model Interaction {
  id                String    @id @default(uuid())
  interactionNumber String    @unique // INT-2026-00001
  type              InteractionType  // CALL, EMAIL, MEETING, VISIT, WHATSAPP, etc.
  direction         Direction  // INBOUND, OUTBOUND

  // Dates
  interactionDate   DateTime  @default(now())
  duration          Int?      // minutes

  // Content
  subject           String?
  description       String?   @db.Text
  outcome           String?   // "Interested", "Not interested", "Follow up needed"

  // Relations
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  contactId         String?
  contact           Contact?  @relation(fields: [contactId], references: [id])

  // Owner
  userId            String
  user              User      @relation(fields: [userId], references: [id])

  // Campaign (if from marketing)
  campaignId        String?
  campaign          Campaign? @relation(fields: [campaignId], references: [id])

  // Attachments
  attachments       Json?     // [{ "name": "doc.pdf", "url": "..." }]

  // Sentiment Analysis (AI)
  sentiment         Sentiment?  // POSITIVE, NEUTRAL, NEGATIVE
  sentimentScore    Float?    // -1 to 1

  // Relations
  tasks             Task[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([customerId])
  @@index([contactId])
  @@index([userId])
  @@index([interactionDate])
  @@index([type])
  @@index([companyId, tenantId])
}

// ==========================================
// LEAD MODELS
// ==========================================

model Lead {
  id                String    @id @default(uuid())
  leadNumber        String    @unique // LED-2026-00001
  status            LeadStatus  // NEW, CONTACTED, QUALIFIED, CONVERTED, LOST

  // Basic Info
  firstName         String?
  lastName          String?
  companyName       String?
  email             String
  phone             String?

  // Source
  source            LeadSource  // WEBSITE, REFERRAL, SOCIAL_MEDIA, ADVERTISING, etc.
  campaign          String?
  medium            String?

  // Qualification
  qualificationScore Float    @default(0)  // 0-100 ML score
  qualifiedAt       DateTime?
  qualifiedBy       String?

  // Assignment
  assignedTo        String?
  assignedAt        DateTime?

  // Conversion
  convertedToCustomerId String?
  convertedAt       DateTime?
  convertedBy       String?

  // Data
  interestedIn      String?   // "Auto Insurance", "Home Insurance"
  budget            Decimal?
  timeline          String?   // "Immediate", "1-3 months", "3-6 months"
  notes             String?   @db.Text

  // Relations
  activities        LeadActivity[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([email])
  @@index([status])
  @@index([source])
  @@index([assignedTo])
  @@index([companyId, tenantId])
}

model LeadActivity {
  id                String    @id @default(uuid())
  leadId            String
  lead              Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)

  type              String    // "email_sent", "call_made", "meeting_scheduled"
  description       String?   @db.Text

  userId            String?
  automatedBy       String?   // "nurturing_workflow_1"

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([leadId])
  @@index([createdAt])
}

// ==========================================
// CUSTOMER SATISFACTION
// ==========================================

model CustomerSatisfaction {
  id                String    @id @default(uuid())
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id])

  // NPS
  npsScore          Int?      // 0-10
  npsCategory       NPSCategory?  // DETRACTOR, PASSIVE, PROMOTER

  // CSAT
  csatScore         Int?      // 1-5 stars

  // CES (Customer Effort Score)
  cesScore          Int?      // 1-7

  // Feedback
  feedback          String?   @db.Text
  improvementAreas  Json?     // ["response_time", "pricing"]

  // Survey
  surveyId          String?
  surveyType        String?   // "post_purchase", "quarterly", "support_ticket"

  // Dates
  surveyDate        DateTime  @default(now())

  // Audit
  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([customerId])
  @@index([surveyDate])
  @@index([npsCategory])
}

// ==========================================
// TAGS & NOTES
// ==========================================

model CustomerTag {
  id                String    @id @default(uuid())
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  tag               String
  color             String?   @default("#757575")

  createdAt         DateTime  @default(now())
  createdBy         String
  companyId         String
  tenantId          String

  @@unique([customerId, tag])
  @@index([tag])
}

model Note {
  id                String    @id @default(uuid())
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  content           String    @db.Text
  isPinned          Boolean   @default(false)

  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([customerId])
  @@index([isPinned])
}

// ==========================================
// ENUMS
// ==========================================

enum CustomerType {
  PERSON
  COMPANY
}

enum CustomerStatus {
  LEAD
  PROSPECT
  ACTIVE
  INACTIVE
  CHURNED
}

enum CompanySize {
  MICRO      // 1-10 employees
  SMALL      // 11-50
  MEDIUM     // 51-250
  LARGE      // 251+
}

enum InteractionType {
  CALL
  EMAIL
  MEETING
  VISIT
  WHATSAPP
  SMS
  CHAT
  VIDEO_CALL
  SOCIAL_MEDIA
  OTHER
}

enum Direction {
  INBOUND
  OUTBOUND
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

enum ContactChannel {
  EMAIL
  PHONE
  WHATSAPP
  SMS
  CHAT
  ANY
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  LOST
}

enum LeadSource {
  WEBSITE
  REFERRAL
  SOCIAL_MEDIA
  ADVERTISING
  EVENT
  COLD_CALL
  PARTNER
  OTHER
}

enum NPSCategory {
  DETRACTOR   // 0-6
  PASSIVE     // 7-8
  PROMOTER    // 9-10
}
```

### 🔌 API Endpoints COMPLETOS

```typescript
// ==========================================
// CUSTOMERS
// ==========================================

POST   /api/v1/crm/customers
GET    /api/v1/crm/customers
GET    /api/v1/crm/customers/:id
PUT    /api/v1/crm/customers/:id
DELETE /api/v1/crm/customers/:id
PATCH  /api/v1/crm/customers/:id/assign      // Asignar a usuario
GET    /api/v1/crm/customers/:id/timeline    // Timeline completo
GET    /api/v1/crm/customers/:id/360         // Vista 360°

// ==========================================
// CONTACTS
// ==========================================

POST   /api/v1/crm/contacts
GET    /api/v1/crm/contacts
GET    /api/v1/crm/contacts/:id
PUT    /api/v1/crm/contacts/:id
DELETE /api/v1/crm/contacts/:id
PATCH  /api/v1/crm/contacts/:id/set-primary

// ==========================================
// SEGMENTS
// ==========================================

POST   /api/v1/crm/segments
GET    /api/v1/crm/segments
GET    /api/v1/crm/segments/:id
PUT    /api/v1/crm/segments/:id
DELETE /api/v1/crm/segments/:id
POST   /api/v1/crm/segments/:id/refresh      // Recalcular miembros
GET    /api/v1/crm/segments/:id/members      // Listar clientes

// ==========================================
// INTERACTIONS
// ==========================================

POST   /api/v1/crm/interactions
GET    /api/v1/crm/interactions
GET    /api/v1/crm/interactions/:id
PUT    /api/v1/crm/interactions/:id
DELETE /api/v1/crm/interactions/:id
POST   /api/v1/crm/interactions/:id/analyze-sentiment  // AI sentiment

// ==========================================
// LEADS
// ==========================================

POST   /api/v1/crm/leads
GET    /api/v1/crm/leads
GET    /api/v1/crm/leads/:id
PUT    /api/v1/crm/leads/:id
DELETE /api/v1/crm/leads/:id
POST   /api/v1/crm/leads/:id/qualify         // Calificar lead
POST   /api/v1/crm/leads/:id/convert         // Convertir a cliente
POST   /api/v1/crm/leads/:id/score           // AI scoring
PATCH  /api/v1/crm/leads/:id/assign          // Asignar a comercial

// ==========================================
// SATISFACTION
// ==========================================

POST   /api/v1/crm/satisfaction
GET    /api/v1/crm/satisfaction
GET    /api/v1/crm/satisfaction/nps-summary  // Resumen NPS
GET    /api/v1/crm/satisfaction/trends       // Tendencias

// ==========================================
// TAGS & NOTES
// ==========================================

POST   /api/v1/crm/customers/:id/tags
DELETE /api/v1/crm/customers/:id/tags/:tag
POST   /api/v1/crm/customers/:id/notes
GET    /api/v1/crm/customers/:id/notes
PUT    /api/v1/crm/notes/:id
DELETE /api/v1/crm/notes/:id

// ==========================================
// ANALYTICS
// ==========================================

GET    /api/v1/crm/analytics/overview        // Dashboard general
GET    /api/v1/crm/analytics/acquisition     // Adquisición clientes
GET    /api/v1/crm/analytics/retention       // Retención
GET    /api/v1/crm/analytics/churn           // Churn analysis
GET    /api/v1/crm/analytics/lifetime-value  // LTV
GET    /api/v1/crm/analytics/cohorts         // Cohort analysis
```

### 📝 DTOs Principales

```typescript
// ==========================================
// CREATE CUSTOMER DTO
// ==========================================

export class CreateCustomerDto {
  @IsEnum(CustomerType)
  customerType: CustomerType;

  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  companyName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+() -]+$/)
  phone?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @IsString()
  segmentId?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(CompanySize)
  companySize?: CompanySize;

  @IsOptional()
  @IsString()
  ownerId?: string;
}

// ==========================================
// CREATE INTERACTION DTO
// ==========================================

export class CreateInteractionDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  contactId?: string;

  @IsEnum(InteractionType)
  type: InteractionType;

  @IsEnum(Direction)
  direction: Direction;

  @IsOptional()
  @IsDateString()
  interactionDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

// ==========================================
// CREATE LEAD DTO
// ==========================================

export class CreateLeadDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+() -]+$/)
  phone?: string;

  @IsEnum(LeadSource)
  source: LeadSource;

  @IsOptional()
  @IsString()
  campaign?: string;

  @IsOptional()
  @IsString()
  interestedIn?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

// ==========================================
// CUSTOMER 360 RESPONSE DTO
// ==========================================

export class Customer360Dto {
  customer: CustomerDto;
  contacts: ContactDto[];
  recentInteractions: InteractionDto[];
  policies: PolicySummaryDto[];
  opportunities: OpportunitySummaryDto[];
  invoices: InvoiceSummaryDto[];
  tickets: TicketSummaryDto[];
  satisfaction: {
    npsScore: number | null;
    csatScore: number | null;
    lastSurveyDate: string | null;
  };
  analytics: {
    totalRevenue: number;
    lifetimeValue: number;
    averageOrderValue: number;
    daysSinceLastPurchase: number;
    churnProbability: number;
  };
  timeline: TimelineEventDto[];
}
```

### 💼 Servicios Principales

```typescript
// ==========================================
// CUSTOMER SERVICE
// ==========================================

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private scoringService: CustomerScoringService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateCustomerDto, userId: string): Promise<Customer> {
    // Generate customer number
    const customerNumber = await this.generateCustomerNumber();

    // Compute display name
    const displayName = dto.customerType === 'PERSON'
      ? `${dto.firstName} ${dto.lastName}`
      : dto.companyName;

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        customerNumber,
        displayName,
        ...dto,
        status: 'PROSPECT',
        firstContactDate: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Calculate initial scores (async)
    this.scoringService.scoreCustomer(customer.id).catch(console.error);

    // Emit event
    this.eventEmitter.emit('customer.created', { customerId: customer.id });

    return customer;
  }

  async get360View(customerId: string): Promise<Customer360Dto> {
    const [
      customer,
      contacts,
      interactions,
      policies,
      opportunities,
      invoices,
      tickets,
      satisfaction,
    ] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: customerId } }),
      this.prisma.contact.findMany({ where: { customerId }, take: 10 }),
      this.prisma.interaction.findMany({
        where: { customerId },
        orderBy: { interactionDate: 'desc' },
        take: 20,
      }),
      this.getPolicySummary(customerId),
      this.getOpportunitySummary(customerId),
      this.getInvoiceSummary(customerId),
      this.getTicketSummary(customerId),
      this.getLatestSatisfaction(customerId),
    ]);

    // Build timeline
    const timeline = await this.buildTimeline(customerId);

    // Calculate analytics
    const analytics = {
      totalRevenue: customer.totalRevenue,
      lifetimeValue: customer.lifetimeValue,
      averageOrderValue: customer.averageOrderValue,
      daysSinceLastPurchase: this.calculateDaysSince(customer.lastPurchaseDate),
      churnProbability: customer.scoreChurn,
    };

    return {
      customer,
      contacts,
      recentInteractions: interactions,
      policies,
      opportunities,
      invoices,
      tickets,
      satisfaction: {
        npsScore: satisfaction?.npsScore || null,
        csatScore: satisfaction?.csatScore || null,
        lastSurveyDate: satisfaction?.surveyDate?.toISOString() || null,
      },
      analytics,
      timeline,
    };
  }

  private async buildTimeline(customerId: string): Promise<TimelineEventDto[]> {
    // Aggregate all events from different modules
    const events: TimelineEventDto[] = [];

    // Interactions
    const interactions = await this.prisma.interaction.findMany({
      where: { customerId },
      orderBy: { interactionDate: 'desc' },
      take: 50,
    });
    events.push(...interactions.map(i => ({
      type: 'interaction',
      date: i.interactionDate,
      title: i.subject || `${i.type} interaction`,
      description: i.description,
      icon: this.getInteractionIcon(i.type),
    })));

    // Policies
    const policies = await this.prisma.policy.findMany({
      where: { customerId },
      orderBy: { startDate: 'desc' },
    });
    events.push(...policies.map(p => ({
      type: 'policy',
      date: p.startDate,
      title: `Policy ${p.policyNumber} created`,
      description: `${p.productType} - ${p.premium}€`,
      icon: '📄',
    })));

    // Sort by date desc
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

// ==========================================
// CUSTOMER SCORING SERVICE (AI/ML)
// ==========================================

@Injectable()
export class CustomerScoringService {
  constructor(
    private prisma: PrismaService,
    private anthropic: AnthropicService,
  ) {}

  async scoreCustomer(customerId: string): Promise<CustomerScores> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        policies: true,
        invoices: true,
        interactions: true,
        tickets: true,
      },
    });

    // Calculate value score (based on revenue)
    const valueScore = this.calculateValueScore(customer);

    // Calculate risk score (based on payment behavior, claims)
    const riskScore = await this.calculateRiskScore(customer);

    // Calculate churn probability using ML
    const churnScore = await this.predictChurn(customer);

    // Update customer
    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        scoreValue: valueScore,
        scoreRisk: riskScore,
        scoreChurn: churnScore,
      },
    });

    return { valueScore, riskScore, churnScore };
  }

  private calculateValueScore(customer: any): number {
    const revenue = parseFloat(customer.totalRevenue.toString());
    const ltv = parseFloat(customer.lifetimeValue.toString());
    const policyCount = customer.policies.length;

    // Weighted formula
    let score = 0;
    score += Math.min(revenue / 10000, 30);  // Max 30 points
    score += Math.min(ltv / 50000, 40);      // Max 40 points
    score += Math.min(policyCount * 5, 30);  // Max 30 points

    return Math.min(score, 100);
  }

  private async calculateRiskScore(customer: any): number {
    // Payment delays
    const overdueInvoices = customer.invoices.filter(i => i.status === 'OVERDUE');
    const paymentRisk = (overdueInvoices.length / Math.max(customer.invoices.length, 1)) * 40;

    // Claims frequency
    const claims = await this.prisma.claim.count({
      where: { customerId: customer.id, status: 'APPROVED' },
    });
    const policiesCount = Math.max(customer.policies.length, 1);
    const claimsRisk = Math.min((claims / policiesCount) * 30, 30);

    // Support tickets escalations
    const escalatedTickets = customer.tickets.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL');
    const supportRisk = Math.min((escalatedTickets.length / Math.max(customer.tickets.length, 1)) * 30, 30);

    return Math.min(paymentRisk + claimsRisk + supportRisk, 100);
  }

  private async predictChurn(customer: any): Promise<number> {
    // Use Claude for ML-based churn prediction
    const prompt = `
      Analyze this customer and predict churn probability (0-100):

      Customer Data:
      - Total Revenue: €${customer.totalRevenue}
      - Lifetime Value: €${customer.lifetimeValue}
      - Policies: ${customer.policies.length}
      - Last Purchase: ${customer.lastPurchaseDate || 'Never'}
      - Recent Interactions: ${customer.interactions.slice(0, 5).map(i => i.type).join(', ')}
      - Overdue Invoices: ${customer.invoices.filter(i => i.status === 'OVERDUE').length}
      - Open Tickets: ${customer.tickets.filter(t => t.status === 'OPEN').length}

      Return only a number between 0-100.
    `;

    const response = await this.anthropic.complete(prompt);
    const churnScore = parseInt(response.trim());

    return isNaN(churnScore) ? 50 : Math.min(Math.max(churnScore, 0), 100);
  }
}

// ==========================================
// LEAD SERVICE
// ==========================================

@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService,
    private scoringService: LeadScoringService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateLeadDto, userId: string): Promise<Lead> {
    const leadNumber = await this.generateLeadNumber();

    const lead = await this.prisma.lead.create({
      data: {
        ...dto,
        leadNumber,
        status: 'NEW',
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Score lead (async)
    this.scoringService.scoreLead(lead.id).catch(console.error);

    // Emit event for auto-assignment
    this.eventEmitter.emit('lead.created', { leadId: lead.id });

    return lead;
  }

  async qualify(leadId: string, userId: string): Promise<Lead> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status !== 'CONTACTED') {
      throw new BadRequestException('Lead must be contacted before qualifying');
    }

    // Update lead
    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'QUALIFIED',
        qualifiedAt: new Date(),
        qualifiedBy: userId,
      },
    });

    // Emit event
    this.eventEmitter.emit('lead.qualified', { leadId });

    return updated;
  }

  async convert(leadId: string, userId: string): Promise<{ customer: Customer; lead: Lead }> {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status !== 'QUALIFIED') {
      throw new BadRequestException('Lead must be qualified before converting');
    }

    // Create customer from lead
    const customer = await this.prisma.customer.create({
      data: {
        customerType: lead.companyName ? 'COMPANY' : 'PERSON',
        firstName: lead.firstName,
        lastName: lead.lastName,
        companyName: lead.companyName,
        displayName: lead.companyName || `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        phone: lead.phone,
        status: 'ACTIVE',
        firstContactDate: lead.createdAt,
        assignedTo: lead.assignedTo,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Update lead
    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'CONVERTED',
        convertedToCustomerId: customer.id,
        convertedAt: new Date(),
        convertedBy: userId,
      },
    });

    // Emit events
    this.eventEmitter.emit('lead.converted', { leadId, customerId: customer.id });
    this.eventEmitter.emit('customer.created', { customerId: customer.id });

    return { customer, lead: updated };
  }
}

// ==========================================
// SEGMENTATION SERVICE
// ==========================================

@Injectable()
export class SegmentationService {
  constructor(private prisma: PrismaService) {}

  async createSegment(dto: CreateSegmentDto, userId: string): Promise<Segment> {
    const segment = await this.prisma.segment.create({
      data: {
        ...dto,
        segmentNumber: await this.generateSegmentNumber(),
        memberCount: 0,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // If dynamic, calculate members immediately
    if (segment.isDynamic) {
      await this.refreshSegment(segment.id);
    }

    return segment;
  }

  async refreshSegment(segmentId: string): Promise<number> {
    const segment = await this.prisma.segment.findUnique({
      where: { id: segmentId },
    });

    if (!segment) {
      throw new NotFoundException('Segment not found');
    }

    // Build WHERE clause from rules
    const whereClause = this.buildWhereClause(segment.rules as any);

    // Get matching customers
    const customers = await this.prisma.customer.findMany({
      where: whereClause,
    });

    // Update customers with segment
    await this.prisma.customer.updateMany({
      where: { id: { in: customers.map(c => c.id) } },
      data: { segmentId: segment.id },
    });

    // Calculate stats
    const totalRevenue = customers.reduce((sum, c) => sum + parseFloat(c.totalRevenue.toString()), 0);
    const averageLTV = customers.reduce((sum, c) => sum + parseFloat(c.lifetimeValue.toString()), 0) / customers.length;

    // Update segment
    await this.prisma.segment.update({
      where: { id: segmentId },
      data: {
        memberCount: customers.length,
        totalRevenue,
        averageLTV,
      },
    });

    return customers.length;
  }

  private buildWhereClause(rules: any): any {
    // Convert JSON rules to Prisma where clause
    const where: any = {};

    if (rules.industry) {
      where.industry = { in: rules.industry };
    }

    if (rules.revenue) {
      if (rules.revenue.gt) {
        where.totalRevenue = { gt: rules.revenue.gt };
      }
      if (rules.revenue.lt) {
        where.totalRevenue = { lt: rules.revenue.lt };
      }
    }

    if (rules.status) {
      where.status = { in: rules.status };
    }

    if (rules.companySize) {
      where.companySize = { in: rules.companySize };
    }

    return where;
  }
}
```

### 🔄 Workflows de Integración

```yaml
# ==========================================
# Workflow: Lead Nurturing Automático
# ==========================================
trigger: "lead.created"
schedule: "Daily at 9:00 AM"

steps:
  - id: score-lead
    action: ait-crm.scoreLead
    input: { leadId: $event.leadId }

  - id: assign-if-hot
    condition: $steps.score-lead.score >= 70
    action: ait-crm.assignLead
    input:
      leadId: $event.leadId
      assignTo: "round-robin"  # Distribución equitativa

  - id: send-welcome-email
    action: ait-marketing.sendEmail
    input:
      to: $event.lead.email
      template: "lead-welcome"
      data: { firstName: $event.lead.firstName }

  - id: schedule-follow-up
    action: ait-crm.createTask
    delay: "2 days"
    input:
      type: "follow_up_call"
      leadId: $event.leadId
      assignedTo: $steps.assign-if-hot.assignedTo

  - id: add-to-nurturing-campaign
    condition: $steps.score-lead.score < 70
    action: ait-marketing.addToCampaign
    input:
      leadId: $event.leadId
      campaignId: "nurturing-low-score"

# ==========================================
# Workflow: Customer 360 Update
# ==========================================
trigger:
  - "policy.created"
  - "invoice.paid"
  - "claim.filed"
  - "ticket.closed"

steps:
  - id: recalculate-scores
    action: ait-crm.scoreCustomer
    input: { customerId: $event.customerId }

  - id: update-ltv
    action: ait-crm.updateLifetimeValue
    input: { customerId: $event.customerId }

  - id: check-churn-risk
    condition: $steps.recalculate-scores.churnScore > 70
    action: ait-crm.notifyCustomerSuccess
    input:
      customerId: $event.customerId
      reason: "high_churn_risk"

  - id: check-upsell-opportunity
    condition: $steps.recalculate-scores.valueScore > 80 AND $event.type == "policy.created"
    action: ait-sales.createOpportunity
    input:
      customerId: $event.customerId
      type: "upsell"
      interestedIn: "premium_upgrade"

# ==========================================
# Workflow: NPS Survey Automation
# ==========================================
trigger: "policy.renewed"
schedule: "Quarterly"

steps:
  - id: get-customer
    action: ait-crm.getCustomer
    input: { customerId: $event.customerId }

  - id: check-last-survey
    action: ait-crm.getLatestSatisfaction
    input: { customerId: $event.customerId }

  - id: skip-if-recent
    condition: $steps.check-last-survey.surveyDate > now() - 90 days
    action: workflow.skip
    message: "Survey sent in last 90 days"

  - id: send-nps-survey
    action: ait-marketing.sendEmail
    input:
      to: $steps.get-customer.email
      template: "nps-survey"
      data:
        surveyLink: "https://soriano.es/survey/{customerId}"
        customerName: $steps.get-customer.displayName

  - id: schedule-reminder
    delay: "7 days"
    condition: survey not completed
    action: ait-marketing.sendEmail
    input:
      to: $steps.get-customer.email
      template: "nps-survey-reminder"
```

### 🧪 Tests Principales

```typescript
// ==========================================
// UNIT TESTS
// ==========================================

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CustomerService, PrismaService, CustomerScoringService, EventEmitter2],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a person customer', async () => {
      const dto: CreateCustomerDto = {
        customerType: 'PERSON',
        firstName: 'Juan',
        lastName: 'García',
        email: 'juan@example.com',
        phone: '+34600000000',
      };

      const customer = await service.create(dto, 'user-123');

      expect(customer).toBeDefined();
      expect(customer.customerNumber).toMatch(/^CLI-2026-\d{5}$/);
      expect(customer.displayName).toBe('Juan García');
      expect(customer.status).toBe('PROSPECT');
    });

    it('should create a company customer', async () => {
      const dto: CreateCustomerDto = {
        customerType: 'COMPANY',
        companyName: 'Acme Corp',
        email: 'info@acme.com',
        taxId: 'B12345678',
        companySize: 'MEDIUM',
      };

      const customer = await service.create(dto, 'user-123');

      expect(customer.displayName).toBe('Acme Corp');
      expect(customer.taxId).toBe('B12345678');
    });

    it('should trigger scoring after creation', async () => {
      const scoringSpy = jest.spyOn(service['scoringService'], 'scoreCustomer');

      await service.create({
        customerType: 'PERSON',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      }, 'user-123');

      expect(scoringSpy).toHaveBeenCalled();
    });
  });

  describe('get360View', () => {
    it('should return complete customer 360 view', async () => {
      const customerId = 'customer-123';

      const view = await service.get360View(customerId);

      expect(view.customer).toBeDefined();
      expect(view.contacts).toBeInstanceOf(Array);
      expect(view.recentInteractions).toBeInstanceOf(Array);
      expect(view.policies).toBeInstanceOf(Array);
      expect(view.analytics).toHaveProperty('totalRevenue');
      expect(view.analytics).toHaveProperty('churnProbability');
      expect(view.timeline).toBeInstanceOf(Array);
    });

    it('should calculate correct daysSinceLastPurchase', async () => {
      // Mock customer with lastPurchaseDate = 30 days ago
      const view = await service.get360View('customer-123');

      expect(view.analytics.daysSinceLastPurchase).toBeGreaterThan(29);
      expect(view.analytics.daysSinceLastPurchase).toBeLessThan(31);
    });
  });
});

describe('CustomerScoringService', () => {
  let service: CustomerScoringService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CustomerScoringService, PrismaService, AnthropicService],
    }).compile();

    service = module.get<CustomerScoringService>(CustomerScoringService);
  });

  describe('calculateValueScore', () => {
    it('should return 100 for high-value customer', () => {
      const customer = {
        totalRevenue: new Decimal(300000),
        lifetimeValue: new Decimal(2000000),
        policies: [{}, {}, {}, {}, {}, {}],  // 6 policies
      };

      const score = service['calculateValueScore'](customer);

      expect(score).toBe(100);
    });

    it('should return low score for new customer', () => {
      const customer = {
        totalRevenue: new Decimal(500),
        lifetimeValue: new Decimal(500),
        policies: [],
      };

      const score = service['calculateValueScore'](customer);

      expect(score).toBeLessThan(10);
    });
  });

  describe('calculateRiskScore', () => {
    it('should return high risk for customer with many overdue invoices', async () => {
      const customer = {
        id: 'customer-123',
        invoices: [
          { status: 'OVERDUE' },
          { status: 'OVERDUE' },
          { status: 'OVERDUE' },
          { status: 'PAID' },
        ],
        policies: [{}],
        tickets: [],
      };

      const riskScore = await service['calculateRiskScore'](customer);

      expect(riskScore).toBeGreaterThan(25);  // 3/4 = 75% overdue => 30 points
    });
  });
});

describe('LeadService', () => {
  let service: LeadService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LeadService, PrismaService, LeadScoringService, EventEmitter2],
    }).compile();

    service = module.get<LeadService>(LeadService);
  });

  describe('convert', () => {
    it('should convert qualified lead to customer', async () => {
      const leadId = 'lead-123';

      const result = await service.convert(leadId, 'user-123');

      expect(result.customer).toBeDefined();
      expect(result.lead.status).toBe('CONVERTED');
      expect(result.lead.convertedToCustomerId).toBe(result.customer.id);
    });

    it('should throw error if lead not qualified', async () => {
      // Mock lead with status NEW
      await expect(service.convert('lead-new', 'user-123')).rejects.toThrow(
        'Lead must be qualified before converting'
      );
    });
  });
});

// ==========================================
// INTEGRATION TESTS
// ==========================================

describe('CRM Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AitCrmModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  it('should create customer and automatically score', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/crm/customers')
      .send({
        customerType: 'PERSON',
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@test.com',
      })
      .expect(201);

    const customerId = response.body.id;

    // Wait for async scoring
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify scores were calculated
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    expect(customer.scoreValue).toBeGreaterThanOrEqual(0);
    expect(customer.scoreRisk).toBeGreaterThanOrEqual(0);
    expect(customer.scoreChurn).toBeGreaterThanOrEqual(0);
  });

  it('should create lead, qualify, and convert to customer', async () => {
    // 1. Create lead
    const leadResponse = await request(app.getHttpServer())
      .post('/api/v1/crm/leads')
      .send({
        firstName: 'Lead',
        lastName: 'Test',
        email: 'lead@test.com',
        source: 'WEBSITE',
      })
      .expect(201);

    const leadId = leadResponse.body.id;

    // 2. Update to CONTACTED
    await request(app.getHttpServer())
      .patch(`/api/v1/crm/leads/${leadId}`)
      .send({ status: 'CONTACTED' })
      .expect(200);

    // 3. Qualify
    await request(app.getHttpServer())
      .post(`/api/v1/crm/leads/${leadId}/qualify`)
      .expect(200);

    // 4. Convert
    const convertResponse = await request(app.getHttpServer())
      .post(`/api/v1/crm/leads/${leadId}/convert`)
      .expect(200);

    expect(convertResponse.body.customer).toBeDefined();
    expect(convertResponse.body.lead.status).toBe('CONVERTED');
  });
});

// ==========================================
// E2E TESTS
// ==========================================

describe('Customer Lifecycle E2E', () => {
  it('should complete full customer lifecycle', async () => {
    // 1. Lead creation (from website form)
    const lead = await createLead({
      firstName: 'E2E',
      lastName: 'Customer',
      email: 'e2e@test.com',
      source: 'WEBSITE',
      interestedIn: 'Auto Insurance',
    });

    // 2. Auto-scoring (ML)
    await wait(1000);
    const scoredLead = await getLead(lead.id);
    expect(scoredLead.qualificationScore).toBeGreaterThan(0);

    // 3. Assign to sales rep
    await assignLead(lead.id, 'sales-rep-123');

    // 4. Sales rep contacts lead
    await createInteraction({
      leadId: lead.id,
      type: 'CALL',
      direction: 'OUTBOUND',
      outcome: 'Interested, requested quote',
    });

    // 5. Qualify lead
    await qualifyLead(lead.id);

    // 6. Convert to customer
    const { customer } = await convertLead(lead.id);

    // 7. Create opportunity
    const opportunity = await createOpportunity({
      customerId: customer.id,
      name: 'Auto Insurance - E2E Customer',
      value: 500,
    });

    // 8. Move through sales pipeline
    await moveOpportunity(opportunity.id, 'QUOTATION');
    await moveOpportunity(opportunity.id, 'NEGOTIATION');
    await moveOpportunity(opportunity.id, 'WON');

    // 9. Policy created (auto-trigger)
    await wait(2000);
    const policies = await getPolicies(customer.id);
    expect(policies.length).toBe(1);

    // 10. Invoice generated (auto-trigger)
    const invoices = await getInvoices(customer.id);
    expect(invoices.length).toBe(1);

    // 11. Customer scores updated
    const updatedCustomer = await getCustomer(customer.id);
    expect(updatedCustomer.scoreValue).toBeGreaterThan(0);
    expect(updatedCustomer.totalRevenue).toBeGreaterThan(0);

    // 12. NPS survey sent (auto-trigger after 7 days)
    // Would require time travel or manual trigger in test

    console.log('✅ Full customer lifecycle completed successfully');
  });
});
```

### 📈 Complejidad Estimada

```yaml
Complejidad Total: CRÍTICA (más complejo que ALTA)
Tiempo Estimado: 60 horas
Líneas de Código: ~12,000

Breakdown:
  - Models Prisma: 5 horas (14 modelos complejos)
  - Services: 18 horas (scoring ML, 360 view, segmentación)
  - Controllers: 6 horas (muchos endpoints)
  - DTOs: 4 horas
  - AI Integration: 10 horas (scoring, sentiment analysis, churn prediction)
  - Workflows: 7 horas (nurturing, automation)
  - Tests: 10 horas (crítico para CRM)

Dependencias Críticas:
  - AIT-AUTHENTICATOR (debe estar funcionando)
  - AIT-DATAHUB (opcional pero recomendado)
  - Antropic Claude API (para scoring ML)

Riesgos:
  - Performance con millones de clientes
  - Complejidad del scoring ML (requiere datos históricos)
  - Integración con TODOS los módulos (360 view)
  - GDPR compliance (datos sensibles)
  - Segmentación dinámica en tiempo real

Prioridad: MÁXIMA
Razón: CRM es el corazón del sistema, todos los módulos dependen de él
```

---

## MÓDULO 7: AIT-POLICY-MANAGER

### 📍 Información Básica
```json
{
  "moduleId": "ait-policy-manager",
  "moduleName": "AIT Policy Manager",
  "category": "01-core-business",
  "port": 3010,
  "database": "policy_db",
  "icon": "📋",
  "color": "#4CAF50",
  "priority": "critical"
}
```

### 🎯 Descripción Completa
Gestión completa del ciclo de vida de pólizas de seguros:
- Emisión y renovación automática de pólizas
- Multi-producto (Auto, Hogar, Vida, Salud, Empresas, etc.)
- Cálculo de primas con motor actuarial integrado
- Endosos y modificaciones
- Anulaciones y cancelaciones
- Coaseguro y reaseguro
- Integración con compañías aseguradoras (APIs externas)
- Documentación automática (PDF generation)
- Recordatorios de renovación con ML

### 📦 Dependencias
```typescript
{
  required: [
    'ait-crm',              // Clientes
    'ait-quotes',           // Cotizaciones
    'ait-underwriting',     // Suscripción
    'ait-engines'          // Motor actuarial
  ],
  optional: [
    'ait-claims',          // Siniestros
    'ait-billing',         // Facturación
    'ait-accounting'       // Contabilidad
  ]
}
```

### 🗄️ Schema Prisma COMPLETO

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// POLICY CORE MODELS
// ==========================================

model Policy {
  id                String    @id @default(uuid())
  policyNumber      String    @unique // POL-2026-00001

  // Tipo de producto
  productType       ProductType  // AUTO, HOME, LIFE, HEALTH, BUSINESS, etc.
  productSubtype    String?      // "Todo riesgo", "Terceros", etc.
  productId         String?      // Link to product catalog

  // Cliente y beneficiarios
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id])
  policyholderType  PolicyholderType  // INDIVIDUAL, COMPANY
  beneficiaries     Beneficiary[]

  // Estado
  status            PolicyStatus  // DRAFT, PENDING_APPROVAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED

  // Fechas
  issueDate         DateTime
  startDate         DateTime
  endDate           DateTime
  effectiveDate     DateTime
  cancellationDate  DateTime?
  renewalDate       DateTime?

  // Importes
  premium           Decimal   // Prima anual
  premiumFrequency  Frequency  // ANNUAL, SEMI_ANNUAL, QUARTERLY, MONTHLY
  sumInsured        Decimal   // Suma asegurada
  deductible        Decimal?  // Franquicia

  // Pago
  paymentMethod     PaymentMethod  // TRANSFER, CARD, DIRECT_DEBIT
  paymentStatus     PaymentStatus  // PENDING, PAID, OVERDUE

  // Compañía aseguradora
  insurerId         String?
  insurer           Insurer?  @relation(fields: [insurerId], references: [id])
  insurerPolicyNumber String?  // Número de póliza en la aseguradora

  // Coaseguro/Reaseguro
  coinsurancePercentage Decimal?  @default(100)  // % que retenemos
  reinsurerId       String?
  reinsurer         Reinsurer? @relation(fields: [reinsurerId], references: [id])

  // Comisiones
  commissionRate    Decimal   @default(0)  // % comisión
  commissionAmount  Decimal   @default(0)

  // Canal
  channelType       ChannelType  // DIRECT, AGENT, BROKER, ONLINE
  agentId           String?
  agent             Agent?    @relation(fields: [agentId], references: [id])

  // Renovación automática
  autoRenewal       Boolean   @default(false)
  renewalAttempted  Boolean   @default(false)
  renewalError      String?

  // Documentos
  documents         PolicyDocument[]

  // Coberturas
  coverages         Coverage[]

  // Asegurados (para múltiples conductores, inquilinos, etc.)
  insuredParties    InsuredParty[]

  // Objetos asegurados (vehículos, viviendas, etc.)
  insuredObjects    InsuredObject[]

  // Historial
  endorsements      Endorsement[]
  claims            Claim[]
  renewals          PolicyRenewal[]

  // Notas
  notes             PolicyNote[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  cancelledBy       String?
  companyId         String
  tenantId          String

  @@index([policyNumber])
  @@index([customerId])
  @@index([status])
  @@index([productType])
  @@index([startDate])
  @@index([endDate])
  @@index([insurerId])
  @@index([agentId])
  @@index([companyId, tenantId])
}

model Beneficiary {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  // Datos del beneficiario
  firstName         String
  lastName          String
  taxId             String?
  relationship      Relationship  // SPOUSE, CHILD, PARENT, SIBLING, OTHER
  percentage        Decimal   @default(100)  // % de la suma asegurada

  // Contacto
  email             String?
  phone             String?
  address           String?

  isPrimary         Boolean   @default(false)

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([policyId])
}

model Coverage {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  // Cobertura
  coverageCode      String    // "RC", "ROBO", "INCENDIO", etc.
  coverageName      String
  description       String?   @db.Text

  // Límites
  sumInsured        Decimal?  // Suma asegurada específica
  deductible        Decimal?  // Franquicia específica
  maxClaims         Int?      // Máximo de siniestros por año

  // Precio
  premium           Decimal   // Prima de esta cobertura

  isOptional        Boolean   @default(false)
  isIncluded        Boolean   @default(true)

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([policyId])
  @@index([coverageCode])
}

model InsuredParty {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  // Tipo (conductor, inquilino, empleado, etc.)
  partyType         String    // "DRIVER", "TENANT", "EMPLOYEE"

  // Datos personales
  firstName         String
  lastName          String
  taxId             String?
  dateOfBirth       DateTime?
  gender            Gender?

  // Específico por tipo
  licenseNumber     String?   // Para conductores
  licenseDate       DateTime? // Fecha de carnet
  occupation        String?

  isPrimary         Boolean   @default(false)

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([policyId])
}

model InsuredObject {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  // Tipo de objeto
  objectType        ObjectType  // VEHICLE, PROPERTY, EQUIPMENT, etc.

  // Datos comunes
  description       String
  value             Decimal

  // Vehículo (si aplica)
  vehicleMake       String?
  vehicleModel      String?
  vehicleYear       Int?
  vehicleVIN        String?
  vehiclePlate      String?
  vehicleKm         Int?

  // Propiedad (si aplica)
  propertyAddress   String?
  propertyCity      String?
  propertyPostalCode String?
  propertyM2        Int?
  propertyType      String?   // "HOUSE", "APARTMENT", "OFFICE"

  // Equipamiento (si aplica)
  equipmentSerialNumber String?
  equipmentBrand    String?

  isPrimary         Boolean   @default(false)

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([policyId])
  @@index([objectType])
  @@index([vehiclePlate])
}

// ==========================================
// ENDORSEMENTS (Modificaciones)
// ==========================================

model Endorsement {
  id                String    @id @default(uuid())
  endorsementNumber String    @unique // END-2026-00001
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id])

  // Tipo de endoso
  type              EndorsementType  // COVERAGE_CHANGE, SUM_CHANGE, BENEFICIARY_CHANGE, etc.

  // Descripción
  reason            String    @db.Text
  effectiveDate     DateTime

  // Cambios en prima
  oldPremium        Decimal
  newPremium        Decimal
  premiumDifference Decimal   // Puede ser negativo (devolución)

  // Estado
  status            EndorsementStatus  // PENDING, APPROVED, REJECTED, APPLIED

  // Datos del cambio (JSON)
  changes           Json      // { "coverages": [...], "sumInsured": ... }

  // Aprobación
  approvedBy        String?
  approvedAt        DateTime?
  rejectionReason   String?

  // Documentos
  documents         EndorsementDocument[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([policyId])
  @@index([status])
}

model EndorsementDocument {
  id                String    @id @default(uuid())
  endorsementId     String
  endorsement       Endorsement @relation(fields: [endorsementId], references: [id], onDelete: Cascade)

  documentType      String    // "endorsement_certificate", "premium_adjustment"
  fileName          String
  fileUrl           String
  mimeType          String

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String

  @@index([endorsementId])
}

// ==========================================
// RENEWALS
// ==========================================

model PolicyRenewal {
  id                String    @id @default(uuid())
  renewalNumber     String    @unique // REN-2026-00001

  // Póliza original
  originalPolicyId  String
  originalPolicy    Policy    @relation(fields: [originalPolicyId], references: [id])

  // Nueva póliza (si se renovó)
  newPolicyId       String?

  // Estado
  status            RenewalStatus  // PENDING, NOTIFIED, ACCEPTED, REJECTED, COMPLETED

  // Fechas
  renewalDate       DateTime
  notificationDate  DateTime?
  responseDate      DateTime?

  // Condiciones de renovación
  oldPremium        Decimal
  newPremium        Decimal
  premiumChange     Decimal
  premiumChangePercentage Decimal

  // Razón del cambio
  priceChangeReason String?   @db.Text

  // Comunicación
  notificationsSent Int       @default(0)
  lastNotificationDate DateTime?

  // Cliente aceptó/rechazó
  customerResponse  String?   // "ACCEPTED", "REJECTED", "RENEGOTIATE"
  customerNotes     String?   @db.Text

  // ML prediction
  mlRenewalProbability Float?  // 0-1
  mlChurnRisk       Float?    // 0-1

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([originalPolicyId])
  @@index([status])
  @@index([renewalDate])
}

// ==========================================
// INSURERS & REINSURERS
// ==========================================

model Insurer {
  id                String    @id @default(uuid())
  insurerCode       String    @unique
  name              String
  taxId             String?

  // Contacto
  email             String?
  phone             String?
  website           String?

  // API Integration
  hasAPI            Boolean   @default(false)
  apiBaseUrl        String?
  apiKey            String?   // Encrypted

  // Productos que ofrecen
  products          String[]  // ["AUTO", "HOME", "LIFE"]

  // Comisiones
  defaultCommissionRate Decimal  @default(0)

  // Estado
  isActive          Boolean   @default(true)

  // Relations
  policies          Policy[]

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([insurerCode])
  @@index([isActive])
}

model Reinsurer {
  id                String    @id @default(uuid())
  name              String
  taxId             String?

  // Límites
  maxRetention      Decimal   // Máximo que podemos retener antes de reaseguro

  isActive          Boolean   @default(true)

  policies          Policy[]

  createdAt         DateTime  @default(now())
  companyId         String
  tenantId          String
}

model Agent {
  id                String    @id @default(uuid())
  agentCode         String    @unique

  // Datos personales
  firstName         String
  lastName          String
  email             String
  phone             String?

  // Tipo
  agentType         AgentType  // EXCLUSIVE, INDEPENDENT, BROKER

  // Comisiones
  defaultCommissionRate Decimal  @default(0)

  // Productos autorizados
  authorizedProducts String[]

  // Estado
  isActive          Boolean   @default(true)

  // Relations
  policies          Policy[]

  // Stats
  totalPolicies     Int       @default(0)
  totalPremium      Decimal   @default(0)
  totalCommission   Decimal   @default(0)

  // Audit
  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([agentCode])
  @@index([isActive])
}

// ==========================================
// DOCUMENTS
// ==========================================

model PolicyDocument {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  documentType      DocumentType  // POLICY_CERTIFICATE, CONDITIONS, RECEIPT, etc.
  fileName          String
  fileUrl           String
  mimeType          String
  fileSize          Int

  // Versioning
  version           Int       @default(1)

  // Firma digital
  isSigned          Boolean   @default(false)
  signedBy          String?
  signedAt          DateTime?
  signatureHash     String?

  createdAt         DateTime  @default(now())
  createdBy         String
  companyId         String
  tenantId          String

  @@index([policyId])
  @@index([documentType])
}

model PolicyNote {
  id                String    @id @default(uuid())
  policyId          String
  policy            Policy    @relation(fields: [policyId], references: [id], onDelete: Cascade)

  content           String    @db.Text

  // Tipo de nota
  noteType          NoteType  // INTERNAL, CUSTOMER_VISIBLE
  isPinned          Boolean   @default(false)

  createdAt         DateTime  @default(now())
  createdBy         String
  updatedAt         DateTime  @updatedAt
  updatedBy         String
  companyId         String
  tenantId          String

  @@index([policyId])
}

// ==========================================
// ENUMS
// ==========================================

enum ProductType {
  AUTO
  HOME
  LIFE
  HEALTH
  TRAVEL
  BUSINESS
  LIABILITY
  PROFESSIONAL
  CYBER
  PET
  ACCIDENT
  FUNERAL
  OTHER
}

enum PolicyStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  SUSPENDED
  CANCELLED
  EXPIRED
  RENEWED
}

enum PolicyholderType {
  INDIVIDUAL
  COMPANY
}

enum Frequency {
  ANNUAL
  SEMI_ANNUAL
  QUARTERLY
  MONTHLY
  SINGLE
}

enum PaymentMethod {
  TRANSFER
  CARD
  DIRECT_DEBIT
  CASH
  CHECK
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  DEFAULTED
}

enum ChannelType {
  DIRECT
  AGENT
  BROKER
  ONLINE
  PHONE
  PARTNER
}

enum Relationship {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  PARTNER
  OTHER
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ObjectType {
  VEHICLE
  PROPERTY
  EQUIPMENT
  MERCHANDISE
  JEWELRY
  ART
  OTHER
}

enum EndorsementType {
  COVERAGE_CHANGE
  SUM_CHANGE
  BENEFICIARY_CHANGE
  INSURED_PARTY_CHANGE
  INSURED_OBJECT_CHANGE
  PREMIUM_ADJUSTMENT
  TERM_EXTENSION
  TERM_REDUCTION
  CANCELLATION
  OTHER
}

enum EndorsementStatus {
  PENDING
  APPROVED
  REJECTED
  APPLIED
}

enum RenewalStatus {
  PENDING
  NOTIFIED
  ACCEPTED
  REJECTED
  COMPLETED
  EXPIRED
}

enum AgentType {
  EXCLUSIVE
  INDEPENDENT
  BROKER
}

enum DocumentType {
  POLICY_CERTIFICATE
  CONDITIONS_GENERAL
  CONDITIONS_PARTICULAR
  PAYMENT_RECEIPT
  ENDORSEMENT
  CANCELLATION
  RENEWAL_NOTICE
  OTHER
}

enum NoteType {
  INTERNAL
  CUSTOMER_VISIBLE
}
```

### 🔌 API Endpoints COMPLETOS

```typescript
// ==========================================
// POLICIES
// ==========================================

POST   /api/v1/policies                       // Emitir nueva póliza
GET    /api/v1/policies                       // Listar pólizas (filtros)
GET    /api/v1/policies/:id                   // Detalle de póliza
PUT    /api/v1/policies/:id                   // Actualizar póliza
DELETE /api/v1/policies/:id                   // Eliminar (solo DRAFT)
PATCH  /api/v1/policies/:id/activate          // Activar póliza
PATCH  /api/v1/policies/:id/suspend           // Suspender póliza
POST   /api/v1/policies/:id/cancel            // Cancelar póliza
GET    /api/v1/policies/:id/timeline          // Línea de tiempo completa

// Documentos
GET    /api/v1/policies/:id/documents         // Listar documentos
POST   /api/v1/policies/:id/documents         // Subir documento
GET    /api/v1/policies/:id/certificate       // Generar certificado PDF
GET    /api/v1/policies/:id/conditions        // Generar condiciones PDF

// Coberturas
POST   /api/v1/policies/:id/coverages         // Añadir cobertura
PUT    /api/v1/policies/:id/coverages/:covId  // Modificar cobertura
DELETE /api/v1/policies/:id/coverages/:covId  // Eliminar cobertura

// ==========================================
// ENDORSEMENTS
// ==========================================

POST   /api/v1/policies/:id/endorsements      // Crear endoso
GET    /api/v1/endorsements                   // Listar endosos
GET    /api/v1/endorsements/:id               // Detalle de endoso
PUT    /api/v1/endorsements/:id               // Actualizar endoso
POST   /api/v1/endorsements/:id/approve       // Aprobar endoso
POST   /api/v1/endorsements/:id/reject        // Rechazar endoso
POST   /api/v1/endorsements/:id/apply         // Aplicar endoso a póliza

// ==========================================
// RENEWALS
// ==========================================

GET    /api/v1/renewals                       // Listar renovaciones
GET    /api/v1/renewals/:id                   // Detalle de renovación
POST   /api/v1/renewals/:id/notify            // Notificar al cliente
POST   /api/v1/renewals/:id/accept            // Cliente acepta renovación
POST   /api/v1/renewals/:id/reject            // Cliente rechaza
POST   /api/v1/renewals/:id/complete          // Completar renovación
GET    /api/v1/renewals/pending               // Renovaciones pendientes

// Automático
POST   /api/v1/renewals/process-batch         // Procesar lote de renovaciones (CRON)

// ==========================================
// INSURERS
// ==========================================

POST   /api/v1/insurers                       // Crear aseguradora
GET    /api/v1/insurers                       // Listar aseguradoras
GET    /api/v1/insurers/:id                   // Detalle de aseguradora
PUT    /api/v1/insurers/:id                   // Actualizar aseguradora
DELETE /api/v1/insurers/:id                   // Eliminar aseguradora
POST   /api/v1/insurers/:id/test-connection   // Test API connection

// ==========================================
// AGENTS
// ==========================================

POST   /api/v1/agents                         // Crear agente
GET    /api/v1/agents                         // Listar agentes
GET    /api/v1/agents/:id                     // Detalle de agente
PUT    /api/v1/agents/:id                     // Actualizar agente
DELETE /api/v1/agents/:id                     // Eliminar agente
GET    /api/v1/agents/:id/performance         // Estadísticas del agente

// ==========================================
// ANALYTICS
// ==========================================

GET    /api/v1/policies/analytics/overview    // Dashboard general
GET    /api/v1/policies/analytics/by-product  // Análisis por producto
GET    /api/v1/policies/analytics/by-channel  // Análisis por canal
GET    /api/v1/policies/analytics/renewals    // Tasas de renovación
GET    /api/v1/policies/analytics/churn       // Análisis de churn
GET    /api/v1/policies/analytics/revenue     // Ingresos por primas
```

### 💼 Servicios Principales

```typescript
// ==========================================
// POLICY SERVICE
// ==========================================

@Injectable()
export class PolicyService {
  constructor(
    private prisma: PrismaService,
    private pricingEngine: PricingEngineService,
    private documentService: DocumentService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreatePolicyDto, userId: string): Promise<Policy> {
    // Validar que el cliente existe
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calcular prima usando motor actuarial
    const pricingResult = await this.pricingEngine.calculatePremium({
      productType: dto.productType,
      customer,
      coverages: dto.coverages,
      insuredObjects: dto.insuredObjects,
      insuredParties: dto.insuredParties,
    });

    // Generar número de póliza
    const policyNumber = await this.generatePolicyNumber();

    // Crear póliza
    const policy = await this.prisma.policy.create({
      data: {
        policyNumber,
        ...dto,
        premium: pricingResult.totalPremium,
        status: 'DRAFT',
        issueDate: new Date(),
        effectiveDate: dto.startDate,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        coverages: true,
        insuredObjects: true,
        insuredParties: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('policy.created', {
      policyId: policy.id,
      customerId: policy.customerId,
    });

    return policy;
  }

  async activate(policyId: string, userId: string): Promise<Policy> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status !== 'DRAFT' && policy.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Policy cannot be activated from current status');
    }

    // Validar pago
    if (policy.paymentStatus !== 'PAID') {
      throw new BadRequestException('Policy must be paid before activation');
    }

    // Activar póliza
    const activated = await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'ACTIVE',
        effectiveDate: new Date(),
        updatedBy: userId,
      },
    });

    // Generar documentos (certificado, condiciones)
    await this.documentService.generatePolicyCertificate(policyId);
    await this.documentService.generateConditions(policyId);

    // Si tiene API con aseguradora, emitir póliza externamente
    if (policy.insurerId) {
      await this.emitToInsurer(policyId);
    }

    // Emit event
    this.eventEmitter.emit('policy.activated', {
      policyId: policy.id,
      customerId: policy.customerId,
      premium: policy.premium,
    });

    return activated;
  }

  async cancel(policyId: string, reason: string, userId: string): Promise<Policy> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    if (policy.status === 'CANCELLED' || policy.status === 'EXPIRED') {
      throw new BadRequestException('Policy already cancelled or expired');
    }

    // Calcular devolución de prima (prorata)
    const refund = this.calculateProRataRefund(policy);

    // Cancelar póliza
    const cancelled = await this.prisma.policy.update({
      where: { id: policyId },
      data: {
        status: 'CANCELLED',
        cancellationDate: new Date(),
        cancelledBy: userId,
        updatedBy: userId,
      },
    });

    // Crear nota con razón de cancelación
    await this.prisma.policyNote.create({
      data: {
        policyId,
        content: `Póliza cancelada. Razón: ${reason}. Devolución: €${refund}`,
        noteType: 'INTERNAL',
        createdBy: userId,
      },
    });

    // Si hay devolución, crear crédito en facturación
    if (refund > 0) {
      this.eventEmitter.emit('policy.refund-needed', {
        policyId,
        customerId: policy.customerId,
        amount: refund,
      });
    }

    // Emit event
    this.eventEmitter.emit('policy.cancelled', {
      policyId,
      customerId: policy.customerId,
      reason,
    });

    return cancelled;
  }

  private calculateProRataRefund(policy: Policy): number {
    const today = new Date();
    const totalDays = differenceInDays(policy.endDate, policy.startDate);
    const remainingDays = differenceInDays(policy.endDate, today);

    if (remainingDays <= 0) return 0;

    const refundPercentage = remainingDays / totalDays;
    const refund = parseFloat(policy.premium.toString()) * refundPercentage;

    return Math.round(refund * 100) / 100;
  }

  private async emitToInsurer(policyId: string): Promise<void> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        insurer: true,
        customer: true,
        coverages: true,
      },
    });

    if (!policy.insurer || !policy.insurer.hasAPI) {
      return;
    }

    try {
      // Call external API
      const response = await axios.post(
        `${policy.insurer.apiBaseUrl}/policies`,
        {
          policyData: this.mapToInsurerFormat(policy),
        },
        {
          headers: {
            'Authorization': `Bearer ${policy.insurer.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update with insurer's policy number
      await this.prisma.policy.update({
        where: { id: policyId },
        data: {
          insurerPolicyNumber: response.data.policyNumber,
        },
      });
    } catch (error) {
      // Log error but don't fail activation
      console.error('Failed to emit policy to insurer:', error);

      await this.prisma.policyNote.create({
        data: {
          policyId,
          content: `Error al emitir en aseguradora: ${error.message}`,
          noteType: 'INTERNAL',
          createdBy: 'SYSTEM',
        },
      });
    }
  }
}

// ==========================================
// RENEWAL SERVICE
// ==========================================

@Injectable()
export class RenewalService {
  constructor(
    private prisma: PrismaService,
    private pricingEngine: PricingEngineService,
    private notificationService: NotificationService,
    private mlService: MLPredictionService,
  ) {}

  @Cron('0 2 * * *')  // Daily at 2 AM
  async processRenewals(): Promise<void> {
    // Find policies expiring in 60 days
    const expiringPolicies = await this.prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: addDays(new Date(), 0),
          lte: addDays(new Date(), 60),
        },
        autoRenewal: true,
        renewalAttempted: false,
      },
      include: {
        customer: true,
        coverages: true,
      },
    });

    for (const policy of expiringPolicies) {
      await this.createRenewal(policy);
    }
  }

  async createRenewal(policy: Policy): Promise<PolicyRenewal> {
    // Calculate new premium (may have changed based on claims history, age, etc.)
    const newPremium = await this.pricingEngine.calculateRenewalPremium(policy);

    const premiumChange = newPremium - parseFloat(policy.premium.toString());
    const premiumChangePercentage = (premiumChange / parseFloat(policy.premium.toString())) * 100;

    // ML prediction of renewal probability
    const mlPrediction = await this.mlService.predictRenewal({
      policyId: policy.id,
      customerId: policy.customerId,
      claimsHistory: await this.getClaimsHistory(policy.id),
      paymentHistory: await this.getPaymentHistory(policy.customerId),
    });

    // Create renewal
    const renewal = await this.prisma.policyRenewal.create({
      data: {
        renewalNumber: await this.generateRenewalNumber(),
        originalPolicyId: policy.id,
        status: 'PENDING',
        renewalDate: policy.endDate,
        oldPremium: policy.premium,
        newPremium,
        premiumChange,
        premiumChangePercentage,
        priceChangeReason: this.explainPriceChange(policy, newPremium),
        mlRenewalProbability: mlPrediction.renewalProbability,
        mlChurnRisk: mlPrediction.churnRisk,
        createdBy: 'SYSTEM',
        updatedBy: 'SYSTEM',
      },
    });

    // Send notification to customer
    await this.notifyCustomer(renewal);

    // Mark policy as renewal attempted
    await this.prisma.policy.update({
      where: { id: policy.id },
      data: { renewalAttempted: true },
    });

    return renewal;
  }

  private async notifyCustomer(renewal: PolicyRenewal): Promise<void> {
    const policy = await this.prisma.policy.findUnique({
      where: { id: renewal.originalPolicyId },
      include: { customer: true },
    });

    const daysUntilExpiry = differenceInDays(renewal.renewalDate, new Date());

    await this.notificationService.send({
      to: policy.customer.email,
      template: 'policy-renewal',
      data: {
        customerName: policy.customer.displayName,
        policyNumber: policy.policyNumber,
        productType: policy.productType,
        expiryDate: format(renewal.renewalDate, 'dd/MM/yyyy'),
        daysUntilExpiry,
        oldPremium: renewal.oldPremium,
        newPremium: renewal.newPremium,
        premiumChange: renewal.premiumChange,
        renewalLink: `https://soriano.es/renewals/${renewal.id}`,
      },
    });

    await this.prisma.policyRenewal.update({
      where: { id: renewal.id },
      data: {
        status: 'NOTIFIED',
        notificationDate: new Date(),
        notificationsSent: 1,
        lastNotificationDate: new Date(),
      },
    });
  }

  async acceptRenewal(renewalId: string, userId: string): Promise<Policy> {
    const renewal = await this.prisma.policyRenewal.findUnique({
      where: { id: renewalId },
      include: {
        originalPolicy: {
          include: {
            coverages: true,
            insuredObjects: true,
            insuredParties: true,
            beneficiaries: true,
          },
        },
      },
    });

    if (!renewal) {
      throw new NotFoundException('Renewal not found');
    }

    // Create new policy based on original
    const newPolicy = await this.prisma.policy.create({
      data: {
        policyNumber: await this.generatePolicyNumber(),
        customerId: renewal.originalPolicy.customerId,
        productType: renewal.originalPolicy.productType,
        productSubtype: renewal.originalPolicy.productSubtype,
        status: 'ACTIVE',
        issueDate: new Date(),
        startDate: addDays(renewal.originalPolicy.endDate, 1),
        endDate: addYears(renewal.originalPolicy.endDate, 1),
        effectiveDate: addDays(renewal.originalPolicy.endDate, 1),
        premium: renewal.newPremium,
        premiumFrequency: renewal.originalPolicy.premiumFrequency,
        sumInsured: renewal.originalPolicy.sumInsured,
        deductible: renewal.originalPolicy.deductible,
        paymentMethod: renewal.originalPolicy.paymentMethod,
        paymentStatus: 'PENDING',
        insurerId: renewal.originalPolicy.insurerId,
        commissionRate: renewal.originalPolicy.commissionRate,
        channelType: renewal.originalPolicy.channelType,
        agentId: renewal.originalPolicy.agentId,
        autoRenewal: renewal.originalPolicy.autoRenewal,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    // Copy coverages
    for (const coverage of renewal.originalPolicy.coverages) {
      await this.prisma.coverage.create({
        data: {
          policyId: newPolicy.id,
          coverageCode: coverage.coverageCode,
          coverageName: coverage.coverageName,
          description: coverage.description,
          sumInsured: coverage.sumInsured,
          deductible: coverage.deductible,
          premium: coverage.premium,
          isOptional: coverage.isOptional,
          isIncluded: coverage.isIncluded,
        },
      });
    }

    // Update renewal
    await this.prisma.policyRenewal.update({
      where: { id: renewalId },
      data: {
        status: 'COMPLETED',
        newPolicyId: newPolicy.id,
        customerResponse: 'ACCEPTED',
        responseDate: new Date(),
        updatedBy: userId,
      },
    });

    // Update original policy status
    await this.prisma.policy.update({
      where: { id: renewal.originalPolicyId },
      data: {
        status: 'RENEWED',
      },
    });

    // Emit events
    this.eventEmitter.emit('policy.renewed', {
      originalPolicyId: renewal.originalPolicyId,
      newPolicyId: newPolicy.id,
      customerId: newPolicy.customerId,
    });

    return newPolicy;
  }
}
```

### 📈 Complejidad Estimada

```yaml
Complejidad Total: CRÍTICA
Tiempo Estimado: 70 horas
Líneas de Código: ~15,000

Breakdown:
  - Models Prisma: 6 horas (20+ modelos muy complejos)
  - Services: 20 horas (pricing engine, renewals, endorsements)
  - Controllers: 7 horas
  - DTOs: 5 horas (muchas variaciones)
  - Document Generation: 8 horas (PDF certificates, conditions)
  - External API Integration: 8 horas (insurers APIs)
  - ML Integration: 6 horas (renewal prediction, pricing)
  - Workflows: 5 horas (auto-renewals, notifications)
  - Tests: 15 horas (crítico para seguros)

Dependencias Críticas:
  - AIT-CRM (clientes)
  - AIT-QUOTES (cotizaciones previas)
  - AIT-UNDERWRITING (suscripción y aprobación)
  - AIT-ENGINES (motor actuarial para cálculo de primas)
  - AIT-BILLING (facturación de primas)
  - AIT-ACCOUNTING (contabilidad de primas cobradas)

Riesgos:
  - Complejidad extrema (múltiples productos, cada uno con reglas diferentes)
  - Performance con millones de pólizas
  - Integraciones con múltiples aseguradoras (APIs heterogéneas)
  - Cálculo de primas debe ser preciso (errores = pérdidas)
  - Regulación estricta (documentos legales, compliance)
  - Renovaciones automáticas (crítico para retención)

Prioridad: MÁXIMA
Razón: Core del negocio de seguros, sin pólizas no hay negocio
```

---