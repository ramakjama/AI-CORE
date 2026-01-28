import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Res
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadService } from '../services/lead.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  FilterLeadDto,
  ConvertLeadDto,
  PaginatedResult
} from '../dto/lead.dto';
import { Lead } from '../entities/lead.entity';
import { Response } from 'express';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully', type: Lead })
  async create(@Body() dto: CreateLeadDto, @Request() req): Promise<Lead> {
    return await this.leadService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads with filters' })
  @ApiResponse({ status: 200, description: 'Leads retrieved successfully' })
  async findAll(@Query() filters: FilterLeadDto): Promise<PaginatedResult<Lead>> {
    return await this.leadService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiResponse({ status: 200, description: 'Lead retrieved successfully', type: Lead })
  async findOne(@Param('id') id: string): Promise<Lead> {
    return await this.leadService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully', type: Lead })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Request() req
  ): Promise<Lead> {
    return await this.leadService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiResponse({ status: 204, description: 'Lead deleted successfully' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.leadService.delete(id);
  }

  // ========================================
  // LEAD SCORING
  // ========================================

  @Post(':id/calculate-score')
  @ApiOperation({ summary: 'Calculate lead score' })
  @ApiResponse({ status: 200, description: 'Score calculated' })
  async calculateScore(@Param('id') id: string): Promise<{ score: number }> {
    const lead = await this.leadService.findOne(id);
    const score = await this.leadService.calculateScore(lead);
    return { score };
  }

  @Post(':id/update-score')
  @ApiOperation({ summary: 'Update lead score' })
  @ApiResponse({ status: 200, description: 'Score updated', type: Lead })
  async updateScore(@Param('id') id: string): Promise<Lead> {
    return await this.leadService.updateScore(id);
  }

  @Get('scoring/hot')
  @ApiOperation({ summary: 'Get hot leads (high score)' })
  @ApiResponse({ status: 200, description: 'Hot leads retrieved' })
  async getHotLeads(@Query('threshold') threshold?: number): Promise<Lead[]> {
    return await this.leadService.getHotLeads(threshold);
  }

  @Get('scoring/cold')
  @ApiOperation({ summary: 'Get cold leads (low score)' })
  @ApiResponse({ status: 200, description: 'Cold leads retrieved' })
  async getColdLeads(@Query('threshold') threshold?: number): Promise<Lead[]> {
    return await this.leadService.getColdLeads(threshold);
  }

  @Post('scoring/recalculate-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Recalculate all lead scores' })
  @ApiResponse({ status: 202, description: 'Recalculation started' })
  async recalculateAllScores(): Promise<{ message: string }> {
    await this.leadService.recalculateAllScores();
    return { message: 'Score recalculation completed' };
  }

  // ========================================
  // ASSIGNMENT
  // ========================================

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign lead to agent' })
  @ApiResponse({ status: 200, description: 'Lead assigned', type: Lead })
  async assign(
    @Param('id') id: string,
    @Body('agentId') agentId: string,
    @Request() req
  ): Promise<Lead> {
    return await this.leadService.assign(id, agentId, req.user.id);
  }

  @Post(':id/auto-assign')
  @ApiOperation({ summary: 'Auto-assign lead using round-robin' })
  @ApiResponse({ status: 200, description: 'Lead auto-assigned', type: Lead })
  async autoAssign(@Param('id') id: string): Promise<Lead> {
    const lead = await this.leadService.findOne(id);
    return await this.leadService.autoAssign(lead);
  }

  @Post(':id/reassign')
  @ApiOperation({ summary: 'Reassign lead to another agent' })
  @ApiResponse({ status: 200, description: 'Lead reassigned', type: Lead })
  async reassign(
    @Param('id') id: string,
    @Body('fromAgentId') fromAgentId: string,
    @Body('toAgentId') toAgentId: string,
    @Request() req
  ): Promise<Lead> {
    return await this.leadService.reassign(id, fromAgentId, toAgentId, req.user.id);
  }

  @Get('assignment/unassigned')
  @ApiOperation({ summary: 'Get unassigned leads' })
  @ApiResponse({ status: 200, description: 'Unassigned leads retrieved' })
  async getUnassignedLeads(): Promise<Lead[]> {
    return await this.leadService.getUnassignedLeads();
  }

  @Get('assignment/by-agent/:agentId')
  @ApiOperation({ summary: 'Get leads by agent' })
  @ApiResponse({ status: 200, description: 'Leads retrieved' })
  async getLeadsByAgent(@Param('agentId') agentId: string): Promise<Lead[]> {
    return await this.leadService.getLeadsByAgent(agentId);
  }

  // ========================================
  // CONVERSION
  // ========================================

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to customer' })
  @ApiResponse({ status: 200, description: 'Lead converted' })
  async convertToCustomer(
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @Request() req
  ): Promise<any> {
    return await this.leadService.convertToCustomer(id, dto, req.user.id);
  }

  @Get(':id/can-convert')
  @ApiOperation({ summary: 'Check if lead can be converted' })
  @ApiResponse({ status: 200, description: 'Conversion check result' })
  async canConvert(@Param('id') id: string): Promise<{ canConvert: boolean }> {
    const canConvert = await this.leadService.canConvert(id);
    return { canConvert };
  }

  @Post(':id/qualify')
  @ApiOperation({ summary: 'Mark lead as qualified' })
  @ApiResponse({ status: 200, description: 'Lead qualified', type: Lead })
  async markAsQualified(@Param('id') id: string, @Request() req): Promise<Lead> {
    return await this.leadService.markAsQualified(id, req.user.id);
  }

  @Post(':id/unqualify')
  @ApiOperation({ summary: 'Mark lead as unqualified' })
  @ApiResponse({ status: 200, description: 'Lead unqualified', type: Lead })
  async markAsUnqualified(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req
  ): Promise<Lead> {
    return await this.leadService.markAsUnqualified(id, reason, req.user.id);
  }

  // ========================================
  // IMPORT/EXPORT
  // ========================================

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import leads from CSV/Excel' })
  @ApiResponse({ status: 200, description: 'Import completed' })
  async importLeads(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ): Promise<any> {
    return await this.leadService.importLeads(file, req.user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export leads to Excel' })
  @ApiResponse({ status: 200, description: 'Export completed' })
  async exportLeads(
    @Query() filters: FilterLeadDto,
    @Query('format') format: 'csv' | 'xlsx' = 'xlsx',
    @Res() res: Response
  ): Promise<void> {
    const buffer = await this.leadService.exportLeads(filters, format);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=leads-export.${format}`);
    res.send(buffer);
  }

  @Post('bulk-update')
  @ApiOperation({ summary: 'Bulk update leads' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  async bulkUpdate(
    @Body('leadIds') leadIds: string[],
    @Body('updates') updates: Partial<Lead>,
    @Request() req
  ): Promise<any> {
    return await this.leadService.bulkUpdate(leadIds, updates, req.user.id);
  }
}
