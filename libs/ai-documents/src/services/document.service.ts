/**
 * Document Service
 * Manages document lifecycle, versioning, permissions, and sharing
 */

import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import * as path from 'path';
import {
  Document,
  DocumentVersion,
  DocumentMetadata,
  DocumentStatus,
  DocumentType,
  DocumentPermission,
  DocumentShare,
  DocumentEvent,
  DocumentEventType,
  PermissionLevel,
  UploadOptions,
  DownloadOptions,
  SearchOptions,
  ShareOptions,
  SearchResult,
  OperationResult,
  BatchResult,
  FacetItem
} from '../types';

/**
 * File data interface for uploads
 */
export interface FileData {
  buffer: Buffer;
  originalName: string;
  mimeType?: string;
  size?: number;
}

/**
 * Context interface for operations
 */
export interface OperationContext {
  tenantId: string;
  userId: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
  upload(tenantId: string, path: string, buffer: Buffer): Promise<string>;
  download(tenantId: string, path: string): Promise<Buffer>;
  delete(tenantId: string, path: string): Promise<void>;
  exists(tenantId: string, path: string): Promise<boolean>;
  copy(tenantId: string, sourcePath: string, targetPath: string): Promise<string>;
  getUrl(tenantId: string, path: string, expiresIn?: number): Promise<string>;
}

/**
 * Database adapter interface
 */
export interface IDocumentRepository {
  create(document: Document): Promise<Document>;
  update(id: string, data: Partial<Document>): Promise<Document>;
  findById(id: string): Promise<Document | null>;
  findByFolder(tenantId: string, folderId: string): Promise<Document[]>;
  search(tenantId: string, options: SearchOptions): Promise<SearchResult>;
  delete(id: string): Promise<void>;
  softDelete(id: string, deletedBy: string): Promise<void>;
  restore(id: string): Promise<Document>;

  // Versions
  createVersion(version: DocumentVersion): Promise<DocumentVersion>;
  getVersions(documentId: string): Promise<DocumentVersion[]>;
  getVersion(documentId: string, versionId: string): Promise<DocumentVersion | null>;

  // Permissions
  setPermissions(documentId: string, permissions: DocumentPermission[]): Promise<void>;
  getPermissions(documentId: string): Promise<DocumentPermission[]>;
  checkPermission(documentId: string, userId: string, level: PermissionLevel): Promise<boolean>;

  // Shares
  createShare(share: DocumentShare): Promise<DocumentShare>;
  getShare(shareToken: string): Promise<DocumentShare | null>;
  updateShare(shareId: string, data: Partial<DocumentShare>): Promise<DocumentShare>;
  deleteShare(shareId: string): Promise<void>;

  // Events
  logEvent(event: DocumentEvent): Promise<void>;
  getEvents(documentId: string): Promise<DocumentEvent[]>;

  // Full-text search
  indexDocument(document: Document, content: string): Promise<void>;
  searchFullText(tenantId: string, query: string, options: SearchOptions): Promise<SearchResult>;
}

/**
 * Document Service Class
 */
export class DocumentService {
  private storage: IStorageAdapter;
  private repository: IDocumentRepository;

  constructor(storage: IStorageAdapter, repository: IDocumentRepository) {
    this.storage = storage;
    this.repository = repository;
  }

  // ============================================================================
  // UPLOAD AND DOWNLOAD
  // ============================================================================

