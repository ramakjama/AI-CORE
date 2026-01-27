import { Controller, Post, Get, Body } from '@nestjs/common';
import { CommunicationsService } from './communications.service';

@Controller('communications')
export class CommunicationsController {
  constructor(private readonly communicationsService: CommunicationsService) {}

  @Post('email')
  async sendEmail(@Body() data: { to: string; subject: string; body: string }) {
    return this.communicationsService.sendEmail(data.to, data.subject, data.body);
  }

  @Post('sms')
  async sendSMS(@Body() data: { to: string; message: string }) {
    return this.communicationsService.sendSMS(data.to, data.message);
  }

  @Post('whatsapp')
  async sendWhatsApp(@Body() data: { to: string; message: string }) {
    return this.communicationsService.sendWhatsApp(data.to, data.message);
  }

  @Get('history')
  async getHistory() {
    return this.communicationsService.getHistory();
  }
}
