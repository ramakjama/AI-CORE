/**
 * Unified Inbox Service
 *
 * Aggregates all communication channels into a single inbox view
 * Features: Conversations, assignment, tagging, metrics
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'eventemitter3';

import {
  Conversation,
  ConversationMessage,
  ConversationStatus,
  UnifiedInbox,
  UnifiedInboxFilters,
  AgentMetrics,
  Contact,
  ChannelType,
  MessageStatus,
  Priority,
  CommunicationEvent,
  Attachment
} from '../types';

import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { WhatsAppService } from './whatsapp.service';
import { VoiceService } from './voice.service';

/**
 * Unified inbox service configuration
 */
export interface UnifiedInboxServiceConfig {
  tenantId: string;
  autoAssignEnabled?: boolean;
  autoResolveHours?: number;
  maxConversationsPerAgent?: number;
}

/**
 * Channel services container
 */
export interface ChannelServices {
  email?: EmailService;
  sms?: SMSService;
  whatsapp?: WhatsAppService;
  voice?: VoiceService;
}

/**
 * Resolution data
 */
export interface ResolutionData {
  status: 'resolved' | 'closed' | 'spam';
  reason?: string;
  notes?: string;
  satisfaction?: number;
}

/**
 * Reply options
 */
export interface ReplyOptions {
  attachments?: Attachment[];
  templateCode?: string;
  templateData?: Record<string, unknown>;
  internal?: boolean;
  scheduledAt?: Date;
}

/**
 * Unified Inbox Service Class
 */
export class UnifiedInboxService extends EventEmitter {
  private config: UnifiedInboxServiceConfig;
  private services: ChannelServices;
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, ConversationMessage[]> = new Map();
  private agents: Map<string, { id: string; name: string; teams: string[] }> = new Map();

