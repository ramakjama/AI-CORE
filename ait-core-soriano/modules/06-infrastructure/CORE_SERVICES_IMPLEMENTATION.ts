/**
 * CORE SERVICE IMPLEMENTATIONS FOR ALL INFRASTRUCTURE MODULES
 * Copy these implementations to the appropriate service files in each module
 */

// ==================== AIT-NOTIFICATION-SERVICE ====================

// File: src/services/email.service.ts
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.utils';

interface EmailData {
  to: string | string[];
  subject: string;
  template?: string;
  data?: any;
  html?: string;
  text?: string;
  attachments?: any[];
}

class EmailService {
  private transporter: any;
  private useSendGrid: boolean;

  constructor() {
    this.useSendGrid = process.env.EMAIL_PROVIDER === 'sendgrid';
    this.initialize();
  }

  private initialize() {
    if (this.useSendGrid) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
      logger.info('Email service initialized with SendGrid');
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      logger.info('Email service initialized with SMTP');
    }
  }

  async send(emailData: EmailData): Promise<void> {
    try {
      let html = emailData.html;

      // Render template if specified
      if (emailData.template && emailData.data) {
        html = await this.renderTemplate(emailData.template, emailData.data);
      }

      if (this.useSendGrid) {
        await this.sendWithSendGrid(emailData, html);
      } else {
        await this.sendWithNodemailer(emailData, html);
      }

      logger.info(`Email sent successfully to: ${emailData.to}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  private async sendWithSendGrid(emailData: EmailData, html?: string): Promise<void> {
    const message = {
      to: emailData.to,
      from: process.env.EMAIL_FROM || 'noreply@ait-core.com',
      subject: emailData.subject,
      html: html || emailData.html,
      text: emailData.text
    };

    await sgMail.send(message);
  }

  private async sendWithNodemailer(emailData: EmailData, html?: string): Promise<void> {
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@ait-core.com',
      to: emailData.to,
      subject: emailData.subject,
      html: html || emailData.html,
      text: emailData.text,
      attachments: emailData.attachments
    };

    await this.transporter.sendMail(message);
  }

  private async renderTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.hbs`);
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    return template(data);
  }
}

export const emailService = new EmailService();

// File: src/services/sms.service.ts
import twilio from 'twilio';
import { logger } from '../utils/logger.utils';

interface SMSData {
  to: string;
  message: string;
  from?: string;
}

class SMSService {
  private client: any;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      logger.info('SMS service initialized with Twilio');
    } else {
      logger.warn('SMS service not configured');
    }
  }

  async send(smsData: SMSData): Promise<void> {
    if (!this.client) {
      throw new Error('SMS service not configured');
    }

    try {
      await this.client.messages.create({
        body: smsData.message,
        from: smsData.from || process.env.TWILIO_PHONE_NUMBER,
        to: smsData.to
      });

      logger.info(`SMS sent successfully to: ${smsData.to}`);
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }
}

export const smsService = new SMSService();

// File: src/services/push.service.ts
import admin from 'firebase-admin';
import { logger } from '../utils/logger.utils';

interface PushData {
  token: string | string[];
  title: string;
  body: string;
  data?: any;
  imageUrl?: string;
}

class PushService {
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
        this.initialized = true;
        logger.info('Push notification service initialized with Firebase');
      }
    } catch (error) {
      logger.warn('Push notification service not configured');
    }
  }

  async send(pushData: PushData): Promise<void> {
    if (!this.initialized) {
      throw new Error('Push notification service not configured');
    }

    try {
      const message = {
        notification: {
          title: pushData.title,
          body: pushData.body,
          ...(pushData.imageUrl && { imageUrl: pushData.imageUrl })
        },
        data: pushData.data || {},
        ...(Array.isArray(pushData.token)
          ? { tokens: pushData.token }
          : { token: pushData.token })
      };

      const response = Array.isArray(pushData.token)
        ? await admin.messaging().sendMulticast(message)
        : await admin.messaging().send(message);

      logger.info(`Push notification sent successfully`);
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      throw error;
    }
  }
}

export const pushService = new PushService();

// File: src/routes/notification.routes.ts
import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.utils';
import notificationService from '../index';

const router = Router();

router.post('/email', asyncHandler(async (req, res) => {
  const { email } = notificationService.getQueues();
  const job = await email.add(req.body);
  res.json({ success: true, jobId: job.id });
}));

router.post('/sms', asyncHandler(async (req, res) => {
  const { sms } = notificationService.getQueues();
  const job = await sms.add(req.body);
  res.json({ success: true, jobId: job.id });
}));

router.post('/push', asyncHandler(async (req, res) => {
  const { push } = notificationService.getQueues();
  const job = await push.add(req.body);
  res.json({ success: true, jobId: job.id });
}));

export default router;

// ==================== AIT-DOCUMENT-SERVICE ====================

// File: src/services/storage.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Client as MinioClient } from 'minio';
import { logger } from '../utils/logger.utils';

interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  folder?: string;
}

