import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { AIAgentsService } from './ai-agents.service';

@Controller('ai-agents')
export class AIAgentsController {
  constructor(private readonly aiAgentsService: AIAgentsService) {}

  /**
   * POST /ai-agents/cfo/analyze-cash-flow
   */
  @Post('cfo/analyze-cash-flow')
  async analyzeCashFlow(@Body() data: any) {
    return this.aiAgentsService.analyzeCashFlow(data);
  }

  /**
   * POST /ai-agents/cfo/optimize-budget
   */
  @Post('cfo/optimize-budget')
  async optimizeBudget(@Body() body: { currentBudget: any; constraints?: any }) {
    return this.aiAgentsService.optimizeBudget(body.currentBudget, body.constraints);
  }

  /**
   * POST /ai-agents/cfo/detect-anomalies
   */
  @Post('cfo/detect-anomalies')
  async detectAnomalies(@Body() body: { historical: any; current: any }) {
    return this.aiAgentsService.detectAnomalies(body.historical, body.current);
  }

  /**
   * POST /ai-agents/cfo/generate-report
   */
  @Post('cfo/generate-report')
  async generateReport(@Body() body: { data: any; period: string }) {
    return this.aiAgentsService.generateReport(body.data, body.period);
  }

  /**
   * POST /ai-agents/cfo/chat
   */
  @Post('cfo/chat')
  async chat(@Body() body: { message: string; context?: any }) {
    return {
      response: await this.aiAgentsService.chat(body.message, body.context),
    };
  }

  /**
   * POST /ai-agents/tasks
   */
  @Post('tasks')
  async executeTask(
    @Body() body: { type: string; input: any; priority?: 'high' | 'medium' | 'low' }
  ) {
    return this.aiAgentsService.executeTask(body.type, body.input, body.priority);
  }

  /**
   * GET /ai-agents/tasks/:taskId
   */
  @Get('tasks/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    return this.aiAgentsService.getTaskStatus(taskId);
  }

  /**
   * GET /ai-agents/tasks
   */
  @Get('tasks')
  async getAllTasks() {
    return this.aiAgentsService.getAllTasks();
  }

  /**
   * GET /ai-agents/stats
   */
  @Get('stats')
  async getStats() {
    return this.aiAgentsService.getStats();
  }
}
