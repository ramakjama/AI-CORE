// AI-CORE Chat Functions

import { type AIMessage, type AIModelConfig } from '@ai-core/types';
import { DEFAULT_AI_CONFIG } from '@ai-core/constants';
import { generateId } from '@ai-core/utils';

import { getDefaultProvider } from './providers';
import {
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type StreamChunk,
} from './types';

// Create a new chat message
export function createMessage(
  role: AIMessage['role'],
  content: string
): AIMessage {
  return {
    id: generateId('msg'),
    role,
    content,
    timestamp: new Date(),
  };
}

// Create system message
export function systemMessage(content: string): AIMessage {
  return createMessage('system', content);
}

// Create user message
export function userMessage(content: string): AIMessage {
  return createMessage('user', content);
}

// Create assistant message
export function assistantMessage(content: string): AIMessage {
  return createMessage('assistant', content);
}

// Chat completion
export async function chat(
  messages: AIMessage[],
  config?: Partial<AIModelConfig>
): Promise<ChatCompletionResponse> {
  const provider = getDefaultProvider();
  const request: ChatCompletionRequest = {
    messages,
    config: { ...DEFAULT_AI_CONFIG, ...config },
  };
  return provider.chat(request);
}

// Chat completion with streaming
export async function* chatStream(
  messages: AIMessage[],
  config?: Partial<AIModelConfig>
): AsyncIterable<StreamChunk> {
  const provider = getDefaultProvider();
  const request: ChatCompletionRequest = {
    messages,
    config: { ...DEFAULT_AI_CONFIG, ...config },
    stream: true,
  };
  yield* provider.chatStream(request);
}

// Simple chat helper
export async function ask(
  prompt: string,
  systemPrompt?: string,
  config?: Partial<AIModelConfig>
): Promise<string> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push(systemMessage(systemPrompt));
  }
  messages.push(userMessage(prompt));

  const response = await chat(messages, config);
  return response.message.content;
}

// Conversation management
export interface Conversation {
  id: string;
  messages: AIMessage[];
  config: AIModelConfig;
}

export function createConversation(
  systemPrompt?: string,
  config?: Partial<AIModelConfig>
): Conversation {
  const messages: AIMessage[] = [];
  if (systemPrompt) {
    messages.push(systemMessage(systemPrompt));
  }

  return {
    id: generateId('conv'),
    messages,
    config: { ...DEFAULT_AI_CONFIG, ...config } as AIModelConfig,
  };
}

export async function continueConversation(
  conversation: Conversation,
  userInput: string
): Promise<{ conversation: Conversation; response: string }> {
  conversation.messages.push(userMessage(userInput));

  const response = await chat(conversation.messages, conversation.config);
  conversation.messages.push(response.message);

  return {
    conversation,
    response: response.message.content,
  };
}
