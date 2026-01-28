import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ============================================
// NOVA BROWSER - DATABASE SERVICE
// JSON-based storage (fallback when SQLite unavailable)
// ============================================

interface DatabaseData {
  history: Record<string, unknown>[];
  bookmarks: Record<string, unknown>[];
  bookmark_folders: Record<string, unknown>[];
  downloads: Record<string, unknown>[];
  security_stats: Record<string, unknown>[];
  settings: Record<string, unknown>;
  tabs_state: Record<string, unknown>[];
}

interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export class DatabaseService {
  private dbPath: string = '';
  private data: DatabaseData = {
    history: [],
    bookmarks: [],
    bookmark_folders: [],
    downloads: [],
    security_stats: [],
    settings: {},
    tabs_state: [],
  };

  constructor() {
    // Path will be set in initialize() after app is ready
  }

  async initialize(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      this.dbPath = path.join(userDataPath, 'nova-browser.json');

      // Load existing data if file exists
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf-8');
        this.data = JSON.parse(rawData);
      }

      // Initialize default folders if needed
      this.initializeDefaultFolders();

      console.log('Database initialized at:', this.dbPath);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      // Continue with empty data
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  private initializeDefaultFolders(): void {
    if (this.data.bookmark_folders.length === 0) {
      this.data.bookmark_folders.push(
        { id: 'bookmarks-bar', name: 'Bookmarks Bar', parentId: null, position: 0, createdAt: new Date().toISOString() },
        { id: 'other-bookmarks', name: 'Other Bookmarks', parentId: null, position: 1, createdAt: new Date().toISOString() }
      );
      this.save();
    }
  }

  // Generic query methods (simplified for JSON storage)
  run(sql: string, params: unknown[] = []): RunResult {
    // Parse SQL and execute on JSON data
    const tableName = this.extractTableName(sql);

    if (sql.toLowerCase().includes('insert')) {
      return this.handleInsert(tableName, params);
    } else if (sql.toLowerCase().includes('update')) {
      return this.handleUpdate(tableName, sql, params);
    } else if (sql.toLowerCase().includes('delete')) {
      return this.handleDelete(tableName, sql, params);
    }

    return { changes: 0, lastInsertRowid: 0 };
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    const results = this.all<T>(sql, params);
    return results[0];
  }

  all<T>(sql: string, params: unknown[] = []): T[] {
    const tableName = this.extractTableName(sql);
    const table = this.getTable(tableName);

    // Simple query parsing
    if (sql.toLowerCase().includes('where')) {
      // Extract where condition (simplified)
      const filtered = table.filter(row => {
        // Check for id match
        if (params.length > 0 && (row as Record<string, unknown>).id === params[0]) {
          return true;
        }
        // Check for url match
        if (params.length > 0 && (row as Record<string, unknown>).url === params[0]) {
          return true;
        }
        return false;
      });
      return filtered as T[];
    }

    // Extract limit if present
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : undefined;

    // Sort by lastVisit or createdAt descending
    const sorted = [...table].sort((a, b) => {
      const aDate = (a as Record<string, unknown>).lastVisit || (a as Record<string, unknown>).createdAt || '';
      const bDate = (b as Record<string, unknown>).lastVisit || (b as Record<string, unknown>).createdAt || '';
      return String(bDate).localeCompare(String(aDate));
    });

    return (limit ? sorted.slice(0, limit) : sorted) as T[];
  }

  private extractTableName(sql: string): string {
    const match = sql.match(/(?:from|into|update|table)\s+(\w+)/i);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  private getTable(name: string): Record<string, unknown>[] {
    switch (name) {
      case 'history': return this.data.history;
      case 'bookmarks': return this.data.bookmarks;
      case 'bookmark_folders': return this.data.bookmark_folders;
      case 'downloads': return this.data.downloads;
      case 'security_stats': return this.data.security_stats;
      case 'tabs_state': return this.data.tabs_state;
      default: return [];
    }
  }

  private handleInsert(tableName: string, params: unknown[]): RunResult {
    const table = this.getTable(tableName);
    // Create object from params (this is simplified - actual SQL parsing would be more complex)
    const row: Record<string, unknown> = {};
    if (params.length > 0) {
      // Assume params are in order: id, url, title, etc.
      row.id = params[0];
      if (params[1]) row.url = params[1];
      if (params[2]) row.title = params[2];
      if (params[3]) row.favicon = params[3];
    }
    table.push(row);
    this.save();
    return { changes: 1, lastInsertRowid: table.length };
  }

  private handleUpdate(tableName: string, _sql: string, params: unknown[]): RunResult {
    const table = this.getTable(tableName);
    const id = params[params.length - 1]; // ID is usually the last param in WHERE clause
    const index = table.findIndex(row => (row as Record<string, unknown>).id === id);

    if (index !== -1) {
      // Update the row with new values
      Object.assign(table[index], params[0]);
      this.save();
      return { changes: 1, lastInsertRowid: 0 };
    }
    return { changes: 0, lastInsertRowid: 0 };
  }

  private handleDelete(tableName: string, _sql: string, params: unknown[]): RunResult {
    const table = this.getTable(tableName);
    const id = params[0];
    const index = table.findIndex(row => (row as Record<string, unknown>).id === id);

    if (index !== -1) {
      table.splice(index, 1);
      this.save();
      return { changes: 1, lastInsertRowid: 0 };
    }
    return { changes: 0, lastInsertRowid: 0 };
  }

  // Direct data manipulation methods for services
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertHistory(entry: any): void {
    this.data.history.push(entry);
    this.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateHistory(id: string, updates: any): void {
    const index = this.data.history.findIndex(h => h.id === id);
    if (index !== -1) {
      Object.assign(this.data.history[index], updates);
      this.save();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertBookmark(bookmark: any): void {
    this.data.bookmarks.push(bookmark);
    this.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateBookmark(id: string, updates: any): void {
    const index = this.data.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      Object.assign(this.data.bookmarks[index], updates);
      this.save();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertFolder(folder: any): void {
    this.data.bookmark_folders.push(folder);
    this.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insertDownload(download: any): void {
    this.data.downloads.push(download);
    this.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateDownload(id: string, updates: any): void {
    const index = this.data.downloads.findIndex(d => d.id === id);
    if (index !== -1) {
      Object.assign(this.data.downloads[index], updates);
      this.save();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getHistory(limit?: number): any[] {
    const sorted = [...this.data.history].sort((a, b) => {
      const aDate = String(a.lastVisit || a.createdAt || '');
      const bDate = String(b.lastVisit || b.createdAt || '');
      return bDate.localeCompare(aDate);
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getBookmarks(): any[] {
    return this.data.bookmarks;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFolders(): any[] {
    return this.data.bookmark_folders;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDownloads(): any[] {
    return [...this.data.downloads].sort((a, b) => {
      const aDate = String(a.createdAt || '');
      const bDate = String(b.createdAt || '');
      return bDate.localeCompare(aDate);
    });
  }

  deleteHistory(id: string): boolean {
    const index = this.data.history.findIndex(h => h.id === id);
    if (index !== -1) {
      this.data.history.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  deleteBookmark(id: string): boolean {
    const index = this.data.bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      this.data.bookmarks.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  deleteDownload(id: string): boolean {
    const index = this.data.downloads.findIndex(d => d.id === id);
    if (index !== -1) {
      this.data.downloads.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  clearHistory(): void {
    this.data.history = [];
    this.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchHistory(query: string): any[] {
    const lowerQuery = query.toLowerCase();
    return this.data.history.filter(h =>
      String(h.url || '').toLowerCase().includes(lowerQuery) ||
      String(h.title || '').toLowerCase().includes(lowerQuery)
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findHistoryByUrl(url: string): any | undefined {
    return this.data.history.find(h => h.url === url);
  }

  // Transaction support (no-op for JSON storage)
  transaction<T>(fn: () => T): T {
    return fn();
  }

  close(): void {
    // Save any pending changes
    this.save();
  }
}