  /**
   * Upload a new document
   */
  async upload(
    file: FileData,
    metadata: DocumentMetadata,
    folderId: string | undefined,
    context: OperationContext,
    options: UploadOptions = {}
  ): Promise<OperationResult<Document>> {
    try {
      const documentId = uuidv4();
      const versionId = uuidv4();
      const extension = path.extname(file.originalName).toLowerCase().slice(1);
      const mimeType = file.mimeType || mime.lookup(file.originalName) || 'application/octet-stream';
      const fileSize = file.size || file.buffer.length;
      const checksum = this.calculateChecksum(file.buffer);

      // Generate storage path
      const storagePath = this.generateStoragePath(context.tenantId, documentId, versionId, extension);

      // Upload to storage
      const filePath = await this.storage.upload(context.tenantId, storagePath, file.buffer);

      // Detect document type
      const documentType = options.autoClassify
        ? await this.detectDocumentType(mimeType, extension, metadata)
        : metadata.documentType || DocumentType.DOCUMENT;

      // Create version record
      const version: DocumentVersion = {
        id: versionId,
        documentId,
        versionNumber: 1,
        majorVersion: 1,
        minorVersion: 0,
        fileSize,
        filePath,
        fileHash: checksum,
        mimeType,
        createdAt: new Date(),
        createdBy: context.userId,
        comment: options.versionComment || 'Initial version',
        isLatest: true
      };

      // Create document record
      const document: Document = {
        id: documentId,
        tenantId: context.tenantId,
        folderId,
        name: metadata.title || file.originalName,
        originalName: file.originalName,
        extension,
        mimeType,
        size: fileSize,
        status: DocumentStatus.DRAFT,
        documentType,
        currentVersionId: versionId,
        currentVersionNumber: 1,
        metadata,
        permissions: [],
        versions: [version],
        createdAt: new Date(),
        createdBy: context.userId,
        updatedAt: new Date(),
        updatedBy: context.userId,
        checksum
      };

      // Save to database
      const savedDocument = await this.repository.create(document);
      await this.repository.createVersion(version);

      // Set initial permissions if provided
      if (options.setPermissions && options.setPermissions.length > 0) {
        const permissions = options.setPermissions.map(p => ({
          ...p,
          id: uuidv4(),
          documentId,
          grantedAt: new Date(),
          grantedBy: context.userId
        })) as DocumentPermission[];
        await this.repository.setPermissions(documentId, permissions);
      }

      // Log event
      await this.logEvent(documentId, 'created', context, {
        fileName: file.originalName,
        fileSize,
        mimeType
      });

      return {
        success: true,
        data: savedDocument,
        message: 'Document uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload document',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Download a document
   */
  async download(
    documentId: string,
    context: OperationContext,
    options: DownloadOptions = {}
  ): Promise<OperationResult<{ buffer: Buffer; document: Document; version: DocumentVersion }>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Check permissions
      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.VIEW
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      // Get version
      let version: DocumentVersion | null;
      if (options.versionId) {
        version = await this.repository.getVersion(documentId, options.versionId);
      } else {
        const versions = await this.repository.getVersions(documentId);
        version = versions.find(v => v.isLatest) || null;
      }

      if (!version) {
        return { success: false, message: 'Version not found' };
      }

      // Download from storage
      const buffer = await this.storage.download(document.tenantId, version.filePath);

      // Log event
      if (options.trackDownload !== false) {
        await this.logEvent(documentId, 'downloaded', context, {
          versionId: version.id,
          versionNumber: version.versionNumber
        });
      }

      return {
        success: true,
        data: { buffer, document, version }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to download document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // VERSIONING
  // ============================================================================

  /**
   * Create a new version of a document
   */
  async createVersion(
    documentId: string,
    file: FileData,
    context: OperationContext,
    comment?: string,
    isMajor: boolean = false
  ): Promise<OperationResult<DocumentVersion>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Check permissions
      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.EDIT
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      const versionId = uuidv4();
      const extension = path.extname(file.originalName).toLowerCase().slice(1);
      const mimeType = file.mimeType || mime.lookup(file.originalName) || 'application/octet-stream';
      const fileSize = file.size || file.buffer.length;
      const checksum = this.calculateChecksum(file.buffer);

      // Generate storage path
      const storagePath = this.generateStoragePath(document.tenantId, documentId, versionId, extension);

      // Upload to storage
      const filePath = await this.storage.upload(document.tenantId, storagePath, file.buffer);

      // Calculate version numbers
      const versions = await this.repository.getVersions(documentId);
      const latestVersion = versions.find(v => v.isLatest);
      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;
      const majorVersion = isMajor
        ? (latestVersion?.majorVersion || 0) + 1
        : (latestVersion?.majorVersion || 1);
      const minorVersion = isMajor
        ? 0
        : (latestVersion?.minorVersion || 0) + 1;

      // Update previous latest version
      if (latestVersion) {
        await this.repository.update(documentId, {
          versions: versions.map(v =>
            v.id === latestVersion.id ? { ...v, isLatest: false } : v
          )
        });
      }

      // Create new version
      const version: DocumentVersion = {
        id: versionId,
        documentId,
        versionNumber: newVersionNumber,
        majorVersion,
        minorVersion,
        fileSize,
        filePath,
        fileHash: checksum,
        mimeType,
        createdAt: new Date(),
        createdBy: context.userId,
        comment: comment || `Version ${majorVersion}.${minorVersion}`,
        isLatest: true
      };

      await this.repository.createVersion(version);

      // Update document
      await this.repository.update(documentId, {
        currentVersionId: versionId,
        currentVersionNumber: newVersionNumber,
        size: fileSize,
        mimeType,
        checksum,
        updatedAt: new Date(),
        updatedBy: context.userId
      });

      // Log event
      await this.logEvent(documentId, 'version_created', context, {
        versionId,
        versionNumber: newVersionNumber,
        majorVersion,
        minorVersion,
        comment
      });

      return {
        success: true,
        data: version,
        message: `Version ${majorVersion}.${minorVersion} created successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create version',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Get version history of a document
   */
  async getVersionHistory(
    documentId: string,
    context: OperationContext
  ): Promise<OperationResult<DocumentVersion[]>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.VIEW
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      const versions = await this.repository.getVersions(documentId);

      return {
        success: true,
        data: versions.sort((a, b) => b.versionNumber - a.versionNumber)
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get version history',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  /**
   * Move document to another folder
   */
  async move(
    documentId: string,
    targetFolderId: string,
    context: OperationContext
  ): Promise<OperationResult<Document>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.EDIT
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      const previousFolderId = document.folderId;
      const updatedDocument = await this.repository.update(documentId, {
        folderId: targetFolderId,
        updatedAt: new Date(),
        updatedBy: context.userId
      });

      await this.logEvent(documentId, 'moved', context, {
        previousFolderId,
        targetFolderId
      });

      return {
        success: true,
        data: updatedDocument,
        message: 'Document moved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to move document',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Copy document to another folder
   */
  async copy(
    documentId: string,
    targetFolderId: string,
    context: OperationContext,
    newName?: string
  ): Promise<OperationResult<Document>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.VIEW
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      // Get latest version
      const versions = await this.repository.getVersions(documentId);
      const latestVersion = versions.find(v => v.isLatest);
      if (!latestVersion) {
        return { success: false, message: 'No version found' };
      }

      // Copy file in storage
      const newDocumentId = uuidv4();
      const newVersionId = uuidv4();
      const newStoragePath = this.generateStoragePath(
        document.tenantId,
        newDocumentId,
        newVersionId,
        document.extension
      );
      await this.storage.copy(document.tenantId, latestVersion.filePath, newStoragePath);

      // Create new version
      const newVersion: DocumentVersion = {
        ...latestVersion,
        id: newVersionId,
        documentId: newDocumentId,
        filePath: newStoragePath,
        versionNumber: 1,
        majorVersion: 1,
        minorVersion: 0,
        createdAt: new Date(),
        createdBy: context.userId,
        comment: `Copied from ${document.name}`
      };

      // Create new document
      const copiedName = newName || `Copy of ${document.name}`;
      const newDocument: Document = {
        ...document,
        id: newDocumentId,
        folderId: targetFolderId,
        name: copiedName,
        currentVersionId: newVersionId,
        currentVersionNumber: 1,
        versions: [newVersion],
        permissions: [],
        createdAt: new Date(),
        createdBy: context.userId,
        updatedAt: new Date(),
        updatedBy: context.userId
      };

      const savedDocument = await this.repository.create(newDocument);
      await this.repository.createVersion(newVersion);

      await this.logEvent(documentId, 'copied', context, {
        newDocumentId,
        targetFolderId,
        newName: copiedName
      });

      return {
        success: true,
        data: savedDocument,
        message: 'Document copied successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to copy document',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Delete a document
   */
  async delete(
    documentId: string,
    context: OperationContext,
    permanent: boolean = false
  ): Promise<OperationResult<void>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.FULL_ACCESS
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      if (permanent) {
        // Delete all versions from storage
        const versions = await this.repository.getVersions(documentId);
        for (const version of versions) {
          await this.storage.delete(document.tenantId, version.filePath);
        }

        // Hard delete from database
        await this.repository.delete(documentId);
      } else {
        // Soft delete
        await this.repository.softDelete(documentId, context.userId);
        await this.repository.update(documentId, {
          status: DocumentStatus.DELETED,
          deletedAt: new Date(),
          deletedBy: context.userId
        });
      }

      await this.logEvent(documentId, 'deleted', context, { permanent });

      return {
        success: true,
        message: permanent ? 'Document permanently deleted' : 'Document moved to trash'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete document',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Restore a deleted document
   */
  async restore(
    documentId: string,
    context: OperationContext
  ): Promise<OperationResult<Document>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.status !== DocumentStatus.DELETED) {
        return { success: false, message: 'Document is not deleted' };
      }

      const restoredDocument = await this.repository.restore(documentId);
      await this.repository.update(documentId, {
        status: DocumentStatus.DRAFT,
        deletedAt: undefined,
        deletedBy: undefined,
        updatedAt: new Date(),
        updatedBy: context.userId
      });

      await this.logEvent(documentId, 'restored', context);

      return {
        success: true,
        data: restoredDocument,
        message: 'Document restored successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to restore document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // SEARCH AND RETRIEVAL
  // ============================================================================

  /**
   * Search documents
   */
  async search(
    query: string,
    context: OperationContext,
    options: SearchOptions = {}
  ): Promise<OperationResult<SearchResult>> {
    try {
      const searchOptions: SearchOptions = {
        ...options,
        query,
        page: options.page || 1,
        pageSize: options.pageSize || 20
      };

      let result: SearchResult;

      if (options.fullTextSearch) {
        result = await this.repository.searchFullText(
          context.tenantId,
          query,
          searchOptions
        );
      } else {
        result = await this.repository.search(context.tenantId, searchOptions);
      }

      // Apply highlighting if requested
      if (options.highlightMatches && query) {
        result.highlights = this.generateHighlights(result.documents, query);
      }

      // Generate facets
      result.facets = this.generateFacets(result.documents);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Search failed',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Get documents by folder
   */
  async getByFolder(
    folderId: string,
    context: OperationContext,
    options: SearchOptions = {}
  ): Promise<OperationResult<SearchResult>> {
    try {
      const searchOptions: SearchOptions = {
        ...options,
        folderId,
        includeSubfolders: options.includeSubfolders || false
      };

      const result = await this.repository.search(context.tenantId, searchOptions);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get documents',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // PERMISSIONS AND SHARING
  // ============================================================================

  /**
   * Set document permissions
   */
  async setPermissions(
    documentId: string,
    permissions: Partial<DocumentPermission>[],
    context: OperationContext
  ): Promise<OperationResult<DocumentPermission[]>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const hasPermission = await this.repository.checkPermission(
        documentId,
        context.userId,
        PermissionLevel.OWNER
      );
      if (!hasPermission) {
        return { success: false, message: 'Access denied' };
      }

      const fullPermissions: DocumentPermission[] = permissions.map(p => ({
        id: p.id || uuidv4(),
        documentId,
        entityType: p.entityType || 'user',
        entityId: p.entityId || '',
        permissionLevel: p.permissionLevel || PermissionLevel.VIEW,
        canDownload: p.canDownload ?? true,
        canPrint: p.canPrint ?? true,
        canShare: p.canShare ?? false,
        canDelete: p.canDelete ?? false,
        expiresAt: p.expiresAt,
        grantedAt: new Date(),
        grantedBy: context.userId
      }));

      await this.repository.setPermissions(documentId, fullPermissions);

      await this.logEvent(documentId, 'permission_changed', context, {
        permissions: fullPermissions
      });

      return {
        success: true,
        data: fullPermissions,
        message: 'Permissions updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to set permissions',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Share a document
   */
  async share(
    documentId: string,
    shareOptions: ShareOptions,
    context: OperationContext
  ): Promise<OperationResult<DocumentShare>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Check if user can share
      const permissions = await this.repository.getPermissions(documentId);
      const userPermission = permissions.find(
        p => p.entityType === 'user' && p.entityId === context.userId
      );
      if (!userPermission?.canShare) {
        const hasFullAccess = await this.repository.checkPermission(
          documentId,
          context.userId,
          PermissionLevel.FULL_ACCESS
        );
        if (!hasFullAccess) {
          return { success: false, message: 'Sharing not allowed' };
        }
      }

      // Generate share token and URL
      const shareToken = this.generateShareToken();
      const shareUrl = this.generateShareUrl(shareToken);

      const share: DocumentShare = {
        id: uuidv4(),
        documentId,
        shareType: shareOptions.shareType,
        shareToken,
        shareUrl,
        permissionLevel: shareOptions.permissionLevel,
        password: shareOptions.password ? this.hashPassword(shareOptions.password) : undefined,
        expiresAt: shareOptions.expiresAt,
        maxDownloads: shareOptions.maxDownloads,
        downloadCount: 0,
        allowedEmails: shareOptions.allowedEmails,
        notifyOnAccess: shareOptions.notifyOnAccess ?? false,
        isActive: true,
        createdAt: new Date(),
        createdBy: context.userId
      };

      const savedShare = await this.repository.createShare(share);

      await this.logEvent(documentId, 'shared', context, {
        shareId: share.id,
        shareType: shareOptions.shareType,
        permissionLevel: shareOptions.permissionLevel
      });

      return {
        success: true,
        data: savedShare,
        message: 'Document shared successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to share document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate file checksum
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate storage path for document
   */
  private generateStoragePath(
    tenantId: string,
    documentId: string,
    versionId: string,
    extension: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `documents/${tenantId}/${year}/${month}/${documentId}/${versionId}.${extension}`;
  }

  /**
   * Detect document type based on mime type and extension
   */
  private async detectDocumentType(
    mimeType: string,
    extension: string,
    metadata: DocumentMetadata
  ): Promise<DocumentType> {
    // Check if already specified
    if (metadata.documentType) {
      return metadata.documentType;
    }

    // Detect by mime type
    if (mimeType.startsWith('image/')) return DocumentType.IMAGE;
    if (mimeType.startsWith('video/')) return DocumentType.VIDEO;
    if (mimeType.startsWith('audio/')) return DocumentType.AUDIO;

    // Detect by extension
    const extensionMap: Record<string, DocumentType> = {
      pdf: DocumentType.DOCUMENT,
      doc: DocumentType.DOCUMENT,
      docx: DocumentType.DOCUMENT,
      xls: DocumentType.SPREADSHEET,
      xlsx: DocumentType.SPREADSHEET,
      ppt: DocumentType.PRESENTATION,
      pptx: DocumentType.PRESENTATION
    };

    return extensionMap[extension] || DocumentType.DOCUMENT;
  }

  /**
   * Generate share token
   */
  private generateShareToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate share URL
   */
  private generateShareUrl(token: string): string {
    // This should be configured from environment
    const baseUrl = process.env.APP_URL || 'https://app.example.com';
    return `${baseUrl}/share/${token}`;
  }

  /**
   * Hash password for share protection
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Log document event
   */
  private async logEvent(
    documentId: string,
    eventType: DocumentEventType,
    context: OperationContext,
    details?: Record<string, unknown>
  ): Promise<void> {
    const event: DocumentEvent = {
      id: uuidv4(),
      documentId,
      eventType,
      userId: context.userId,
      userEmail: context.userEmail,
      timestamp: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details
    };

    await this.repository.logEvent(event);
  }

  /**
   * Generate search highlights
   */
  private generateHighlights(
    documents: Document[],
    query: string
  ): Record<string, string[]> {
    const highlights: Record<string, string[]> = {};
    const queryLower = query.toLowerCase();

    for (const doc of documents) {
      const matches: string[] = [];

      // Check name
      if (doc.name.toLowerCase().includes(queryLower)) {
        matches.push(`Name: ...${this.highlightText(doc.name, query)}...`);
      }

      // Check metadata
      if (doc.metadata.description?.toLowerCase().includes(queryLower)) {
        matches.push(`Description: ...${this.highlightText(doc.metadata.description, query)}...`);
      }

      if (matches.length > 0) {
        highlights[doc.id] = matches;
      }
    }

    return highlights;
  }

  /**
   * Highlight text with query
   */
  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Generate search facets
   */
  private generateFacets(documents: Document[]): {
    documentTypes: FacetItem[];
    categories: FacetItem[];
    tags: FacetItem[];
    statuses: FacetItem[];
    extensions: FacetItem[];
    createdBy: FacetItem[];
  } {
    const countMap = <T extends string>(items: T[]): FacetItem[] => {
      const counts = items.reduce((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value,
        count,
        label: value
      }));
    };

    return {
      documentTypes: countMap(documents.map(d => d.documentType)),
      categories: countMap(documents.map(d => d.metadata.category).filter(Boolean) as string[]),
      tags: countMap(documents.flatMap(d => d.metadata.tags || [])),
      statuses: countMap(documents.map(d => d.status)),
      extensions: countMap(documents.map(d => d.extension)),
      createdBy: countMap(documents.map(d => d.createdBy))
    };
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Batch delete documents
   */
  async batchDelete(
    documentIds: string[],
    context: OperationContext,
    permanent: boolean = false
  ): Promise<BatchResult> {
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const id of documentIds) {
      const result = await this.delete(id, context, permanent);
      results.push({
        id,
        success: result.success,
        error: result.errors?.[0]
      });
    }

    return {
      total: documentIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Batch move documents
   */
  async batchMove(
    documentIds: string[],
    targetFolderId: string,
    context: OperationContext
  ): Promise<BatchResult> {
    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const id of documentIds) {
      const result = await this.move(id, targetFolderId, context);
      results.push({
        id,
        success: result.success,
        error: result.errors?.[0]
      });
    }

    return {
      total: documentIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

export default DocumentService;
