/**
 * OpenAI Provider
 * Implementation for OpenAI API (GPT-4, GPT-3.5, etc.)
 */

import OpenAI from 'openai';
import { encoding_for_model, type TiktokenModel } from 'tiktoken';
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
} from '../types';

export class OpenAIProvider extends BaseProvider {
  readonly type = ProviderType.OPENAI;
  readonly name = 'OpenAI';

  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
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
      const response = await this.retryWithBackoff(async () => {
        return await this.client.chat.completions.create({
          model: request.model,
          messages: this.formatMessages(request.messages),
          temperature: request.temperature,
          top_p: request.topP,
          max_tokens: request.maxTokens,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty,
          stop: request.stop,
          tools: request.tools ? this.formatTools(request.tools) : undefined,
          tool_choice: request.toolChoice as OpenAI.ChatCompletionToolChoiceOption | undefined,
          response_format: request.responseFormat as OpenAI.ChatCompletionCreateParams['response_format'],
          user: request.user,
          seed: request.seed,
          stream: false,
        });
      });

      const choice = response.choices[0];
      const result: CompletionResponse = {
        id: response.id,
        model: response.model,
        content: choice.message.content || '',
        role: 'assistant',
        toolCalls: choice.message.tool_calls?.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
        finishReason: this.mapFinishReason(choice.finish_reason),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        createdAt: new Date(response.created * 1000),
        latencyMs: Date.now() - startTime,
      };

      this.logRequest(request, result, startTime);
      return result;
    } catch (error) {
      throw this.handleOpenAIError(error);
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
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: this.formatMessages(request.messages),
        temperature: request.temperature,
        top_p: request.topP,
        max_tokens: request.maxTokens,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stop: request.stop,
        tools: request.tools ? this.formatTools(request.tools) : undefined,
        tool_choice: request.toolChoice as OpenAI.ChatCompletionToolChoiceOption | undefined,
        user: request.user,
        seed: request.seed,
        stream: true,
        stream_options: { include_usage: true },
      });

      // Emit start event
      await handler(this.createStreamEvent(StreamEventType.START));

      let fullContent = '';
      let finishReason: string | null = null;
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        // Handle content
        if (delta?.content) {
          fullContent += delta.content;
          await handler(
            this.createStreamEvent(StreamEventType.TOKEN, {
              content: fullContent,
              delta: delta.content,
            })
          );
        }

        // Handle tool calls
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCalls.has(tc.index)) {
              toolCalls.set(tc.index, { id: '', name: '', arguments: '' });
              await handler(
                this.createStreamEvent(StreamEventType.TOOL_CALL_START, {
                  index: tc.index,
                })
              );
            }

            const existing = toolCalls.get(tc.index)!;
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) {
              existing.arguments += tc.function.arguments;
              await handler(
                this.createStreamEvent(StreamEventType.TOOL_CALL_DELTA, {
                  index: tc.index,
                  toolCall: {
                    id: existing.id,
                    name: existing.name,
                    arguments: tc.function.arguments,
                  },
                })
              );
            }
          }
        }

        // Handle finish reason
        if (chunk.choices[0]?.finish_reason) {
          finishReason = chunk.choices[0].finish_reason;
        }

        // Handle usage
        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }
      }

      // Emit tool call end events
      for (const [index, tc] of toolCalls) {
        await handler(
          this.createStreamEvent(StreamEventType.TOOL_CALL_END, {
            index,
            toolCall: tc,
          })
        );
      }

      // Emit done event
      await handler(
        this.createStreamEvent(StreamEventType.DONE, {
          content: fullContent,
          finishReason: finishReason || undefined,
          usage,
        })
      );

      const result: CompletionResponse = {
        id: `chatcmpl-${Date.now()}`,
        model: request.model,
        content: fullContent,
        role: 'assistant',
        toolCalls: Array.from(toolCalls.values()).map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        })),
        finishReason: this.mapFinishReason(finishReason),
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
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Generate embeddings
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.client.embeddings.create({
          model: request.model || 'text-embedding-ada-002',
          input: request.input,
          dimensions: request.dimensions,
          user: request.user,
        });
      });

      return {
        model: response.model,
        embeddings: response.data.map(d => d.embedding),
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens,
        },
      };
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Count tokens
   */
  async countTokens(text: string, model = 'gpt-4'): Promise<number> {
    try {
      const enc = encoding_for_model(model as TiktokenModel);
      const tokens = enc.encode(text);
      enc.free();
      return tokens.length;
    } catch {
      // Fallback: rough estimate
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    const response = await this.client.models.list();
    return response.data
      .filter(m => m.id.includes('gpt'))
      .map(m => m.id)
      .sort();
  }

  /**
   * Format messages for OpenAI API
   */
  private formatMessages(
    messages: ProviderMessage[]
  ): OpenAI.ChatCompletionMessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool' as const,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          tool_call_id: msg.toolCallId!,
        };
      }

      if (msg.role === 'assistant' && msg.toolCalls) {
        return {
          role: 'assistant' as const,
          content: typeof msg.content === 'string' ? msg.content : null,
          tool_calls: msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }

      const baseMessage = {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content as string | OpenAI.ChatCompletionContentPart[],
      };

      // Handle multimodal content
      if (Array.isArray(msg.content)) {
        return {
          ...baseMessage,
          content: msg.content.map(part => {
            if (part.type === 'text') {
              return { type: 'text' as const, text: part.text! };
            }
            if (part.type === 'image_url') {
              return {
                type: 'image_url' as const,
                image_url: part.imageUrl!,
              };
            }
            return part;
          }),
        };
      }

      return baseMessage;
    });
  }

  /**
   * Format tools for OpenAI API
   */
  private formatTools(tools: ProviderTool[]): OpenAI.ChatCompletionTool[] {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters as OpenAI.FunctionParameters,
      },
    }));
  }

  /**
   * Map finish reason
   */
  private mapFinishReason(
    reason: string | null
  ): CompletionResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'tool_calls':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle OpenAI errors
   */
  private handleOpenAIError(error: unknown): never {
    if (error instanceof OpenAI.APIError) {
      const retryable =
        error.status === 429 ||
        error.status === 500 ||
        error.status === 502 ||
        error.status === 503;

      throw this.createError(
        error.code || 'OPENAI_ERROR',
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
