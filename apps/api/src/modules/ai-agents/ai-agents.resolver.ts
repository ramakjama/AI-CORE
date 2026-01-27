import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AIAgentsService } from './ai-agents.service';

@Resolver('AIAgent')
export class AIAgentsResolver {
  constructor(private readonly aiAgentsService: AIAgentsService) {}

  @Mutation('analyzeCashFlow')
  async analyzeCashFlow(@Args('data') data: any) {
    return this.aiAgentsService.analyzeCashFlow(data);
  }

  @Mutation('optimizeBudget')
  async optimizeBudget(
    @Args('currentBudget') currentBudget: any,
    @Args('constraints') constraints?: any
  ) {
    return this.aiAgentsService.optimizeBudget(currentBudget, constraints);
  }

  @Mutation('detectAnomalies')
  async detectAnomalies(@Args('historical') historical: any, @Args('current') current: any) {
    return this.aiAgentsService.detectAnomalies(historical, current);
  }

  @Mutation('generateReport')
  async generateReport(@Args('data') data: any, @Args('period') period: string) {
    return this.aiAgentsService.generateReport(data, period);
  }

  @Mutation('chatWithCFO')
  async chatWithCFO(@Args('message') message: string, @Args('context') context?: any) {
    const response = await this.aiAgentsService.chat(message, context);
    return { response };
  }

  @Mutation('executeAgentTask')
  async executeAgentTask(
    @Args('type') type: string,
    @Args('input') input: any,
    @Args('priority') priority?: string
  ) {
    return this.aiAgentsService.executeTask(type, input, priority as any);
  }

  @Query('agentTaskStatus')
  async agentTaskStatus(@Args('taskId') taskId: string) {
    return this.aiAgentsService.getTaskStatus(taskId);
  }

  @Query('allAgentTasks')
  async allAgentTasks() {
    return this.aiAgentsService.getAllTasks();
  }

  @Query('agentStats')
  async agentStats() {
    return this.aiAgentsService.getStats();
  }
}
