import * as crypto from 'crypto';
import { DatabaseService } from '../database/sqlite';

const uuidv4 = () => crypto.randomUUID();

// ============================================
// NOVA BROWSER - BOOKMARKS SERVICE
// Full bookmark management with folders
// ============================================

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folderId?: string;
  position: number;
  createdAt: string;
}

export interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  position: number;
  createdAt: string;
  children?: (Bookmark | BookmarkFolder)[];
}

export class BookmarksService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  addBookmark(bookmark: { url: string; title: string; favicon?: string; folderId?: string }): Bookmark {
    const bookmarks = this.db.getBookmarks();
    const newBookmark: Bookmark = {
      id: uuidv4(),
      url: bookmark.url,
      title: bookmark.title || bookmark.url,
      favicon: bookmark.favicon,
      folderId: bookmark.folderId || 'bookmarks-bar',
      position: bookmarks.length,
      createdAt: new Date().toISOString(),
    };

    this.db.insertBookmark(newBookmark);
    return newBookmark;
  }

  getAllBookmarks(): Bookmark[] {
    return this.db.getBookmarks() as Bookmark[];
  }

  getBookmarksByFolder(folderId: string): Bookmark[] {
    const bookmarks = this.getAllBookmarks();
    return bookmarks.filter(b => b.folderId === folderId);
  }

  updateBookmark(id: string, data: Partial<{ title: string; url: string; folderId: string }>): Bookmark | null {
    const bookmarks = this.getAllBookmarks();
    const bookmark = bookmarks.find(b => b.id === id);

    if (bookmark) {
      this.db.updateBookmark(id, data);
      return { ...bookmark, ...data };
    }

    return null;
  }

  deleteBookmark(id: string): boolean {
    return this.db.deleteBookmark(id);
  }

  createFolder(name: string, parentId?: string): BookmarkFolder {
    const folders = this.db.getFolders();
    const newFolder: BookmarkFolder = {
      id: uuidv4(),
      name,
      parentId,
      position: folders.length,
      createdAt: new Date().toISOString(),
    };

    this.db.insertFolder(newFolder);
    return newFolder;
  }

  getAllFolders(): BookmarkFolder[] {
    return this.db.getFolders() as BookmarkFolder[];
  }

  getBookmarkTree(): BookmarkFolder[] {
    const folders = this.getAllFolders();
    const bookmarks = this.getAllBookmarks();

    // Build tree structure
    const rootFolders = folders.filter(f => !f.parentId);

    const buildTree = (folder: BookmarkFolder): BookmarkFolder => {
      const children: (Bookmark | BookmarkFolder)[] = [];

      // Add child folders
      folders
        .filter(f => f.parentId === folder.id)
        .forEach(childFolder => {
          children.push(buildTree(childFolder));
        });

      // Add bookmarks in this folder
      bookmarks
        .filter(b => b.folderId === folder.id)
        .forEach(bookmark => {
          children.push(bookmark);
        });

      return { ...folder, children };
    };

    return rootFolders.map(buildTree);
  }

  searchBookmarks(query: string): Bookmark[] {
    const lowerQuery = query.toLowerCase();
    const bookmarks = this.getAllBookmarks();
    return bookmarks.filter(b =>
      b.title.toLowerCase().includes(lowerQuery) ||
      b.url.toLowerCase().includes(lowerQuery)
    );
  }

  moveBookmark(id: string, targetFolderId: string): boolean {
    const bookmark = this.getAllBookmarks().find(b => b.id === id);
    if (bookmark) {
      this.db.updateBookmark(id, { folderId: targetFolderId });
      return true;
    }
    return false;
  }
}
