/**
 * @fileoverview AIT Communications Module Entry Point
 * @module @ait-core/communications
 * @description Multi-channel communication service with Email, SMS, and WhatsApp
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { CommunicationOrchestrator } from './services/communication-orchestrator.service';
import { EmailController } from './controllers/email.controller';
import { SmsController } from './controllers/sms.controller';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = new Logger('AIT-Communications');
const app: Express = express();
const port = process.env.PORT || 3020;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize orchestrator
const orchestrator = new CommunicationOrchestrator();

// Initialize controllers
const emailController = new EmailController(orchestrator);
const smsController = new SmsController(orchestrator);
const whatsappController = new WhatsAppController(orchestrator);

// Email routes
app.post('/api/email/send', emailController.sendEmail.bind(emailController));
app.post('/api/email/template', emailController.sendTemplateEmail.bind(emailController));
app.get('/api/email/track/open/:messageId', emailController.trackOpen.bind(emailController));
app.get('/api/email/track/click/:messageId', emailController.trackClick.bind(emailController));
app.post('/api/email/unsubscribe', emailController.unsubscribe.bind(emailController));

// SMS routes
app.post('/api/sms/send', smsController.sendSms.bind(smsController));
app.post('/api/sms/template', smsController.sendTemplateSms.bind(smsController));
app.post('/api/sms/otp', smsController.sendOtp.bind(smsController));
app.post('/api/sms/validate', smsController.validatePhone.bind(smsController));
app.post('/api/webhooks/twilio/sms/:messageId', smsController.handleWebhook.bind(smsController));

// WhatsApp routes
app.post('/api/whatsapp/send', whatsappController.sendMessage.bind(whatsappController));
app.post('/api/whatsapp/template', whatsappController.sendTemplate.bind(whatsappController));
app.post('/api/whatsapp/media', whatsappController.sendMedia.bind(whatsappController));
app.post('/api/whatsapp/interactive', whatsappController.sendInteractive.bind(whatsappController));
app.post('/api/webhooks/twilio/whatsapp/incoming', whatsappController.handleIncoming.bind(whatsappController));
app.post('/api/webhooks/twilio/whatsapp/:messageId', whatsappController.handleStatus.bind(whatsappController));

// Health check
app.get('/health', async (req, res) => {
  try {
    const status = await orchestrator.getAllProvidersStatus();
    const statusObj: any = {};

    status.forEach((value, key) => {
      statusObj[key] = value;
    });

    res.json({
      status: 'healthy',
      service: 'ait-communications',
      providers: statusObj,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Start server
async function start() {
  try {
    // Initialize orchestrator
    await orchestrator.initialize();

    app.listen(port, () => {
      logger.info(`AIT Communications service running on port ${port}`);
      logger.info('Available channels:');
      logger.info('  - Email (Resend)');
      logger.info('  - SMS (Twilio)');
      logger.info('  - WhatsApp (Twilio Business API)');
    });
  } catch (error) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the application
start();

// Export for testing
export { app, orchestrator };
