// Groq Provider - Ultra-fast LLM inference
// Models: Llama 3.3, Mixtral, Gemma

import Groq from 'groq-sdk';
import type {
  CompletionRequest,
  CompletionResponse,
  Message,
  StreamChunk,
  Tool,
  ToolCall,
  TokenUsage,
  ModelId,
} from '../types';

export type GroqModel =
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'llama3-groq-70b-8192-tool-use-preview'
  | 'llama3-groq-8b-8192-tool-use-preview'
  | 'mixtral-8x7b-32768'
  | 'gemma2-9b-it'
  | 'gemma-7b-it';

export class GroqProvider {
  private client: Groq;
  private readonly COST_PER_1K: Record<string, { input: number; output: number }> = {
    'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
    'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
    'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
    'llama3-groq-70b-8192-tool-use-preview': { input: 0.00089, output: 0.00089 },
    'llama3-groq-8b-8192-tool-use-preview': { input: 0.00019, output: 0.00019 },
    'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
    'gemma2-9b-it': { input: 0.0002, output: 0.0002 },
    'gemma-7b-it': { input: 0.00007, output: 0.00007 },
  };

  constructor(apiKey?: string) {
    this.client = new Groq({
      apiKey: apiKey ?? process.env['GROQ_API_KEY'],
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const groqMessages = this.convertMessages(request.messages, request.systemPrompt);

    const response = await this.client.chat.completions.create({
      model: request.model as GroqModel,
      messages: groqMessages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
      tool_choice: request.tools ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const usage = this.calculateUsage(
      request.model,
      response.usage?.prompt_tokens ?? 0,
      response.usage?.completion_tokens ?? 0
    );

    const toolCalls = this.extractToolCalls(choice?.message?.tool_calls);

    return {
      id: response.id,
      model: request.model,
      content: choice?.message?.content ?? '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage,
      stopReason: this.mapStopReason(choice?.finish_reason ?? 'stop'),
      latencyMs: Date.now() - startTime,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const groqMessages = this.convertMessages(request.messages, request.systemPrompt);

    const stream = await this.client.chat.completions.create({
      model: request.model as GroqModel,
      messages: groqMessages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'text', text: delta.content };
      }
    }

    yield { type: 'done' };
  }

  private convertMessages(
    messages: Message[],
    systemPrompt?: string
  ): Groq.Chat.Completions.ChatCompletionMessageParam[] {
    const result: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      result.push({ role: 'system', content: systemPrompt });
    }

    // Add system messages from the messages array
    const systemMessages = messages.filter(m => m.role === 'system');
    for (const msg of systemMessages) {
      if (typeof msg.content === 'string') {
        result.push({ role: 'system', content: msg.content });
      }
    }

    // Add user and assistant messages
    for (const msg of messages) {
      if (msg.role === 'system') continue;

      const content = typeof msg.content === 'string'
        ? msg.content
        : msg.content
          ?.filter(b => b.type === 'text')
          .map(b => b.text)
          .join('') ?? '';

      if (msg.role === 'user') {
        result.push({ role: 'user', content });
      } else if (msg.role === 'assistant') {
        result.push({ role: 'assistant', content });
      }
    }

    return result;
  }

  private convertTools(tools: Tool[]): Groq.Chat.Completions.ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema as Record<string, unknown>,
      },
    }));
  }

  private extractToolCalls(
    toolCalls?: Groq.Chat.Completions.ChatCompletionMessageToolCall[]
  ): ToolCall[] {
    if (!toolCalls) return [];

    return toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments) as Record<string, unknown>,
    }));
  }

  private calculateUsage(model: ModelId, inputTokens: number, outputTokens: number): TokenUsage {
    const costs = this.COST_PER_1K[model] ?? { input: 0.0003, output: 0.0003 };

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output,
    };
  }

  private mapStopReason(reason: string): CompletionResponse['stopReason'] {
    switch (reason) {
      case 'stop':
        return 'end_turn';
      case 'length':
        return 'max_tokens';
      case 'tool_calls':
        return 'tool_use';
      default:
        return 'end_turn';
    }
  }

  // Get available Groq models
  getAvailableModels(): GroqModel[] {
    return [
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-groq-70b-8192-tool-use-preview',
      'llama3-groq-8b-8192-tool-use-preview',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
      'gemma-7b-it',
    ];
  }

  // Get model info
  getModelInfo(model: GroqModel): { contextWindow: number; description: string } {
    const info: Record<GroqModel, { contextWindow: number; description: string }> = {
      'llama-3.3-70b-versatile': {
        contextWindow: 128000,
        description: 'Meta Llama 3.3 70B - Most capable open model, 128K context',
      },
      'llama-3.1-70b-versatile': {
        contextWindow: 131072,
        description: 'Meta Llama 3.1 70B - Versatile large model',
      },
      'llama-3.1-8b-instant': {
        contextWindow: 131072,
        description: 'Meta Llama 3.1 8B - Fast and efficient',
      },
      'llama3-groq-70b-8192-tool-use-preview': {
        contextWindow: 8192,
        description: 'Llama 3 70B optimized for tool use',
      },
      'llama3-groq-8b-8192-tool-use-preview': {
        contextWindow: 8192,
        description: 'Llama 3 8B optimized for tool use',
      },
      'mixtral-8x7b-32768': {
        contextWindow: 32768,
        description: 'Mixtral 8x7B MoE - 32K context',
      },
      'gemma2-9b-it': {
        contextWindow: 8192,
        description: 'Google Gemma 2 9B - Instruction tuned',
      },
      'gemma-7b-it': {
        contextWindow: 8192,
        description: 'Google Gemma 7B - Instruction tuned',
      },
    };

    return info[model] ?? { contextWindow: 8192, description: 'Unknown model' };
  }
}

export const groqProvider = new GroqProvider();
