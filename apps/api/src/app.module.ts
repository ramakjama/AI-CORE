import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';
import { ExpertsModule } from './modules/experts/experts.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { SalesIntelligenceModule } from './modules/sales-intelligence/sales-intelligence.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ExpertsModule,
    TicketsModule,
    SalesIntelligenceModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
