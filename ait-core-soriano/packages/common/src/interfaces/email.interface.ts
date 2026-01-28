import { z } from 'zod';

// Email Folder Types
export const EmailFolder = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  TRASH: 'trash',
  SPAM: 'spam',
  STARRED: 'starred',
  ARCHIVE: 'archive',
} as const;

export type EmailFolder = (typeof EmailFolder)[keyof typeof EmailFolder];

// Email Priority
export const EmailPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export type EmailPriority = (typeof EmailPriority)[keyof typeof EmailPriority];

// Email Schema
export const EmailSchema = z.object({
  id: z.string().uuid(),
  threadId: z.string().uuid(),
  userId: z.string().uuid(),
  folder: z.enum(['inbox', 'sent', 'drafts', 'trash', 'spam', 'starred', 'archive']),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })),
  cc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).default([]),
  bcc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).default([]),
  subject: z.string(),
  body: z.string(),
  bodyHtml: z.string().optional(),
  snippet: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  isRead: z.boolean().default(false),
  isStarred: z.boolean().default(false),
  isDraft: z.boolean().default(false),
  hasAttachments: z.boolean().default(false),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string().url().optional(),
  })).default([]),
  labels: z.array(z.string()).default([]),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).default([]),
  headers: z.record(z.string()).default({}),
  sentAt: z.string().datetime().optional(),
  receivedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Email = z.infer<typeof EmailSchema>;

// Compose Email DTO
export const ComposeEmailSchema = z.object({
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).default([]),
  bcc: z.array(z.string().email()).default([]),
  subject: z.string(),
  body: z.string(),
  bodyHtml: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  attachments: z.array(z.string()).default([]),
  inReplyTo: z.string().uuid().optional(),
  isDraft: z.boolean().default(false),
  scheduledAt: z.string().datetime().optional(),
});

export type ComposeEmailDto = z.infer<typeof ComposeEmailSchema>;

// Email Thread
export interface EmailThread {
  id: string;
  subject: string;
  participants: Array<{
    email: string;
    name?: string;
  }>;
  messageCount: number;
  unreadCount: number;
  hasAttachments: boolean;
  isStarred: boolean;
  labels: string[];
  snippet: string;
  lastMessageAt: string;
  messages: Email[];
}

// Email Label
export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  isSystem: boolean;
  messageCount: number;
  unreadCount: number;
}

// Email Filter/Rule
export interface EmailFilter {
  id: string;
  name: string;
  conditions: Array<{
    field: 'from' | 'to' | 'subject' | 'body' | 'hasAttachment';
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
    value: string;
  }>;
  actions: Array<{
    type: 'label' | 'folder' | 'star' | 'markRead' | 'forward' | 'delete';
    value?: string;
  }>;
  enabled: boolean;
}

// AI Email Features
export interface AIEmailSummary {
  summary: string;
  actionItems: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  priority: EmailPriority;
  suggestedReply?: string;
}

export interface AISmartCompose {
  suggestions: string[];
  completions: Array<{
    text: string;
    confidence: number;
  }>;
}
