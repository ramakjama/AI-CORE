/**
 * Email Service
 *
 * Handles all email communications via SMTP/IMAP
 * Features: Send, receive, templates, bulk, conversations
 */

import * as nodemailer from 'nodemailer';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import * as Handlebars from 'handlebars';
import { EventEmitter } from 'eventemitter3';

import {
  EmailMessage,
  EmailAddress,
  EmailSendOptions,
  EmailFetchOptions,
  EmailAccountConfig,
  Attachment,
  Template,
  RenderedTemplate,
  SendResult,
  BulkSendResult,
  MessageStatus,
  ChannelType,
  CommunicationEvent
} from '../types';

/**
 * Email service configuration
 */
export interface EmailServiceConfig {
  tenantId: string;
  accounts: EmailAccountConfig[];
  defaultAccountId?: string;
  trackingDomain?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  unsubscribeUrl?: string;
}

/**
 * Email search options
 */
export interface EmailSearchOptions {
  folder?: string;
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  since?: Date;
  before?: Date;
  hasAttachment?: boolean;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Email Service Class
 */
export class EmailService extends EventEmitter {
  private config: EmailServiceConfig;
  private transporters: Map<string, nodemailer.Transporter> = new Map();
  private templates: Map<string, Template> = new Map();

  constructor(config: EmailServiceConfig) {
    super();
    this.config = config;
    this.initializeTransporters();
  }

  /**
   * Initialize SMTP transporters for all accounts
   */
  private initializeTransporters(): void {
    for (const account of this.config.accounts) {
      const transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.smtp.auth.user,
          pass: account.smtp.auth.pass
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 10
      });

