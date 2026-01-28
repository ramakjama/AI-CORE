/**
 * Telephony Service
 * Core telephony logic and call handling
 */

import twilio from 'twilio';
import { config } from './config';

const VoiceResponse = twilio.twiml.VoiceResponse;

export class TelephonyService {
  private client: twilio.Twilio;

  constructor(twilioConfig: typeof config.twilio) {
    this.client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  }

  /**
   * Handle incoming call
   */
  async handleIncomingCall(params: any): Promise<string> {
    const twiml = new VoiceResponse();

    // Log incoming call
    console.log('[Telephony] Incoming call from:', params.From);

    // Play greeting
    twiml.say(
      {
        voice: 'Polly.Lucia',
        language: 'es-ES',
      },
      'Bienvenido a AIT-CORE Soriano Mediadores.'
    );

    // Redirect to IVR menu
    twiml.redirect('/api/ivr/menu');

    return twiml.toString();
  }

  /**
   * Handle outgoing call
   */
  async handleOutgoingCall(params: any): Promise<string> {
    const twiml = new VoiceResponse();

    // Extract destination from params
    const to = params.To;

    console.log('[Telephony] Outgoing call to:', to);

    // Dial the number
    twiml.dial(to);

    return twiml.toString();
  }

  /**
   * Make a call programmatically
   */
  async makeCall(options: {
    to: string;
    from?: string;
    url: string;
    statusCallback?: string;
    record?: boolean;
  }) {
    try {
      const call = await this.client.calls.create({
        to: options.to,
        from: options.from || config.twilio.phoneNumber,
        url: options.url,
        statusCallback: options.statusCallback,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        record: options.record,
      });

      return call;
    } catch (error) {
      console.error('[Telephony] Failed to make call:', error);
      throw error;
    }
  }

  /**
   * Get call history
   */
  async getCallHistory(options: { userId?: string; limit: number }) {
    try {
      const calls = await this.client.calls.list({
        limit: options.limit,
      });

      return calls.map((call) => ({
        sid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        direction: call.direction,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        priceUnit: call.priceUnit,
      }));
    } catch (error) {
      console.error('[Telephony] Failed to get call history:', error);
      throw error;
    }
  }

  /**
   * Get call recording
   */
  async getRecording(recordingSid: string): Promise<string> {
    try {
      const recording = await this.client.recordings(recordingSid).fetch();
      return `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
    } catch (error) {
      console.error('[Telephony] Failed to get recording:', error);
      throw error;
    }
  }

  /**
   * Handle call status update webhook
   */
  async handleCallStatusUpdate(params: any) {
    console.log('[Telephony] Call status update:', {
      callSid: params.CallSid,
      status: params.CallStatus,
      duration: params.CallDuration,
    });

    // TODO: Store in database
    // await db.calls.update(...)
  }

  /**
   * Handle recording status update webhook
   */
  async handleRecordingStatusUpdate(params: any) {
    console.log('[Telephony] Recording status update:', {
      recordingSid: params.RecordingSid,
      status: params.RecordingStatus,
      duration: params.RecordingDuration,
      url: params.RecordingUrl,
    });

    // TODO: Store recording URL in database
    // await db.recordings.create(...)
  }
}
