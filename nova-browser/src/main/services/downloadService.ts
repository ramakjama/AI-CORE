import * as crypto from 'crypto';
import { DatabaseService } from '../database/sqlite';

const uuidv4 = () => crypto.randomUUID();

// ============================================
// NOVA BROWSER - DOWNLOAD SERVICE
// Complete download management
// ============================================

export interface Download {
  id: string;
  url: string;
  fileName: string;
  savePath?: string;
  totalBytes?: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  completedAt?: Date | string;
  createdAt: string;
}

export class DownloadService {
  private db: DatabaseService;
  private activeDownloads: Map<string, Download> = new Map();

  constructor(db: DatabaseService) {
    this.db = db;
  }

  addDownload(download: Omit<Download, 'status' | 'createdAt'> & { completedAt?: Date }): Download {
    const id = download.id || uuidv4();
    const newDownload: Download = {
      id,
      url: download.url,
      fileName: download.fileName,
      savePath: download.savePath,
      totalBytes: download.totalBytes,
      status: 'completed',
      completedAt: download.completedAt?.toISOString() || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.db.insertDownload(newDownload);
    return newDownload;
  }

  getDownload(id: string): Download | undefined {
    // Check active downloads first
    if (this.activeDownloads.has(id)) {
      return this.activeDownloads.get(id);
    }

    const downloads = this.db.getDownloads() as Download[];
    return downloads.find(d => d.id === id);
  }

  getAllDownloads(): Download[] {
    const dbDownloads = this.db.getDownloads() as Download[];

    // Merge with active downloads
    const activeArray = Array.from(this.activeDownloads.values());

    return [...activeArray.filter(d => d.status !== 'completed'), ...dbDownloads];
  }

  getRecentDownloads(limit: number = 20): Download[] {
    const downloads = this.db.getDownloads() as Download[];
    return downloads.slice(0, limit);
  }

  getDownloadsByStatus(status: Download['status']): Download[] {
    if (status === 'downloading' || status === 'paused') {
      return Array.from(this.activeDownloads.values()).filter(d => d.status === status);
    }

    const downloads = this.db.getDownloads() as Download[];
    return downloads.filter(d => d.status === status);
  }

  updateDownloadStatus(id: string, status: Download['status'], error?: string): boolean {
    if (this.activeDownloads.has(id)) {
      const download = this.activeDownloads.get(id)!;
      download.status = status;
      if (error) download.error = error;

      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        // Move to database
        this.db.insertDownload(download);
        this.activeDownloads.delete(id);
      }

      return true;
    }

    this.db.updateDownload(id, { status });
    return true;
  }

  deleteDownload(id: string): boolean {
    // Remove from active downloads
    this.activeDownloads.delete(id);
    return this.db.deleteDownload(id);
  }

  clearCompletedDownloads(): number {
    const downloads = this.db.getDownloads() as Download[];
    let count = 0;
    downloads.filter(d => d.status === 'completed').forEach(d => {
      if (this.db.deleteDownload(d.id)) count++;
    });
    return count;
  }

  clearAllDownloads(): void {
    this.activeDownloads.clear();
    const downloads = this.db.getDownloads() as Download[];
    downloads.forEach(d => this.db.deleteDownload(d.id));
  }

  // Statistics
  getStats(): {
    total: number;
    completed: number;
    failed: number;
    totalBytes: number
  } {
    const downloads = this.db.getDownloads() as Download[];
    return {
      total: downloads.length,
      completed: downloads.filter(d => d.status === 'completed').length,
      failed: downloads.filter(d => d.status === 'failed').length,
      totalBytes: downloads.reduce((sum, d) => sum + (d.totalBytes || 0), 0),
    };
  }

  // Search downloads
  search(query: string): Download[] {
    const lowerQuery = query.toLowerCase();
    const downloads = this.db.getDownloads() as Download[];
    return downloads.filter(d =>
      d.fileName.toLowerCase().includes(lowerQuery) ||
      d.url.toLowerCase().includes(lowerQuery)
    );
  }
}
