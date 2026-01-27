import { Module } from '@nestjs/common';
import { AgentsResolver } from './agents.resolver';
import { AgentsService } from './agents.service';

@Module({
  providers: [AgentsResolver, AgentsService],
})
export class AgentsModule {}
