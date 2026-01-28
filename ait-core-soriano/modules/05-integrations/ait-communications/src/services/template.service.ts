/**
 * @fileoverview Template Service
 * @module @ait-core/communications/services
 * @description Manages email, SMS, and WhatsApp templates
 */

import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import { join } from 'path';
import mjml2html from 'mjml';
import { convert } from 'html-to-text';
import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import { CommunicationChannel, TemplateType } from '../interfaces/message.types';

export class TemplateService {
  private emailTemplates: Map<string, HandlebarsTemplateDelegate>;
  private smsTemplates: Map<string, HandlebarsTemplateDelegate>;
  private whatsappTemplates: Map<string, HandlebarsTemplateDelegate>;
  private prisma: PrismaClient;
  private logger: Logger;
  private templatesDir: string;

  constructor() {
    this.emailTemplates = new Map();
    this.smsTemplates = new Map();
    this.whatsappTemplates = new Map();
    this.prisma = new PrismaClient();
    this.logger = new Logger('TemplateService');
    this.templatesDir = join(__dirname, '../templates');

    this.registerHelpers();
  }

  /**
   * Initialize template service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadTemplates();
      this.logger.info('Template service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize template service', error);
      throw error;
    }
  }

  /**
   * Render template
   */
  async render(
    channel: CommunicationChannel,
    templateId: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      let template: HandlebarsTemplateDelegate | undefined;

      switch (channel) {
        case 'EMAIL':
          template = this.emailTemplates.get(templateId);
          break;
        case 'SMS':
          template = this.smsTemplates.get(templateId);
          break;
        case 'WHATSAPP':
          template = this.whatsappTemplates.get(templateId);
          break;
      }

      if (!template) {
        throw new Error(`Template not found: ${templateId} for channel ${channel}`);
      }

      return template(data);
    } catch (error) {
      this.logger.error(`Failed to render template: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * Render email template with MJML
   */
  async renderEmail(
    templateId: string,
    data: Record<string, any>
  ): Promise<{ html: string; text: string }> {
    try {
      const mjmlTemplate = this.emailTemplates.get(templateId);
      if (!mjmlTemplate) {
        throw new Error(`Email template not found: ${templateId}`);
      }

      const mjmlContent = mjmlTemplate(data);
      const { html } = mjml2html(mjmlContent);
      const text = convert(html, {
        wordwrap: 130
      });

      return { html, text };
    } catch (error) {
      this.logger.error(`Failed to render email template: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * Load templates from filesystem
   */
  private async loadTemplates(): Promise<void> {
    try {
      // Load email templates
      await this.loadChannelTemplates('email', this.emailTemplates);

      // Load SMS templates
      await this.loadChannelTemplates('sms', this.smsTemplates);

      // Load WhatsApp templates
      await this.loadChannelTemplates('whatsapp', this.whatsappTemplates);

      this.logger.info(
        `Loaded templates - Email: ${this.emailTemplates.size}, SMS: ${this.smsTemplates.size}, WhatsApp: ${this.whatsappTemplates.size}`
      );
    } catch (error) {
      this.logger.error('Failed to load templates', error);
      throw error;
    }
  }

  /**
   * Load channel-specific templates
   */
  private async loadChannelTemplates(
    channel: string,
    templateMap: Map<string, HandlebarsTemplateDelegate>
  ): Promise<void> {
    const channelDir = join(this.templatesDir, channel);

    try {
      const files = await fs.readdir(channelDir);

      for (const file of files) {
        if (file.endsWith('.hbs') || file.endsWith('.mjml')) {
          const templatePath = join(channelDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const templateName = file.replace(/\.(hbs|mjml)$/, '');

          const compiledTemplate = Handlebars.compile(templateContent);
          templateMap.set(templateName, compiledTemplate);
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`Template directory not found: ${channelDir}`);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Format currency
    Handlebars.registerHelper('currency', (amount: number, currency = 'EUR') => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency
      }).format(amount);
    });

    // Format date
    Handlebars.registerHelper('date', (date: Date, format = 'short') => {
      if (!date) return '';

      const options: Intl.DateTimeFormatOptions =
        format === 'long'
          ? { year: 'numeric', month: 'long', day: 'numeric' }
          : { year: 'numeric', month: '2-digit', day: '2-digit' };

      return new Intl.DateTimeFormat('es-ES', options).format(new Date(date));
    });

    // Conditional helper
    Handlebars.registerHelper('if_eq', function (a, b, opts) {
      if (a === b) {
        return opts.fn(this);
      } else {
        return opts.inverse(this);
      }
    });

    // Uppercase helper
    Handlebars.registerHelper('upper', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lower', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Truncate helper
    Handlebars.registerHelper('truncate', (str: string, length = 50) => {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });

    // URL helper
    Handlebars.registerHelper('url', (path: string) => {
      const baseUrl = process.env.APP_URL || 'https://sorianomediadores.com';
      return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
    });
  }

  /**
   * Create template from database
   */
  async createTemplate(
    channel: CommunicationChannel,
    type: TemplateType,
    name: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.communicationTemplate.create({
        data: {
          channel,
          type,
          name,
          content,
          metadata,
          version: 1
        }
      });

      // Compile and cache template
      const compiled = Handlebars.compile(content);

      switch (channel) {
        case 'EMAIL':
          this.emailTemplates.set(name, compiled);
          break;
        case 'SMS':
          this.smsTemplates.set(name, compiled);
          break;
        case 'WHATSAPP':
          this.whatsappTemplates.set(name, compiled);
          break;
      }

      this.logger.info(`Template created: ${name} (${channel})`);
    } catch (error) {
      this.logger.error('Failed to create template', error);
      throw error;
    }
  }

  /**
   * Update template version
   */
  async updateTemplate(
    templateId: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const template = await this.prisma.communicationTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Create new version
      await this.prisma.communicationTemplate.update({
        where: { id: templateId },
        data: {
          content,
          metadata,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });

      // Update cached template
      const compiled = Handlebars.compile(content);

      switch (template.channel) {
        case 'EMAIL':
          this.emailTemplates.set(template.name, compiled);
          break;
        case 'SMS':
          this.smsTemplates.set(template.name, compiled);
          break;
        case 'WHATSAPP':
          this.whatsappTemplates.set(template.name, compiled);
          break;
      }

      this.logger.info(`Template updated: ${template.name} (v${template.version + 1})`);
    } catch (error) {
      this.logger.error('Failed to update template', error);
      throw error;
    }
  }

  /**
   * Get template preview
   */
  async preview(
    templateId: string,
    data: Record<string, any>
  ): Promise<string> {
    try {
      const template = await this.prisma.communicationTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const compiled = Handlebars.compile(template.content);
      return compiled(data);
    } catch (error) {
      this.logger.error('Failed to preview template', error);
      throw error;
    }
  }
}