  constructor(
    config: UnifiedInboxServiceConfig,
    services: ChannelServices
  ) {
    super();
    this.config = config;
    this.services = services;
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for all channels
   */
  private setupEventListeners(): void {
    // Email events
    if (this.services.email) {
      this.services.email.on('message.incoming', (event: CommunicationEvent) => {
        this.handleIncomingMessage(ChannelType.EMAIL, event);
      });
    }

    // SMS events
    if (this.services.sms) {
      this.services.sms.on('message.incoming', (event: CommunicationEvent) => {
        this.handleIncomingMessage(ChannelType.SMS, event);
      });
    }

    // WhatsApp events
    if (this.services.whatsapp) {
      this.services.whatsapp.on('message.incoming', (event: CommunicationEvent) => {
        this.handleIncomingMessage(ChannelType.WHATSAPP, event);
      });
    }

    // Voice events
    if (this.services.voice) {
      this.services.voice.on('call.incoming', (event: CommunicationEvent) => {
        this.handleIncomingMessage(ChannelType.VOICE, event);
      });
    }
  }

  /**
   * Handle incoming message from any channel
   */
  private async handleIncomingMessage(
    channel: ChannelType,
    event: CommunicationEvent
  ): Promise<void> {
    const contact = event.data.contact as Contact;

    // Find or create conversation
    let conversation = this.findConversationByContact(contact, channel);

    if (!conversation) {
      conversation = this.createConversation(contact, channel);
    }

    // Add message to conversation
    const message: ConversationMessage = {
      id: uuidv4(),
      conversationId: conversation.id,
      channel,
      direction: 'INBOUND',
      content: this.extractMessageContent(event),
      sender: {
        type: 'CONTACT',
        id: contact.id || contact.phone || contact.email || contact.whatsappId || '',
        name: contact.name
      },
      status: MessageStatus.DELIVERED,
      metadata: event.data.metadata,
      createdAt: new Date()
    };

    this.addMessageToConversation(conversation.id, message);

    // Update conversation
    conversation.lastMessageAt = new Date();
    conversation.messageCount++;
    conversation.unreadCount++;
    conversation.updatedAt = new Date();

    if (!conversation.channels.includes(channel)) {
      conversation.channels.push(channel);
    }

    conversation.lastMessage = {
      content: message.content,
      channel,
      direction: 'INBOUND',
      timestamp: new Date()
    };

    // Reopen if resolved
    if (conversation.status === ConversationStatus.RESOLVED ||
        conversation.status === ConversationStatus.CLOSED) {
      conversation.status = ConversationStatus.OPEN;
      this.emitEvent('conversation.reopened', conversation.id);
    }

    // Auto-assign if enabled
    if (this.config.autoAssignEnabled && !conversation.assignedTo) {
      await this.autoAssign(conversation.id);
    }

    // Emit event
    this.emitEvent('conversation.updated', conversation.id, {
      message
    });
  }

  /**
   * Get conversations with filters
   */
  getConversations(
    agentId?: string,
    filters?: UnifiedInboxFilters
  ): UnifiedInbox {
    let conversations = Array.from(this.conversations.values());

    // Filter by agent assignment
    if (agentId) {
      const agent = this.agents.get(agentId);
      if (agent) {
        conversations = conversations.filter(c =>
          c.assignedTo === agentId ||
          (agent.teams.length > 0 && agent.teams.includes(c.assignedTeam || ''))
        );
      }
    }

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        conversations = conversations.filter(c =>
          filters.status!.includes(c.status)
        );
      }

      if (filters.channels && filters.channels.length > 0) {
        conversations = conversations.filter(c =>
          c.channels.some(ch => filters.channels!.includes(ch))
        );
      }

      if (filters.assignedTo) {
        conversations = conversations.filter(c =>
          c.assignedTo === filters.assignedTo
        );
      }

      if (filters.assignedTeam) {
        conversations = conversations.filter(c =>
          c.assignedTeam === filters.assignedTeam
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        conversations = conversations.filter(c =>
          c.tags && filters.tags!.some(t => c.tags!.includes(t))
        );
      }

      if (filters.priority && filters.priority.length > 0) {
        conversations = conversations.filter(c =>
          c.priority && filters.priority!.includes(c.priority)
        );
      }

      if (filters.dateRange) {
        conversations = conversations.filter(c =>
          c.lastMessageAt >= filters.dateRange!.start &&
          c.lastMessageAt <= filters.dateRange!.end
        );
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        conversations = conversations.filter(c =>
          c.contact.name?.toLowerCase().includes(searchLower) ||
          c.contact.email?.toLowerCase().includes(searchLower) ||
          c.contact.phone?.includes(searchLower) ||
          c.subject?.toLowerCase().includes(searchLower) ||
          c.lastMessage?.content.toLowerCase().includes(searchLower)
        );
      }

      // Sorting
      const sortBy = filters.sortBy || 'lastMessageAt';
      const sortOrder = filters.sortOrder || 'desc';

      conversations.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'lastMessageAt':
            comparison = a.lastMessageAt.getTime() - b.lastMessageAt.getTime();
            break;
          case 'firstMessageAt':
            comparison = a.firstMessageAt.getTime() - b.firstMessageAt.getTime();
            break;
          case 'priority':
            const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
            comparison = (priorityOrder[a.priority || 'NORMAL'] || 2) -
                        (priorityOrder[b.priority || 'NORMAL'] || 2);
            break;
          case 'unreadCount':
            comparison = a.unreadCount - b.unreadCount;
            break;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    // Calculate totals before pagination
    const totalCount = conversations.length;
    const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    // Apply pagination
    if (filters?.offset) {
      conversations = conversations.slice(filters.offset);
    }

    if (filters?.limit) {
      conversations = conversations.slice(0, filters.limit);
    }

    return {
      tenantId: this.config.tenantId,
      agentId,
      conversations,
      totalCount,
      unreadCount,
      filters: filters || {}
    };
  }

  /**
   * Get a single conversation with messages
   */
  getConversation(conversationId: string): {
    conversation: Conversation;
    messages: ConversationMessage[];
  } | null {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return null;
    }

    const messages = this.messages.get(conversationId) || [];

    return {
      conversation,
      messages: [...messages].sort((a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime()
      )
    };
  }

  /**
   * Reply to a conversation
   */
  async reply(
    conversationId: string,
    channel: ChannelType,
    message: string,
    options?: ReplyOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found'
      };
    }

    // Get recipient info based on channel
    const recipient = this.getRecipientForChannel(conversation.contact, channel);

    if (!recipient) {
      return {
        success: false,
        error: `No recipient found for channel ${channel}`
      };
    }

    let result: { success: boolean; messageId?: string };

