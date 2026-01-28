import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear scrapers
  const scrapers = [
    {
      slug: 'ultimate-client-scraper',
      name: 'Ultimate Client Scraper',
      description: 'Scraper ultra completo con trazabilidad máxima, screen recording, OCR y extracción profunda',
      version: '1.0.0',
      status: 'active',
      category: 'client-data',
      techStack: ['Playwright', 'FFmpeg', 'Tesseract', 'Whisper', 'Prisma', 'PostgreSQL'],
      features: [
        'Screen recording con cursor',
        'OCR de imágenes',
        'Extracción máxima profundidad',
        'Auto-añade campos a BD',
        'Manejo de variantes de cliente',
      ],
      config: {
        maxDepth: 10,
        screenshotEveryStep: true,
        recordScreen: true,
        enableOCR: true,
        timeout: 30000,
      },
    },
    {
      slug: 'document-scraper',
      name: 'Document Downloader & Organizer',
      description: 'Descarga todos los documentos del cliente y los organiza en OneDrive',
      version: '1.0.0',
      status: 'active',
      category: 'documents',
      techStack: ['Playwright', 'Microsoft Graph API', 'Prisma'],
      features: [
        'Descarga certificados, pólizas, recibos',
        'Estructura en OneDrive',
        'Indexación en BD',
        'Organización automática',
      ],
      config: {
        uploadToOneDrive: true,
        createFolderStructure: true,
      },
    },
    {
      slug: 'portfolio-surveillance',
      name: 'Portfolio Surveillance Scraper',
      description: 'Descarga y procesa la base de datos de vigilancia de cartera',
      version: '1.0.0',
      status: 'active',
      category: 'portfolio',
      techStack: ['Playwright', 'Prisma', 'Excel Parser'],
      features: [
        'Descarga datos de vigilancia',
        'Procesamiento automático',
        'Reportes generados',
      ],
      config: {},
    },
    {
      slug: 'portfolio-defense',
      name: 'Portfolio Defense Scraper',
      description: 'Descarga y procesa la base de datos de defensa de cartera',
      version: '1.0.0',
      status: 'active',
      category: 'portfolio',
      techStack: ['Playwright', 'Prisma', 'Excel Parser'],
      features: [
        'Descarga datos de defensa',
        'Procesamiento automático',
        'Integración con DataAdmin',
      ],
      config: {},
    },
    {
      slug: 'main-db-downloader',
      name: 'Main Database Downloader',
      description: 'Descarga los Excel principales que forman la base de datos',
      version: '1.0.0',
      status: 'active',
      category: 'database',
      techStack: ['Playwright', 'Prisma', 'Connector'],
      features: [
        'Descarga Candidatos, Pólizas, Recibos, Siniestros',
        'Pasa a Prisma',
        'Inserta en DataAdmin',
        'Conecta con módulos vitales',
      ],
      config: {
        files: ['candidatos', 'polizas', 'recibos', 'siniestros'],
      },
    },
    {
      slug: 'onedrive-optimizer',
      name: 'OneDrive Analyzer & Optimizer',
      description: 'Analiza OneDrive y propone optimizaciones',
      version: '1.0.0',
      status: 'active',
      category: 'cloud',
      techStack: ['Microsoft Graph API', 'AI/ML', 'Elasticsearch'],
      features: [
        'Detecta duplicados',
        'Analiza uso de espacio',
        'Propone reorganización',
        'Limpieza automática',
      ],
      config: {
        enableAI: true,
        autoCleanup: false,
      },
    },
    {
      slug: 'm365-configurator',
      name: 'Microsoft 365 Auto-Configurator',
      description: 'Configura automáticamente Microsoft 365',
      version: '1.0.0',
      status: 'active',
      category: 'cloud',
      techStack: ['Microsoft Graph API', 'Azure AD', 'PowerShell'],
      features: [
        'Configura Exchange Online',
        'Setup SharePoint y Teams',
        'Reglas de seguridad',
        'Workflows automatizados',
      ],
      config: {
        applyBestPractices: true,
      },
    },
    {
      slug: 'ai-enrichment',
      name: 'AI-Powered Data Enrichment',
      description: 'Enriquece datos de clientes con IA',
      version: '1.0.0',
      status: 'active',
      category: 'ai',
      techStack: ['OpenAI GPT-4', 'LangChain', 'Pinecone'],
      features: [
        'Predice churn risk',
        'Sugiere cross-sell',
        'Categorización automática',
        'Insights de documentos',
      ],
      config: {
        model: 'gpt-4',
        enableVectorDB: true,
      },
    },
    {
      slug: 'competitor-intel',
      name: 'Competitor Intelligence',
      description: 'Monitorea competidores y analiza mercado',
      version: '1.0.0',
      status: 'active',
      category: 'intelligence',
      techStack: ['Playwright', 'AI/ML', 'Alerting'],
      features: [
        'Monitoreo de precios',
        'Análisis de productos',
        'Alertas de cambios',
        'Reportes competitivos',
      ],
      config: {
        competitors: [],
        checkInterval: 3600000, // 1 hora
      },
    },
  ];

  for (const scraper of scrapers) {
    await prisma.scraper.upsert({
      where: { slug: scraper.slug },
      update: scraper,
      create: scraper,
    });
    console.log(`✓ Scraper created: ${scraper.name}`);
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
