import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';

@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get()
  async getAllWorkflows() {
    return this.workflowsService.findAll();
  }

  @Get(':id')
  async getWorkflow(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Post()
  async createWorkflow(@Body() data: any) {
    return this.workflowsService.create(data);
  }

  @Post(':id/execute')
  async executeWorkflow(@Param('id') id: string) {
    return this.workflowsService.execute(id);
  }

  @Post(':id/pause')
  async pauseWorkflow(@Param('id') id: string) {
    return this.workflowsService.pause(id);
  }
}
