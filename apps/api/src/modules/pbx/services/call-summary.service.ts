import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Anthropic from '@anthropic-ai/sdk';
import { CallSummary } from '../entities/call-summary.entity';
import { Transcription } from '../entities/transcription.entity';
import { Call } from '../entities/call.entity';
import { SentimentAnalysis } from '../entities/sentiment-analysis.entity';
import {
  ICallSummary,
  IActionItem,
  ResolutionStatus,
  ISummaryOptions,
} from '../interfaces/summary.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CallSummaryService {
  private readonly logger = new Logger(CallSummaryService.name);
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(CallSummary)
    private readonly summaryRepository: Repository<CallSummary>,
    @InjectRepository(Transcription)
    private readonly transcriptionRepository: Repository<Transcription>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(SentimentAnalysis)
    private readonly sentimentRepository: Repository<SentimentAnalysis>,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateSummary(
    callId: string,
    transcriptionId?: string,
    options: ISummaryOptions = {
      includeActionItems: true,
      includeNextSteps: true,
      includeTopics: true,
      language: 'es',
    },
  ): Promise<ICallSummary> {
    this.logger.log(`Generating summary for call ${callId}`);

    const call = await this.callRepository.findOne({ where: { id: callId } });
    if (!call) {
      throw new Error(`Call ${callId} not found`);
    }

    let transcription: Transcription;
    if (transcriptionId) {
      transcription = await this.transcriptionRepository.findOne({
        where: { id: transcriptionId },
      });
    } else {
      transcription = await this.transcriptionRepository.findOne({
        where: { callId },
      });
    }

    if (!transcription) {
      throw new Error(`Transcription not found for call ${callId}`);
    }

    const sentiment = await this.sentimentRepository.findOne({
      where: { callId },
    });

    const existingSummary = await this.summaryRepository.findOne({
      where: { callId },
    });

    try {
      const prompt = this.buildSummaryPrompt(transcription, sentiment, options);

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

      const summaryText = response.content[0].type === 'text' ? response.content[0].text : '';
      const summaryData = this.parseSummaryResponse(summaryText);

      let summary: CallSummary;

      if (existingSummary) {
        summary = existingSummary;
        Object.assign(summary, summaryData);
      } else {
        summary = this.summaryRepository.create({
          callId,
          transcriptionId: transcription.id,
          ...summaryData,
        });
      }

      await this.summaryRepository.save(summary);

      await this.callRepository.update(callId, {
        summaryId: summary.id,
      });

      this.logger.log(`Summary generated for call ${callId}`);

      this.eventEmitter.emit('pbx.summary.generated', {
        summaryId: summary.id,
        callId,
        resolutionStatus: summary.resolutionStatus,
        actionItemsCount: summary.actionItems.length,
      });

      return summary as ICallSummary;
    } catch (error) {
      this.logger.error(`Summary generation failed for call ${callId}`, error);
      throw error;
    }
  }

  private buildSummaryPrompt(
    transcription: Transcription,
    sentiment: SentimentAnalysis | null,
    options: ISummaryOptions,
  ): string {
    let prompt = `Analiza la siguiente conversación telefónica entre un agente de atención al cliente y un cliente, y genera un resumen completo.

Transcripción:
${transcription.text}`;

    if (sentiment) {
      prompt += `

Análisis de Sentimiento:
- Sentimiento general: ${sentiment.overallSentiment}
- Nivel de satisfacción: ${(sentiment.satisfactionScore * 100).toFixed(0)}%
- Nivel de frustración: ${(sentiment.frustrationLevel * 100).toFixed(0)}%
- Emociones detectadas: ${sentiment.emotions.join(', ')}`;
    }

    prompt += `

Genera un resumen en formato JSON con la siguiente estructura:

{
  "summary": [resumen ejecutivo de 2-3 oraciones sobre la llamada],
  "reason": [motivo principal de la llamada en 1 oración],
  "topics": [array de temas tratados durante la llamada],
  "agreements": [array de acuerdos o compromisos establecidos],`;

    if (options.includeActionItems) {
      prompt += `
  "actionItems": [
    {
      "id": [UUID generado],
      "description": [descripción del action item],
      "assignedTo": [null o ID si se mencionó quién debe hacerlo],
      "dueDate": [fecha límite en formato ISO si se mencionó, o null],
      "priority": ["low" | "medium" | "high"],
      "status": "pending",
      "createdAt": [fecha actual en formato ISO]
    }
  ],`;
    } else {
      prompt += `
  "actionItems": [],`;
    }

    if (options.includeNextSteps) {
      prompt += `
  "nextSteps": [array de próximos pasos a seguir],`;
    } else {
      prompt += `
  "nextSteps": [],`;
    }

    prompt += `
  "resolution": [explicación de cómo se resolvió o no el problema],
  "resolutionStatus": ["resolved" | "partially_resolved" | "unresolved" | "escalated" | "callback_required"],
  "sentiment": [descripción breve del sentimiento del cliente],
  "keyPoints": [array de 3-5 puntos clave de la conversación]
}`;

    if (options.maxLength) {
      prompt += `\n\nLimita el resumen a un máximo de ${options.maxLength} palabras.`;
    }

    prompt += `\n\nRespuesta ÚNICAMENTE con el JSON, sin texto adicional.`;

    return prompt;
  }

  private parseSummaryResponse(response: string): Partial<CallSummary> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      const actionItems: IActionItem[] = (data.actionItems || []).map((item: any) => ({
        id: item.id || uuidv4(),
        description: item.description,
        assignedTo: item.assignedTo || null,
        dueDate: item.dueDate ? new Date(item.dueDate) : null,
        priority: item.priority || 'medium',
        status: item.status || 'pending',
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      }));

      return {
        summary: data.summary || '',
        reason: data.reason || '',
        topics: data.topics || [],
        agreements: data.agreements || [],
        actionItems,
        nextSteps: data.nextSteps || [],
        resolution: data.resolution || '',
        resolutionStatus: data.resolutionStatus || ResolutionStatus.UNRESOLVED,
        sentiment: data.sentiment || '',
        keyPoints: data.keyPoints || [],
      };
    } catch (error) {
      this.logger.error('Failed to parse summary response', error);
      throw new Error('Failed to parse summary response');
    }
  }

  async getSummary(summaryId: string): Promise<ICallSummary | null> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId },
    });

    return summary as ICallSummary | null;
  }

  async getSummaryByCallId(callId: string): Promise<ICallSummary | null> {
    const summary = await this.summaryRepository.findOne({
      where: { callId },
    });

    return summary as ICallSummary | null;
  }

  async findSummaries(filters: {
    resolutionStatus?: ResolutionStatus;
    search?: string;
    topic?: string;
    hasPendingActions?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ICallSummary[]> {
    const queryBuilder = this.summaryRepository.createQueryBuilder('summary');

    if (filters.resolutionStatus) {
      queryBuilder.andWhere('summary.resolutionStatus = :resolutionStatus', {
        resolutionStatus: filters.resolutionStatus,
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(summary.summary ILIKE :search OR summary.reason ILIKE :search OR summary.resolution ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.topic) {
      queryBuilder.andWhere(':topic = ANY(summary.topics)', {
        topic: filters.topic,
      });
    }

    if (filters.hasPendingActions) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(summary.actionItems) AS item
          WHERE item->>'status' = 'pending'
        )`,
      );
    }

    if (filters.startDate) {
      queryBuilder.andWhere('summary.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('summary.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const summaries = await queryBuilder
      .orderBy('summary.createdAt', 'DESC')
      .getMany();

    return summaries as ICallSummary[];
  }

  async updateActionItem(
    summaryId: string,
    actionItemId: string,
    updates: Partial<IActionItem>,
  ): Promise<ICallSummary> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId },
    });

    if (!summary) {
      throw new Error(`Summary ${summaryId} not found`);
    }

    const actionItemIndex = summary.actionItems.findIndex((item) => item.id === actionItemId);

    if (actionItemIndex === -1) {
      throw new Error(`Action item ${actionItemId} not found`);
    }

    summary.actionItems[actionItemIndex] = {
      ...summary.actionItems[actionItemIndex],
      ...updates,
    };

    await this.summaryRepository.save(summary);

    this.logger.log(`Action item ${actionItemId} updated in summary ${summaryId}`);

    this.eventEmitter.emit('pbx.summary.actionitem.updated', {
      summaryId,
      actionItemId,
      status: summary.actionItems[actionItemIndex].status,
    });

    return summary as ICallSummary;
  }

  async getPendingActionItems(assignedTo?: string): Promise<
    Array<IActionItem & { summaryId: string; callId: string }>
  > {
    const queryBuilder = this.summaryRepository.createQueryBuilder('summary');

    queryBuilder.where(
      `EXISTS (
        SELECT 1 FROM jsonb_array_elements(summary.actionItems) AS item
        WHERE item->>'status' IN ('pending', 'in_progress')
      )`,
    );

    if (assignedTo) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(summary.actionItems) AS item
          WHERE item->>'assignedTo' = :assignedTo
        )`,
        { assignedTo },
      );
    }

    const summaries = await queryBuilder.getMany();

    const actionItems: Array<IActionItem & { summaryId: string; callId: string }> = [];

    for (const summary of summaries) {
      for (const item of summary.actionItems) {
        if (item.status === 'pending' || item.status === 'in_progress') {
          if (!assignedTo || item.assignedTo === assignedTo) {
            actionItems.push({
              ...item,
              priority: item.priority as 'high' | 'medium' | 'low',
              status: item.status as 'pending' | 'in_progress' | 'completed',
              summaryId: summary.id,
              callId: summary.callId,
            });
          }
        }
      }
    }

    return actionItems;
  }

  async getResolutionStats(filters: {
    startDate: Date;
    endDate: Date;
    agentId?: string;
    queueId?: string;
  }): Promise<{
    resolutionDistribution: Record<ResolutionStatus, number>;
    resolutionRate: number;
    averageActionItems: number;
    totalSummaries: number;
  }> {
    const queryBuilder = this.summaryRepository
      .createQueryBuilder('summary')
      .innerJoin('summary.call', 'call')
      .where('summary.createdAt >= :startDate', { startDate: filters.startDate })
      .andWhere('summary.createdAt <= :endDate', { endDate: filters.endDate });

    if (filters.agentId) {
      queryBuilder.andWhere('call.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters.queueId) {
      queryBuilder.andWhere('call.queueId = :queueId', { queueId: filters.queueId });
    }

    const summaries = await queryBuilder.getMany();

    if (summaries.length === 0) {
      return {
        resolutionDistribution: {
          [ResolutionStatus.RESOLVED]: 0,
          [ResolutionStatus.PARTIALLY_RESOLVED]: 0,
          [ResolutionStatus.UNRESOLVED]: 0,
          [ResolutionStatus.ESCALATED]: 0,
          [ResolutionStatus.CALLBACK_REQUIRED]: 0,
        },
        resolutionRate: 0,
        averageActionItems: 0,
        totalSummaries: 0,
      };
    }

    const distribution: Record<ResolutionStatus, number> = {
      [ResolutionStatus.RESOLVED]: 0,
      [ResolutionStatus.PARTIALLY_RESOLVED]: 0,
      [ResolutionStatus.UNRESOLVED]: 0,
      [ResolutionStatus.ESCALATED]: 0,
      [ResolutionStatus.CALLBACK_REQUIRED]: 0,
    };

    let totalActionItems = 0;
    let resolvedCount = 0;

    summaries.forEach((summary) => {
      distribution[summary.resolutionStatus]++;
      totalActionItems += summary.actionItems.length;
      if (summary.resolutionStatus === ResolutionStatus.RESOLVED) {
        resolvedCount++;
      }
    });

    return {
      resolutionDistribution: distribution,
      resolutionRate: (resolvedCount / summaries.length) * 100,
      averageActionItems: totalActionItems / summaries.length,
      totalSummaries: summaries.length,
    };
  }

  async extractTopics(startDate: Date, endDate: Date, limit = 10): Promise<Array<{ topic: string; count: number }>> {
    const summaries = await this.summaryRepository
      .createQueryBuilder('summary')
      .where('summary.createdAt >= :startDate', { startDate })
      .andWhere('summary.createdAt <= :endDate', { endDate })
      .getMany();

    const topicCounts = new Map<string, number>();

    summaries.forEach((summary) => {
      summary.topics.forEach((topic) => {
        const count = topicCounts.get(topic) || 0;
        topicCounts.set(topic, count + 1);
      });
    });

    const sortedTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedTopics;
  }
}
