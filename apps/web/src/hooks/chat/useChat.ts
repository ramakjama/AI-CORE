import { useState, useCallback, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  Conversation,
  Message,
  ChatState,
  SendMessageParams,
  CreateConversationParams,
  MessageFeedback,
  ContextData,
} from '@/types/chat';
import { chatApi } from '@/lib/api/chat-api';

interface UseChatOptions {
  conversationId?: string;
  userId: string;
  companyId: string;
  context?: ContextData;
  autoConnect?: boolean;
}

interface UseChatReturn extends ChatState {
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (params?: CreateConversationParams) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  submitFeedback: (messageId: string, feedback: MessageFeedback) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  setContext: (context: ContextData | null) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { conversationId: initialConversationId, userId, companyId, context: initialContext, autoConnect = true } = options;

  const [state, setState] = useState<ChatState>({
    currentConversation: null,
    conversations: [],
    isLoading: false,
    isStreaming: false,
    error: null,
    context: initialContext || null,
  });

  const socketRef = useRef<Socket | null>(null);
  const streamingMessageRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string | null>(null);

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const wsUrl = chatApi.getWebSocketUrl();
    const socket = io(wsUrl, {
      transports: ['websocket'],
      query: {
        userId,
        companyId,
      },
    });

    socket.on('connect', () => {
      console.log('Chat WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('Chat WebSocket disconnected');
    });

    socket.on('message.ai.thinking', () => {
      updateState({ isStreaming: true });
    });

    socket.on('message.ai.streaming', (data: { messageId: string; token: string }) => {
      streamingMessageIdRef.current = data.messageId;
      streamingMessageRef.current += data.token;

      setState((prev) => {
        if (!prev.currentConversation) return prev;

        const messages = [...prev.currentConversation.messages];
        const streamingMessageIndex = messages.findIndex(
          (m) => m.id === data.messageId
        );

        if (streamingMessageIndex >= 0) {
          messages[streamingMessageIndex] = {
            ...messages[streamingMessageIndex],
            content: streamingMessageRef.current,
            status: 'streaming',
          };
        } else {
          messages.push({
            id: data.messageId,
            conversationId: prev.currentConversation.id,
            role: 'assistant',
            content: streamingMessageRef.current,
            timestamp: new Date(),
            status: 'streaming',
          });
        }

        return {
          ...prev,
          currentConversation: {
            ...prev.currentConversation,
            messages,
          },
        };
      });
    });

    socket.on('message.ai.complete', (data: { messageId: string; message: Message }) => {
      streamingMessageRef.current = '';
      streamingMessageIdRef.current = null;

      setState((prev) => {
        if (!prev.currentConversation) return { ...prev, isStreaming: false };

        const messages = prev.currentConversation.messages.map((m) =>
          m.id === data.messageId ? { ...data.message, status: 'sent' as const } : m
        );

        return {
          ...prev,
          isStreaming: false,
          currentConversation: {
            ...prev.currentConversation,
            messages,
            updatedAt: new Date(),
          },
        };
      });
    });

    socket.on('message.error', (data: { error: string }) => {
      streamingMessageRef.current = '';
      streamingMessageIdRef.current = null;
      updateState({
        isStreaming: false,
        error: data.error,
      });
    });

    socketRef.current = socket;
  }, [userId, companyId, updateState]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await chatApi.getConversation(id);

