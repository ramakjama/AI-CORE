import { assistantApi } from '../api';

export interface StreamMessageOptions {
  message: string;
  conversationId?: string;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  conversationId: string;
}

export interface AssistantConversation {
  id: string;
  title: string;
  messages: AssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  conversationId: string;
  timestamp: string;
}

export interface CreateConversationResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

class AssistantClient {
  /**
   * Send a message to the AI assistant
   */
  async sendMessage(
    message: string,
    conversationId?: string
  ): Promise<SendMessageResponse> {
    try {
      const response = await assistantApi.post<SendMessageResponse>('/messages', {
        message,
        conversation_id: conversationId,
      });
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Send a message with streaming support (SSE)
   */
  async sendMessageStream(options: StreamMessageOptions): Promise<void> {
    const { message, conversationId, onChunk, onComplete, onError } = options;

    try {
      const url = new URL('/assistant/messages/stream', assistantApi['instance'].defaults.baseURL);

      // Add query parameters
      const params = new URLSearchParams();
      if (conversationId) {
        params.append('conversation_id', conversationId);
      }

      const fullUrl = `${url.toString()}?${params.toString()}`;

      // Get auth token
      const token = localStorage.getItem('access_token');

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete?.(fullResponse);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              onComplete?.(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || parsed.delta || '';

              if (content) {
                fullResponse += content;
                onChunk?.(content);
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming message:', error);
      onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<AssistantConversation> {
    try {
      const response = await assistantApi.get<AssistantConversation>(
        `/conversations/${conversationId}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * List all conversations
   */
  async listConversations(): Promise<AssistantConversation[]> {
    try {
      const response = await assistantApi.get<AssistantConversation[]>('/conversations');
      return response;
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(title?: string): Promise<CreateConversationResponse> {
    try {
      const response = await assistantApi.post<CreateConversationResponse>('/conversations', {
        title: title || 'New Conversation',
      });
      return response;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await assistantApi.delete(`/conversations/${conversationId}`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Clear all conversations
   */
  async clearAllConversations(): Promise<void> {
    try {
      await assistantApi.delete('/conversations');
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  }

  /**
   * Execute a command (like /summarize, /translate, etc.)
   */
  async executeCommand(
    command: string,
    context?: string,
    conversationId?: string
  ): Promise<SendMessageResponse> {
    const message = context ? `${command} ${context}` : command;
    return this.sendMessage(message, conversationId);
  }
}

// Export singleton instance
export const assistantClient = new AssistantClient();
