/**
 * Anthropic Provider
 * Implementation for Anthropic API (Claude models)
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base.provider';
import {
  ProviderType,
  StreamEventType,
  type ProviderConfig,
  type CompletionRequest,
  type CompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type StreamHandler,
  type ProviderMessage,
  type ProviderTool,
  type ContentPart,
} from '../types';

export class AnthropicProvider extends BaseProvider {
  readonly type = ProviderType.ANTHROPIC;
  readonly name = 'Anthropic';

  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
      defaultHeaders: config.headers,
    });
  }

  /**
   * Execute completion request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);
    const startTime = Date.now();

    try {
      const { systemPrompt, messages } = this.extractSystemPrompt(request.messages);

      const response = await this.retryWithBackoff(async () => {
        return await this.client.messages.create({
          model: request.model,
          max_tokens: request.maxTokens || 4096,
          messages: this.formatMessages(messages),
          system: systemPrompt,
          temperature: request.temperature,
          top_p: request.topP,
          stop_sequences: request.stop,
          tools: request.tools ? this.formatTools(request.tools) : undefined,
          tool_choice: this.formatToolChoice(request.toolChoice),
          metadata: request.user ? { user_id: request.user } : undefined,
        });
      });

      const result = this.parseResponse(response, request.model, startTime);
      this.logRequest(request, result, startTime);
      return result;
    } catch (error) {
      throw this.handleAnthropicError(error);
    }
  }

  /**
   * Execute streaming completion request
   */
  async completeStream(
    request: CompletionRequest,
    handler: StreamHandler
  ): Promise<CompletionResponse> {
    this.validateRequest(request);
    const startTime = Date.now();

    try {
      const { systemPrompt, messages } = this.extractSystemPrompt(request.messages);

      const stream = await this.client.messages.stream({
        model: request.model,
        max_tokens: request.maxTokens || 4096,
        messages: this.formatMessages(messages),
        system: systemPrompt,
        temperature: request.temperature,
        top_p: request.topP,
        stop_sequences: request.stop,
        tools: request.tools ? this.formatTools(request.tools) : undefined,
        tool_choice: this.formatToolChoice(request.toolChoice),
        metadata: request.user ? { user_id: request.user } : undefined,
      });

      // Emit start event
      await handler(this.createStreamEvent(StreamEventType.START));

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let currentToolCall: { id: string; name: string; arguments: string } | null = null;
      let toolCallIndex = 0;

      for await (const event of stream) {
        switch (event.type) {
          case 'message_start':
            inputTokens = event.message.usage.input_tokens;
            break;

          case 'content_block_start':
            if (event.content_block.type === 'tool_use') {
              currentToolCall = {
                id: event.content_block.id,
                name: event.content_block.name,
                arguments: '',
              };
              await handler(
                this.createStreamEvent(StreamEventType.TOOL_CALL_START, {
                  index: toolCallIndex,
                  toolCall: {
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                  },
                })
              );
            }
            break;

          case 'content_block_delta':
            if (event.delta.type === 'text_delta') {
              fullContent += event.delta.text;
              await handler(
                this.createStreamEvent(StreamEventType.TOKEN, {
                  content: fullContent,
                  delta: event.delta.text,
                })
              );
            } else if (event.delta.type === 'input_json_delta' && currentToolCall) {
              currentToolCall.arguments += event.delta.partial_json;
              await handler(
                this.createStreamEvent(StreamEventType.TOOL_CALL_DELTA, {
                  index: toolCallIndex,
                  toolCall: {
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    arguments: event.delta.partial_json,
                  },
                })
              );
            }
            break;

          case 'content_block_stop':
            if (currentToolCall) {
              toolCalls.push(currentToolCall);
              await handler(
                this.createStreamEvent(StreamEventType.TOOL_CALL_END, {
                  index: toolCallIndex,
                  toolCall: currentToolCall,
                })
              );
              currentToolCall = null;
              toolCallIndex++;
            }
            break;

          case 'message_delta':
            outputTokens = event.usage.output_tokens;
            break;
        }
      }

      // Emit done event
      const usage = {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens: inputTokens + outputTokens,
      };

      await handler(
        this.createStreamEvent(StreamEventType.DONE, {
          content: fullContent,
          finishReason: 'stop',
          usage,
        })
      );

      const result: CompletionResponse = {
        id: `msg-${Date.now()}`,
        model: request.model,
        content: fullContent,
        role: 'assistant',
        toolCalls: toolCalls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        })),
        finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
        usage,
        createdAt: new Date(),
        latencyMs: Date.now() - startTime,
      };

      this.logRequest(request, result, startTime);
      return result;
    } catch (error) {
      await handler(
        this.createStreamEvent(StreamEventType.ERROR, {
          error: {
            code: 'STREAM_ERROR',
            message: (error as Error).message,
          },
        })
      );
      throw this.handleAnthropicError(error);
    }
  }

  /**
   * Generate embeddings
   * Note: Anthropic doesn't have a native embedding API
   * This method throws an error - use a different provider for embeddings
   */
  async embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw this.createError(
      'NOT_SUPPORTED',
      'Anthropic does not support embeddings. Use OpenAI or another provider.',
      400,
      false
    );
  }

  /**
   * Count tokens
   * Uses Anthropic's token counting
   */
  async countTokens(text: string, _model = 'claude-3-opus'): Promise<number> {
    try {
      const result = await this.client.messages.count_tokens({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: text }],
      });
      return result.input_tokens;
    } catch {
      // Fallback: rough estimate (Claude uses ~3.5 chars per token)
      return Math.ceil(text.length / 3.5);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    // Anthropic doesn't have a list models endpoint
    // Return known models
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  /**
   * Extract system prompt from messages
   */
  private extractSystemPrompt(messages: ProviderMessage[]): {
    systemPrompt?: string;
    messages: ProviderMessage[];
  } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const systemPrompt = systemMessages
      .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('\n\n');

    return {
      systemPrompt: systemPrompt || undefined,
      messages: otherMessages,
    };
  }

  /**
   * Format messages for Anthropic API
   */
  private formatMessages(
    messages: ProviderMessage[]
  ): Anthropic.MessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: msg.toolCallId!,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            },
          ],
        };
      }

      if (msg.role === 'assistant' && msg.toolCalls) {
        const content: Anthropic.ContentBlock[] = [];

        if (msg.content && typeof msg.content === 'string' && msg.content.trim()) {
          content.push({ type: 'text', text: msg.content });
        }

        for (const tc of msg.toolCalls) {
          content.push({
            type: 'tool_use',
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          });
        }

        return {
          role: 'assistant' as const,
          content,
        };
      }

      // Handle multimodal content
      if (Array.isArray(msg.content)) {
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content.map((part: ContentPart) => {
            if (part.type === 'text') {
              return { type: 'text' as const, text: part.text! };
            }
            if (part.type === 'image_url' && part.imageUrl) {
              // Convert URL to base64 if needed
              return {
                type: 'image' as const,
                source: {
                  type: 'url' as const,
                  url: part.imageUrl.url,
                },
              };
            }
            if (part.type === 'image' && part.source) {
              return {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: part.source.mediaType as Anthropic.Base64ImageSource['media_type'],
                  data: part.source.data,
                },
              };
            }
            return { type: 'text' as const, text: JSON.stringify(part) };
          }),
        };
      }

      return {
        role: msg.role as 'user' | 'assistant',
        content: msg.content as string,
      };
    });
  }

  /**
   * Format tools for Anthropic API
   */
  private formatTools(tools: ProviderTool[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Anthropic.Tool.InputSchema,
    }));
  }

  /**
   * Format tool choice for Anthropic API
   */
  private formatToolChoice(
    toolChoice?: CompletionRequest['toolChoice']
  ): Anthropic.MessageCreateParams['tool_choice'] {
    if (!toolChoice) return undefined;

    if (toolChoice === 'auto') return { type: 'auto' };
    if (toolChoice === 'none') return { type: 'auto' }; // Anthropic doesn't have 'none', use auto
    if (toolChoice === 'required') return { type: 'any' };

    if (typeof toolChoice === 'object' && toolChoice.type === 'function') {
      return {
        type: 'tool',
        name: toolChoice.function.name,
      };
    }

    return undefined;
  }

  /**
   * Parse Anthropic response
   */
  private parseResponse(
    response: Anthropic.Message,
    model: string,
    startTime: number
  ): CompletionResponse {
    let content = '';
    const toolCalls: CompletionResponse['toolCalls'] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return {
      id: response.id,
      model: model,
      content,
      role: 'assistant',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: this.mapStopReason(response.stop_reason),
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      createdAt: new Date(),
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Map stop reason
   */
  private mapStopReason(
    reason: Anthropic.Message['stop_reason']
  ): CompletionResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'tool_use':
        return 'tool_calls';
      default:
        return 'stop';
    }
  }

  /**
   * Handle Anthropic errors
   */
  private handleAnthropicError(error: unknown): never {
    if (error instanceof Anthropic.APIError) {
      const retryable =
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503 ||
        error.status === 529; // Overloaded

      throw this.createError(
        error.error?.type || 'ANTHROPIC_ERROR',
        error.message,
        error.status,
        retryable,
        error
      );
    }

    throw this.createError(
      'UNKNOWN_ERROR',
      (error as Error).message || 'Unknown error',
      undefined,
      false,
      error
    );
  }
}
