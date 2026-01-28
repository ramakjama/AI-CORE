import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignService } from '../services/campaign.service';
import { CreateCampaignDto, UpdateCampaignDto, FilterCampaignDto, CreateSegmentDto } from '../dto/campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  @ApiOperation({ summary: 'Create campaign' })
  async create(@Body() dto: CreateCampaignDto, @Request() req) {
    return await this.campaignService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns' })
  async findAll(@Query() filters: FilterCampaignDto) {
    return await this.campaignService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  async findOne(@Param('id') id: string) {
    return await this.campaignService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  async update(@Param('id') id: string, @Body() dto: UpdateCampaignDto, @Request() req) {
    return await this.campaignService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  async delete(@Param('id') id: string) {
    return await this.campaignService.delete(id);
  }

  // Execution
  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule campaign' })
  async schedule(@Param('id') id: string, @Body('scheduledDate') scheduledDate: Date) {
    return await this.campaignService.schedule(id, scheduledDate);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send campaign' })
  async send(@Param('id') id: string) {
    return await this.campaignService.send(id);
  }

  @Post(':id/send-test')
  @ApiOperation({ summary: 'Send test emails' })
  async sendTest(@Param('id') id: string, @Body('emails') emails: string[]) {
    return await this.campaignService.sendTest(id, emails);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause campaign' })
  async pause(@Param('id') id: string) {
    return await this.campaignService.pause(id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume campaign' })
  async resume(@Param('id') id: string) {
    return await this.campaignService.resume(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel campaign' })
  async cancel(@Param('id') id: string) {
    return await this.campaignService.cancel(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate campaign' })
  async duplicate(@Param('id') id: string, @Request() req) {
    return await this.campaignService.duplicate(id, req.user.id);
  }

  @Get('queue/sending')
  @ApiOperation({ summary: 'Get sending queue' })
  async getSendingQueue() {
    return await this.campaignService.getSendingQueue();
  }

  // Analytics
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get campaign statistics' })
  async getStatistics(@Param('id') id: string) {
    return await this.campaignService.getStatistics(id);
  }

  @Get(':id/open-rate')
  @ApiOperation({ summary: 'Get open rate' })
  async getOpenRate(@Param('id') id: string) {
    const rate = await this.campaignService.getOpenRate(id);
    return { openRate: rate };
  }

  @Get(':id/click-rate')
  @ApiOperation({ summary: 'Get click rate' })
  async getClickRate(@Param('id') id: string) {
    const rate = await this.campaignService.getClickRate(id);
    return { clickRate: rate };
  }

  @Get(':id/conversion-rate')
  @ApiOperation({ summary: 'Get conversion rate' })
  async getConversionRate(@Param('id') id: string) {
    const rate = await this.campaignService.getConversionRate(id);
    return { conversionRate: rate };
  }

  @Get(':id/unsubscribe-rate')
  @ApiOperation({ summary: 'Get unsubscribe rate' })
  async getUnsubscribeRate(@Param('id') id: string) {
    const rate = await this.campaignService.getUnsubscribeRate(id);
    return { unsubscribeRate: rate };
  }

  @Get(':id/bounce-rate')
  @ApiOperation({ summary: 'Get bounce rate' })
  async getBounceRate(@Param('id') id: string) {
    const rate = await this.campaignService.getBounceRate(id);
    return { bounceRate: rate };
  }

  // Segmentation
  @Post('segments')
  @ApiOperation({ summary: 'Create segment' })
  async createSegment(@Body() dto: CreateSegmentDto, @Request() req) {
    return await this.campaignService.createSegment(dto, req.user.id);
  }

  @Get(':id/recipients')
  @ApiOperation({ summary: 'Get recipients' })
  async getRecipients(@Param('id') id: string) {
    return await this.campaignService.getRecipients(id);
  }

  @Post(':id/add-recipients')
  @ApiOperation({ summary: 'Add recipients' })
  async addRecipients(@Param('id') id: string, @Body('contactIds') contactIds: string[]) {
    return await this.campaignService.addRecipients(id, contactIds);
  }

  @Post(':id/remove-recipients')
  @ApiOperation({ summary: 'Remove recipients' })
  async removeRecipients(@Param('id') id: string, @Body('contactIds') contactIds: string[]) {
    return await this.campaignService.removeRecipients(id, contactIds);
  }
}
