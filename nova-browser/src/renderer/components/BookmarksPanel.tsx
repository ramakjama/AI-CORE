import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Bookmark,
  Search,
  Folder,
  FolderPlus,
  Star,
  Globe,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

// ============================================
// NOVA BROWSER - BOOKMARKS PANEL
// Full bookmark management with folders
// ============================================

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  folderId?: string;
}

interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  isExpanded?: boolean;
}

interface BookmarksPanelProps {
  onClose: () => void;
}

export default function BookmarksPanel({ onClose }: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['bookmarks-bar']));
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const { tabs, activeTab, addTab } = useBrowserStore();

  const currentTab = tabs.find(t => t.id === activeTab);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      if (window.nova?.bookmarks) {
        const items = await window.nova.bookmarks.getAll();
        setBookmarks(items || []);

        // Set default folders
        setFolders([
          { id: 'bookmarks-bar', name: 'Bookmarks Bar', isExpanded: true },
          { id: 'other-bookmarks', name: 'Other Bookmarks', isExpanded: false },
        ]);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBookmark = async () => {
    if (!currentTab || currentTab.url === 'nova://newtab') return;

    try {
      if (window.nova?.bookmarks) {
        const bookmark = await window.nova.bookmarks.add({
          url: currentTab.url,
          title: currentTab.title || currentTab.url,
          favicon: currentTab.favicon,
          folderId: 'bookmarks-bar',
        });
        setBookmarks(prev => [...prev, bookmark]);
      }
    } catch (error) {
      console.error('Failed to add bookmark:', error);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      if (window.nova?.bookmarks) {
        await window.nova.bookmarks.delete(id);
        setBookmarks(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      if (window.nova?.bookmarks) {
        const folder = await window.nova.bookmarks.createFolder(newFolderName);
        setFolders(prev => [...prev, folder]);
        setNewFolderName('');
        setShowNewFolderInput(false);
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleOpenUrl = (url: string) => {
    addTab(url);
    onClose();
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const updated = new Set(prev);
      if (updated.has(folderId)) {
        updated.delete(folderId);
      } else {
        updated.add(folderId);
      }
      return updated;
    });
  };

  const getBookmarksInFolder = (folderId: string) => {
    return bookmarks.filter(b => (b.folderId || 'bookmarks-bar') === folderId);
  };

  const filteredBookmarks = searchQuery
    ? bookmarks.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const isCurrentPageBookmarked = currentTab && bookmarks.some(b => b.url === currentTab.url);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[400px] bg-nova-white/95 backdrop-blur-xl border-l border-black/10 flex flex-col shadow-tech-hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nova-warning/10 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-nova-warning" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-nova-black">Bookmarks</h3>
            <p className="text-[11px] text-nova-graphite">{bookmarks.length} saved</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Close bookmarks panel"
        >
          <X className="w-5 h-5 text-nova-graphite" />
        </button>
      </div>

      {/* Add Current Page */}
      {currentTab && currentTab.url !== 'nova://newtab' && (
        <div className="p-4 border-b border-black/5">
          <button
            type="button"
            onClick={handleAddBookmark}
            disabled={isCurrentPageBookmarked}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              isCurrentPageBookmarked
                ? 'bg-nova-warning/10 text-nova-warning cursor-default'
                : 'bg-nova-pearl hover:bg-nova-silver/30 text-nova-charcoal'
            }`}
          >
            <Star className={`w-5 h-5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`} />
            <div className="flex-1 text-left">
              <p className="text-[13px] font-medium truncate">
                {isCurrentPageBookmarked ? 'Page Bookmarked' : 'Bookmark This Page'}
              </p>
              <p className="text-[11px] text-nova-graphite truncate">
                {currentTab.title || currentTab.url}
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Search */}
      <div className="p-4 border-b border-black/5">
        <div className="flex items-center gap-2 bg-nova-pearl rounded-xl px-4 py-2.5 border border-black/5 focus-within:border-nova-tech/30 transition-all">
          <Search className="w-4 h-4 text-nova-graphite" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="flex-1 bg-transparent text-nova-black placeholder-nova-graphite outline-none text-[13px]"
          />
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-nova-warning border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchQuery && filteredBookmarks ? (
          // Search results
          <div className="space-y-1">
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-nova-graphite text-[13px]">No bookmarks found</p>
              </div>
            ) : (
              filteredBookmarks.map(bookmark => (
                <BookmarkRow
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleOpenUrl}
                  onDelete={handleDeleteBookmark}
                />
              ))
            )}
          </div>
        ) : (
          // Folder view
          <div className="space-y-2">
            {folders.map(folder => (
              <div key={folder.id}>
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-nova-pearl rounded-lg transition-colors"
                >
                  {expandedFolders.has(folder.id) ? (
                    <ChevronDown className="w-4 h-4 text-nova-graphite" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-nova-graphite" />
                  )}
                  <Folder className="w-4 h-4 text-nova-warning" />
                  <span className="text-[13px] text-nova-charcoal font-medium">
                    {folder.name}
                  </span>
                  <span className="text-[11px] text-nova-graphite ml-auto">
                    {getBookmarksInFolder(folder.id).length}
                  </span>
                </button>

                {expandedFolders.has(folder.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-6 space-y-1 mt-1"
                  >
                    {getBookmarksInFolder(folder.id).map(bookmark => (
                      <BookmarkRow
                        key={bookmark.id}
                        bookmark={bookmark}
                        onOpen={handleOpenUrl}
                        onDelete={handleDeleteBookmark}
                      />
                    ))}
                    {getBookmarksInFolder(folder.id).length === 0 && (
                      <p className="text-[11px] text-nova-graphite py-2 pl-6">
                        No bookmarks in this folder
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            ))}

            {/* New Folder Button */}
            {showNewFolderInput ? (
              <div className="flex items-center gap-2 p-2">
                <FolderPlus className="w-4 h-4 text-nova-graphite" />
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Folder name..."
                  className="flex-1 bg-nova-pearl rounded px-2 py-1 text-[12px] outline-none border border-black/5 focus:border-nova-tech/30"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="p-1 hover:bg-nova-success/10 rounded"
                  title="Create folder"
                >
                  <Plus className="w-4 h-4 text-nova-success" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewFolderInput(false);
                    setNewFolderName('');
                  }}
                  className="p-1 hover:bg-nova-danger/10 rounded"
                  title="Cancel"
                >
                  <X className="w-4 h-4 text-nova-danger" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewFolderInput(true)}
                className="w-full flex items-center gap-2 p-2 text-nova-graphite hover:text-nova-charcoal hover:bg-nova-pearl rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="text-[12px]">New Folder</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 bg-nova-pearl/50">
        <div className="flex items-center justify-between text-[11px] text-nova-graphite">
          <span>Nova Browser Bookmarks</span>
          <span>AI Innovation Technologies</span>
        </div>
      </div>
    </motion.div>
  );
}

interface BookmarkRowProps {
  bookmark: BookmarkItem;
  onOpen: (url: string) => void;
  onDelete: (id: string) => void;
}

function BookmarkRow({ bookmark, onOpen, onDelete }: BookmarkRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-3 p-2 hover:bg-nova-pearl rounded-lg transition-all cursor-pointer"
      onClick={() => onOpen(bookmark.url)}
    >
      <div className="w-6 h-6 rounded bg-white border border-black/5 flex items-center justify-center flex-shrink-0">
        {bookmark.favicon ? (
          <img src={bookmark.favicon} alt="" className="w-4 h-4" />
        ) : (
          <Globe className="w-3 h-3 text-nova-graphite" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-nova-charcoal truncate">
          {bookmark.title}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(bookmark.id);
          }}
          className="p-1 hover:bg-nova-danger/10 rounded transition-colors"
          title="Delete bookmark"
        >
          <Trash2 className="w-3 h-3 text-nova-danger" />
        </button>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onOpen(bookmark.url);
          }}
          className="p-1 hover:bg-nova-tech/10 rounded transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-3 h-3 text-nova-tech" />
        </button>
      </div>
    </motion.div>
  );
}
