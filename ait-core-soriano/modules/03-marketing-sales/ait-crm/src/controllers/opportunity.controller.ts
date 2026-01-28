import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OpportunityService } from '../services/opportunity.service';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
  FilterOpportunityDto,
  PipelineStage,
  CloseWonDto,
  CloseLostDto,
  ScheduleFollowUpDto
} from '../dto/opportunity.dto';
import { CreateActivityDto } from '../dto/activity.dto';

@ApiTags('Opportunities')
@ApiBearerAuth()
@Controller('opportunities')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Post()
  @ApiOperation({ summary: 'Create opportunity' })
  async create(@Body() dto: CreateOpportunityDto, @Request() req) {
    return await this.opportunityService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all opportunities' })
  async findAll(@Query() filters: FilterOpportunityDto) {
    return await this.opportunityService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get opportunity by ID' })
  async findOne(@Param('id') id: string) {
    return await this.opportunityService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update opportunity' })
  async update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto, @Request() req) {
    return await this.opportunityService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete opportunity' })
  async delete(@Param('id') id: string) {
    return await this.opportunityService.delete(id);
  }

  // Pipeline Management
  @Post(':id/move-stage')
  @ApiOperation({ summary: 'Move opportunity to stage' })
  async moveToStage(@Param('id') id: string, @Body('stage') stage: PipelineStage, @Request() req) {
    return await this.opportunityService.moveToStage(id, stage, req.user.id);
  }

  @Get('pipeline/by-stage/:stage')
  @ApiOperation({ summary: 'Get opportunities by stage' })
  async getByStage(@Param('stage') stage: PipelineStage) {
    return await this.opportunityService.getByStage(stage);
  }

  @Get('pipeline/view')
  @ApiOperation({ summary: 'Get pipeline view' })
  async getPipeline(@Query('agentId') agentId?: string) {
    return await this.opportunityService.getPipeline(agentId);
  }

  @Post(':id/calculate-probability')
  @ApiOperation({ summary: 'Calculate win probability' })
  async calculateProbability(@Param('id') id: string) {
    const opp = await this.opportunityService.findOne(id);
    const probability = await this.opportunityService.calculateProbability(opp);
    return { probability };
  }

  @Post(':id/update-probability')
  @ApiOperation({ summary: 'Update probability' })
  async updateProbability(@Param('id') id: string) {
    return await this.opportunityService.updateProbability(id);
  }

  @Get('forecast/revenue')
  @ApiOperation({ summary: 'Forecast revenue' })
  async forecastRevenue(@Query() filters?: FilterOpportunityDto) {
    return await this.opportunityService.forecastRevenue(filters);
  }

  @Get('pipeline/stale')
  @ApiOperation({ summary: 'Get stale opportunities' })
  async getStaleOpportunities(@Query('days') days?: number) {
    return await this.opportunityService.getStaleOpportunities(days);
  }

  @Post(':id/close-won')
  @ApiOperation({ summary: 'Close as won' })
  async closeWon(@Param('id') id: string, @Body() dto: CloseWonDto, @Request() req) {
    return await this.opportunityService.closeWon(id, dto, req.user.id);
  }

  @Post(':id/close-lost')
  @ApiOperation({ summary: 'Close as lost' })
  async closeLost(@Param('id') id: string, @Body() dto: CloseLostDto, @Request() req) {
    return await this.opportunityService.closeLost(id, dto, req.user.id);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen opportunity' })
  async reopen(@Param('id') id: string, @Body('reason') reason: string, @Request() req) {
    return await this.opportunityService.reopen(id, reason, req.user.id);
  }

  // Activities
  @Post(':id/activities')
  @ApiOperation({ summary: 'Log activity' })
  async logActivity(@Param('id') id: string, @Body() dto: CreateActivityDto, @Request() req) {
    return await this.opportunityService.logActivity(id, dto, req.user.id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get activities' })
  async getActivities(@Param('id') id: string) {
    return await this.opportunityService.getActivities(id);
  }

  @Post(':id/schedule-follow-up')
  @ApiOperation({ summary: 'Schedule follow-up' })
  async scheduleFollowUp(@Param('id') id: string, @Body() dto: ScheduleFollowUpDto, @Request() req) {
    return await this.opportunityService.scheduleFollowUp(id, dto, req.user.id);
  }

  @Get('activities/upcoming')
  @ApiOperation({ summary: 'Get upcoming activities' })
  async getUpcomingActivities(@Query('agentId') agentId: string) {
    return await this.opportunityService.getUpcomingActivities(agentId);
  }
}
