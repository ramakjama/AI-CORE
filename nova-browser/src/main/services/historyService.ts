import * as crypto from 'crypto';
import { DatabaseService } from '../database/sqlite';

const uuidv4 = () => crypto.randomUUID();

// ============================================
// NOVA BROWSER - HISTORY SERVICE
// Real browsing history with persistent storage
// ============================================

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitCount: number;
  lastVisit: string;
  createdAt: string;
}

export class HistoryService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  addEntry(entry: { url: string; title: string; favicon?: string }): HistoryEntry {
    // Check if URL already exists
    const existing = this.db.findHistoryByUrl(entry.url) as HistoryEntry | undefined;

    if (existing) {
      // Update visit count and last visit time
      const updates = {
        visitCount: (existing.visitCount || 0) + 1,
        lastVisit: new Date().toISOString(),
        title: entry.title || existing.title,
        favicon: entry.favicon || existing.favicon,
      };
      this.db.updateHistory(existing.id, updates);
      return { ...existing, ...updates };
    }

    // Create new entry
    const newEntry: HistoryEntry = {
      id: uuidv4(),
      url: entry.url,
      title: entry.title || entry.url,
      favicon: entry.favicon,
      visitCount: 1,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.db.insertHistory(newEntry);
    return newEntry;
  }

  getHistory(limit?: number): HistoryEntry[] {
    return this.db.getHistory(limit) as HistoryEntry[];
  }

  search(query: string): HistoryEntry[] {
    return this.db.searchHistory(query) as HistoryEntry[];
  }

  deleteEntry(id: string): boolean {
    return this.db.deleteHistory(id);
  }

  clearHistory(): void {
    this.db.clearHistory();
  }

  getByDate(date: Date): HistoryEntry[] {
    const dateStr = date.toISOString().split('T')[0];
    const history = this.getHistory();
    return history.filter(entry => {
      const entryDate = new Date(entry.lastVisit).toISOString().split('T')[0];
      return entryDate === dateStr;
    });
  }

  getMostVisited(limit: number = 10): HistoryEntry[] {
    const history = this.getHistory();
    return history
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, limit);
  }
}
