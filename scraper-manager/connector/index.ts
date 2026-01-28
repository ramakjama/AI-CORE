import { EventBus } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { ModuleRegistry } from './module-registry';
import { DataHubConnector } from './datahub-connector';

export class UniversalConnector {
  private eventBus: EventBus;
  private moduleRegistry: ModuleRegistry;
  private dataHubConnector: DataHubConnector;

  constructor() {
    this.eventBus = new EventBus();
    this.moduleRegistry = new ModuleRegistry();
    this.dataHubConnector = new DataHubConnector();
  }

  /**
   * Initialize the connector system
   */
  async initialize(): Promise<void> {
    console.log('🔌 Initializing Universal Connector...');

    // Register all modules
    await this.moduleRegistry.discoverModules();

    // Setup event subscriptions
    await this.setupEventHandlers();

    // Initialize DataHub connection
    await this.dataHubConnector.connect();

    console.log('✅ Universal Connector initialized successfully');
  }

  /**
   * Setup event handlers for module communication
   */
  private async setupEventHandlers(): Promise<void> {
    // Handle data sync events
    await this.eventBus.subscribe('data:sync', async (event) => {
      console.log('📥 Data sync event received:', event);
      await this.handleDataSync(event);
    });

    // Handle module events
    await this.eventBus.subscribe('module:event', async (event) => {
      console.log('📡 Module event received:', event);
      await this.handleModuleEvent(event);
    });

    // Handle scraper completion events
    await this.eventBus.subscribe('scraper:completed', async (event) => {
      console.log('✅ Scraper completed:', event);
      await this.handleScraperCompletion(event);
    });
  }

  /**
   * Handle data synchronization between modules
   */
  private async handleDataSync(event: any): Promise<void> {
    const { sourceModule, targetModule, data, dataType } = event;

    try {
      // Validate modules
      const source = await this.moduleRegistry.getModule(sourceModule);
      const target = await this.moduleRegistry.getModule(targetModule);

      if (!source || !target) {
        throw new Error('Invalid source or target module');
      }

      // Transform data if needed
      const transformedData = await this.transformData(data, dataType, source, target);

      // Send to target module
      await this.sendToModule(target, transformedData);

      // Log the sync
      await this.logModuleEvent(targetModule, 'DATA_SYNC', {
        from: sourceModule,
        dataType,
        itemCount: Array.isArray(data) ? data.length : 1,
      });

      console.log(`✅ Data synced from ${sourceModule} to ${targetModule}`);
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      throw error;
    }
  }

  /**
   * Handle general module events
   */
  private async handleModuleEvent(event: any): Promise<void> {
    const { moduleId, eventType, payload } = event;

    await prisma.moduleEvent.create({
      data: {
        moduleId,
        eventType,
        eventName: eventType,
        payload,
        status: 'PENDING',
      },
    });

    // Broadcast to subscribers
    await this.eventBus.publish(`module:${moduleId}:${eventType}`, payload);
  }

  /**
   * Handle scraper completion and trigger downstream actions
   */
  private async handleScraperCompletion(event: any): Promise<void> {
    const { scraperId, executionId, data } = event;

    // Get scraper info
    const scraper = await prisma.scraper.findUnique({
      where: { id: scraperId },
    });

    if (!scraper) return;

    // Determine which modules should receive this data
    const targetModules = await this.determineTargetModules(scraper.category);

    // Sync data to each target module
    for (const module of targetModules) {
      await this.eventBus.publish('data:sync', {
        sourceModule: scraper.slug,
        targetModule: module.slug,
        data,
        dataType: scraper.category,
      });
    }
  }

  /**
   * Transform data between module formats
   */
  private async transformData(
    data: any,
    dataType: string,
    source: any,
    target: any
  ): Promise<any> {
    // Implement data transformation logic based on source and target formats
    // This is a placeholder - implement actual transformation logic
    return data;
  }

  /**
   * Send data to a specific module
   */
  private async sendToModule(module: any, data: any): Promise<void> {
    if (module.apiEndpoint) {
      // Send via HTTP API
      const response = await fetch(module.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to send data to ${module.name}`);
      }
    } else if (module.webhookUrl) {
      // Send via webhook
      await fetch(module.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    // Update module health status
    await prisma.module.update({
      where: { id: module.id },
      data: { lastHealthCheck: new Date(), healthStatus: 'HEALTHY' },
    });
  }

  /**
   * Determine which modules should receive data based on category
   */
  private async determineTargetModules(category: string): Promise<any[]> {
    const categoryModuleMap: Record<string, string[]> = {
      CLIENT_DATA: ['datahub', 'crm', 'analytics'],
      DOCUMENTS: ['datahub', 'document-manager'],
      PORTFOLIO: ['datahub', 'portfolio-manager'],
      DATABASE: ['datahub'],
    };

    const moduleNames = categoryModuleMap[category] || ['datahub'];

    return await prisma.module.findMany({
      where: {
        slug: { in: moduleNames },
        isEnabled: true,
      },
    });
  }

  /**
   * Log module event
   */
  private async logModuleEvent(
    moduleId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    await prisma.moduleEvent.create({
      data: {
        moduleId,
        eventType,
        eventName: eventType,
        payload,
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
  }

  /**
   * Register a new module
   */
  async registerModule(moduleData: {
    name: string;
    slug: string;
    type: string;
    isVital?: boolean;
    apiEndpoint?: string;
    webhookUrl?: string;
  }): Promise<void> {
    await this.moduleRegistry.registerModule(moduleData);
  }

  /**
   * Publish an event to the event bus
   */
  async publishEvent(channel: string, data: any): Promise<void> {
    await this.eventBus.publish(channel, data);
  }

  /**
   * Subscribe to events
   */
  async subscribe(channel: string, callback: (data: any) => void): Promise<void> {
    await this.eventBus.subscribe(channel, callback);
  }
}

// Export singleton instance
export const connector = new UniversalConnector();
