import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Anthropic from '@anthropic-ai/sdk';
import { SentimentAnalysis } from '../entities/sentiment-analysis.entity';
import { Transcription } from '../entities/transcription.entity';
import { Call } from '../entities/call.entity';
import {
  ISentimentAnalysis,
  SentimentScore,
  EmotionType,
  ISentimentAlert,
  ISentimentTimeline,
} from '../interfaces/sentiment.interface';

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(SentimentAnalysis)
    private readonly sentimentRepository: Repository<SentimentAnalysis>,
    @InjectRepository(Transcription)
    private readonly transcriptionRepository: Repository<Transcription>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async analyzeSentiment(transcriptionId: string, includeTimeline = true): Promise<ISentimentAnalysis> {
    this.logger.log(`Starting sentiment analysis for transcription ${transcriptionId}`);

    const transcription = await this.transcriptionRepository.findOne({
      where: { id: transcriptionId },
      relations: ['call'],
    });

    if (!transcription) {
      throw new Error(`Transcription ${transcriptionId} not found`);
    }

    const existingSentiment = await this.sentimentRepository.findOne({
      where: { transcriptionId },
    });

    try {
      const prompt = this.buildAnalysisPrompt(transcription, includeTimeline);

      const response = await this.anthropic.messages.create({
        model: this.configService.get<string>('ANTHROPIC_MODEL', 'claude-opus-4-20250514'),
        max_tokens: 4096,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
      const analysisData = this.parseAnalysisResponse(analysisText);

      let sentiment: SentimentAnalysis;

      if (existingSentiment) {
        sentiment = existingSentiment;
        Object.assign(sentiment, analysisData);
      } else {
        sentiment = this.sentimentRepository.create({
          callId: transcription.callId,
          transcriptionId: transcription.id,
          ...analysisData,
        });
      }

      await this.sentimentRepository.save(sentiment);

      await this.callRepository.update(transcription.callId, {
        sentimentAnalysisId: sentiment.id,
      });

      this.logger.log(
        `Sentiment analysis completed for transcription ${transcriptionId}. Overall: ${sentiment.overallSentiment}`,
      );

      this.eventEmitter.emit('pbx.sentiment.analyzed', {
        sentimentId: sentiment.id,
        callId: transcription.callId,
        sentiment: sentiment.overallSentiment,
        escalationRequired: sentiment.escalationRequired,
      });

      if (sentiment.escalationRequired) {
        await this.sendEscalationAlert(sentiment);
      }

      return sentiment as ISentimentAnalysis;
    } catch (error) {
      this.logger.error(`Sentiment analysis failed for transcription ${transcriptionId}`, error);
      throw error;
    }
  }

  private buildAnalysisPrompt(transcription: Transcription, includeTimeline: boolean): string {
    let prompt = `Analiza el siguiente texto de una conversación telefónica entre un agente de atención al cliente y un cliente.

Transcripción:
${transcription.text}

Por favor, proporciona un análisis detallado del sentimiento en formato JSON con la siguiente estructura:

{
  "overallScore": [número entre 0 y 1, donde 0 es muy negativo y 1 es muy positivo],
  "overallSentiment": ["very_negative" | "negative" | "neutral" | "positive" | "very_positive"],
  "emotions": [array de emociones detectadas: "angry", "frustrated", "confused", "satisfied", "happy", "anxious", "neutral", "urgent"],
  "frustrationLevel": [número entre 0 y 1],
  "urgencyLevel": [número entre 0 y 1],
  "satisfactionScore": [número entre 0 y 1],
  "keyPhrases": [array de frases clave que indican el sentimiento],
  "escalationRequired": [boolean - true si detectas alto nivel de frustración o insatisfacción],
  "escalationReason": [string explicando por qué se requiere escalación, o null]`;

    if (includeTimeline && transcription.segments && transcription.segments.length > 0) {
      prompt += `,
  "timeline": [
    {
      "timestamp": [número en segundos],
      "score": [número entre 0 y 1],
      "sentiment": ["very_negative" | "negative" | "neutral" | "positive" | "very_positive"],
      "text": [fragmento del texto]
    }
  ]`;
    }

    prompt += `
}

Considera:
- El tono y las palabras utilizadas por ambas partes
- La evolución del sentimiento a lo largo de la conversación
- Indicadores de frustración como repetición, palabras negativas, o solicitudes de escalación
- Nivel de urgencia expresado por el cliente
- Satisfacción final del cliente con la resolución

Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    return prompt;
  }

  private parseAnalysisResponse(response: string): Partial<SentimentAnalysis> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        overallScore: data.overallScore || 0.5,
        overallSentiment: data.overallSentiment || SentimentScore.NEUTRAL,
        emotions: data.emotions || [],
        frustrationLevel: data.frustrationLevel || 0,
        urgencyLevel: data.urgencyLevel || 0,
        satisfactionScore: data.satisfactionScore || 0.5,
        keyPhrases: data.keyPhrases || [],
        escalationRequired: data.escalationRequired || false,
        escalationReason: data.escalationReason || null,
        timeline: data.timeline || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse sentiment analysis response', error);
      throw new Error('Failed to parse sentiment analysis response');
    }
  }

  private async sendEscalationAlert(sentiment: SentimentAnalysis): Promise<void> {
    const call = await this.callRepository.findOne({
      where: { id: sentiment.callId },
    });

    if (!call) {
      return;
    }

    const alert: ISentimentAlert = {
      callId: sentiment.callId,
      agentId: call.agentId,
      type: 'escalation',
      severity: this.calculateAlertSeverity(sentiment),
      message: sentiment.escalationReason || 'High frustration level detected',
      timestamp: new Date(),
    };

    this.logger.warn(`Escalation alert for call ${sentiment.callId}`, alert);

    this.eventEmitter.emit('pbx.sentiment.alert', alert);
  }

  private calculateAlertSeverity(sentiment: SentimentAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    if (sentiment.frustrationLevel >= 0.8 || sentiment.overallScore <= 0.2) {
      return 'critical';
    } else if (sentiment.frustrationLevel >= 0.6 || sentiment.overallScore <= 0.3) {
      return 'high';
    } else if (sentiment.frustrationLevel >= 0.4 || sentiment.overallScore <= 0.4) {
      return 'medium';
    }
    return 'low';
  }

  async getSentimentAnalysis(sentimentId: string): Promise<ISentimentAnalysis | null> {
    const sentiment = await this.sentimentRepository.findOne({
      where: { id: sentimentId },
    });

    return sentiment as ISentimentAnalysis | null;
  }

  async getSentimentByCallId(callId: string): Promise<ISentimentAnalysis | null> {
    const sentiment = await this.sentimentRepository.findOne({
      where: { callId },
    });

    return sentiment as ISentimentAnalysis | null;
  }

  async findSentimentAnalyses(filters: {
    sentiment?: SentimentScore;
    escalationRequired?: boolean;
    minFrustration?: number;
    minUrgency?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ISentimentAnalysis[]> {
    const queryBuilder = this.sentimentRepository.createQueryBuilder('sentiment');

    if (filters.sentiment) {
      queryBuilder.andWhere('sentiment.overallSentiment = :sentiment', {
        sentiment: filters.sentiment,
      });
    }

    if (filters.escalationRequired !== undefined) {
      queryBuilder.andWhere('sentiment.escalationRequired = :escalationRequired', {
        escalationRequired: filters.escalationRequired,
      });
    }

    if (filters.minFrustration !== undefined) {
      queryBuilder.andWhere('sentiment.frustrationLevel >= :minFrustration', {
        minFrustration: filters.minFrustration,
      });
    }

    if (filters.minUrgency !== undefined) {
      queryBuilder.andWhere('sentiment.urgencyLevel >= :minUrgency', {
        minUrgency: filters.minUrgency,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('sentiment.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('sentiment.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const sentiments = await queryBuilder
      .orderBy('sentiment.createdAt', 'DESC')
      .getMany();

    return sentiments as ISentimentAnalysis[];
  }

  async getSentimentTrends(filters: {
    startDate: Date;
    endDate: Date;
    agentId?: string;
    queueId?: string;
  }): Promise<{
    averageScore: number;
    sentimentDistribution: Record<SentimentScore, number>;
    averageFrustration: number;
    escalationRate: number;
    totalAnalyses: number;
  }> {
    const queryBuilder = this.sentimentRepository
      .createQueryBuilder('sentiment')
      .innerJoin('sentiment.call', 'call')
      .where('sentiment.createdAt >= :startDate', { startDate: filters.startDate })
      .andWhere('sentiment.createdAt <= :endDate', { endDate: filters.endDate });

    if (filters.agentId) {
      queryBuilder.andWhere('call.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters.queueId) {
      queryBuilder.andWhere('call.queueId = :queueId', { queueId: filters.queueId });
    }

    const sentiments = await queryBuilder.getMany();

    if (sentiments.length === 0) {
      return {
        averageScore: 0,
        sentimentDistribution: {
          [SentimentScore.VERY_NEGATIVE]: 0,
          [SentimentScore.NEGATIVE]: 0,
          [SentimentScore.NEUTRAL]: 0,
          [SentimentScore.POSITIVE]: 0,
          [SentimentScore.VERY_POSITIVE]: 0,
        },
        averageFrustration: 0,
        escalationRate: 0,
        totalAnalyses: 0,
      };
    }

    const totalScore = sentiments.reduce((sum, s) => sum + s.overallScore, 0);
    const totalFrustration = sentiments.reduce((sum, s) => sum + s.frustrationLevel, 0);
    const escalations = sentiments.filter((s) => s.escalationRequired).length;

    const distribution: Record<SentimentScore, number> = {
      [SentimentScore.VERY_NEGATIVE]: 0,
      [SentimentScore.NEGATIVE]: 0,
      [SentimentScore.NEUTRAL]: 0,
      [SentimentScore.POSITIVE]: 0,
      [SentimentScore.VERY_POSITIVE]: 0,
    };

    sentiments.forEach((s) => {
      distribution[s.overallSentiment]++;
    });

    return {
      averageScore: totalScore / sentiments.length,
      sentimentDistribution: distribution,
      averageFrustration: totalFrustration / sentiments.length,
      escalationRate: (escalations / sentiments.length) * 100,
      totalAnalyses: sentiments.length,
    };
  }

  async detectNegativeTrend(callId: string): Promise<boolean> {
    const sentiment = await this.sentimentRepository.findOne({
      where: { callId },
    });

    if (!sentiment || !sentiment.timeline || sentiment.timeline.length < 3) {
      return false;
    }

    const timeline = sentiment.timeline;
    const lastThree = timeline.slice(-3);

    let isDecreasing = true;
    for (let i = 1; i < lastThree.length; i++) {
      if (lastThree[i].score >= lastThree[i - 1].score) {
        isDecreasing = false;
        break;
      }
    }

    if (isDecreasing && lastThree[lastThree.length - 1].score < 0.4) {
      this.logger.warn(`Negative trend detected for call ${callId}`);
      this.eventEmitter.emit('pbx.sentiment.negative-trend', {
        callId,
        currentScore: lastThree[lastThree.length - 1].score,
      });
      return true;
    }

    return false;
  }
}