      if (response.success && response.data) {
        updateState({
          currentConversation: response.data,
          isLoading: false,
        });
      } else {
        updateState({
          error: response.error || 'Failed to load conversation',
          isLoading: false,
        });
      }
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  }, [updateState]);

  const createConversation = useCallback(async (params: CreateConversationParams = {}): Promise<string | null> => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await chatApi.createConversation({
        title: params.title || 'Nueva conversación',
        context: params.context || state.context || undefined,
      });

      if (response.success && response.data) {
        updateState({
          currentConversation: response.data,
          conversations: [response.data, ...state.conversations],
          isLoading: false,
        });
        return response.data.id;
      } else {
        updateState({
          error: response.error || 'Failed to create conversation',
          isLoading: false,
        });
        return null;
      }
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
      return null;
    }
  }, [updateState, state.context, state.conversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let conversationId = state.currentConversation?.id;

    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) return;
    }

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending',
    };

    setState((prev) => ({
      ...prev,
      currentConversation: prev.currentConversation
        ? {
            ...prev.currentConversation,
            messages: [...prev.currentConversation.messages, userMessage],
          }
        : null,
    }));

    try {
      streamingMessageRef.current = '';

      const params: SendMessageParams = {
        conversationId,
        content: content.trim(),
        context: state.context || undefined,
      };

      const response = await chatApi.sendMessage(params);

      if (response.success && response.data) {
        setState((prev) => {
          if (!prev.currentConversation) return prev;

          const messages = prev.currentConversation.messages.map((m) =>
            m.id === userMessage.id ? { ...response.data!, status: 'sent' as const } : m
          );

          return {
            ...prev,
            currentConversation: {
              ...prev.currentConversation,
              messages,
            },
          };
        });

        if (socketRef.current) {
          socketRef.current.emit('message.typing', {
            conversationId,
            userId,
          });
        }
      } else {
        setState((prev) => {
          if (!prev.currentConversation) return prev;

          const messages = prev.currentConversation.messages.map((m) =>
            m.id === userMessage.id ? { ...m, status: 'error' as const } : m
          );

          return {
            ...prev,
            currentConversation: {
              ...prev.currentConversation,
              messages,
            },
            error: response.error || 'Failed to send message',
          };
        });
      }
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [state.currentConversation, state.context, createConversation, updateState, userId]);

  const deleteConversation = useCallback(async (id: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const response = await chatApi.deleteConversation(id);

      if (response.success) {
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.filter((c) => c.id !== id),
          currentConversation:
            prev.currentConversation?.id === id ? null : prev.currentConversation,
          isLoading: false,
        }));
      } else {
        updateState({
          error: response.error || 'Failed to delete conversation',
          isLoading: false,
        });
      }
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      });
    }
  }, [updateState]);

  const submitFeedback = useCallback(async (messageId: string, feedback: MessageFeedback) => {
    if (!state.currentConversation) return;

    try {
      const response = await chatApi.submitFeedback(
        state.currentConversation.id,
        messageId,
        feedback
      );

      if (response.success) {
        setState((prev) => {
          if (!prev.currentConversation) return prev;

          const messages = prev.currentConversation.messages.map((m) =>
            m.id === messageId
              ? { ...m, metadata: { ...m.metadata, feedback } }
              : m
          );

          return {
            ...prev,
            currentConversation: {
              ...prev.currentConversation,
              messages,
            },
          };
        });
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, [state.currentConversation]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    if (!state.currentConversation) return;

    const messageIndex = state.currentConversation.messages.findIndex(
      (m) => m.id === messageId
    );

    if (messageIndex <= 0) return;

    const previousMessage = state.currentConversation.messages[messageIndex - 1];

    if (previousMessage.role !== 'user') return;

    setState((prev) => {
      if (!prev.currentConversation) return prev;

      const messages = prev.currentConversation.messages.slice(0, messageIndex);

      return {
        ...prev,
        currentConversation: {
          ...prev.currentConversation,
          messages,
        },
      };
    });

    await sendMessage(previousMessage.content);
  }, [state.currentConversation, sendMessage]);

  const setContext = useCallback((context: ContextData | null) => {
    updateState({ context });
  }, [updateState]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, [initialConversationId, loadConversation]);

  return {
    ...state,
    sendMessage,
    loadConversation,
    createConversation,
    deleteConversation,
    submitFeedback,
    regenerateMessage,
    setContext,
    connect,
    disconnect,
  };
}
