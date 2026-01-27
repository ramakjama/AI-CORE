import { Module } from '@nestjs/common';
import { AIAgentsController } from './ai-agents.controller';
import { AIAgentsService } from './ai-agents.service';
import { AIAgentsResolver } from './ai-agents.resolver';

@Module({
  controllers: [AIAgentsController],
  providers: [AIAgentsService, AIAgentsResolver],
  exports: [AIAgentsService],
})
export class AIAgentsModule {}
