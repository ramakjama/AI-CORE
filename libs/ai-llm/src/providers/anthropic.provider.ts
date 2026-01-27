// Anthropic Claude Provider

import Anthropic from '@anthropic-ai/sdk';
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

export class AnthropicProvider {
  private client: Anthropic;
  private readonly COST_PER_1K = {
    'claude-opus-4-5-20251101': { input: 0.015, output: 0.075 },
    'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 },
  };

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env['ANTHROPIC_API_KEY'],
    });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const anthropicMessages = this.convertMessages(request.messages);

    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: anthropicMessages,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
    });

    const usage = this.calculateUsage(
      request.model,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    const toolCalls = this.extractToolCalls(response.content);

    return {
      id: response.id,
      model: request.model,
      content: this.extractTextContent(response.content),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage,
      stopReason: this.mapStopReason(response.stop_reason ?? 'end_turn'),
      latencyMs: Date.now() - startTime,
    };
  }

  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const anthropicMessages = this.convertMessages(request.messages);

    const stream = this.client.messages.stream({
      model: request.model,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: anthropicMessages,
      tools: request.tools ? this.convertTools(request.tools) : undefined,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if ('text' in delta) {
          yield { type: 'text', text: delta.text };
        }
      }
    }

    yield { type: 'done' };
  }

  private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : this.convertContentBlocks(m.content),
      }));
  }

  private convertContentBlocks(blocks: NonNullable<Message['content']>): Anthropic.ContentBlockParam[] {
    if (typeof blocks === 'string') {
      return [{ type: 'text', text: blocks }];
    }

    return blocks.map(block => {
      if (block.type === 'text') {
        return { type: 'text' as const, text: block.text ?? '' };
      }
      if (block.type === 'image' && block.source) {
        return {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: block.source.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: block.source.data ?? '',
          },
        };
      }
      if (block.type === 'tool_result') {
        return {
          type: 'tool_result' as const,
          tool_use_id: block.toolUseId ?? '',
          content: block.content ?? '',
        };
      }
      return { type: 'text' as const, text: '' };
    });
  }

  private convertTools(tools: Tool[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }

  private extractTextContent(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');
  }

  private extractToolCalls(content: Anthropic.ContentBlock[]): ToolCall[] {
    return content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
      .map(block => ({
        id: block.id,
        name: block.name,
        arguments: block.input as Record<string, unknown>,
      }));
  }

  private calculateUsage(model: ModelId, inputTokens: number, outputTokens: number): TokenUsage {
    const costs = this.COST_PER_1K[model as keyof typeof this.COST_PER_1K] ?? { input: 0.003, output: 0.015 };

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output,
    };
  }

  private mapStopReason(reason: string): CompletionResponse['stopReason'] {
    switch (reason) {
      case 'end_turn':
        return 'end_turn';
      case 'max_tokens':
        return 'max_tokens';
      case 'tool_use':
        return 'tool_use';
      case 'stop_sequence':
        return 'stop_sequence';
      default:
        return 'end_turn';
    }
  }
}

export const anthropicProvider = new AnthropicProvider();