class StorageService {
  private s3Client?: S3Client;
  private minioClient?: MinioClient;
  private provider: string;
  private bucket: string;

  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 's3';
    this.bucket = process.env.STORAGE_BUCKET || 'ait-documents';
  }

  async initialize(): Promise<void> {
    if (this.provider === 's3') {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
        }
      });
      logger.info('Storage initialized with AWS S3');
    } else if (this.provider === 'minio') {
      this.minioClient = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT || 'localhost',
        port: parseInt(process.env.MINIO_PORT || '9000'),
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || '',
        secretKey: process.env.MINIO_SECRET_KEY || ''
      });
      logger.info('Storage initialized with MinIO');
    }
  }

  async upload(options: UploadOptions): Promise<string> {
    const key = options.folder
      ? `${options.folder}/${options.filename}`
      : options.filename;

    if (this.provider === 's3' && this.s3Client) {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: options.buffer,
        ContentType: options.mimetype
      }));
    } else if (this.provider === 'minio' && this.minioClient) {
      await this.minioClient.putObject(
        this.bucket,
        key,
        options.buffer,
        options.buffer.length,
        { 'Content-Type': options.mimetype }
      );
    }

    logger.info(`File uploaded: ${key}`);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    if (this.provider === 's3' && this.s3Client) {
      const response = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
      return Buffer.from(await response.Body!.transformToByteArray());
    } else if (this.provider === 'minio' && this.minioClient) {
      const stream = await this.minioClient.getObject(this.bucket, key);
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }
    throw new Error('Storage not initialized');
  }

  async delete(key: string): Promise<void> {
    if (this.provider === 's3' && this.s3Client) {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
    } else if (this.provider === 'minio' && this.minioClient) {
      await this.minioClient.removeObject(this.bucket, key);
    }
    logger.info(`File deleted: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (this.provider === 's3' && this.s3Client) {
      return getSignedUrl(
        this.s3Client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn }
      );
    } else if (this.provider === 'minio' && this.minioClient) {
      return this.minioClient.presignedGetObject(this.bucket, key, expiresIn);
    }
    throw new Error('Storage not initialized');
  }

  async getInfo(): Promise<any> {
    return {
      provider: this.provider,
      bucket: this.bucket,
      initialized: !!(this.s3Client || this.minioClient)
    };
  }
}

export const storageService = new StorageService();

// File: src/services/generation.service.ts
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger.utils';

interface PDFOptions {
  title: string;
  content: string;
  footer?: string;
}

class GenerationService {
  async generatePDF(options: PDFOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Add title
        doc.fontSize(20).text(options.title, { align: 'center' });
        doc.moveDown();

        // Add content
        doc.fontSize(12).text(options.content);

        // Add footer if provided
        if (options.footer) {
          doc.moveDown();
          doc.fontSize(10).text(options.footer, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const generationService = new GenerationService();

// File: src/services/search.service.ts
import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger.utils';

class SearchService {
  private client?: Client;
  private index: string = 'documents';

  async initialize(): Promise<void> {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
      });
      await this.client.ping();
      logger.info('Search service initialized with Elasticsearch');
    } catch (error) {
      logger.warn('Search service not configured');
    }
  }

  async indexDocument(id: string, document: any): Promise<void> {
    if (!this.client) return;

    await this.client.index({
      index: this.index,
      id,
      document
    });
  }

  async search(query: string, options: any = {}): Promise<any[]> {
    if (!this.client) return [];

    const result = await this.client.search({
      index: this.index,
      query: {
        multi_match: {
          query,
          fields: ['title^2', 'content', 'description']
        }
      },
      ...options
    });

    return result.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));
  }

  async deleteDocument(id: string): Promise<void> {
    if (!this.client) return;

    await this.client.delete({
      index: this.index,
      id
    });
  }
}

export const searchService = new SearchService();

// File: src/routes/upload.routes.ts
import { Router } from 'express';
import multer from 'multer';
import { storageService } from '../services/storage.service';
import { asyncHandler } from '../utils/async-handler.utils';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const key = await storageService.upload({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    folder: req.body.folder
  });

  res.json({
    success: true,
    data: {
      key,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

export default router;

// File: src/routes/document.routes.ts
import { Router } from 'express';
import { storageService } from '../services/storage.service';
import { asyncHandler } from '../utils/async-handler.utils';

const router = Router();

router.get('/:key', asyncHandler(async (req, res) => {
  const buffer = await storageService.download(req.params.key);
  res.send(buffer);
}));

router.delete('/:key', asyncHandler(async (req, res) => {
  await storageService.delete(req.params.key);
  res.json({ success: true, message: 'Document deleted' });
}));

router.get('/:key/url', asyncHandler(async (req, res) => {
  const url = await storageService.getSignedUrl(req.params.key);
  res.json({ success: true, url });
}));

export default router;

// File: src/routes/search.routes.ts
import { Router } from 'express';
import { searchService } from '../services/search.service';
import { asyncHandler } from '../utils/async-handler.utils';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const query = req.query.q as string;
  const results = await searchService.search(query);
  res.json({ success: true, results });
}));

export default router;

// ==================== SHARED TSCONFIG ====================
// Copy this to each module's tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
