import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

export interface IVRMenuOption {
  digit: string;
  action: 'queue' | 'extension' | 'voicemail' | 'submenu' | 'hangup' | 'callback';
  target: string;
  label?: string;
}

export interface IVRMenu {
  id: string;
  name: string;
  greeting: string;
  options: IVRMenuOption[];
  timeout?: number;
  maxRetries?: number;
  defaultAction?: string;
  defaultTarget?: string;
  audioUrl?: string;
  ttsText?: string;
  ttsVoice?: string;
}

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
  intent?: string;
  entities?: Record<string, any>;
  suggestedAction?: {
    type: string;
    target: string;
  };
}

@Injectable()
export class IVRService {
  private readonly logger = new Logger(IVRService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  async playMenu(callId: string, menuId: string): Promise<void> {
    this.logger.log(`Playing IVR menu ${menuId} for call ${callId}`);

    const menu = await this.prisma.iVRMenu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new Error(`IVR menu ${menuId} not found`);
    }

    this.eventEmitter.emit('pbx.ivr.menu.start', {
      callId,
      menuId,
      menu,
    });

    // El audio se reproduce en Asterisk mediante AMI
    // Aquí solo guardamos el estado y emitimos eventos
  }

  async processInput(callId: string, input: string, menuId: string): Promise<any> {
    this.logger.log(`Processing DTMF input "${input}" for call ${callId} in menu ${menuId}`);

    const menu = await this.prisma.iVRMenu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new Error(`IVR menu ${menuId} not found`);
    }

    const options = menu.options as any as IVRMenuOption[];
    const selectedOption = options.find((opt) => opt.digit === input);

    if (!selectedOption) {
      this.logger.warn(`Invalid IVR option "${input}" selected for call ${callId}`);

      this.eventEmitter.emit('pbx.ivr.invalid.input', {
        callId,
        menuId,
        input,
      });

      return {
        action: menu.defaultAction || 'retry',
        target: menu.defaultTarget,
      };
    }

    this.logger.log(`IVR option "${input}" selected: ${selectedOption.action} -> ${selectedOption.target}`);

    this.eventEmitter.emit('pbx.ivr.option.selected', {
      callId,
      menuId,
      option: selectedOption,
    });

