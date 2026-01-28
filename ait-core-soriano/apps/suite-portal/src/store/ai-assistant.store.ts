import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AISuggestion {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

interface AIAssistantState {
  conversations: AIConversation[];
  activeConversationId: string | null;
  isTyping: boolean;
  unreadCount: number;
  suggestions: AISuggestion[];

  // Actions
  createConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<AIMessage>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  clearConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  setSuggestions: (suggestions: AISuggestion[]) => void;
}

const defaultSuggestions: AISuggestion[] = [
  {
    id: '1',
    label: 'Summarize document',
    prompt: '/summarize',
    icon: '📝',
  },
  {
    id: '2',
    label: 'Translate text',
    prompt: '/translate',
    icon: '🌐',
  },
  {
    id: '3',
    label: 'Improve writing',
    prompt: '/improve',
    icon: '✨',
  },
  {
    id: '4',
    label: 'Explain concept',
    prompt: '/explain',
    icon: '💡',
  },
  {
    id: '5',
    label: 'Generate content',
    prompt: '/generate',
    icon: '🎨',
  },
];

export const useAIAssistantStore = create<AIAssistantState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isTyping: false,
      unreadCount: 0,
      suggestions: defaultSuggestions,

      createConversation: () => {
        const id = nanoid();
        const newConversation: AIConversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: id,
        }));

        return id;
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        const messageWithId: AIMessage = {
          ...message,
          id: nanoid(),
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, messageWithId],
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));

        // Auto-generate title from first user message
        const conversation = get().conversations.find((c) => c.id === conversationId);
        if (
          conversation &&
          conversation.title === 'New Conversation' &&
          message.role === 'user' &&
          conversation.messages.length === 0
        ) {
          const title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
          get().updateConversationTitle(conversationId, title);
        }
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      removeMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.filter((msg) => msg.id !== messageId),
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      clearConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [],
                  title: 'New Conversation',
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== conversationId),
          activeConversationId:
            state.activeConversationId === conversationId
              ? null
              : state.activeConversationId,
        }));
      },

      setIsTyping: (isTyping) => {
        set({ isTyping });
      },

      incrementUnreadCount: () => {
        set((state) => ({
          unreadCount: state.unreadCount + 1,
        }));
      },

      resetUnreadCount: () => {
        set({ unreadCount: 0 });
      },

      updateConversationTitle: (conversationId, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  title,
                  updatedAt: new Date(),
                }
              : conv
          ),
        }));
      },

      setSuggestions: (suggestions) => {
        set({ suggestions });
      },
    }),
    {
      name: 'ai-assistant-storage',
      partialize: (state) => ({
        conversations: state.conversations.slice(0, 10), // Keep only last 10 conversations
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
