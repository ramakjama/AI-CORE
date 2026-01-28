/**
 * Telephony Service
 * Virtual PBX with Twilio integration
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import twilio from 'twilio';
import { config } from './config';
import { TelephonyService } from './telephony.service';
import { IVRService } from './ivr.service';
import { CallQueueService } from './call-queue.service';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Services
const telephonyService = new TelephonyService(config.twilio);
const ivrService = new IVRService();
const queueService = new CallQueueService();

// CORS
fastify.register(cors, {
  origin: true,
});

/**
 * Health check
 */
fastify.get('/health', async () => {
  return { status: 'ok', service: 'telephony' };
});

/**
 * Generate Twilio access token for client
 */
fastify.post<{
  Body: { identity: string };
}>('/api/token', async (request, reply) => {
  const { identity } = request.body;

  if (!identity) {
    return reply.code(400).send({ error: 'Identity is required' });
  }

  try {
    // Create access token
    const token = new AccessToken(
      config.twilio.accountSid,
      config.twilio.apiKey,
      config.twilio.apiSecret,
      { identity }
    );

    // Create voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: config.twilio.twimlAppSid,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    return {
      token: token.toJwt(),
      identity,
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to generate token' });
  }
});

/**
 * Handle incoming calls (TwiML endpoint)
 */
fastify.post('/api/calls/incoming', async (request, reply) => {
  try {
    const twiml = await telephonyService.handleIncomingCall(request.body);

    reply.type('text/xml');
    return twiml;
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to handle incoming call' });
  }
});

/**
 * Handle outgoing calls (TwiML endpoint)
 */
fastify.post('/api/calls/outgoing', async (request, reply) => {
  try {
    const twiml = await telephonyService.handleOutgoingCall(request.body);

    reply.type('text/xml');
    return twiml;
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to handle outgoing call' });
  }
});

/**
 * IVR Handler (TwiML endpoint)
 */
fastify.post('/api/ivr/menu', async (request, reply) => {
  try {
    const twiml = await ivrService.handleMenuSelection(request.body);

    reply.type('text/xml');
    return twiml;
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send({ error: 'Failed to handle IVR' });
  }
});

/**
 * Get call history
 */
fastify.get<{
  Querystring: { userId?: string; limit?: string };
}>('/api/calls/history', async (request) => {
  const { userId, limit = '50' } = request.query;

  try {
    const calls = await telephonyService.getCallHistory({
      userId,
      limit: parseInt(limit),
    });

    return { calls };
  } catch (error) {
    fastify.log.error(error);
    throw new Error('Failed to get call history');
  }
});

/**
 * Get call recording
 */
fastify.get<{
  Params: { recordingSid: string };
}>('/api/recordings/:recordingSid', async (request) => {
  const { recordingSid } = request.params;

  try {
    const recordingUrl = await telephonyService.getRecording(recordingSid);
    return { url: recordingUrl };
  } catch (error) {
    fastify.log.error(error);
    throw new Error('Failed to get recording');
  }
});

/**
 * Get call queue status
 */
fastify.get<{
  Params: { queueId: string };
}>('/api/queues/:queueId', async (request) => {
  const { queueId } = request.params;

  try {
    const queue = await queueService.getQueueStatus(queueId);
    return queue;
  } catch (error) {
    fastify.log.error(error);
    throw new Error('Failed to get queue status');
  }
});

/**
 * Call status webhook
 */
fastify.post('/api/webhooks/call-status', async (request) => {
  fastify.log.info('Call status update:', request.body);

  // Handle call status updates (connecting, ringing, in-progress, completed, etc.)
  await telephonyService.handleCallStatusUpdate(request.body);

  return { success: true };
});

/**
 * Recording status webhook
 */
fastify.post('/api/webhooks/recording-status', async (request) => {
  fastify.log.info('Recording status update:', request.body);

  // Handle recording status updates
  await telephonyService.handleRecordingStatusUpdate(request.body);

  return { success: true };
});

/**
 * Start server
 */
const start = async () => {
  try {
    await fastify.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    fastify.log.info(`🔊 Telephony service running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
