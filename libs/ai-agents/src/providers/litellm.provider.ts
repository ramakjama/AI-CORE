/**
 * LiteLLM Provider
 * Multi-model router that can route to any provider via LiteLLM proxy
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
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
  type MultiModelRequest,
  type ModelInfo,
} from '../types';

interface LiteLLMConfig extends ProviderConfig {
  proxyUrl?: string;
  defaultModel?: string;
  fallbackModels?: string[];
  loadBalancing?: 'round_robin' | 'least_busy' | 'random';
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export class LiteLLMProvider extends BaseProvider {
  readonly type = ProviderType.LITELLM;
  readonly name = 'LiteLLM';

  private httpClient: AxiosInstance;
  private proxyUrl: string;
  private modelCache: Map<string, ModelInfo> = new Map();
  private requestCount = 0;

  constructor(config: LiteLLMConfig) {
    super(config);
    this.proxyUrl = config.proxyUrl || config.baseUrl || 'http://localhost:4000';

    this.httpClient = axios.create({
      baseURL: this.proxyUrl,
      timeout: config.timeout || 120000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...config.headers,
      },
    });
  }

  /**
   * Execute completion request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);
    const startTime = Date.now();

    try {
      const body = this.formatRequest(request);

      const response = await this.retryWithBackoff(async () => {
        return await this.httpClient.post('/chat/completions', body);
      });

      return this.parseResponse(response.data, request.model, startTime);
    } catch (error) {
      throw this.handleLiteLLMError(error);
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
      const body = this.formatRequest(request);
      body.stream = true;

      const response = await this.httpClient.post('/chat/completions', body, {
        responseType: 'stream',
      });

      // Emit start event
      await handler(this.createStreamEvent(StreamEventType.START));

      let fullContent = '';
      let finishReason: string | null = null;
      let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      const toolCalls: Map<number, { id: string; name: string; arguments: string }> =
        new Map();

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              fullContent += delta.content;
              await handler(
                this.createStreamEvent(StreamEventType.TOKEN, {
                  content: fullContent,
                  delta: delta.content,
                })
              );
            }

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

            if (parsed.choices?.[0]?.finish_reason) {
              finishReason = parsed.choices[0].finish_reason;
            }

            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens || 0,
                completionTokens: parsed.usage.completion_tokens || 0,
                totalTokens: parsed.usage.total_tokens || 0,
              };
            }
          } catch {
            // Skip malformed JSON
          }
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
        id: `litellm-${Date.now()}`,
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
      throw this.handleLiteLLMError(error);
    }
  }

  /**
   * Execute multi-model request with fallbacks
   */
  async completeWithFallback(
    request: MultiModelRequest
  ): Promise<CompletionResponse> {
    const models = [request.model, ...(request.fallbackModels || [])];

    for (const model of models) {
      try {
        return await this.complete({ ...request, model });
      } catch (error) {
        this.logger.warn({ model, error }, 'Model failed, trying fallback');
        if (model === models[models.length - 1]) {
          throw error;
        }
      }
    }

    throw this.createError(
      'ALL_MODELS_FAILED',
      'All models in the fallback chain failed',
      500,
      false
    );
  }

  /**
   * Generate embeddings
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const response = await this.retryWithBackoff(async () => {
        return await this.httpClient.post('/embeddings', {
          model: request.model || 'text-embedding-ada-002',
          input: request.input,
          dimensions: request.dimensions,
          user: request.user,
        });
      });

      return {
        model: response.data.model,
        embeddings: response.data.data.map(
          (d: { embedding: number[] }) => d.embedding
        ),
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      throw this.handleLiteLLMError(error);
    }
  }

  /**
   * Count tokens
   */
  async countTokens(text: string, _model = 'gpt-4'): Promise<number> {
    // LiteLLM doesn't have a token counting endpoint
    // Use rough estimate
    return Math.ceil(text.length / 4);
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/models');
      return response.data.data.map((m: { id: string }) => m.id);
    } catch {
      // Return common models if endpoint not available
      return [
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'claude-3-opus',
        'claude-3-sonnet',
        'gemini-pro',
      ];
    }
  }

  /**
   * Get model info
   */
  async getModelInfo(modelId: string): Promise<ModelInfo | null> {
    if (this.modelCache.has(modelId)) {
      return this.modelCache.get(modelId)!;
    }

    try {
      const response = await this.httpClient.get(`/model/info?model=${modelId}`);
      const info: ModelInfo = {
        id: modelId,
        name: response.data.model_name || modelId,
        provider: this.detectProvider(modelId),
        maxContextTokens: response.data.max_tokens || 128000,
        maxOutputTokens: response.data.max_output_tokens || 4096,
        supportsVision: response.data.supports_vision || false,
        supportsTools: response.data.supports_function_calling || true,
        supportsStreaming: true,
        supportsJsonMode: response.data.supports_json_mode || false,
        inputCostPer1M: response.data.input_cost_per_token * 1000000 || 0,
        outputCostPer1M: response.data.output_cost_per_token * 1000000 || 0,
        isAvailable: true,
      };

      this.modelCache.set(modelId, info);
      return info;
    } catch {
      return null;
    }
  }

  /**
   * Detect provider from model ID
   */
  private detectProvider(modelId: string): ProviderType {
    if (modelId.includes('gpt') || modelId.includes('text-embedding')) {
      return ProviderType.OPENAI;
    }
    if (modelId.includes('claude')) {
      return ProviderType.ANTHROPIC;
    }
    if (modelId.includes('gemini')) {
      return ProviderType.GOOGLE;
    }
    return ProviderType.LITELLM;
  }

  /**
   * Format request for LiteLLM
   */
  private formatRequest(
    request: CompletionRequest
  ): Record<string, unknown> {
    return {
      model: request.model,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature,
      top_p: request.topP,
      max_tokens: request.maxTokens,
      frequency_penalty: request.frequencyPenalty,
      presence_penalty: request.presencePenalty,
      stop: request.stop,
      tools: request.tools ? this.formatTools(request.tools) : undefined,
      tool_choice: request.toolChoice,
      response_format: request.responseFormat,
      user: request.user,
      seed: request.seed,
      stream: request.stream || false,
    };
  }

  /**
   * Format messages
   */
  private formatMessages(
    messages: ProviderMessage[]
  ): Array<Record<string, unknown>> {
    return messages.map(msg => {
      const formatted: Record<string, unknown> = {
        role: msg.role,
        content: msg.content,
      };

      if (msg.name) formatted.name = msg.name;
      if (msg.toolCallId) formatted.tool_call_id = msg.toolCallId;
      if (msg.toolCalls) {
        formatted.tool_calls = msg.toolCalls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: tc.function,
        }));
      }

      return formatted;
    });
  }

  /**
   * Format tools
   */
  private formatTools(tools: ProviderTool[]): Array<Record<string, unknown>> {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    }));
  }

  /**
   * Parse response
   */
  private parseResponse(
    data: Record<string, unknown>,
    model: string,
    startTime: number
  ): CompletionResponse {
    const choices = data.choices as Array<{
      message: {
        content: string;
        tool_calls?: Array<{
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;

    const choice = choices[0];
    const usage = data.usage as {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };

    return {
      id: (data.id as string) || `litellm-${Date.now()}`,
      model: (data.model as string) || model,
      content: choice.message.content || '',
      role: 'assistant',
      toolCalls: choice.message.tool_calls?.map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: tc.function,
      })),
      finishReason: this.mapFinishReason(choice.finish_reason),
      usage: {
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      },
      createdAt: new Date(),
      latencyMs: Date.now() - startTime,
    };
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
      case 'function_call':
        return 'tool_calls';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle LiteLLM errors
   */
  private handleLiteLLMError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string; type?: string } }>;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      const retryable = status === 429 || status === 500 || status === 502 || status === 503;

      throw this.createError(
        data?.error?.type || 'LITELLM_ERROR',
        data?.error?.message || axiosError.message,
        status,
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
