import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
// import { TicketsResolver } from './tickets.resolver';
import { PrismaService } from '../../database/prisma.service';

@Module({
  providers: [
    TicketsService,
    // TicketsResolver,
    PrismaService,
  ],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
