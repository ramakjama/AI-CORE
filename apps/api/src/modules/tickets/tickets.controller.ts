import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { Prisma } from '@prisma/client';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: any) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('companyId') companyId?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (companyId) where.companyId = companyId;

    return this.ticketsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 50,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('stats')
  getStats(@Query('companyId') companyId?: string) {
    return this.ticketsService.getStats(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: any,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() messageDto: any,
  ) {
    return this.ticketsService.addMessage(id, messageDto);
  }
}
