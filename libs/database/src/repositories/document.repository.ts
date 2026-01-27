/**
 * Document Repository
 * Manages Documents in SM_DOCUMENTS database
 */

import { BaseRepository } from './base.repository';
import { Document, PaginatedResult, PaginationOptions } from '../types';

// ============================================
// DOCUMENT TYPES
// ============================================

export type DocumentType =
  | 'POLICY'
  | 'CLAIM'
  | 'INVOICE'
  | 'CONTRACT'
  | 'IDENTITY'
  | 'ENDORSEMENT'
  | 'RECEIPT'
  | 'CORRESPONDENCE'
  | 'OTHER';

export interface DocumentCreateInput {
  name: string;
  type: DocumentType;
  mimeType: string;
  size: number;
  url: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentUpdateInput {
  name?: string;
  type?: DocumentType;
  metadata?: Record<string, unknown>;
}

export interface DocumentSearchCriteria {
  name?: string;
  type?: DocumentType;
  mimeType?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  uploadedFrom?: Date;
  uploadedTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
}

// ============================================
// DOCUMENT REPOSITORY
// ============================================

export class DocumentRepository extends BaseRepository<Document, DocumentCreateInput, DocumentUpdateInput> {
  constructor() {
    super('sm_documents', 'document', 'id');
  }

  /**
   * Find documents by entity
   */
  async findByEntity(
    entityType: string,
    entityId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    return this.findMany({
      where: { entityType, entityId },
      ...options,
    });
  }

  /**
   * Find documents by type
   */
  async findByType(
    type: DocumentType,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    return this.findMany({
      where: { type },
      ...options,
    });
  }

  /**
   * Find documents uploaded by user
   */
  async findByUploader(
    uploadedBy: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    return this.findMany({
      where: { uploadedBy },
      ...options,
    });
  }

  /**
   * Search documents with multiple criteria
   */
  async search(
    criteria: DocumentSearchCriteria,
    options?: PaginationOptions
  ): Promise<PaginatedResult<Document>> {
    const where: Record<string, unknown> = {};

    if (criteria.name) {
      where.name = { contains: criteria.name, mode: 'insensitive' };
    }
    if (criteria.type) {
      where.type = criteria.type;
    }
    if (criteria.mimeType) {
      where.mimeType = criteria.mimeType;
    }
    if (criteria.entityType) {
      where.entityType = criteria.entityType;
    }
    if (criteria.entityId) {
      where.entityId = criteria.entityId;
    }
    if (criteria.uploadedBy) {
      where.uploadedBy = criteria.uploadedBy;
    }
    if (criteria.uploadedFrom || criteria.uploadedTo) {
      where.uploadedAt = {
        ...(criteria.uploadedFrom && { gte: criteria.uploadedFrom }),
        ...(criteria.uploadedTo && { lte: criteria.uploadedTo }),
      };
    }
    if (criteria.sizeMin !== undefined || criteria.sizeMax !== undefined) {
      where.size = {
        ...(criteria.sizeMin !== undefined && { gte: criteria.sizeMin }),
        ...(criteria.sizeMax !== undefined && { lte: criteria.sizeMax }),
      };
    }

    return this.findMany({ where, ...options });
  }

  /**
   * Move document to different entity
   */
  async moveToEntity(id: string, newEntityType: string, newEntityId: string): Promise<Document> {
    return this.update(id, {
      metadata: {
        previousEntityType: 'unknown',
        previousEntityId: 'unknown',
        movedAt: new Date(),
      },
    });
  }

  /**
   * Clone document for another entity
   */
  async cloneForEntity(
    id: string,
    newEntityType: string,
    newEntityId: string,
    clonedBy: string
  ): Promise<Document> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Document not found');
    }

    return this.create({
      name: original.name,
      type: original.type as DocumentType,
      mimeType: original.mimeType,
      size: original.size,
      url: original.url,
      entityType: newEntityType,
      entityId: newEntityId,
      uploadedBy: clonedBy,
      metadata: {
        ...original.metadata,
        clonedFrom: id,
        clonedAt: new Date(),
      },
    });
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byMimeType: Record<string, number>;
    totalSize: number;
    averageSize: number;
  }> {
    const delegate = await this.getDelegate();

    const [total, byType, byMimeType, sizeStats] = await Promise.all([
      delegate.count(),
      delegate.groupBy({
        by: ['type'],
        _count: true,
      }),
      delegate.groupBy({
        by: ['mimeType'],
        _count: true,
      }),
      delegate.aggregate({
        _sum: { size: true },
        _avg: { size: true },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      byMimeType: byMimeType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.mimeType] = item._count;
        return acc;
      }, {}),
      totalSize: sizeStats._sum.size ?? 0,
      averageSize: sizeStats._avg.size ?? 0,
    };
  }

  /**
   * Find recent documents
   */
  async findRecent(limit = 10): Promise<Document[]> {
    const result = await this.findMany({
      orderBy: 'uploadedAt',
      orderDirection: 'desc',
      pageSize: limit,
    });
    return result.data;
  }

  /**
   * Find documents by mime type pattern
   */
  async findByMimeTypePattern(pattern: string): Promise<Document[]> {
    const result = await this.findMany({
      where: {
        mimeType: { startsWith: pattern },
      },
    });
    return result.data;
  }

  /**
   * Get storage usage by entity type
   */
  async getStorageByEntityType(): Promise<Record<string, { count: number; totalSize: number }>> {
    const delegate = await this.getDelegate();

    const stats = await delegate.groupBy({
      by: ['entityType'],
      _count: true,
      _sum: { size: true },
    });

    return stats.reduce((acc: Record<string, { count: number; totalSize: number }>, item: any) => {
      acc[item.entityType] = {
        count: item._count,
        totalSize: item._sum.size ?? 0,
      };
      return acc;
    }, {});
  }

  /**
   * Bulk update metadata for documents
   */
  async bulkUpdateMetadata(
    documentIds: string[],
    metadata: Record<string, unknown>
  ): Promise<number> {
    return this.updateMany(
      { id: { in: documentIds } },
      { metadata }
    );
  }

  /**
   * Find orphaned documents (no valid entity reference)
   */
  async findOrphaned(): Promise<Document[]> {
    // This would need to check against all entity types
    // For now, return documents with empty entityId
    const result = await this.findMany({
      where: {
        OR: [
          { entityId: '' },
          { entityId: null as any },
        ],
      },
    });
    return result.data;
  }

  /**
   * Archive old documents
   */
  async archiveOlderThan(date: Date): Promise<number> {
    return this.updateMany(
      {
        uploadedAt: { lt: date },
        metadata: { not: { path: ['archived'], equals: true } },
      },
      {
        metadata: {
          archived: true,
          archivedAt: new Date(),
        },
      }
    );
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let documentRepositoryInstance: DocumentRepository | null = null;

export function getDocumentRepository(): DocumentRepository {
  if (!documentRepositoryInstance) {
    documentRepositoryInstance = new DocumentRepository();
  }
  return documentRepositoryInstance;
}
