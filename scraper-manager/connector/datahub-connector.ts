import { prisma } from '@/lib/prisma';
import { EventBus } from '@/lib/redis';

/**
 * DataHub Connector - Manages connection to the central DataHub/HubCenter
 */
export class DataHubConnector {
  private eventBus: EventBus;
  private isConnected: boolean = false;

  constructor() {
    this.eventBus = new EventBus();
  }

  /**
   * Connect to DataHub
   */
  async connect(): Promise<void> {
    console.log('🔗 Connecting to DataHub...');

    try {
      // Register DataHub module if not exists
      await prisma.module.upsert({
        where: { slug: 'datahub' },
        update: {
          status: 'ACTIVE',
          lastHealthCheck: new Date(),
        },
        create: {
          name: 'DataHub',
          slug: 'datahub',
          type: 'CORE',
          category: 'Data Management',
          isVital: true,
          isEnabled: true,
          version: '1.0.0',
          description: 'Central data hub for all scraped data',
        },
      });

      this.isConnected = true;
      console.log('✅ DataHub connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to DataHub:', error);
      throw error;
    }
  }

  /**
   * Insert client data into DataHub
   */
  async insertClient(clientData: any): Promise<void> {
    try {
      const client = await prisma.client.upsert({
        where: { nif: clientData.nif },
        update: {
          ...clientData,
          updatedAt: new Date(),
        },
        create: {
          ...clientData,
        },
      });

      console.log(`✅ Client inserted/updated: ${client.nif}`);

      // Publish event
      await this.eventBus.publish('datahub:client:upserted', {
        clientId: client.id,
        nif: client.nif,
      });

      return client;
    } catch (error) {
      console.error('❌ Failed to insert client:', error);
      throw error;
    }
  }

  /**
   * Bulk insert clients
   */
  async bulkInsertClients(clients: any[]): Promise<void> {
    console.log(`📥 Bulk inserting ${clients.length} clients...`);

    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
    };

    for (const clientData of clients) {
      try {
        await this.insertClient(clientData);
        results.inserted++;
      } catch (error) {
        console.error(`❌ Failed to insert client ${clientData.nif}:`, error);
        results.failed++;
      }
    }

    console.log(`✅ Bulk insert completed:`, results);

    // Publish summary event
    await this.eventBus.publish('datahub:bulk:completed', {
      type: 'clients',
      results,
    });
  }

  /**
   * Insert policy data
   */
  async insertPolicy(policyData: any): Promise<void> {
    try {
      const policy = await prisma.policy.upsert({
        where: { policyNumber: policyData.policyNumber },
        update: {
          ...policyData,
          updatedAt: new Date(),
        },
        create: {
          ...policyData,
        },
      });

      console.log(`✅ Policy inserted/updated: ${policy.policyNumber}`);

      await this.eventBus.publish('datahub:policy:upserted', {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
      });

      return policy;
    } catch (error) {
      console.error('❌ Failed to insert policy:', error);
      throw error;
    }
  }

  /**
   * Insert receipt data
   */
  async insertReceipt(receiptData: any): Promise<void> {
    try {
      const receipt = await prisma.receipt.upsert({
        where: { receiptNumber: receiptData.receiptNumber },
        update: {
          ...receiptData,
          updatedAt: new Date(),
        },
        create: {
          ...receiptData,
        },
      });

      console.log(`✅ Receipt inserted/updated: ${receipt.receiptNumber}`);

      await this.eventBus.publish('datahub:receipt:upserted', {
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
      });

      return receipt;
    } catch (error) {
      console.error('❌ Failed to insert receipt:', error);
      throw error;
    }
  }

  /**
   * Insert claim data
   */
  async insertClaim(claimData: any): Promise<void> {
    try {
      const claim = await prisma.claim.upsert({
        where: { claimNumber: claimData.claimNumber },
        update: {
          ...claimData,
          updatedAt: new Date(),
        },
        create: {
          ...claimData,
        },
      });

      console.log(`✅ Claim inserted/updated: ${claim.claimNumber}`);

      await this.eventBus.publish('datahub:claim:upserted', {
        claimId: claim.id,
        claimNumber: claim.claimNumber,
      });

      return claim;
    } catch (error) {
      console.error('❌ Failed to insert claim:', error);
      throw error;
    }
  }

  /**
   * Insert document data with OneDrive link
   */
  async insertDocument(documentData: any): Promise<void> {
    try {
      const document = await prisma.document.create({
        data: {
          ...documentData,
        },
      });

      console.log(`✅ Document inserted: ${document.fileName}`);

      await this.eventBus.publish('datahub:document:created', {
        documentId: document.id,
        fileName: document.fileName,
      });

      return document;
    } catch (error) {
      console.error('❌ Failed to insert document:', error);
      throw error;
    }
  }

  /**
   * Create client variant
   */
  async insertClientVariant(variantData: any): Promise<void> {
    try {
      const variant = await prisma.clientVariant.create({
        data: variantData,
      });

      console.log(`✅ Client variant inserted: ${variant.variantType}`);

      return variant;
    } catch (error) {
      console.error('❌ Failed to insert client variant:', error);
      throw error;
    }
  }

  /**
   * Get client by NIF
   */
  async getClient(nif: string): Promise<any | null> {
    return await prisma.client.findUnique({
      where: { nif },
      include: {
        policies: true,
        receipts: true,
        claims: true,
        documents: true,
        variants: true,
      },
    });
  }

  /**
   * Search clients
   */
  async searchClients(query: string): Promise<any[]> {
    return await prisma.client.findMany({
      where: {
        OR: [
          { nif: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50,
    });
  }

  /**
   * Check connection status
   */
  isDataHubConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from DataHub
   */
  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from DataHub...');
    this.isConnected = false;

    await prisma.module.update({
      where: { slug: 'datahub' },
      data: {
        status: 'INACTIVE',
      },
    });
  }
}
