import { z } from 'zod';

// Document Type
export const DocumentType = {
  DOCUMENT: 'document',
  SPREADSHEET: 'spreadsheet',
  PRESENTATION: 'presentation',
  NOTE: 'note',
  FORM: 'form',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

// Document Status
export const DocumentStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

// Permission Level
export const PermissionLevel = {
  VIEWER: 'viewer',
  COMMENTER: 'commenter',
  EDITOR: 'editor',
  OWNER: 'owner',
} as const;

export type PermissionLevel = (typeof PermissionLevel)[keyof typeof PermissionLevel];

// Document Schema
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.string(),
  contentHtml: z.string().optional(),
  type: z.enum(['document', 'spreadsheet', 'presentation', 'note', 'form']),
  status: z.enum(['draft', 'published', 'archived', 'deleted']),
  ownerId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  version: z.number().int().positive().default(1),
  wordCount: z.number().int().nonnegative().default(0),
  characterCount: z.number().int().nonnegative().default(0),
  thumbnail: z.string().url().optional(),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastAccessedAt: z.string().datetime().optional(),
});

export type Document = z.infer<typeof DocumentSchema>;

// Create Document DTO
export const CreateDocumentSchema = DocumentSchema.pick({
  title: true,
  content: true,
  type: true,
  folderId: true,
  tags: true,
  isTemplate: true,
}).partial({
  content: true,
  folderId: true,
  tags: true,
  isTemplate: true,
});

export type CreateDocumentDto = z.infer<typeof CreateDocumentSchema>;

// Update Document DTO
export const UpdateDocumentSchema = DocumentSchema.pick({
  title: true,
  content: true,
  status: true,
  folderId: true,
  tags: true,
  metadata: true,
}).partial();

export type UpdateDocumentDto = z.infer<typeof UpdateDocumentSchema>;

// Document Version
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  createdBy: string;
  createdAt: string;
  changeDescription?: string;
}

// Document Share
export interface DocumentShare {
  id: string;
  documentId: string;
  userId?: string;
  email?: string;
  permission: PermissionLevel;
  expiresAt?: string;
  createdAt: string;
  createdBy: string;
}

// Document Comment
export interface DocumentComment {
  id: string;
  documentId: string;
  parentId?: string;
  content: string;
  userId: string;
  position?: {
    start: number;
    end: number;
  };
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

// AI Document Analysis
export interface DocumentAIAnalysis {
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  readingTime: number;
  suggestions: string[];
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
}