    // Send via appropriate channel
    switch (channel) {
      case ChannelType.EMAIL:
        if (!this.services.email) {
          return { success: false, error: 'Email service not configured' };
        }
        if (options?.templateCode) {
          const sendResult = await this.services.email.sendTemplate(
            recipient,
            options.templateCode,
            options.templateData || {}
          );
          result = { success: sendResult.success, messageId: sendResult.messageId };
        } else {
          const sendResult = await this.services.email.send(
            recipient,
            conversation.subject || 'Reply',
            message,
            options?.attachments
          );
          result = { success: sendResult.success, messageId: sendResult.messageId };
        }
        break;

      case ChannelType.SMS:
        if (!this.services.sms) {
          return { success: false, error: 'SMS service not configured' };
        }
        if (options?.templateCode) {
          const sendResult = await this.services.sms.sendTemplate(
            recipient,
            options.templateCode,
            options.templateData || {}
          );
          result = { success: sendResult.success, messageId: sendResult.messageId };
        } else {
          const sendResult = await this.services.sms.send(recipient, message);
          result = { success: sendResult.success, messageId: sendResult.messageId };
        }
        break;

      case ChannelType.WHATSAPP:
        if (!this.services.whatsapp) {
          return { success: false, error: 'WhatsApp service not configured' };
        }
        if (options?.templateCode) {
          const sendResult = await this.services.whatsapp.sendTemplate(
            recipient,
            options.templateCode,
            options.templateData || {}
          );
          result = { success: sendResult.success, messageId: sendResult.messageId };
        } else {
          const sendResult = await this.services.whatsapp.sendText(recipient, message);
          result = { success: sendResult.success, messageId: sendResult.messageId };
        }
        break;

      default:
        return { success: false, error: `Channel ${channel} not supported for reply` };
    }

    if (result.success) {
      // Add message to conversation
      const conversationMessage: ConversationMessage = {
        id: result.messageId || uuidv4(),
        conversationId,
        channel,
        direction: 'OUTBOUND',
        content: message,
        attachments: options?.attachments,
        sender: {
          type: options?.internal ? 'BOT' : 'AGENT',
          id: conversation.assignedTo || 'system',
          name: 'Agent'
        },
        status: MessageStatus.SENT,
        createdAt: new Date()
      };

      this.addMessageToConversation(conversationId, conversationMessage);

      // Update conversation
      conversation.lastMessageAt = new Date();
      conversation.messageCount++;
      conversation.updatedAt = new Date();

      if (!conversation.firstResponseAt) {
        conversation.firstResponseAt = new Date();
        conversation.responseTime = Math.floor(
          (conversation.firstResponseAt.getTime() - conversation.firstMessageAt.getTime()) / 1000
        );
      }

      conversation.lastMessage = {
        content: message,
        channel,
        direction: 'OUTBOUND',
        timestamp: new Date()
      };
    }

