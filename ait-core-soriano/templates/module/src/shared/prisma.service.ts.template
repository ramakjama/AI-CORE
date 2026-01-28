/**
 * PrismaService - Shared Database Service
 *
 * Manages database connections with lifecycle hooks
 * Compatible with multi-tenant architecture
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database...');
    await this.$connect();
    this.logger.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('✅ Database disconnected');
  }

  /**
   * Clean database (for testing only)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ Cannot clean database in production');
    }

    const tablenames = await this.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          this.logger.error(`Error truncating ${tablename}:`, error);
        }
      }
    }
    this.logger.log('🧹 Database cleaned');
  }

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = await this.$queryRaw<any[]>`
      SELECT
        schemaname,
        tablename,
        pg_total_relation_size(schemaname||'.'||tablename) AS total_bytes,
        pg_relation_size(schemaname||'.'||tablename) AS data_bytes,
        pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename) AS external_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    return stats;
  }
}
