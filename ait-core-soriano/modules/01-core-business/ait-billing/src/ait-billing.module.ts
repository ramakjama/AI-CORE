import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BillingController } from './controllers/billing.controller';
import { PrismaService } from './shared/prisma.service';
import { BillingService } from './services/billing.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [BillingController],
  providers: [PrismaService, BillingService],
  exports: [PrismaService, BillingService],
})
export class AitBillingModule {}
