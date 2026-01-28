/**
 * IVR Service
 * Interactive Voice Response system
 */

import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export class IVRService {
  /**
   * Main IVR menu
   */
  async getMainMenu(): Promise<string> {
    const twiml = new VoiceResponse();

    const gather = twiml.gather({
      numDigits: 1,
      action: '/api/ivr/menu',
      method: 'POST',
      timeout: 10,
    });

    gather.say(
      {
        voice: 'Polly.Lucia',
        language: 'es-ES',
      },
      'Para seguros de vida, pulse 1. ' +
        'Para seguros de salud, pulse 2. ' +
        'Para seguros de hogar, pulse 3. ' +
        'Para seguros de automóvil, pulse 4. ' +
        'Para hablar con un agente, pulse 9.'
    );

    // If no input, repeat
    twiml.redirect('/api/ivr/menu');

    return twiml.toString();
  }

  /**
   * Handle menu selection
   */
  async handleMenuSelection(params: any): Promise<string> {
    const twiml = new VoiceResponse();
    const digit = params.Digits;

    console.log('[IVR] Menu selection:', digit);

    switch (digit) {
      case '1':
        // Seguros de vida
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Le transferimos con nuestro departamento de seguros de vida.'
        );
        twiml.dial({
          action: '/api/calls/completed',
        }, '+34912345678'); // Replace with actual extension
        break;

      case '2':
        // Seguros de salud
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Le transferimos con nuestro departamento de seguros de salud.'
        );
        twiml.dial('+34912345679');
        break;

      case '3':
        // Seguros de hogar
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Le transferimos con nuestro departamento de seguros de hogar.'
        );
        twiml.dial('+34912345680');
        break;

      case '4':
        // Seguros de automóvil
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Le transferimos con nuestro departamento de seguros de automóvil.'
        );
        twiml.dial('+34912345681');
        break;

      case '9':
        // Agente
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Le conectamos con un agente disponible. Por favor, espere.'
        );
        // Enqueue call
        twiml.enqueue({
          waitUrl: '/api/ivr/wait-music',
          action: '/api/calls/completed',
        }, 'general-queue');
        break;

      default:
        // Invalid option
        twiml.say(
          {
            voice: 'Polly.Lucia',
            language: 'es-ES',
          },
          'Opción no válida.'
        );
        twiml.redirect('/api/ivr/menu');
        break;
    }

    return twiml.toString();
  }

  /**
   * Wait music for queued calls
   */
  async getWaitMusic(): Promise<string> {
    const twiml = new VoiceResponse();

    twiml.say(
      {
        voice: 'Polly.Lucia',
        language: 'es-ES',
      },
      'Su llamada es importante para nosotros. Por favor, permanezca en la línea.'
    );

    // Play hold music
    twiml.play('http://com.twilio.sounds.music.s3.amazonaws.com/MARKOVICHAMP-Borghestral.mp3');

    return twiml.toString();
  }
}
