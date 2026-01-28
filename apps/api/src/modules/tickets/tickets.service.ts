import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<any> {
    return this.prisma.ticket.create({
      data: {
        ...data,
        ticketNumber: await this.generateTicketNumber(),
      },
      include: {
        messages: true,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<any[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.ticket.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string): Promise<any | null> {
    return this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async update(id: string, data: any): Promise<any> {
    return this.prisma.ticket.update({
      where: { id },
      data,
      include: {
        messages: true,
      },
    });
  }

  async delete(id: string): Promise<any> {
    return this.prisma.ticket.delete({
      where: { id },
    });
  }

  async addMessage(ticketId: string, data: any) {
    return this.prisma.ticketMessage.create({
      data: {
        ...data,
        ticket: {
          connect: { id: ticketId },
        },
      },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.ticket.count({ where });
  }

  private async generateTicketNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const count = await this.prisma.ticket.count();
    return `TKT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Métodos adicionales para estadísticas
  async getStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };
  }
}
