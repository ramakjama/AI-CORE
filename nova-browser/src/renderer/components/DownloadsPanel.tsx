import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Download,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  FolderOpen,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  HardDrive,
} from 'lucide-react';

// ============================================
// NOVA BROWSER - DOWNLOADS PANEL
// Complete download management
// ============================================

interface DownloadItem {
  id: string;
  url: string;
  fileName: string;
  savePath?: string;
  totalBytes?: number;
  receivedBytes?: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  completedAt?: string;
  createdAt?: string;
}

interface DownloadsPanelProps {
  onClose: () => void;
}

export default function DownloadsPanel({ onClose }: DownloadsPanelProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadItem>>(new Map());

  useEffect(() => {
    loadDownloads();
    setupDownloadListeners();
  }, []);

  const loadDownloads = async () => {
    setIsLoading(true);
    try {
      if (window.nova?.downloads) {
        const items = await window.nova.downloads.getAll();
        setDownloads(items || []);
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDownloadListeners = () => {
    if (!window.nova?.downloads) return;

    window.nova.downloads.onStarted((download: any) => {
      setActiveDownloads(prev => {
        const updated = new Map(prev);
        updated.set(download.id, {
          ...download,
          status: 'downloading',
          progress: 0,
          createdAt: new Date().toISOString(),
        });
        return updated;
      });
    });

    window.nova.downloads.onProgress((progress: any) => {
      setActiveDownloads(prev => {
        const updated = new Map(prev);
        const existing = updated.get(progress.id);
        if (existing) {
          updated.set(progress.id, {
            ...existing,
            receivedBytes: progress.receivedBytes,
            progress: progress.progress,
          });
        }
        return updated;
      });
    });

    window.nova.downloads.onCompleted((result: any) => {
      setActiveDownloads(prev => {
        const updated = new Map(prev);
        updated.delete(result.id);
        return updated;
      });
      loadDownloads(); // Refresh the list
    });

    window.nova.downloads.onFailed((error: any) => {
      setActiveDownloads(prev => {
        const updated = new Map(prev);
        const existing = updated.get(error.id);
        if (existing) {
          updated.set(error.id, {
            ...existing,
            status: 'failed',
          });
        }
        return updated;
      });
    });
  };

  const handleOpenFile = async (path: string) => {
    try {
      if (window.nova?.downloads && path) {
        await window.nova.downloads.openFile(path);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleShowInFolder = async (path: string) => {
    try {
      if (window.nova?.downloads && path) {
        await window.nova.downloads.showInFolder(path);
      }
    } catch (error) {
      console.error('Failed to show in folder:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (window.nova?.downloads) {
        await window.nova.downloads.delete(id);
        setDownloads(prev => prev.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete download:', error);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '')) {
      return <Image className="w-5 h-5 text-nova-tech" />;
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext || '')) {
      return <Film className="w-5 h-5 text-nova-cyber" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext || '')) {
      return <Music className="w-5 h-5 text-nova-success" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
      return <Archive className="w-5 h-5 text-nova-warning" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-nova-danger" />;
    }
    return <File className="w-5 h-5 text-nova-graphite" />;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Combine active and completed downloads
  const allDownloads = [
    ...Array.from(activeDownloads.values()),
    ...downloads,
  ];

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
          <div className="w-10 h-10 rounded-xl bg-nova-cyber/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-nova-cyber" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-nova-black">Downloads</h3>
            <p className="text-[11px] text-nova-graphite">
              {activeDownloads.size} active, {downloads.length} completed
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Close downloads panel"
        >
          <X className="w-5 h-5 text-nova-graphite" />
        </button>
      </div>

      {/* Downloads List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-nova-cyber border-t-transparent rounded-full animate-spin" />
          </div>
        ) : allDownloads.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive className="w-12 h-12 text-nova-platinum mx-auto mb-3" />
            <p className="text-nova-graphite text-[13px]">No downloads yet</p>
            <p className="text-nova-steel text-[11px] mt-1">Your downloads will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allDownloads.map(download => (
              <motion.div
                key={download.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group p-4 bg-nova-pearl rounded-xl border border-black/5 hover:border-nova-tech/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-black/5 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(download.fileName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] text-nova-charcoal font-medium truncate flex-1">
                        {download.fileName}
                      </p>
                      {download.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-nova-success flex-shrink-0" />
                      )}
                      {download.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-nova-danger flex-shrink-0" />
                      )}
                      {download.status === 'downloading' && (
                        <Loader2 className="w-4 h-4 text-nova-cyber animate-spin flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-nova-graphite">
                        {formatBytes(download.totalBytes)}
                      </span>
                      {download.completedAt && (
                        <>
                          <span className="text-[11px] text-nova-steel">•</span>
                          <span className="text-[11px] text-nova-steel">
                            {formatDate(download.completedAt)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress bar for active downloads */}
                    {download.status === 'downloading' && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-nova-tech to-nova-cyber"
                            initial={{ width: 0 }}
                            animate={{ width: `${(download.progress || 0) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-nova-graphite mt-1">
                          {Math.round((download.progress || 0) * 100)}% • {formatBytes(download.receivedBytes)} of {formatBytes(download.totalBytes)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {download.status === 'completed' && download.savePath && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => handleOpenFile(download.savePath!)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-nova-black text-white rounded-lg text-[11px] font-medium hover:bg-nova-charcoal transition-colors"
                    >
                      Open File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShowInFolder(download.savePath!)}
                      className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                      title="Show in folder"
                    >
                      <FolderOpen className="w-4 h-4 text-nova-graphite" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(download.id)}
                      className="p-2 hover:bg-nova-danger/10 rounded-lg transition-colors"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4 text-nova-danger" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 bg-nova-pearl/50">
        <div className="flex items-center justify-between text-[11px] text-nova-graphite">
          <span>Nova Browser Downloads</span>
          <span>AI Innovation Technologies</span>
        </div>
      </div>
    </motion.div>
  );
}
