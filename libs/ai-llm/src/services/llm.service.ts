import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI-CORE - LLM Service (IMPLEMENTACIÓN REAL)
 * 
 * Orquestador de múltiples proveedores de LLM:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude 3)
 * - Google (Gemini Pro)
 * - Groq (Mixtral, Llama)
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'groq';

export type LLMModel = 
  | 'gpt-4-turbo-preview'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'claude-3-haiku-20240307'
  | 'gemini-pro'
  | 'mixtral-8x7b-32768'
  | 'llama2-70b-4096';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  provider?: LLMProvider;
  model?: LLMModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: LLMTool[];
  systemPrompt?: string;
}

export interface LLMTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
}

export class LLMService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private google: GoogleGenerativeAI;
  private groq: OpenAI; // Groq usa API compatible con OpenAI

  constructor() {
    // Inicializar clientes
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.google = new GoogleGenerativeAI(
      process.env.GOOGLE_AI_API_KEY || ''
    );

    this.groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  /**
   * Completar con el mejor modelo para la tarea
   */
  async complete(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): Promise<LLMResponse> {
    const provider = options.provider || this.selectBestProvider(messages);
    const model = options.model || this.getDefaultModel(provider);

    switch (provider) {
      case 'openai':
        return this.completeWithOpenAI(messages, model, options);
      case 'anthropic':
        return this.completeWithAnthropic(messages, model, options);
      case 'google':
        return this.completeWithGoogle(messages, model, options);
      case 'groq':
        return this.completeWithGroq(messages, model, options);
      default:
        throw new Error(`Proveedor no soportado: ${provider}`);
    }
  }

  /**
   * Streaming de respuestas
   */
  async *stream(
    messages: LLMMessage[],
    options: LLMCompletionOptions = {}
  ): AsyncGenerator<string> {
    const provider = options.provider || 'openai';
    const model = options.model || this.getDefaultModel(provider);

    if (provider === 'openai' || provider === 'groq') {
      const client = provider === 'openai' ? this.openai : this.groq;
      
      const stream = await client.chat.completions.create({
        model,
        messages: this.formatMessagesForOpenAI(messages, options.systemPrompt),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } else if (provider === 'anthropic') {
      const stream = await this.anthropic.messages.stream({
        model,
        messages: this.formatMessagesForAnthropic(messages),
        system: options.systemPrompt,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield chunk.delta.text;
        }
      }
    } else {
      throw new Error(`Streaming no soportado para ${provider}`);
    }
  }

  /**
   * Completar con OpenAI
   */
  private async completeWithOpenAI(
    messages: LLMMessage[],
    model: string,
    options: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: this.formatMessagesForOpenAI(messages, options.systemPrompt),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      tools: options.tools ? this.formatToolsForOpenAI(options.tools) : undefined,
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      provider: 'openai',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason,
      toolCalls: choice.message.tool_calls?.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };
  }

  /**
   * Completar con Anthropic Claude
   */
  private async completeWithAnthropic(
    messages: LLMMessage[],
    model: string,
    options: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const response = await this.anthropic.messages.create({
      model,
      messages: this.formatMessagesForAnthropic(messages),
      system: options.systemPrompt,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      tools: options.tools ? this.formatToolsForAnthropic(options.tools) : undefined,
    });

    const content = response.content[0];
    const textContent = content.type === 'text' ? content.text : '';

    return {
      content: textContent,
      provider: 'anthropic',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      finishReason: response.stop_reason || 'end_turn',
      toolCalls: response.content
        .filter(c => c.type === 'tool_use')
        .map(c => ({
          name: (c as any).name,
          arguments: (c as any).input,
        })),
    };
  }

  /**
   * Completar con Google Gemini
   */
  private async completeWithGoogle(
    messages: LLMMessage[],
    model: string,
    options: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const genModel = this.google.getGenerativeModel({ model });
    
    const chat = genModel.startChat({
      history: this.formatMessagesForGoogle(messages),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      provider: 'google',
      model,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: 'stop',
    };
  }

  /**
   * Completar con Groq
   */
  private async completeWithGroq(
    messages: LLMMessage[],
    model: string,
    options: LLMCompletionOptions
  ): Promise<LLMResponse> {
    const response = await this.groq.chat.completions.create({
      model,
      messages: this.formatMessagesForOpenAI(messages, options.systemPrompt),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      provider: 'groq',
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason,
    };
  }

  /**
   * Seleccionar el mejor proveedor según el contexto
   */
  private selectBestProvider(messages: LLMMessage[]): LLMProvider {
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    
    // Para conversaciones largas, usar Claude (mejor contexto)
    if (totalLength > 10000) {
      return 'anthropic';
    }
    
    // Para tareas de código, usar Claude
    if (messages.some(m => m.content.includes('```'))) {
      return 'anthropic';
    }
    
    // Por defecto, usar GPT-4
    return 'openai';
  }

  /**
   * Obtener modelo por defecto para cada proveedor
   */
  private getDefaultModel(provider: LLMProvider): string {
    const defaults: Record<LLMProvider, string> = {
      openai: 'gpt-4-turbo-preview',
      anthropic: 'claude-3-opus-20240229',
      google: 'gemini-pro',
      groq: 'mixtral-8x7b-32768',
    };
    return defaults[provider];
  }

  /**
   * Formatear mensajes para OpenAI
   */
  private formatMessagesForOpenAI(
    messages: LLMMessage[],
    systemPrompt?: string
  ): Array<OpenAI.Chat.ChatCompletionMessageParam> {
    const formatted: Array<OpenAI.Chat.ChatCompletionMessageParam> = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    if (systemPrompt) {
      formatted.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    return formatted;
  }

  /**
   * Formatear mensajes para Anthropic
   */
  private formatMessagesForAnthropic(
    messages: LLMMessage[]
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  }

  /**
   * Formatear mensajes para Google
   */
  private formatMessagesForGoogle(
    messages: LLMMessage[]
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
  }

  /**
   * Formatear tools para OpenAI
   */
  private formatToolsForOpenAI(tools: LLMTool[]) {
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Formatear tools para Anthropic
   */
  private formatToolsForAnthropic(tools: LLMTool[]): Array<Anthropic.Tool> {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        ...tool.parameters,
      },
    }));
  }

  /**
   * Calcular costo estimado
   */
  calculateCost(response: LLMResponse): number {
    // Precios por 1M tokens (aproximados)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4-turbo-preview': { input: 10, output: 30 },
      'gpt-4': { input: 30, output: 60 },
      'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
      'claude-3-opus-20240229': { input: 15, output: 75 },
      'claude-3-sonnet-20240229': { input: 3, output: 15 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
      'gemini-pro': { input: 0.5, output: 1.5 },
      'mixtral-8x7b-32768': { input: 0.27, output: 0.27 },
    };

    const modelPricing = pricing[response.model] || { input: 1, output: 2 };
    
    const inputCost = (response.usage.promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (response.usage.completionTokens / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}

// Singleton instance
export const llmService = new LLMService();
