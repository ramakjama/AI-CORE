import { Injectable } from '@nestjs/common';

@Injectable()
export class CommunicationsService {
  async sendEmail(to: string, subject: string, body: string) {
    return { id: Date.now().toString(), to, subject, status: 'SENT', sentAt: new Date() };
  }

  async sendSMS(to: string, message: string) {
    return { id: Date.now().toString(), to, message, status: 'SENT', sentAt: new Date() };
  }

  async sendWhatsApp(to: string, message: string) {
    return { id: Date.now().toString(), to, message, status: 'SENT', sentAt: new Date() };
  }

  async getHistory() {
    return [
      { id: '1', type: 'EMAIL', to: 'client@example.com', subject: 'Póliza renovada', status: 'SENT', sentAt: new Date() },
      { id: '2', type: 'SMS', to: '+34600000000', message: 'Recordatorio pago', status: 'SENT', sentAt: new Date() },
      { id: '3', type: 'WHATSAPP', to: '+34600000001', message: 'Consulta atendida', status: 'SENT', sentAt: new Date() },
    ];
  }
}
