// AI-LLM Conversation Service - Manages conversation context and memory

import type {
  CompletionRequest,
  CompletionResponse,
  ConversationContext,
  Message,
  ModelId,
  Tool,
} from '../types';
import { RouterService } from './router.service';

export interface ConversationConfig {
  model: ModelId;
  systemPrompt?: string;
  temperature?: number;
  maxHistoryMessages?: number;
  tools?: Tool[];
}

export interface SavedConversation {
  id: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  messages: Message[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationService {
  private router: RouterService;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor(router?: RouterService) {
    this.router = router ?? new RouterService();
  }

  async startConversation(
    conversationId: string,
    config: ConversationConfig
  ): Promise<ConversationContext> {
    const context: ConversationContext = {
      conversationId,
      messages: [],
      systemPrompt: config.systemPrompt,
      metadata: {
        model: config.model,
        temperature: config.temperature,
        tools: config.tools,
        startedAt: new Date(),
      },
    };

    this.conversations.set(conversationId, context);
    return context;
  }

  async sendMessage(
    conversationId: string,
    userMessage: string,
    config?: Partial<ConversationConfig>
  ): Promise<CompletionResponse> {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    // Add user message to history
    context.messages.push({
      role: 'user',
      content: userMessage,
    });

    const model = (config?.model ?? context.metadata?.['model'] ?? 'claude-3-5-sonnet-20241022') as ModelId;
    const tools = config?.tools ?? (context.metadata?.['tools'] as Tool[] | undefined);

    const request: CompletionRequest = {
      model,
      messages: context.messages,
      systemPrompt: config?.systemPrompt ?? context.systemPrompt,
      temperature: config?.temperature ?? (context.metadata?.['temperature'] as number | undefined),
      tools,
    };

    const response = await this.router.complete(request);

    // Add assistant response to history
    context.messages.push({
      role: 'assistant',
      content: response.content,
    });

    // Trim history if needed
    const maxHistory = config?.maxHistoryMessages ?? 50;
    if (context.messages.length > maxHistory) {
      context.messages = context.messages.slice(-maxHistory);
    }

    return response;
  }

  async *streamMessage(
    conversationId: string,
    userMessage: string,
    config?: Partial<ConversationConfig>
  ): AsyncGenerator<string> {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    context.messages.push({
      role: 'user',
      content: userMessage,
    });

    const model = (config?.model ?? context.metadata?.['model'] ?? 'claude-3-5-sonnet-20241022') as ModelId;

    const request: CompletionRequest = {
      model,
      messages: context.messages,
      systemPrompt: config?.systemPrompt ?? context.systemPrompt,
      temperature: config?.temperature ?? (context.metadata?.['temperature'] as number | undefined),
      stream: true,
    };

    let fullResponse = '';

    for await (const chunk of this.router.stream(request)) {
      if (chunk.type === 'text' && chunk.text) {
        fullResponse += chunk.text;
        yield chunk.text;
      }
    }

    context.messages.push({
      role: 'assistant',
      content: fullResponse,
    });
  }

  getConversation(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }

  getMessages(conversationId: string): Message[] {
    return this.conversations.get(conversationId)?.messages ?? [];
  }

  clearHistory(conversationId: string): void {
    const context = this.conversations.get(conversationId);
    if (context) {
      context.messages = [];
    }
  }

  endConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  // Integration with sm_ai_agents database
  async saveToDatabase(conversationId: string, userId?: string): Promise<SavedConversation> {
    const context = this.conversations.get(conversationId);
    if (!context) {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    const saved: SavedConversation = {
      id: conversationId,
      userId,
      title: this.generateTitle(context.messages),
      messages: context.messages,
      metadata: context.metadata,
      createdAt: (context.metadata?.['startedAt'] as Date) ?? new Date(),
      updatedAt: new Date(),
    };

    // TODO: Save to sm_ai_agents.Conversation table
    console.log('Saving conversation to database:', saved.id);

    return saved;
  }

  async loadFromDatabase(conversationId: string): Promise<ConversationContext | null> {
    // TODO: Load from sm_ai_agents.Conversation table
    console.log('Loading conversation from database:', conversationId);
    return null;
  }

  private generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'Nueva conversación';

    const content = typeof firstUserMessage.content === 'string'
      ? firstUserMessage.content
      : '';

    return content.slice(0, 50) + (content.length > 50 ? '...' : '');
  }
}

export const conversationService = new ConversationService();
