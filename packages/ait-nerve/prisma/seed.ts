import { PrismaClient, MotorCategory } from '@prisma/client';

const prisma = new PrismaClient();

const MOTORS = [
  {
    slug: 'ai-engine',
    name: 'Motor de IA',
    description: 'Inteligencia artificial con 30 agentes especializados para seguros',
    category: 'AI_ML' as MotorCategory,
    version: '2.3.1',
    enabled: true,
    config: {
      agents: {
        cotizador: { active: true, model: 'gpt-4', maxTokens: 2000 },
        comparador: { active: true, providers: ['occident', 'mapfre', 'axa'] },
        renovador: { active: true, daysBeforeExpiry: 30 },
        siniestros: { active: true, autoApproveThreshold: 500 },
        attencionCliente: { active: true, languages: ['es', 'en', 'fr'] },
      },
      rateLimit: { requests: 1000, window: '1h' },
    },
    icon: '🤖',
    color: '#3B82F6',
    order: 1,
  },
  {
    slug: 'pricing-engine',
    name: 'Motor de Cotización',
    description: 'Cálculo automático de primas usando GLM, Bonus-Malus y RL',
    category: 'BUSINESS_LOGIC' as MotorCategory,
    version: '1.8.2',
    enabled: true,
    config: {
      models: {
        auto: 'glm_poisson_gamma_v2',
        hogar: 'glm_gamma_v1',
        vida: 'actuarial_mortality_table',
      },
      discounts: {
        multiproduct: 0.1,
        loyalty: 0.05,
        youngDriver: -0.15,
      },
      provider: 'ait-engines',
    },
    icon: '💰',
    color: '#10B981',
    order: 2,
  },
  {
    slug: 'commission-engine',
    name: 'Motor de Comisiones',
    description: 'Cálculo automático de comisiones para mediadores',
    category: 'BUSINESS_LOGIC' as MotorCategory,
    version: '1.2.0',
    enabled: true,
    config: {
      tiers: [
        { range: [0, 50000], rate: 0.1 },
        { range: [50001, 100000], rate: 0.12 },
        { range: [100001, Infinity], rate: 0.15 },
      ],
      bonuses: {
        newClient: 50,
        crossSell: 30,
        renewal: 20,
      },
      paymentSchedule: 'monthly',
    },
    icon: '💸',
    color: '#F59E0B',
    order: 3,
  },
  {
    slug: 'rules-engine',
    name: 'Motor de Reglas',
    description: 'Evaluación de reglas de negocio complejas',
    category: 'BUSINESS_LOGIC' as MotorCategory,
    version: '2.0.5',
    enabled: true,
    config: {
      rules: [
        {
          id: 'AUTO_001',
          name: 'Rechazo por siniestralidad',
          condition: 'claims_last_2_years > 3',
          action: 'reject',
          priority: 10,
        },
        {
          id: 'AUTO_002',
          name: 'Sobreprecio joven conductor',
          condition: 'age < 25 AND vehicle_hp > 150',
          action: 'multiply_premium:1.3',
          priority: 5,
        },
      ],
      evaluationOrder: 'priority-desc',
    },
    icon: '📜',
    color: '#8B5CF6',
    order: 4,
  },
  {
    slug: 'workflow-engine',
    name: 'Motor de Workflows',
    description: 'Automatización de procesos de negocio',
    category: 'AUTOMATION' as MotorCategory,
    version: '1.5.3',
    enabled: true,
    config: {
      workflows: {
        onboarding: {
          steps: [
            { id: 1, action: 'validate_identity', timeout: '5m' },
            { id: 2, action: 'credit_check', timeout: '2m' },
            { id: 3, action: 'generate_quote', timeout: '1m' },
            { id: 4, action: 'send_offer', timeout: 'instant' },
          ],
          retryPolicy: { maxAttempts: 3, backoff: 'exponential' },
        },
      },
    },
    icon: '🔄',
    color: '#06B6D4',
    order: 5,
  },
  {
    slug: 'scraping-engine',
    name: 'Motor de Scraping',
    description: 'Extracción de datos de fuentes externas',
    category: 'AUTOMATION' as MotorCategory,
    version: '1.3.1',
    enabled: true,
    config: {
      targets: {
        occident: {
          active: true,
          url: 'https://www.occident.es/cotizador',
          rateLimit: 60,
          proxy: true,
          cache: '30m',
        },
        dgt: {
          active: true,
          endpoint: 'https://api.dgt.es/v1/vehicles',
        },
      },
    },
    icon: '🕷️',
    color: '#EC4899',
    order: 6,
  },
  {
    slug: 'communications-engine',
    name: 'Motor de Comunicaciones',
    description: 'Envío multi-canal de comunicaciones (Email, SMS, WhatsApp)',
    category: 'COMMUNICATION' as MotorCategory,
    version: '1.7.0',
    enabled: true,
    config: {
      channels: {
        email: {
          provider: 'sendgrid',
          from: 'noreply@soriano.com',
        },
        sms: {
          provider: 'twilio',
          from: '+34600000000',
        },
      },
      preferences: {
        respectUnsubscribe: true,
        quietHours: { start: '22:00', end: '09:00' },
      },
    },
    icon: '📢',
    color: '#14B8A6',
    order: 7,
  },
  {
    slug: 'payment-engine',
    name: 'Motor de Pagos',
    description: 'Procesamiento de pagos y subscripciones',
    category: 'INTEGRATION' as MotorCategory,
    version: '1.4.2',
    enabled: true,
    config: {
      providers: {
        stripe: {
          active: true,
          webhook: 'https://api.soriano.com/webhooks/stripe',
        },
        redsys: {
          active: true,
          terminal: '001',
          currency: 'EUR',
        },
      },
      recurringBilling: {
        enabled: true,
        retryPolicy: { attempts: 3, delays: [1, 3, 7] },
      },
    },
    icon: '💳',
    color: '#F97316',
    order: 8,
  },
  {
    slug: 'integrations-engine',
    name: 'Motor de Integraciones',
    description: 'Conectar con servicios de terceros',
    category: 'INTEGRATION' as MotorCategory,
    version: '1.6.0',
    enabled: true,
    config: {
      connectors: {
        occident: {
          type: 'insurance',
          auth: 'oauth2',
        },
        salesforce: {
          type: 'crm',
          auth: 'oauth2',
          sync: { frequency: '5m', entities: ['leads', 'opportunities'] },
        },
      },
    },
    icon: '🔗',
    color: '#6366F1',
    order: 9,
  },
  {
    slug: 'analytics-engine',
    name: 'Motor de Analytics',
    description: 'Análisis de datos y reportes',
    category: 'ANALYTICS' as MotorCategory,
    version: '1.9.1',
    enabled: true,
    config: {
      dataWarehouse: {
        type: 'postgresql',
        refreshInterval: '1h',
      },
      dashboards: {
        sales: { refresh: 'realtime' },
        claims: { refresh: '5m' },
        financial: { refresh: '1h' },
      },
    },
    icon: '📊',
    color: '#0EA5E9',
    order: 10,
  },
  {
    slug: 'gamification-engine',
    name: 'Motor de Gamificación',
    description: 'Sistema de puntos, badges y recompensas',
    category: 'OTHER' as MotorCategory,
    version: '1.1.0',
    enabled: true,
    config: {
      actions: {
        policy_sold: { points: 100, badge: 'closer' },
        renewal: { points: 50 },
        cross_sell: { points: 150, badge: 'upseller' },
        perfect_month: { points: 1000, badge: 'top_performer' },
      },
      leaderboards: {
        monthly: { top: 10, reset: 'first_day_of_month' },
        yearly: { top: 20, reset: 'january_1st' },
      },
    },
    icon: '🎮',
    color: '#A855F7',
    order: 11,
  },
  {
    slug: 'fraud-engine',
    name: 'Motor Anti-Fraude',
    description: 'Detección de fraude con ML (GNN, CV, NLP)',
    category: 'SECURITY' as MotorCategory,
    version: '2.1.0',
    enabled: true,
    config: {
      models: {
        claims: {
          model: 'fraud_detector_v3',
          threshold: 0.75,
          features: ['claim_amount', 'time_since_policy', 'previous_claims', 'image_authenticity'],
        },
        networks: {
          model: 'gnn_fraud_rings',
          minClusterSize: 3,
        },
      },
      actions: {
        high_risk: 'block_and_alert',
        medium_risk: 'manual_review',
        low_risk: 'log_only',
      },
    },
    icon: '🛡️',
    color: '#EF4444',
    order: 12,
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  console.log('🗑️  Cleaning existing motors...');
  await prisma.motorEvent.deleteMany();
  await prisma.motorMetric.deleteMany();
  await prisma.motorLog.deleteMany();
  await prisma.motorConfigHistory.deleteMany();
  await prisma.motorPermission.deleteMany();
  await prisma.motorAlert.deleteMany();
  await prisma.motorDependency.deleteMany();
  await prisma.motorSchedule.deleteMany();
  await prisma.motorSecret.deleteMany();
  await prisma.motor.deleteMany();

  // Create motors
  console.log('🎯 Creating motors...');
  for (const motor of MOTORS) {
    await prisma.motor.create({
      data: motor,
    });
    console.log(`  ✅ ${motor.name} (${motor.slug})`);
  }

  // Create sample metrics for each motor
  console.log('📊 Creating sample metrics...');
  const motors = await prisma.motor.findMany();

  for (const motor of motors) {
    await prisma.motorMetric.create({
      data: {
        motorId: motor.id,
        requestsPerHour: Math.floor(Math.random() * 2000) + 100,
        avgResponseTimeMs: Math.floor(Math.random() * 500) + 50,
        errorRate: Math.random() * 2,
        uptime: 99 + Math.random(),
        cpuUsage: Math.random() * 60,
        memoryUsageMB: Math.floor(Math.random() * 2000) + 500,
        activeConnections: Math.floor(Math.random() * 100),
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`📦 Created ${motors.length} motors with sample data`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