    return result;
  }

  /**
   * Assign conversation to agent
   */
  async assign(
    conversationId: string,
    agentId: string,
    teamId?: string
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.assignedTo = agentId;
    conversation.assignedTeam = teamId;
    conversation.assignedAt = new Date();
    conversation.status = ConversationStatus.ASSIGNED;
    conversation.updatedAt = new Date();

    this.emitEvent('conversation.assigned', conversationId, {
      agentId,
      teamId
    });

    return true;
  }

  /**
   * Unassign conversation
   */
  async unassign(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.assignedTo = undefined;
    conversation.assignedTeam = undefined;
    conversation.assignedAt = undefined;
    conversation.status = ConversationStatus.OPEN;
    conversation.updatedAt = new Date();

    return true;
  }

  /**
   * Auto-assign conversation to available agent
   */
  private async autoAssign(conversationId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    // Find agent with fewest assigned conversations
    let bestAgent: { id: string; count: number } | null = null;

    for (const [agentId] of this.agents) {
      const assignedCount = Array.from(this.conversations.values())
        .filter(c =>
          c.assignedTo === agentId &&
          c.status !== ConversationStatus.RESOLVED &&
          c.status !== ConversationStatus.CLOSED
        ).length;

      if (!this.config.maxConversationsPerAgent ||
          assignedCount < this.config.maxConversationsPerAgent) {
        if (!bestAgent || assignedCount < bestAgent.count) {
          bestAgent = { id: agentId, count: assignedCount };
        }
      }
    }

    if (bestAgent) {
      return this.assign(conversationId, bestAgent.id);
    }

    return false;
  }

  /**
   * Resolve conversation
   */
  async resolve(
    conversationId: string,
    resolution: ResolutionData
  ): Promise<boolean> {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.status = resolution.status === 'spam'
      ? ConversationStatus.SPAM
      : resolution.status === 'closed'
        ? ConversationStatus.CLOSED
        : ConversationStatus.RESOLVED;

    conversation.resolvedAt = new Date();
    conversation.updatedAt = new Date();

    if (conversation.firstMessageAt) {
      conversation.resolutionTime = Math.floor(
        (conversation.resolvedAt.getTime() - conversation.firstMessageAt.getTime()) / 1000
      );
    }

    // Store resolution details in metadata
    conversation.metadata = {
      ...conversation.metadata,
      resolution
    };

    this.emitEvent('conversation.resolved', conversationId, {
      resolution
    });

    return true;
  }

  /**
   * Add tags to conversation
   */
  tag(conversationId: string, tags: string[]): boolean {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    if (!conversation.tags) {
      conversation.tags = [];
    }

    for (const tag of tags) {
      if (!conversation.tags.includes(tag)) {
        conversation.tags.push(tag);
      }
    }

    conversation.updatedAt = new Date();

    return true;
  }

  /**
   * Remove tags from conversation
   */
  untag(conversationId: string, tags: string[]): boolean {
    const conversation = this.conversations.get(conversationId);

    if (!conversation || !conversation.tags) {
      return false;
    }

    conversation.tags = conversation.tags.filter(t => !tags.includes(t));
    conversation.updatedAt = new Date();

    return true;
  }

  /**
   * Set conversation priority
   */
  setPriority(conversationId: string, priority: Priority): boolean {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.priority = priority;
    conversation.updatedAt = new Date();

    return true;
  }

  /**
   * Mark conversation as read
   */
  markAsRead(conversationId: string): boolean {
    const conversation = this.conversations.get(conversationId);

    if (!conversation) {
      return false;
    }

    conversation.unreadCount = 0;
    conversation.updatedAt = new Date();

    // Mark all messages as read
    const messages = this.messages.get(conversationId);
    if (messages) {
      for (const message of messages) {
        if (!message.readAt) {
          message.readAt = new Date();
        }
      }
    }

    return true;
  }

  /**
   * Get agent metrics
   */
  getMetrics(agentId: string, period: { start: Date; end: Date }): AgentMetrics {
    const conversations = Array.from(this.conversations.values())
      .filter(c =>
        c.assignedTo === agentId &&
        c.createdAt >= period.start &&
        c.createdAt <= period.end
      );

    const resolved = conversations.filter(c =>
      c.status === ConversationStatus.RESOLVED ||
      c.status === ConversationStatus.CLOSED
    );

    const open = conversations.filter(c =>
      c.status === ConversationStatus.OPEN ||
      c.status === ConversationStatus.ASSIGNED ||
      c.status === ConversationStatus.PENDING
    );

    // Calculate response times
    const responseTimes = resolved
      .map(c => c.responseTime)
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => a - b);

    // Calculate resolution times
    const resolutionTimes = resolved
      .map(c => c.resolutionTime)
      .filter((t): t is number => t !== undefined)
      .sort((a, b) => a - b);

    // Count messages by channel
    const messagesByChannel: Record<ChannelType, number> = {
      [ChannelType.EMAIL]: 0,
      [ChannelType.SMS]: 0,
      [ChannelType.WHATSAPP]: 0,
      [ChannelType.VOICE]: 0,
      [ChannelType.PUSH]: 0
    };

    let totalSent = 0;
    let totalReceived = 0;

    for (const conv of conversations) {
      const messages = this.messages.get(conv.id) || [];
      for (const msg of messages) {
        if (msg.createdAt >= period.start && msg.createdAt <= period.end) {
          messagesByChannel[msg.channel]++;
          if (msg.direction === 'OUTBOUND') {
            totalSent++;
          } else {
            totalReceived++;
          }
        }
      }
    }

    return {
      agentId,
      period,
      conversations: {
        total: conversations.length,
        resolved: resolved.length,
        open: open.length,
        assigned: conversations.filter(c => c.status === ConversationStatus.ASSIGNED).length
      },
      messages: {
        sent: totalSent,
        received: totalReceived,
        byChannel: messagesByChannel
      },
      responseTime: {
        average: responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
        median: responseTimes.length > 0
          ? responseTimes[Math.floor(responseTimes.length / 2)]
          : 0,
        min: responseTimes.length > 0 ? responseTimes[0] : 0,
        max: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0
      },
      resolutionTime: {
        average: resolutionTimes.length > 0
          ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
          : 0,
        median: resolutionTimes.length > 0
          ? resolutionTimes[Math.floor(resolutionTimes.length / 2)]
          : 0,
        min: resolutionTimes.length > 0 ? resolutionTimes[0] : 0,
        max: resolutionTimes.length > 0 ? resolutionTimes[resolutionTimes.length - 1] : 0
      }
    };
  }

  /**
   * Register an agent
   */
  registerAgent(id: string, name: string, teams: string[] = []): void {
    this.agents.set(id, { id, name, teams });
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(id: string): void {
    this.agents.delete(id);
  }

  /**
   * Create a new conversation
   */
  private createConversation(contact: Contact, channel: ChannelType): Conversation {
    const conversation: Conversation = {
      id: uuidv4(),
      tenantId: this.config.tenantId,
      contact,
      channels: [channel],
      status: ConversationStatus.OPEN,
      firstMessageAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);

    this.emitEvent('conversation.created', conversation.id);

    return conversation;
  }

  /**
   * Find conversation by contact
   */
  private findConversationByContact(
    contact: Contact,
    channel: ChannelType
  ): Conversation | null {
    for (const conversation of this.conversations.values()) {
      // Skip resolved/closed conversations unless recently active
      if (conversation.status === ConversationStatus.RESOLVED ||
          conversation.status === ConversationStatus.CLOSED) {
        const hoursSinceResolved = conversation.resolvedAt
          ? (Date.now() - conversation.resolvedAt.getTime()) / (1000 * 60 * 60)
          : Infinity;

        if (hoursSinceResolved > (this.config.autoResolveHours || 24)) {
          continue;
        }
      }

      // Match by contact identifiers
      const contactMatch =
        (contact.email && conversation.contact.email === contact.email) ||
        (contact.phone && conversation.contact.phone === contact.phone) ||
        (contact.whatsappId && conversation.contact.whatsappId === contact.whatsappId) ||
        (contact.id && conversation.contact.id === contact.id);

      if (contactMatch) {
        return conversation;
      }
    }

    return null;
  }

  /**
   * Add message to conversation
   */
  private addMessageToConversation(
    conversationId: string,
    message: ConversationMessage
  ): void {
    const messages = this.messages.get(conversationId) || [];
    messages.push(message);
    this.messages.set(conversationId, messages);
  }

  /**
   * Get recipient for channel
   */
  private getRecipientForChannel(contact: Contact, channel: ChannelType): string | null {
    switch (channel) {
      case ChannelType.EMAIL:
        return contact.email || null;
      case ChannelType.SMS:
      case ChannelType.VOICE:
        return contact.phone || null;
      case ChannelType.WHATSAPP:
        return contact.whatsappId || contact.phone || null;
      default:
        return null;
    }
  }

  /**
   * Extract message content from event
   */
  private extractMessageContent(event: CommunicationEvent): string {
    const metadata = event.data.metadata as any;

    if (metadata?.message) {
      const msg = metadata.message;
      // Handle different message types
      if (msg.body) return msg.body; // SMS
      if (msg.text?.body) return msg.text.body; // WhatsApp
      if (msg.bodyText) return msg.bodyText; // Email
      if (msg.subject) return msg.subject; // Email fallback
    }

    return 'New message';
  }

  /**
   * Emit communication event
   */
  private emitEvent(
    type: string,
    conversationId: string,
    data?: Record<string, unknown>
  ): void {
    const event = {
      type,
      conversationId,
      timestamp: new Date(),
      data
    };

    this.emit(type, event);
    this.emit('event', event);
  }

  /**
   * Export conversations to external system
   */
  exportConversations(filters?: UnifiedInboxFilters): Conversation[] {
    const inbox = this.getConversations(undefined, filters);
    return inbox.conversations;
  }

  /**
   * Import conversation from external system
   */
  importConversation(conversation: Conversation, messages?: ConversationMessage[]): void {
    this.conversations.set(conversation.id, conversation);

    if (messages) {
      this.messages.set(conversation.id, messages);
    }
  }
}

export default UnifiedInboxService;
