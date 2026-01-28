import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { CreateActivityDto, UpdateActivityDto, FilterActivityDto, LogCallDto, LogEmailDto, LogMeetingDto, LogNoteDto, LogTaskDto, LogDemoDto, LogProposalDto, LogDocumentDto } from '../dto/activity.dto';
import { Response } from 'express';

@ApiTags('Activities')
@ApiBearerAuth()
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Create activity' })
  async create(@Body() dto: CreateActivityDto, @Request() req) {
    return await this.activityService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities' })
  async findAll(@Query() filters: FilterActivityDto) {
    return await this.activityService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity by ID' })
  async findOne(@Param('id') id: string) {
    return await this.activityService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update activity' })
  async update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return await this.activityService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete activity' })
  async delete(@Param('id') id: string) {
    return await this.activityService.delete(id);
  }

  // Activity Types
  @Post('log-call')
  @ApiOperation({ summary: 'Log a call' })
  async logCall(@Body() dto: LogCallDto, @Request() req) {
    return await this.activityService.logCall(dto, req.user.id);
  }

  @Post('log-email')
  @ApiOperation({ summary: 'Log an email' })
  async logEmail(@Body() dto: LogEmailDto, @Request() req) {
    return await this.activityService.logEmail(dto, req.user.id);
  }

  @Post('log-meeting')
  @ApiOperation({ summary: 'Log a meeting' })
  async logMeeting(@Body() dto: LogMeetingDto, @Request() req) {
    return await this.activityService.logMeeting(dto, req.user.id);
  }

  @Post('log-note')
  @ApiOperation({ summary: 'Log a note' })
  async logNote(@Body() dto: LogNoteDto, @Request() req) {
    return await this.activityService.logNote(dto, req.user.id);
  }

  @Post('log-task')
  @ApiOperation({ summary: 'Log a task' })
  async logTask(@Body() dto: LogTaskDto, @Request() req) {
    return await this.activityService.logTask(dto, req.user.id);
  }

  @Post('log-demo')
  @ApiOperation({ summary: 'Log a demo' })
  async logDemo(@Body() dto: LogDemoDto, @Request() req) {
    return await this.activityService.logDemo(dto, req.user.id);
  }

  @Post('log-proposal')
  @ApiOperation({ summary: 'Log a proposal' })
  async logProposal(@Body() dto: LogProposalDto, @Request() req) {
    return await this.activityService.logProposal(dto, req.user.id);
  }

  @Post('log-document')
  @ApiOperation({ summary: 'Log a document' })
  async logDocument(@Body() dto: LogDocumentDto, @Request() req) {
    return await this.activityService.logDocument(dto, req.user.id);
  }

  // Timeline
  @Get('timeline/:entityType/:entityId')
  @ApiOperation({ summary: 'Get activity timeline' })
  async getTimeline(@Param('entityType') entityType: 'lead' | 'opportunity' | 'customer', @Param('entityId') entityId: string) {
    return await this.activityService.getTimeline(entityType, entityId);
  }

  @Get('agent/:agentId/recent')
  @ApiOperation({ summary: 'Get recent activities' })
  async getRecentActivities(@Param('agentId') agentId: string, @Query('days') days?: number) {
    return await this.activityService.getRecentActivities(agentId, days);
  }

  @Get('agent/:agentId/summary')
  @ApiOperation({ summary: 'Get activity summary' })
  async getActivitySummary(@Param('agentId') agentId: string, @Query('period') period?: 'day' | 'week' | 'month') {
    return await this.activityService.getActivitySummary(agentId, period);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export activities' })
  async exportActivities(@Query() filters: FilterActivityDto, @Res() res: Response) {
    const buffer = await this.activityService.exportActivities(filters);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=activities-export.xlsx');
    res.send(buffer);
  }
}
