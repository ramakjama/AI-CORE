import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { EncashmentController } from './controllers/encashment.controller';
import { PrismaService } from './shared/prisma.service';
import { EncashmentService } from './services/encashment.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [EncashmentController],
  providers: [PrismaService, EncashmentService],
  exports: [PrismaService, EncashmentService],
})
export class AitEncashmentModule {}
