export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'error' | 'streaming';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status?: MessageStatus;
  metadata?: {
    model?: string;
    tokens?: number;
    context?: ContextData;
    feedback?: MessageFeedback;
  };
}

export interface MessageFeedback {
  rating: 'positive' | 'negative';
  comment?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  companyId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  context?: ContextData;
  metadata?: {
    messageCount: number;
    lastMessageAt?: Date;
  };
}

export interface ContextData {
  type?: 'client' | 'policy' | 'claim' | 'product' | 'general';
  entityId?: string;
  entityName?: string;
  pageUrl?: string;
  additionalInfo?: Record<string, any>;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  category?: string;
}

export interface ChatState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  context: ContextData | null;
}

export interface ChatWidgetPosition {
  bottom?: number;
  right?: number;
  left?: number;
  top?: number;
}

export interface ChatWidgetProps {
  userId: string;
  companyId: string;
  position?: ChatWidgetPosition;
  defaultMinimized?: boolean;
  showNotificationBadge?: boolean;
  onClose?: () => void;
}

export interface ChatInterfaceProps {
  conversationId?: string;
  context?: ContextData;
  onMinimize?: () => void;
  onNewConversation?: () => void;
  showHeader?: boolean;
  showQuickActions?: boolean;
  className?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onFeedback?: (feedback: MessageFeedback) => void;
  onRegenerate?: () => void;
}

export interface TypingIndicatorProps {
  show: boolean;
  message?: string;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  columns?: number;
}

export interface ChatHistoryProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onConversationDelete: (conversationId: string) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export interface ContextPanelProps {
  context: ContextData | null;
  suggestions?: QuickAction[];
  onSuggestionClick?: (suggestion: QuickAction) => void;
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp?: Date;
}

export interface SendMessageParams {
  content: string;
  conversationId?: string;
  context?: ContextData;
}

export interface CreateConversationParams {
  title?: string;
  context?: ContextData;
}

export interface StreamingChunk {
  type: 'token' | 'complete' | 'error';
  content?: string;
  messageId?: string;
  error?: string;
}

export interface WebSocketMessage {
  event: string;
  data: any;
  messageId?: string;
}

export interface ChatApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore?: number;
  url?: string;
}

export interface KnowledgeSearchParams {
  query: string;
  category?: string;
  limit?: number;
}
