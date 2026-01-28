import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const scrapers = [
  {
    name: 'Ultimate Client Scraper',
    slug: 'ultimate-client-scraper',
    description: '5-star ultra scraper with screen recording, OCR, and deep data extraction capabilities',
    version: '1.0.0',
    category: 'CLIENT_DATA',
    techStack: ['Playwright', 'FFmpeg', 'Tesseract', 'Whisper', 'Sharp', 'Node.js'],
    features: [
      'Complete database download',
      'Screen recording with mouse cursor tracking',
      'Visual, text, audio, and transcription collection',
      'NIF-based client search',
      'Maximum depth extraction (tabs, subtabs, windows)',
      'Auto-add missing database fields',
      'Multiple client variants handling',
      'Complete backup system',
      'OCR processing',
      'Audio transcription',
    ],
    color: '#3B82F6',
    priority: 100,
    status: 'STOPPED',
  },
  {
    name: 'Document Downloader & Organizer',
    slug: 'document-scraper',
    description: 'Download and organize all client documents with OneDrive integration',
    version: '1.0.0',
    category: 'DOCUMENTS',
    techStack: ['Playwright', 'Microsoft Graph API', 'OneDrive', 'Node.js'],
    features: [
      'Download ALL client documents',
      'Certificates, policies, receipts, claims',
      'OneDrive structure mirroring',
      'Organization by Client NIF / Type / Date',
      'Automatic upload to OneDrive',
      'Database indexing',
    ],
    color: '#10B981',
    priority: 90,
    status: 'STOPPED',
  },
  {
    name: 'Portfolio Surveillance',
    slug: 'portfolio-surveillance',
    description: 'Monitor portfolio and download surveillance database',
    version: '1.0.0',
    category: 'PORTFOLIO',
    techStack: ['Playwright', 'Excel.js', 'Prisma', 'Node.js'],
    features: [
      'Portfolio surveillance database download',
      'Excel/CSV export processing',
      'Data normalization',
      'Automated reporting',
      'Alert detection',
    ],
    color: '#F59E0B',
    priority: 80,
    status: 'STOPPED',
  },
  {
    name: 'Portfolio Defense',
    slug: 'portfolio-defense',
    description: 'Download and process portfolio defense data',
    version: '1.0.0',
    category: 'PORTFOLIO',
    techStack: ['Playwright', 'Excel.js', 'Prisma', 'Node.js'],
    features: [
      'Portfolio defense database download',
      'Excel processing pipeline',
      'DataAdmin integration',
      'Defense strategy tracking',
    ],
    color: '#EF4444',
    priority: 75,
    status: 'STOPPED',
  },
  {
    name: 'Main Database Downloader',
    slug: 'main-db-downloader',
    description: 'Download complete portal database (Candidates, Policies, Receipts, Claims)',
    version: '1.0.0',
    category: 'DATABASE',
    techStack: ['Playwright', 'Prisma', 'PostgreSQL', 'Node.js'],
    features: [
      'Complete database extraction',
      'Candidates, Policies, Receipts, Claims',
      'Prisma ORM integration',
      'DataAdmin module connectivity',
      'Connector-based module linking',
    ],
    color: '#8B5CF6',
    priority: 95,
    status: 'STOPPED',
  },
  {
    name: 'OneDrive Analyzer & Optimizer',
    slug: 'onedrive-optimizer',
    description: 'Analyze, optimize, and reorganize OneDrive structure with AI',
    version: '1.0.0',
    category: 'CLOUD',
    techStack: ['Microsoft Graph API', 'OpenAI', 'Elasticsearch', 'Node.js'],
    features: [
      'Complete OneDrive structure analysis',
      'Duplicate detection',
      'Large file identification',
      'Unused file detection (>1 year)',
      'AI-powered reorganization proposals',
      'Visual reports',
      'Automated action execution',
    ],
    color: '#06B6D4',
    priority: 70,
    status: 'STOPPED',
  },
  {
    name: 'Microsoft 365 Auto-Configurator',
    slug: 'm365-configurator',
    description: 'Auto-configure M365 organization with best practices',
    version: '1.0.0',
    category: 'CLOUD',
    techStack: ['Microsoft Graph API', 'Azure AD API', 'PowerShell', 'Node.js'],
    features: [
      'M365 organization analysis',
      'Exchange Online auto-configuration',
      'SharePoint site setup',
      'Teams channel configuration',
      'OneDrive quotas and sharing',
      'Security & Compliance policies',
      'Azure AD user and group management',
      'Best practices application',
    ],
    color: '#0EA5E9',
    priority: 65,
    status: 'STOPPED',
  },
  {
    name: 'AI-Powered Data Enrichment',
    slug: 'ai-enrichment',
    description: 'Enrich client data with AI-powered insights and predictions',
    version: '1.0.0',
    category: 'AI_ML',
    techStack: ['OpenAI GPT-4', 'LangChain', 'Pinecone', 'pgvector', 'Node.js'],
    features: [
      'Client pattern analysis',
      'Churn risk prediction',
      'Cross-sell opportunity identification',
      'Automatic client categorization',
      'GPT-4 document insight extraction',
      'Client summaries generation',
      'Vector database integration',
    ],
    color: '#EC4899',
    priority: 85,
    status: 'STOPPED',
  },
  {
    name: 'Competitor Intelligence',
    slug: 'competitor-intel',
    description: 'Monitor competitors and track market changes',
    version: '1.0.0',
    category: 'INTELLIGENCE',
    techStack: ['Playwright', 'Cheerio', 'OpenAI', 'Elasticsearch', 'Node.js'],
    features: [
      'Competitor website monitoring',
      'Pricing change tracking',
      'Product analysis',
      'Competitive analysis reports',
      'Market change alerts',
      'Trend detection',
    ],
    color: '#F97316',
    priority: 60,
    status: 'STOPPED',
  },
];

