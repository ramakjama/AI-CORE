import { PrismaClient as GlobalClient } from '../../../databases/sm_global/generated/client';
import { PrismaClient as InsuranceClient } from '../../../databases/ss_insurance/generated/client';
import { PrismaClient as EnergyClient } from '../../../databases/se_energy/generated/client';
import { PrismaClient as TelecomClient } from '../../../databases/st_telecom/generated/client';
import { PrismaClient as FinanceClient } from '../../../databases/sf_finance/generated/client';
import { PrismaClient as RepairsClient } from '../../../databases/sr_repairs/generated/client';
import { PrismaClient as WorkshopsClient } from '../../../databases/sw_workshops/generated/client';
import { PrismaClient as AuthClient } from '../../../databases/sm_auth/generated/client';
import { PrismaClient as AuditClient } from '../../../databases/sm_audit/generated/client';
import { PrismaClient as AnalyticsClient } from '../../../databases/sm_analytics/generated/client';
import { PrismaClient as CommunicationsClient } from '../../../databases/sm_communications/generated/client';
import { PrismaClient as DocumentsClient } from '../../../databases/sm_documents/generated/client';
import { PrismaClient as AIAgentsClient } from '../../../databases/sm_ai_agents/generated/client';

export class DatabaseService {
  // Core databases
  public global: GlobalClient;
  public auth: AuthClient;
  public audit: AuditClient;
  
  // Business area databases
  public insurance: InsuranceClient;
  public energy: EnergyClient;
  public telecom: TelecomClient;
  public finance: FinanceClient;
  public repairs: RepairsClient;
  public workshops: WorkshopsClient;
  
  // Support databases
  public analytics: AnalyticsClient;
  public communications: CommunicationsClient;
  public documents: DocumentsClient;
  public aiAgents: AIAgentsClient;

  private static instance: DatabaseService;

  private constructor() {
    // Initialize all database connections
    this.global = new GlobalClient({
      datasources: {
        db: {
          url: process.env.SM_GLOBAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_global'
        }
      }
    });

    this.auth = new AuthClient({
      datasources: {
        db: {
          url: process.env.SM_AUTH_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_auth'
        }
      }
    });

    this.audit = new AuditClient({
      datasources: {
        db: {
          url: process.env.SM_AUDIT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_audit'
        }
      }
    });

    this.insurance = new InsuranceClient({
      datasources: {
        db: {
          url: process.env.SS_INSURANCE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ss_insurance'
        }
      }
    });

    this.energy = new EnergyClient({
      datasources: {
        db: {
          url: process.env.SE_ENERGY_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/se_energy'
        }
      }
    });

    this.telecom = new TelecomClient({
      datasources: {
        db: {
          url: process.env.ST_TELECOM_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/st_telecom'
        }
      }
    });

    this.finance = new FinanceClient({
      datasources: {
        db: {
          url: process.env.SF_FINANCE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sf_finance'
        }
      }
    });

    this.repairs = new RepairsClient({
      datasources: {
        db: {
          url: process.env.SR_REPAIRS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sr_repairs'
        }
      }
    });

    this.workshops = new WorkshopsClient({
      datasources: {
        db: {
          url: process.env.SW_WORKSHOPS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sw_workshops'
        }
      }
    });

    this.analytics = new AnalyticsClient({
      datasources: {
        db: {
          url: process.env.SM_ANALYTICS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_analytics'
        }
      }
    });

    this.communications = new CommunicationsClient({
      datasources: {
        db: {
          url: process.env.SM_COMMUNICATIONS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_communications'
        }
      }
    });

    this.documents = new DocumentsClient({
      datasources: {
        db: {
          url: process.env.SM_DOCUMENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_documents'
        }
      }
    });

    this.aiAgents = new AIAgentsClient({
      datasources: {
        db: {
          url: process.env.SM_AI_AGENTS_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sm_ai_agents'
        }
      }
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async connect(): Promise<void> {
    try {
      await Promise.all([
        this.global.$connect(),
        this.auth.$connect(),
        this.audit.$connect(),
        this.insurance.$connect(),
        this.energy.$connect(),
        this.telecom.$connect(),
        this.finance.$connect(),
        this.repairs.$connect(),
        this.workshops.$connect(),
        this.analytics.$connect(),
        this.communications.$connect(),
        this.documents.$connect(),
        this.aiAgents.$connect(),
      ]);
      console.log('✅ All databases connected successfully');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.global.$disconnect(),
      this.auth.$disconnect(),
      this.audit.$disconnect(),
      this.insurance.$disconnect(),
      this.energy.$disconnect(),
      this.telecom.$disconnect(),
      this.finance.$disconnect(),
      this.repairs.$disconnect(),
      this.workshops.$disconnect(),
      this.analytics.$disconnect(),
      this.communications.$disconnect(),
      this.documents.$disconnect(),
      this.aiAgents.$disconnect(),
    ]);
    console.log('✅ All databases disconnected');
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const checks: Record<string, boolean> = {};

    try {
      await this.global.$queryRaw`SELECT 1`;
      checks.global = true;
    } catch {
      checks.global = false;
    }

    try {
      await this.auth.$queryRaw`SELECT 1`;
      checks.auth = true;
    } catch {
      checks.auth = false;
    }

    try {
      await this.audit.$queryRaw`SELECT 1`;
      checks.audit = true;
    } catch {
      checks.audit = false;
    }

    try {
      await this.insurance.$queryRaw`SELECT 1`;
      checks.insurance = true;
    } catch {
      checks.insurance = false;
    }

    try {
      await this.energy.$queryRaw`SELECT 1`;
      checks.energy = true;
    } catch {
      checks.energy = false;
    }

    try {
      await this.telecom.$queryRaw`SELECT 1`;
      checks.telecom = true;
    } catch {
      checks.telecom = false;
    }

    try {
      await this.finance.$queryRaw`SELECT 1`;
      checks.finance = true;
    } catch {
      checks.finance = false;
    }

    try {
      await this.repairs.$queryRaw`SELECT 1`;
      checks.repairs = true;
    } catch {
      checks.repairs = false;
    }

    try {
      await this.workshops.$queryRaw`SELECT 1`;
      checks.workshops = true;
    } catch {
      checks.workshops = false;
    }

    try {
      await this.analytics.$queryRaw`SELECT 1`;
      checks.analytics = true;
    } catch {
      checks.analytics = false;
    }

    try {
      await this.communications.$queryRaw`SELECT 1`;
      checks.communications = true;
    } catch {
      checks.communications = false;
    }

    try {
      await this.documents.$queryRaw`SELECT 1`;
      checks.documents = true;
    } catch {
      checks.documents = false;
    }

    try {
      await this.aiAgents.$queryRaw`SELECT 1`;
      checks.aiAgents = true;
    } catch {
      checks.aiAgents = false;
    }

    return checks;
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance();

// Helper function for connection
export async function connectDatabase(): Promise<void> {
  await db.connect();
}

// Helper function for disconnection
export async function disconnectDatabase(): Promise<void> {
  await db.disconnect();
}