      this.transporters.set(account.id, transporter);
    }
  }

  /**
   * Get the default account or specified account
   */
  private getAccount(accountId?: string): EmailAccountConfig {
    const id = accountId || this.config.defaultAccountId;
    const account = this.config.accounts.find(a => a.id === id);

    if (!account) {
      throw new Error(`Email account not found: ${id}`);
    }

    return account;
  }

  /**
   * Get transporter for an account
   */
  private getTransporter(accountId?: string): nodemailer.Transporter {
    const account = this.getAccount(accountId);
    const transporter = this.transporters.get(account.id);

    if (!transporter) {
      throw new Error(`Transporter not found for account: ${account.id}`);
    }

    return transporter;
  }

  /**
   * Send a single email
   */
  async send(
    to: string | EmailAddress | EmailAddress[],
    subject: string,
    body: string | { text?: string; html?: string },
    attachments?: Attachment[],
    options?: EmailSendOptions & { accountId?: string }
  ): Promise<SendResult> {
    const messageId = uuidv4();
    const account = this.getAccount(options?.accountId);
    const transporter = this.getTransporter(options?.accountId);

    try {
      // Normalize recipients
      const toAddresses = this.normalizeAddresses(to);

      // Prepare body
      const bodyText = typeof body === 'string' ? body : body.text;
      const bodyHtml = typeof body === 'string' ? undefined : body.html;

      // Apply tracking if enabled
      const trackedHtml = this.applyTracking(
        bodyHtml,
        messageId,
        options?.trackOpens ?? this.config.trackOpens,
        options?.trackClicks ?? this.config.trackClicks
      );

      // Prepare attachments
      const mailAttachments = attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        path: att.url,
        contentType: att.mimeType,
        cid: att.contentId,
        contentDisposition: att.disposition as 'attachment' | 'inline'
      }));

      // Send email
      const info = await transporter.sendMail({
        from: {
          name: account.name,
          address: account.email
        },
        to: toAddresses.map(a => ({ name: a.name, address: a.email })),
        replyTo: options?.replyTo ? {
          name: options.replyTo.name,
          address: options.replyTo.email
        } : undefined,
        subject,
        text: bodyText,
        html: trackedHtml || bodyHtml,
        attachments: mailAttachments,
        headers: {
          'X-Message-ID': messageId,
          'X-Tenant-ID': this.config.tenantId,
          ...options?.headers
        },
        priority: this.mapPriority(options?.priority)
      });

      // Emit event
      this.emitEvent('message.sent', messageId, {
        recipients: toAddresses,
        subject
      });

      return {
        success: true,
        messageId,
        providerId: info.messageId,
        status: MessageStatus.SENT
      };
    } catch (error) {
      const err = error as Error;

      this.emitEvent('message.failed', messageId, {
        error: err.message
      });

      return {
        success: false,
        messageId,
        status: MessageStatus.FAILED,
        error: {
          code: 'SEND_FAILED',
          message: err.message,
          details: err
        }
      };
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplate(
    to: string | EmailAddress | EmailAddress[],
    templateCode: string,
    data: Record<string, unknown>,
    options?: EmailSendOptions & { accountId?: string }
  ): Promise<SendResult> {
    const template = this.templates.get(templateCode);

    if (!template) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `Template not found: ${templateCode}`
        }
      };
    }

    const rendered = this.renderTemplate(template, data);

    if (rendered.missingVariables && rendered.missingVariables.length > 0) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'MISSING_VARIABLES',
          message: `Missing required variables: ${rendered.missingVariables.join(', ')}`
        }
      };
    }

    return this.send(
      to,
      rendered.subject || '',
      { text: rendered.bodyText, html: rendered.bodyHtml },
      undefined,
      options
    );
  }

  /**
   * Send bulk emails
   */
  async sendBulk(
    recipients: Array<{
      to: string | EmailAddress;
      data?: Record<string, unknown>;
    }>,
    template: Template | string,
    defaultData?: Record<string, unknown>,
    options?: EmailSendOptions & { accountId?: string; batchSize?: number; delayMs?: number }
  ): Promise<BulkSendResult> {
    const batchSize = options?.batchSize || 50;
    const delayMs = options?.delayMs || 100;
    const results: BulkSendResult['results'] = [];

    // Get template
    const templateObj = typeof template === 'string'
      ? this.templates.get(template)
      : template;

    if (!templateObj) {
      return {
        total: recipients.length,
        successful: 0,
        failed: recipients.length,
        results: recipients.map(r => ({
          recipient: typeof r.to === 'string' ? r.to : r.to.email,
          result: {
            success: false,
            status: MessageStatus.FAILED,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found'
            }
          }
        }))
      };
    }

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (recipient) => {
        const mergedData = { ...defaultData, ...recipient.data };
        const rendered = this.renderTemplate(templateObj, mergedData);

        const result = await this.send(
          recipient.to,
          rendered.subject || '',
          { text: rendered.bodyText, html: rendered.bodyHtml },
          undefined,
          options
        );

        return {
          recipient: typeof recipient.to === 'string' ? recipient.to : recipient.to.email,
          result
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay between batches
      if (i + batchSize < recipients.length) {
        await this.delay(delayMs);
      }
    }

    const successful = results.filter(r => r.result.success).length;

    return {
      total: recipients.length,
      successful,
      failed: recipients.length - successful,
      results
    };
  }

  /**
   * Fetch emails via IMAP
   */
  async fetch(
    accountId: string,
    folder: string = 'INBOX',
    options?: EmailFetchOptions
  ): Promise<EmailMessage[]> {
    const account = this.getAccount(accountId);

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: account.imap.auth.user,
        password: account.imap.auth.pass,
        host: account.imap.host,
        port: account.imap.port,
        tls: account.imap.secure,
        tlsOptions: { rejectUnauthorized: false }
      });

      const messages: EmailMessage[] = [];

      imap.once('ready', () => {
        imap.openBox(folder, true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Build search criteria
          const searchCriteria = this.buildImapSearchCriteria(options);

          imap.search(searchCriteria, (searchErr, results) => {
            if (searchErr) {
              imap.end();
              return reject(searchErr);
            }

            if (!results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            // Apply limit and offset
            let uids = results;
            if (options?.offset) {
              uids = uids.slice(options.offset);
            }
            if (options?.limit) {
              uids = uids.slice(0, options.limit);
            }

            const fetchOptions: Imap.FetchOptions = {
              bodies: options?.includeBody ? '' : 'HEADER',
              struct: true,
              markSeen: false
            };

            const fetch = imap.fetch(uids, fetchOptions);

            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              let attributes: Imap.ImapMessageAttributes;

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('attributes', (attrs) => {
                attributes = attrs;
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const emailMessage = this.parseEmail(parsed, attributes, accountId, folder);
                  messages.push(emailMessage);
                } catch (parseErr) {
                  console.error('Error parsing email:', parseErr);
                }
              });
            });

            fetch.once('error', (fetchErr) => {
              imap.end();
              reject(fetchErr);
            });

            fetch.once('end', () => {
              imap.end();
              resolve(messages);
            });
          });
        });
      });

      imap.once('error', (imapErr: Error) => {
        reject(imapErr);
      });

      imap.connect();
    });
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string, accountId?: string): Promise<boolean> {
    const account = this.getAccount(accountId);

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: account.imap.auth.user,
        password: account.imap.auth.pass,
        host: account.imap.host,
        port: account.imap.port,
        tls: account.imap.secure,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          imap.search([['HEADER', 'X-Message-ID', messageId]], (searchErr, results) => {
            if (searchErr || !results.length) {
              imap.end();
              return resolve(false);
            }

            imap.addFlags(results, ['\\Seen'], (flagErr) => {
              imap.end();
              if (flagErr) {
                return reject(flagErr);
              }
              resolve(true);
            });
          });
        });
      });

      imap.once('error', (imapErr: Error) => {
        reject(imapErr);
      });

      imap.connect();
    });
  }

  /**
   * Reply to an email
   */
  async reply(
    messageId: string,
    body: string | { text?: string; html?: string },
    attachments?: Attachment[],
    options?: EmailSendOptions & { accountId?: string }
  ): Promise<SendResult> {
    // In a real implementation, fetch the original message first
    // For now, we'll create a reply structure

    const originalMessage = await this.getMessageById(messageId, options?.accountId);

    if (!originalMessage) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: `Original message not found: ${messageId}`
        }
      };
    }

    const replySubject = originalMessage.subject.startsWith('Re:')
      ? originalMessage.subject
      : `Re: ${originalMessage.subject}`;

    return this.send(
      originalMessage.from,
      replySubject,
      body,
      attachments,
      {
        ...options,
        headers: {
          'In-Reply-To': originalMessage.messageId || '',
          'References': [
            ...(originalMessage.references || []),
            originalMessage.messageId || ''
          ].filter(Boolean).join(' ')
        }
      }
    );
  }

  /**
   * Forward an email
   */
  async forward(
    messageId: string,
    to: string | EmailAddress | EmailAddress[],
    additionalBody?: string,
    options?: EmailSendOptions & { accountId?: string }
  ): Promise<SendResult> {
    const originalMessage = await this.getMessageById(messageId, options?.accountId);

    if (!originalMessage) {
      return {
        success: false,
        status: MessageStatus.FAILED,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: `Original message not found: ${messageId}`
        }
      };
    }

    const forwardSubject = originalMessage.subject.startsWith('Fwd:')
      ? originalMessage.subject
      : `Fwd: ${originalMessage.subject}`;

    // Build forwarded message body
    const forwardedHeader = `
---------- Forwarded message ---------
From: ${originalMessage.from.name || ''} <${originalMessage.from.email}>
Date: ${originalMessage.sentAt?.toISOString() || ''}
Subject: ${originalMessage.subject}
To: ${originalMessage.to.map(t => `${t.name || ''} <${t.email}>`).join(', ')}
`;

    const forwardBody = `${additionalBody || ''}

${forwardedHeader}

${originalMessage.bodyText || originalMessage.bodyHtml || ''}`;

    return this.send(
      to,
      forwardSubject,
      forwardBody,
      originalMessage.attachments,
      options
    );
  }

  /**
   * Get email conversation (thread)
   */
  async getConversation(threadId: string, accountId?: string): Promise<EmailMessage[]> {
    const account = this.getAccount(accountId);

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: account.imap.auth.user,
        password: account.imap.auth.pass,
        host: account.imap.host,
        port: account.imap.port,
        tls: account.imap.secure,
        tlsOptions: { rejectUnauthorized: false }
      });

      const messages: EmailMessage[] = [];

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Search for messages with the thread ID in References or In-Reply-To
          imap.search([
            ['OR',
              ['HEADER', 'References', threadId],
              ['HEADER', 'Message-ID', threadId]
            ]
          ], (searchErr, results) => {
            if (searchErr || !results.length) {
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(results, {
              bodies: '',
              struct: true
            });

            fetch.on('message', (msg, seqno) => {
              let buffer = '';
              let attributes: Imap.ImapMessageAttributes;

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
              });

              msg.once('attributes', (attrs) => {
                attributes = attrs;
              });

              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  const emailMessage = this.parseEmail(parsed, attributes, account.id, 'INBOX');
                  emailMessage.threadId = threadId;
                  messages.push(emailMessage);
                } catch (parseErr) {
                  console.error('Error parsing email:', parseErr);
                }
              });
            });

            fetch.once('error', (fetchErr) => {
              imap.end();
              reject(fetchErr);
            });

            fetch.once('end', () => {
              imap.end();
              // Sort by date
              messages.sort((a, b) =>
                (a.sentAt?.getTime() || 0) - (b.sentAt?.getTime() || 0)
              );
              resolve(messages);
            });
          });
        });
      });

      imap.once('error', (imapErr: Error) => {
        reject(imapErr);
      });

      imap.connect();
    });
  }

  /**
   * Search emails
   */
  async search(
    query: string,
    options?: EmailSearchOptions & { accountId?: string }
  ): Promise<EmailMessage[]> {
    const searchOptions: EmailFetchOptions = {
      folder: options?.folder,
      since: options?.since,
      before: options?.before,
      unseen: options?.isRead === false,
      limit: options?.limit,
      offset: options?.offset,
      search: query,
      includeBody: true
    };

    return this.fetch(options?.accountId || '', options?.folder || 'INBOX', searchOptions);
  }

  /**
   * Register a template
   */
  registerTemplate(template: Template): void {
    this.templates.set(template.code, template);
  }

  /**
   * Render a template with data
   */
  private renderTemplate(template: Template, data: Record<string, unknown>): RenderedTemplate {
    const missingVariables: string[] = [];

    // Check for required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in data)) {
        missingVariables.push(variable.name);
      }
    }

    if (missingVariables.length > 0) {
      return { missingVariables };
    }

    // Compile and render templates
    const subjectTemplate = template.subject ? Handlebars.compile(template.subject) : null;
    const textTemplate = template.bodyText ? Handlebars.compile(template.bodyText) : null;
    const htmlTemplate = template.bodyHtml ? Handlebars.compile(template.bodyHtml) : null;

    return {
      subject: subjectTemplate ? subjectTemplate(data) : undefined,
      bodyText: textTemplate ? textTemplate(data) : undefined,
      bodyHtml: htmlTemplate ? htmlTemplate(data) : undefined
    };
  }

  /**
   * Get message by ID (helper method)
   */
  private async getMessageById(messageId: string, accountId?: string): Promise<EmailMessage | null> {
    // In a real implementation, this would query a database or IMAP
    // For now, return a mock structure
    return null;
  }

  /**
   * Parse email from mailparser result
   */
  private parseEmail(
    parsed: ParsedMail,
    attributes: Imap.ImapMessageAttributes,
    accountId: string,
    folder: string
  ): EmailMessage {
    const toAddresses: EmailAddress[] = [];
    if (parsed.to) {
      const toValue = parsed.to;
      if ('value' in toValue) {
        for (const addr of toValue.value) {
          toAddresses.push({
            email: addr.address || '',
            name: addr.name
          });
        }
      }
    }

    const fromAddress: EmailAddress = {
      email: '',
      name: undefined
    };
    if (parsed.from && 'value' in parsed.from) {
      const fromVal = parsed.from.value[0];
      fromAddress.email = fromVal.address || '';
      fromAddress.name = fromVal.name;
    }

    const attachments: Attachment[] = (parsed.attachments || []).map(att => ({
      id: uuidv4(),
      filename: att.filename || 'attachment',
      mimeType: att.contentType,
      size: att.size,
      content: att.content,
      contentId: att.contentId,
      disposition: (att.contentDisposition as 'attachment' | 'inline') || 'attachment'
    }));

    return {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      channel: ChannelType.EMAIL,
      status: attributes.flags?.includes('\\Seen') ? MessageStatus.READ : MessageStatus.DELIVERED,
      direction: 'INBOUND',
      from: fromAddress,
      to: toAddresses,
      subject: parsed.subject || '',
      bodyText: parsed.text,
      bodyHtml: parsed.html || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      messageId: parsed.messageId,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references as string[] | undefined,
      folder,
      isRead: attributes.flags?.includes('\\Seen') || false,
      isStarred: attributes.flags?.includes('\\Flagged') || false,
      hasAttachments: attachments.length > 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: parsed.date || undefined
    };
  }

  /**
   * Build IMAP search criteria
   */
  private buildImapSearchCriteria(options?: EmailFetchOptions): any[] {
    const criteria: any[] = ['ALL'];

    if (options?.unseen) {
      criteria.push('UNSEEN');
    }

    if (options?.since) {
      criteria.push(['SINCE', options.since]);
    }

    if (options?.before) {
      criteria.push(['BEFORE', options.before]);
    }

    if (options?.search) {
      criteria.push(['TEXT', options.search]);
    }

    return criteria;
  }

  /**
   * Normalize email addresses
   */
  private normalizeAddresses(
    addresses: string | EmailAddress | EmailAddress[]
  ): EmailAddress[] {
    if (typeof addresses === 'string') {
      return [{ email: addresses }];
    }

    if (Array.isArray(addresses)) {
      return addresses;
    }

    return [addresses];
  }

  /**
   * Apply tracking pixels and link tracking
   */
  private applyTracking(
    html: string | undefined,
    messageId: string,
    trackOpens?: boolean,
    trackClicks?: boolean
  ): string | undefined {
    if (!html) return undefined;

    let trackedHtml = html;

    // Add open tracking pixel
    if (trackOpens && this.config.trackingDomain) {
      const trackingPixel = `<img src="${this.config.trackingDomain}/track/open/${messageId}" width="1" height="1" style="display:none" alt="" />`;
      trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`);
    }

    // Add click tracking (wrap links)
    if (trackClicks && this.config.trackingDomain) {
      const linkRegex = /href="(https?:\/\/[^"]+)"/g;
      trackedHtml = trackedHtml.replace(linkRegex, (match, url) => {
        const encodedUrl = encodeURIComponent(url);
        return `href="${this.config.trackingDomain}/track/click/${messageId}?url=${encodedUrl}"`;
      });
    }

    return trackedHtml;
  }

  /**
   * Map priority to email header value
   */
  private mapPriority(priority?: string): 'high' | 'normal' | 'low' | undefined {
    switch (priority) {
      case 'URGENT':
      case 'HIGH':
        return 'high';
      case 'LOW':
        return 'low';
      default:
        return 'normal';
    }
  }

  /**
   * Emit communication event
   */
  private emitEvent(
    type: CommunicationEvent['type'],
    messageId: string,
    data: Record<string, unknown>
  ): void {
    const event: CommunicationEvent = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      type,
      channel: ChannelType.EMAIL,
      timestamp: new Date(),
      data: {
        messageId,
        ...data
      }
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    for (const transporter of this.transporters.values()) {
      transporter.close();
    }
    this.transporters.clear();
  }
}

export default EmailService;
