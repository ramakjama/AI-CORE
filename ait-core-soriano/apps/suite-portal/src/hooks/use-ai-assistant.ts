import { useState, useCallback, useEffect } from 'react';
import { useAIAssistantStore, AIMessage, AISuggestion } from '@/store/ai-assistant.store';
import { assistantClient } from '@/lib/ai/assistant-client';
import { useAppStore } from '@/store/app.store';

export interface UseAIAssistantReturn {
  messages: AIMessage[];
  sendMessage: (content: string) => Promise<void>;
  isTyping: boolean;
  currentConversation: string | null;
  clearConversation: () => void;
  suggestions: AISuggestion[];
  createNewConversation: () => void;
  error: Error | null;
}

export function useAIAssistant(): UseAIAssistantReturn {
  const {
    conversations,
    activeConversationId,
    isTyping,
    suggestions,
    createConversation,
    setActiveConversation,
    addMessage,
    updateMessage,
    setIsTyping,
    clearConversation: clearConversationStore,
    incrementUnreadCount,
  } = useAIAssistantStore();

  const { isAIAssistantOpen } = useAppStore();

  const [error, setError] = useState<Error | null>(null);

  // Get current conversation messages
  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = currentConversation?.messages || [];

  // Create new conversation if none exists
  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      createConversation();
    } else if (!activeConversationId && conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, createConversation, setActiveConversation]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);

      // Get or create conversation
      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = createConversation();
      }

      // Add user message
      addMessage(conversationId, {
        role: 'user',
        content: content.trim(),
      });

      // Set typing indicator
      setIsTyping(true);

      // Add temporary typing message
      const typingMessageId = `typing-${Date.now()}`;
      addMessage(conversationId, {
        role: 'assistant',
        content: '',
        isTyping: true,
      });

      try {
        let assistantResponse = '';

        // Use streaming for real-time responses
        await assistantClient.sendMessageStream({
          message: content.trim(),
          conversationId,
          onChunk: (chunk) => {
            assistantResponse += chunk;

            // Update the typing message with accumulated response
            const conv = useAIAssistantStore
              .getState()
              .conversations.find((c) => c.id === conversationId);
            if (conv) {
              const typingMsg = conv.messages.find((m) => m.isTyping);
              if (typingMsg) {
                updateMessage(conversationId, typingMsg.id, {
                  content: assistantResponse,
                });
              }
            }
          },
          onComplete: (fullResponse) => {
            // Remove typing indicator and finalize message
            const conv = useAIAssistantStore
              .getState()
              .conversations.find((c) => c.id === conversationId);
            if (conv) {
              const typingMsg = conv.messages.find((m) => m.isTyping);
              if (typingMsg) {
                updateMessage(conversationId, typingMsg.id, {
                  content: fullResponse,
                  isTyping: false,
                });
              }
            }

            setIsTyping(false);

            // Increment unread count if panel is closed
            if (!isAIAssistantOpen) {
              incrementUnreadCount();
            }
          },
          onError: (err) => {
            console.error('Streaming error:', err);
            setError(err);
            setIsTyping(false);

            // Remove typing message on error
            const conv = useAIAssistantStore
              .getState()
              .conversations.find((c) => c.id === conversationId);
            if (conv) {
              const typingMsg = conv.messages.find((m) => m.isTyping);
              if (typingMsg) {
                updateMessage(conversationId, typingMsg.id, {
                  content: 'Sorry, I encountered an error. Please try again.',
                  isTyping: false,
                });
              }
            }
          },
        });
      } catch (err) {
        console.error('Error sending message:', err);
        setError(err as Error);
        setIsTyping(false);

        // Fallback: try non-streaming API
        try {
          const response = await assistantClient.sendMessage(content.trim(), conversationId);

          // Remove typing message
          const conv = useAIAssistantStore
            .getState()
            .conversations.find((c) => c.id === conversationId);
          if (conv) {
            const typingMsg = conv.messages.find((m) => m.isTyping);
            if (typingMsg) {
              updateMessage(conversationId, typingMsg.id, {
                content: response.content,
                isTyping: false,
              });
            }
          }

          if (!isAIAssistantOpen) {
            incrementUnreadCount();
          }
        } catch (fallbackErr) {
          console.error('Fallback error:', fallbackErr);

          // Remove typing message and show error
          const conv = useAIAssistantStore
            .getState()
            .conversations.find((c) => c.id === conversationId);
          if (conv) {
            const typingMsg = conv.messages.find((m) => m.isTyping);
            if (typingMsg) {
              updateMessage(conversationId, typingMsg.id, {
                content: 'Sorry, I encountered an error. Please try again.',
                isTyping: false,
              });
            }
          }
        }
      }
    },
    [
      activeConversationId,
      createConversation,
      addMessage,
      updateMessage,
      setIsTyping,
      isAIAssistantOpen,
      incrementUnreadCount,
    ]
  );

  const clearConversation = useCallback(() => {
    if (activeConversationId) {
      clearConversationStore(activeConversationId);
    }
  }, [activeConversationId, clearConversationStore]);

  const createNewConversation = useCallback(() => {
    createConversation();
  }, [createConversation]);

  return {
    messages,
    sendMessage,
    isTyping,
    currentConversation: activeConversationId,
    clearConversation,
    suggestions,
    createNewConversation,
    error,
  };
}
