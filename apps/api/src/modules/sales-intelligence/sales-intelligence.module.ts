import { Module } from '@nestjs/common';
import { SalesIntelligenceService } from './sales-intelligence.service';
import { SalesIntelligenceController } from './sales-intelligence.controller';
// import { SalesIntelligenceResolver } from './sales-intelligence.resolver';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [
    SalesIntelligenceService,
    // SalesIntelligenceResolver,
    PrismaService,
  ],
  controllers: [SalesIntelligenceController],
  exports: [SalesIntelligenceService],
})
export class SalesIntelligenceModule {}
