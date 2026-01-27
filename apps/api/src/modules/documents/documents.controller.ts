import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { DocumentsService } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async getAllDocuments() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post('upload')
  async uploadDocument(@Body() file: any) {
    return this.documentsService.upload(file);
  }

  @Post(':id/process')
  async processDocument(@Param('id') id: string) {
    return this.documentsService.process(id);
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
