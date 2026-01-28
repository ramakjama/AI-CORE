import { renderHook, act, waitFor } from '@testing-library/react';
import { useChat } from '../useChat';
import { chatApi } from '@/lib/api/chat-api';
import { io } from 'socket.io-client';

jest.mock('@/lib/api/chat-api');
jest.mock('socket.io-client');

const mockSocket = {
  connected: false,
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

(io as jest.Mock).mockReturnValue(mockSocket);

describe('useChat', () => {
  const defaultOptions = {
    userId: 'user-1',
    companyId: 'company-1',
    autoConnect: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useChat(defaultOptions));

    expect(result.current.currentConversation).toBeNull();
    expect(result.current.conversations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('creates a new conversation', async () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      userId: 'user-1',
      companyId: 'company-1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (chatApi.createConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: mockConversation,
    });

    const { result } = renderHook(() => useChat(defaultOptions));

    let conversationId: string | null = null;

    await act(async () => {
      conversationId = await result.current.createConversation({
        title: 'Test Conversation',
      });
    });

    expect(conversationId).toBe('conv-1');
    expect(result.current.currentConversation).toEqual(mockConversation);
  });

  it('loads a conversation by id', async () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      userId: 'user-1',
      companyId: 'company-1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (chatApi.getConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: mockConversation,
    });

    const { result } = renderHook(() => useChat(defaultOptions));

    await act(async () => {
      await result.current.loadConversation('conv-1');
    });

    await waitFor(() => {
      expect(result.current.currentConversation).toEqual(mockConversation);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('sends a message', async () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      userId: 'user-1',
      companyId: 'company-1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMessage = {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: new Date(),
      status: 'sent' as const,
    };

    (chatApi.createConversation as jest.Mock).mockResolvedValue({
      success: true,
      data: mockConversation,
    });

    (chatApi.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockMessage,
    });

    const { result } = renderHook(() => useChat(defaultOptions));

    await act(async () => {
      await result.current.sendMessage('Hello');
    });

    await waitFor(() => {
      expect(chatApi.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello',
        })
      );
    });
  });

  it('deletes a conversation', async () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      userId: 'user-1',
      companyId: 'company-1',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (chatApi.deleteConversation as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() =>
      useChat({
        ...defaultOptions,
        conversationId: 'conv-1',
      })
    );

    act(() => {
      result.current.conversations.push(mockConversation);
    });

    await act(async () => {
      await result.current.deleteConversation('conv-1');
    });

    await waitFor(() => {
      expect(chatApi.deleteConversation).toHaveBeenCalledWith('conv-1');
    });
  });

  it('handles error when creating conversation fails', async () => {
    (chatApi.createConversation as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to create conversation',
    });

    const { result } = renderHook(() => useChat(defaultOptions));

    let conversationId: string | null = null;

    await act(async () => {
      conversationId = await result.current.createConversation();
    });

    expect(conversationId).toBeNull();
    expect(result.current.error).toBe('Failed to create conversation');
  });

  it('sets context', () => {
    const { result } = renderHook(() => useChat(defaultOptions));

    const context = {
      type: 'client' as const,
      entityId: 'client-1',
      entityName: 'John Doe',
    };

    act(() => {
      result.current.setContext(context);
    });

    expect(result.current.context).toEqual(context);
  });

  it('submits feedback for a message', async () => {
    const mockConversation = {
      id: 'conv-1',
      title: 'Test Conversation',
      userId: 'user-1',
      companyId: 'company-1',
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          role: 'assistant' as const,
          content: 'Hello',
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (chatApi.submitFeedback as jest.Mock).mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useChat(defaultOptions));

    act(() => {
      result.current.currentConversation = mockConversation;
    });

    const feedback = {
      rating: 'positive' as const,
      createdAt: new Date(),
    };

    await act(async () => {
      await result.current.submitFeedback('msg-1', feedback);
    });

    expect(chatApi.submitFeedback).toHaveBeenCalledWith(
      'conv-1',
      'msg-1',
      feedback
    );
  });
});
