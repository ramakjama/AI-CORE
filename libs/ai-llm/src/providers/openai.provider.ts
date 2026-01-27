// OpenAI GPT Provider

import OpenAI from 'openai';
import type {
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  Message,
  StreamChunk,
  Tool,
  ToolCall,
  TokenUsage,
  ModelId,
} from '../types';

export class OpenAIProvider {
  private client: OpenAI;
  private readonly COST_PER_1K = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'o1-preview': { input: 0.015, output: 0.06 },
    'o1-mini': { input: 0.003, output: 0.012 },
  };

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env['OPENAI_API_KEY'],
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const messages = this.convertMessages(request.messages, request.systemPrompt);

    const response = await this.client.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      top_p: request.topP,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
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
    const messages = this.convertMessages(request.messages, request.systemPrompt);

    const stream = await this.client.chat.completions.create({
      model: request.model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      stream: true,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'text', text: delta.content };
      }
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.function?.name && toolCall.function?.arguments) {
            yield {
              type: 'tool_use',
              toolCall: {
                id: toolCall.id ?? '',
                name: toolCall.function.name,
                arguments: JSON.parse(toolCall.function.arguments),
              },
            };
          }
        }
      }
    }

    yield { type: 'done' };
  }

  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.client.embeddings.create({
      model: request.model,
      input: request.input,
      dimensions: request.dimensions,
    });

    return {
      embeddings: response.data.map(d => d.embedding),
      usage: { totalTokens: response.usage.total_tokens },
    };
  }

  private convertMessages(
    messages: Message[],
    systemPrompt?: string
  ): OpenAI.ChatCompletionMessageParam[] {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      openaiMessages.push({ role: 'system', content: systemPrompt });
    }

    for (const msg of messages) {
      if (msg.role === 'system' && !systemPrompt) {
        openaiMessages.push({
          role: 'system',
          content: typeof msg.content === 'string' ? msg.content : '',
        });
      } else if (msg.role === 'user') {
        openaiMessages.push({
          role: 'user',
          content: typeof msg.content === 'string' ? msg.content : this.convertContentToOpenAI(msg.content),
        });
      } else if (msg.role === 'assistant') {
        openaiMessages.push({
          role: 'assistant',
          content: typeof msg.content === 'string' ? msg.content : '',
        });
      }
    }

    return openaiMessages;
  }

  private convertContentToOpenAI(
    content: NonNullable<Message['content']>
  ): OpenAI.ChatCompletionContentPart[] {
    if (typeof content === 'string') {
      return [{ type: 'text', text: content }];
    }

    return content.map(block => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text ?? '' };
      }
      if (block.type === 'image' && block.source) {
        return {
          type: 'image_url' as const,
          image_url: {
            url: block.source.type === 'base64'
              ? `data:${block.source.mediaType};base64,${block.source.data}`
              : block.source.url ?? '',
          },
        };
      }
      return { type: 'text' as const, text: '' };
    });
  }

  private convertTools(tools: Tool[]): OpenAI.ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  private extractToolCalls(
    toolCalls?: OpenAI.ChatCompletionMessageToolCall[]
  ): ToolCall[] {
    if (!toolCalls) return [];

    return toolCalls.map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));
  }

  private calculateUsage(model: ModelId, inputTokens: number, outputTokens: number): TokenUsage {
    const costs = this.COST_PER_1K[model as keyof typeof this.COST_PER_1K] ?? { input: 0.005, output: 0.015 };

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
}

export const openAIProvider = new OpenAIProvider();