const modules = [
  {
    name: 'DataHub',
    slug: 'datahub',
    type: 'CORE',
    category: 'Data Management',
    isVital: true,
    isEnabled: true,
    version: '1.0.0',
    description: 'Central data hub for all scraped data',
  },
  {
    name: 'Document Manager',
    slug: 'document-manager',
    type: 'VITAL',
    category: 'Document Management',
    isVital: true,
    isEnabled: true,
    version: '1.0.0',
    description: 'Manages all document storage and retrieval',
    dependencies: ['datahub'],
  },
  {
    name: 'Portfolio Manager',
    slug: 'portfolio-manager',
    type: 'VITAL',
    category: 'Portfolio Management',
    isVital: true,
    isEnabled: true,
    version: '1.0.0',
    description: 'Manages portfolio surveillance and defense',
    dependencies: ['datahub'],
  },
  {
    name: 'CRM Integration',
    slug: 'crm',
    type: 'EXTERNAL',
    category: 'Customer Relationship',
    isVital: false,
    isEnabled: true,
    version: '1.0.0',
    description: 'External CRM system integration',
    dependencies: ['datahub'],
  },
  {
    name: 'Analytics Engine',
    slug: 'analytics',
    type: 'INTERNAL',
    category: 'Analytics',
    isVital: false,
    isEnabled: true,
    version: '1.0.0',
    description: 'Analytics and reporting engine',
    dependencies: ['datahub'],
  },
];

async function main() {
  console.log('🌱 Seeding database...');

  // Seed scrapers
  console.log('\n📦 Creating scrapers...');
  for (const scraper of scrapers) {
    const created = await prisma.scraper.upsert({
      where: { slug: scraper.slug },
      update: scraper,
      create: scraper,
    });
    console.log(`✅ Created scraper: ${created.name}`);

    // Create default config
    await prisma.scraperConfig.upsert({
      where: { scraperId: created.id },
      update: {},
      create: {
        scraperId: created.id,
        enabled: true,
        maxRetries: 3,
        timeout: 300000,
        useDatabase: true,
        settings: {},
      },
    });
  }

  // Seed modules
  console.log('\n🔌 Creating modules...');
  for (const module of modules) {
    const created = await prisma.module.upsert({
      where: { slug: module.slug },
      update: module,
      create: module,
    });
    console.log(`✅ Created module: ${created.name}`);
  }

  console.log('\n✅ Database seeded successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`   - ${scrapers.length} scrapers created`);
  console.log(`   - ${modules.length} modules created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
