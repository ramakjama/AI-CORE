/**
 * Google Provider
 * Implementation for Google Generative AI (Gemini models)
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  Part,
  FunctionDeclaration,
  Tool as GoogleTool,
  GenerateContentResult,
  FunctionCallingMode,
} from '@google/generative-ai';
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

export class GoogleProvider extends BaseProvider {
  readonly type = ProviderType.GOOGLE;
  readonly name = 'Google';

  private client: GoogleGenerativeAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  /**
   * Get model instance
   */
  private getModel(
    modelName: string,
    request: CompletionRequest
  ): GenerativeModel {
    const tools: GoogleTool[] = [];

    if (request.tools && request.tools.length > 0) {
      tools.push({
        functionDeclarations: this.formatTools(request.tools),
      });
    }

    return this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: request.temperature,
        topP: request.topP,
        maxOutputTokens: request.maxTokens,
        stopSequences: request.stop,
      },
      tools: tools.length > 0 ? tools : undefined,
      toolConfig: request.toolChoice
        ? {
            functionCallingConfig: {
              mode: this.mapToolChoice(request.toolChoice),
              allowedFunctionNames:
                typeof request.toolChoice === 'object'
                  ? [request.toolChoice.function.name]
                  : undefined,
            },
          }
        : undefined,
    });
  }

  /**
   * Execute completion request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    this.validateRequest(request);
    const startTime = Date.now();

    try {
      const model = this.getModel(request.model, request);
      const { systemInstruction, contents } = this.formatMessages(request.messages);

      const result = await this.retryWithBackoff(async () => {
        return await model.generateContent({
          contents,
          systemInstruction,
        });
      });

      return this.parseResponse(result, request.model, startTime);
    } catch (error) {
      throw this.handleGoogleError(error);
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
      const model = this.getModel(request.model, request);
      const { systemInstruction, contents } = this.formatMessages(request.messages);

      const result = await model.generateContentStream({
        contents,
        systemInstruction,
      });

      // Emit start event
      await handler(this.createStreamEvent(StreamEventType.START));

      let fullContent = '';
      const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let toolCallIndex = 0;

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullContent += text;
          await handler(
            this.createStreamEvent(StreamEventType.TOKEN, {
              content: fullContent,
              delta: text,
            })
          );
        }

        // Handle function calls
        const functionCalls = chunk.functionCalls();
        if (functionCalls) {
          for (const fc of functionCalls) {
            const toolCall = {
              id: `call-${Date.now()}-${toolCallIndex}`,
              name: fc.name,
              arguments: JSON.stringify(fc.args),
            };
            toolCalls.push(toolCall);

            await handler(
              this.createStreamEvent(StreamEventType.TOOL_CALL_START, {
                index: toolCallIndex,
                toolCall: { id: toolCall.id, name: toolCall.name },
              })
            );

            await handler(
              this.createStreamEvent(StreamEventType.TOOL_CALL_END, {
                index: toolCallIndex,
                toolCall,
              })
            );

            toolCallIndex++;
          }
        }
      }

      // Get final response for usage
      const finalResponse = await result.response;
      const usage = {
        promptTokens: finalResponse.usageMetadata?.promptTokenCount || 0,
        completionTokens: finalResponse.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: finalResponse.usageMetadata?.totalTokenCount || 0,
      };

      // Emit done event
      await handler(
        this.createStreamEvent(StreamEventType.DONE, {
          content: fullContent,
          finishReason: 'stop',
          usage,
        })
      );

      const completionResult: CompletionResponse = {
        id: `gen-${Date.now()}`,
        model: request.model,
        content: fullContent,
        role: 'assistant',
        toolCalls:
          toolCalls.length > 0
            ? toolCalls.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: {
                  name: tc.name,
                  arguments: tc.arguments,
                },
              }))
            : undefined,
        finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
        usage,
        createdAt: new Date(),
        latencyMs: Date.now() - startTime,
      };

      this.logRequest(request, completionResult, startTime);
      return completionResult;
    } catch (error) {
      await handler(
        this.createStreamEvent(StreamEventType.ERROR, {
          error: {
            code: 'STREAM_ERROR',
            message: (error as Error).message,
          },
        })
      );
      throw this.handleGoogleError(error);
    }
  }

  /**
   * Generate embeddings
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: request.model || 'text-embedding-004',
      });

      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const embeddings: number[][] = [];

      for (const input of inputs) {
        const result = await model.embedContent(input);
        embeddings.push(result.embedding.values);
      }

      return {
        model: request.model || 'text-embedding-004',
        embeddings,
        usage: {
          promptTokens: inputs.reduce((acc, i) => acc + Math.ceil(i.length / 4), 0),
          totalTokens: inputs.reduce((acc, i) => acc + Math.ceil(i.length / 4), 0),
        },
      };
    } catch (error) {
      throw this.handleGoogleError(error);
    }
  }

  /**
   * Count tokens
   */
  async countTokens(text: string, model = 'gemini-pro'): Promise<number> {
    try {
      const geminiModel = this.client.getGenerativeModel({ model });
      const result = await geminiModel.countTokens(text);
      return result.totalTokens;
    } catch {
      // Fallback: rough estimate
      return Math.ceil(text.length / 4);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    // Google doesn't have a list models endpoint in the SDK
    // Return known models
    return [
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-pro',
      'gemini-pro-vision',
    ];
  }

  /**
   * Format messages for Google API
   */
  private formatMessages(messages: ProviderMessage[]): {
    systemInstruction?: string;
    contents: Content[];
  } {
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    const systemInstruction = systemMessages
      .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
      .join('\n\n');

    const contents: Content[] = [];

    for (const msg of otherMessages) {
      const role = msg.role === 'assistant' ? 'model' : 'user';

      if (msg.role === 'tool') {
        // Tool result - add as function response
        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: msg.name || 'unknown',
                response: {
                  result:
                    typeof msg.content === 'string'
                      ? msg.content
                      : JSON.stringify(msg.content),
                },
              },
            },
          ],
        });
        continue;
      }

      const parts: Part[] = [];

      // Handle multimodal content
      if (Array.isArray(msg.content)) {
        for (const part of msg.content as ContentPart[]) {
          if (part.type === 'text') {
            parts.push({ text: part.text! });
          } else if (part.type === 'image_url' && part.imageUrl) {
            // Google needs inline data or file data
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: part.imageUrl.url.replace(/^data:image\/\w+;base64,/, ''),
              },
            });
          } else if (part.type === 'image' && part.source) {
            parts.push({
              inlineData: {
                mimeType: part.source.mediaType,
                data: part.source.data,
              },
            });
          }
        }
      } else {
        parts.push({ text: msg.content as string });
      }

      // Handle tool calls from assistant
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.function.name,
              args: JSON.parse(tc.function.arguments),
            },
          });
        }
      }

      contents.push({ role, parts });
    }

    return {
      systemInstruction: systemInstruction || undefined,
      contents,
    };
  }

  /**
   * Format tools for Google API
   */
  private formatTools(tools: ProviderTool[]): FunctionDeclaration[] {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters as FunctionDeclaration['parameters'],
    }));
  }

  /**
   * Map tool choice
   */
  private mapToolChoice(
    toolChoice: CompletionRequest['toolChoice']
  ): FunctionCallingMode {
    if (toolChoice === 'auto') return FunctionCallingMode.AUTO;
    if (toolChoice === 'none') return FunctionCallingMode.NONE;
    if (toolChoice === 'required') return FunctionCallingMode.ANY;
    if (typeof toolChoice === 'object') return FunctionCallingMode.ANY;
    return FunctionCallingMode.AUTO;
  }

  /**
   * Parse Google response
   */
  private parseResponse(
    result: GenerateContentResult,
    model: string,
    startTime: number
  ): CompletionResponse {
    const response = result.response;
    const candidate = response.candidates?.[0];

    if (!candidate) {
      throw this.createError(
        'NO_RESPONSE',
        'No response from model',
        500,
        true
      );
    }

    let content = '';
    const toolCalls: CompletionResponse['toolCalls'] = [];

    for (const part of candidate.content.parts) {
      if ('text' in part) {
        content += part.text;
      } else if ('functionCall' in part) {
        toolCalls.push({
          id: `call-${Date.now()}-${toolCalls.length}`,
          type: 'function',
          function: {
            name: part.functionCall.name,
            arguments: JSON.stringify(part.functionCall.args),
          },
        });
      }
    }

    const finishReason = this.mapFinishReason(candidate.finishReason);

    return {
      id: `gen-${Date.now()}`,
      model,
      content,
      role: 'assistant',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
      createdAt: new Date(),
      latencyMs: Date.now() - startTime,
    };
  }

  /**
   * Map finish reason
   */
  private mapFinishReason(
    reason?: string
  ): CompletionResponse['finishReason'] {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }

  /**
   * Handle Google errors
   */
  private handleGoogleError(error: unknown): never {
    const err = error as Error & { status?: number; code?: string };

    const retryable =
      err.status === 429 ||
      err.status === 500 ||
      err.status === 502 ||
      err.status === 503;

    throw this.createError(
      err.code || 'GOOGLE_ERROR',
      err.message,
      err.status,
      retryable,
      error
    );
  }
}
