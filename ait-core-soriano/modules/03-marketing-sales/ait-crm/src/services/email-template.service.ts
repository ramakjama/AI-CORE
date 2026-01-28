import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateTemplateDto, EmailTemplate } from '../dto/campaign.dto';
import Handlebars from 'handlebars';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new email template
   */
  async create(dto: CreateTemplateDto, userId: string): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        htmlContent: dto.htmlContent,
        textContent: dto.textContent,
        variables: dto.variables || [],
        createdBy: userId
      }
    });

    this.logger.log(`Email template created: ${template.id}`);
    return template;
  }

  /**
   * Find all templates
   */
  async findAll(): Promise<EmailTemplate[]> {
    return await this.prisma.emailTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find one template by ID
   */
  async findOne(id: string): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new NotFoundException(`Email template ${id} not found`);
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(id: string, dto: Partial<CreateTemplateDto>): Promise<EmailTemplate> {
    await this.findOne(id);

    return await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.emailTemplate.delete({
      where: { id }
    });

    this.logger.log(`Email template deleted: ${id}`);
  }

  /**
   * Render template with variables
   */
  async render(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.findOne(templateId);

    // Compile template with Handlebars
    const compiledTemplate = Handlebars.compile(template.htmlContent);
    return compiledTemplate(variables);
  }

  /**
   * Preview template with sample data
   */
  async preview(templateId: string, variables: Record<string, any>): Promise<string> {
    return await this.render(templateId, variables);
  }

  /**
   * Clone a template
   */
  async clone(templateId: string, userId: string): Promise<EmailTemplate> {
    const template = await this.findOne(templateId);

    const cloned = await this.prisma.emailTemplate.create({
      data: {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables,
        createdBy: userId
      }
    });

    this.logger.log(`Email template ${templateId} cloned to ${cloned.id}`);
    return cloned;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
