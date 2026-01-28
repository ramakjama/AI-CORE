import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  History,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  Globe,
  Calendar,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

// ============================================
// NOVA BROWSER - HISTORY PANEL
// Full browsing history with search
// ============================================

interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitCount: number;
  lastVisit: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { addTab } = useBrowserStore();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      if (window.nova?.history) {
        const entries = await window.nova.history.getAll(100);
        setHistory(entries || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadHistory();
      return;
    }

    setIsLoading(true);
    try {
      if (window.nova?.history) {
        const results = await window.nova.history.search(searchQuery);
        setHistory(results || []);
      }
    } catch (error) {
      console.error('Failed to search history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (window.nova?.history) {
        await window.nova.history.delete(id);
        setHistory(prev => prev.filter(entry => entry.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      if (window.nova?.history) {
        await window.nova.history.clear();
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const handleOpenUrl = (url: string) => {
    addTab(url);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, entry) => {
    const date = formatDate(entry.lastVisit);
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, HistoryEntry[]>);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[450px] bg-nova-white/95 backdrop-blur-xl border-l border-black/10 flex flex-col shadow-tech-hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-nova-tech/10 flex items-center justify-center">
            <History className="w-5 h-5 text-nova-tech" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-nova-black">History</h3>
            <p className="text-[11px] text-nova-graphite">{history.length} entries</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Close history panel"
        >
          <X className="w-5 h-5 text-nova-graphite" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-black/5">
        <div className="flex items-center gap-2 bg-nova-pearl rounded-xl px-4 py-2.5 border border-black/5 focus-within:border-nova-tech/30 transition-all">
          <Search className="w-4 h-4 text-nova-graphite" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search history..."
            className="flex-1 bg-transparent text-nova-black placeholder-nova-graphite outline-none text-[13px]"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-black/5">
        <span className="text-[11px] text-nova-graphite">
          {Object.keys(groupedHistory).length} groups
        </span>
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1 px-2 py-1 text-[11px] text-nova-danger hover:bg-nova-danger/10 rounded-lg transition-colors"
          title="Clear all history"
        >
          <Trash2 className="w-3 h-3" />
          Clear All
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-nova-tech border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-nova-platinum mx-auto mb-3" />
            <p className="text-nova-graphite text-[13px]">No history found</p>
            <p className="text-nova-steel text-[11px] mt-1">Start browsing to see your history here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, entries]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-nova-graphite" />
                  <span className="text-[11px] text-nova-graphite font-medium uppercase tracking-wider">
                    {date}
                  </span>
                </div>

                <div className="space-y-1">
                  {entries.map(entry => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group flex items-center gap-3 p-3 hover:bg-nova-pearl rounded-xl transition-all cursor-pointer"
                      onClick={() => handleOpenUrl(entry.url)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-black/5 flex items-center justify-center flex-shrink-0">
                        {entry.favicon ? (
                          <img src={entry.favicon} alt="" className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4 text-nova-graphite" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-nova-charcoal font-medium truncate">
                          {entry.title || entry.url}
                        </p>
                        <p className="text-[11px] text-nova-graphite truncate">
                          {entry.url}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-nova-steel">
                          {formatTime(entry.lastVisit)}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="p-1.5 hover:bg-nova-danger/10 rounded-lg transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-nova-danger" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenUrl(entry.url);
                          }}
                          className="p-1.5 hover:bg-nova-tech/10 rounded-lg transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-nova-tech" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 bg-nova-pearl/50">
        <div className="flex items-center justify-between text-[11px] text-nova-graphite">
          <span>Nova Browser History</span>
          <span>AI Innovation Technologies</span>
        </div>
      </div>
    </motion.div>
  );
}
