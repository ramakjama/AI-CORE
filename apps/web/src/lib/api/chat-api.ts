import type {
  Conversation,
  Message,
  CreateConversationParams,
  SendMessageParams,
  MessageFeedback,
  ChatApiResponse,
  ConversationListResponse,
  KnowledgeSearchParams,
  KnowledgeBaseArticle,
} from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ChatApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ChatApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createConversation(
    params: CreateConversationParams
  ): Promise<ChatApiResponse<Conversation>> {
    return this.request<Conversation>('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getConversations(
    page: number = 1,
    pageSize: number = 20
  ): Promise<ChatApiResponse<ConversationListResponse>> {
    return this.request<ConversationListResponse>(
      `/chat/conversations?page=${page}&pageSize=${pageSize}`
    );
  }

  async getConversation(
    conversationId: string
  ): Promise<ChatApiResponse<Conversation>> {
    return this.request<Conversation>(`/chat/conversations/${conversationId}`);
  }

  async deleteConversation(conversationId: string): Promise<ChatApiResponse<void>> {
    return this.request<void>(`/chat/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  async sendMessage(params: SendMessageParams): Promise<ChatApiResponse<Message>> {
    const { conversationId, content, context } = params;

    if (!conversationId) {
      return {
        success: false,
        error: 'Conversation ID is required',
      };
    }

    return this.request<Message>(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, context }),
    });
  }

  async submitFeedback(
    conversationId: string,
    messageId: string,
    feedback: MessageFeedback
  ): Promise<ChatApiResponse<void>> {
    return this.request<void>(
      `/chat/conversations/${conversationId}/messages/${messageId}/feedback`,
      {
        method: 'POST',
        body: JSON.stringify(feedback),
      }
    );
  }

  async searchKnowledge(
    params: KnowledgeSearchParams
  ): Promise<ChatApiResponse<KnowledgeBaseArticle[]>> {
    const queryParams = new URLSearchParams({
      query: params.query,
      ...(params.category && { category: params.category }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<KnowledgeBaseArticle[]>(
      `/chat/knowledge?${queryParams.toString()}`
    );
  }

  async updateConversationTitle(
    conversationId: string,
    title: string
  ): Promise<ChatApiResponse<Conversation>> {
    return this.request<Conversation>(`/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  }

  getWebSocketUrl(): string {
    const wsProtocol = this.baseUrl.startsWith('https') ? 'wss' : 'ws';
    const baseUrlWithoutProtocol = this.baseUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${baseUrlWithoutProtocol}/chat`;
  }
}

export const chatApi = new ChatApiClient();
export default chatApi;