    // Guardar el path del IVR en la llamada
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
    });

    if (call) {
      const ivrPath = (call.ivrPath as any) || [];
      ivrPath.push({
        menuId,
        option: input,
        action: selectedOption.action,
        target: selectedOption.target,
        timestamp: new Date().toISOString(),
      });

      await this.prisma.call.update({
        where: { id: callId },
        data: { ivrPath },
      });
    }

    return {
      action: selectedOption.action,
      target: selectedOption.target,
    };
  }

  async voiceRecognition(callId: string, audioBuffer: Buffer): Promise<VoiceRecognitionResult> {
    this.logger.log(`Processing voice recognition for call ${callId}`);

    try {
      // Usar Whisper API para transcripción
      const transcription = await this.transcribeAudio(audioBuffer);

      // Usar Claude para entender la intención
      const analysis = await this.analyzeIntent(transcription);

      const result: VoiceRecognitionResult = {
        text: transcription,
        confidence: analysis.confidence,
        intent: analysis.intent,
        entities: analysis.entities,
        suggestedAction: analysis.suggestedAction,
      };

      this.eventEmitter.emit('pbx.ivr.voice.recognized', {
        callId,
        result,
      });

      return result;
    } catch (error) {
      this.logger.error(`Voice recognition failed for call ${callId}:`, error);
      throw error;
    }
  }

  private async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    // Aquí se integraría con Whisper API de OpenAI
    // Por ahora simulamos la transcripción
    this.logger.debug('Transcribing audio with Whisper API...');

    // En producción:
    // const openai = new OpenAI({ apiKey: this.configService.get('OPENAI_API_KEY') });
    // const transcription = await openai.audio.transcriptions.create({
    //   file: audioBuffer,
    //   model: 'whisper-1',
    //   language: 'es',
    // });
    // return transcription.text;

    // Simulación
    return 'Quiero hablar con el departamento de ventas';
  }

  private async analyzeIntent(text: string): Promise<{
    confidence: number;
    intent: string;
    entities: Record<string, any>;
    suggestedAction: { type: string; target: string };
  }> {
    this.logger.debug(`Analyzing intent for: "${text}"`);

    const prompt = `Analiza la siguiente solicitud de un cliente en una llamada telefónica y extrae:
1. La intención principal (intent)
2. Entidades relevantes (nombres, departamentos, números, etc.)
3. Una acción sugerida para el IVR

Solicitud: "${text}"

Responde en JSON con este formato:
{
  "confidence": 0.95,
  "intent": "contact_sales",
  "entities": {
    "department": "ventas",
    "urgency": "normal"
  },
  "suggestedAction": {
    "type": "queue",
    "target": "sales_queue"
  }
}

Posibles intents: contact_sales, contact_support, check_policy, file_claim, general_inquiry, speak_to_agent
Posibles actions: queue, extension, voicemail, callback`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return analysis;
        }
      }

      // Fallback
      return {
        confidence: 0.5,
        intent: 'general_inquiry',
        entities: {},
        suggestedAction: {
          type: 'queue',
          target: 'general_queue',
        },
      };
    } catch (error) {
      this.logger.error('Failed to analyze intent with Claude:', error);
      throw error;
    }
  }

  async detectLanguage(text: string): Promise<string> {
    // Detección simple de idioma
    const spanishPatterns = /(?:quiero|hablar|necesito|ayuda|departamento|ventas|soporte)/i;
    const englishPatterns = /(?:want|speak|need|help|department|sales|support)/i;

    if (spanishPatterns.test(text)) {
      return 'es-ES';
    } else if (englishPatterns.test(text)) {
      return 'en-US';
    }

    return 'es-ES'; // Default
  }

  async createMenu(data: {
    name: string;
    description?: string;
    greeting: string;
    options: IVRMenuOption[];
    timeout?: number;
    maxRetries?: number;
    audioUrl?: string;
    ttsText?: string;
    ttsVoice?: string;
    companyId?: string;
  }): Promise<IVRMenu> {
    this.logger.log(`Creating IVR menu: ${data.name}`);

    const menu = await this.prisma.iVRMenu.create({
      data: {
        name: data.name,
        description: data.description,
        greeting: data.greeting,
        options: data.options as any,
        timeout: data.timeout || 5,
        maxRetries: data.maxRetries || 3,
        audioUrl: data.audioUrl,
        ttsText: data.ttsText,
        ttsVoice: data.ttsVoice || 'es-ES-Standard-A',
        companyId: data.companyId,
        active: true,
      },
    });

    return menu as any as IVRMenu;
  }

  async updateMenu(menuId: string, data: Partial<IVRMenu>): Promise<IVRMenu> {
    this.logger.log(`Updating IVR menu: ${menuId}`);

    const menu = await this.prisma.iVRMenu.update({
      where: { id: menuId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.greeting && { greeting: data.greeting }),
        ...(data.options && { options: data.options as any }),
        ...(data.timeout !== undefined && { timeout: data.timeout }),
        ...(data.maxRetries !== undefined && { maxRetries: data.maxRetries }),
        ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
        ...(data.ttsText !== undefined && { ttsText: data.ttsText }),
        ...(data.ttsVoice !== undefined && { ttsVoice: data.ttsVoice }),
      },
    });

    return menu as any as IVRMenu;
  }

  async deleteMenu(menuId: string): Promise<void> {
    this.logger.log(`Deleting IVR menu: ${menuId}`);

    await this.prisma.iVRMenu.update({
      where: { id: menuId },
      data: { active: false },
    });
  }

  async getMenu(menuId: string): Promise<IVRMenu | null> {
    const menu = await this.prisma.iVRMenu.findUnique({
      where: { id: menuId },
    });

    return menu as any as IVRMenu;
  }

  async listMenus(filters?: {
    companyId?: string;
    active?: boolean;
  }): Promise<IVRMenu[]> {
    const menus = await this.prisma.iVRMenu.findMany({
      where: {
        ...(filters?.companyId && { companyId: filters.companyId }),
        ...(filters?.active !== undefined && { active: filters.active }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return menus as any as IVRMenu[];
  }

  async getIVRPath(callId: string): Promise<any[]> {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      select: { ivrPath: true },
    });

    return (call?.ivrPath as any) || [];
  }

  async generateTTS(text: string, voice = 'es-ES-Standard-A'): Promise<Buffer> {
    // Aquí se integraría con Google Cloud Text-to-Speech o similar
    this.logger.debug(`Generating TTS for text: "${text}" with voice: ${voice}`);

    // En producción:
    // const textToSpeech = require('@google-cloud/text-to-speech');
    // const client = new textToSpeech.TextToSpeechClient();
    // const [response] = await client.synthesizeSpeech({
    //   input: { text },
    //   voice: { languageCode: 'es-ES', name: voice },
    //   audioConfig: { audioEncoding: 'MP3' },
    // });
    // return Buffer.from(response.audioContent);

    // Simulación
    return Buffer.from('fake-audio-data');
  }
}
