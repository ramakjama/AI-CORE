import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  History,
  Bookmark,
  Settings,
  Shield,
  Download,
  Sparkles,
  FileText,
  Terminal,
  Zap,
  Layout,
  Plus,
  ShieldCheck,
  Eye,
  Lock,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

interface CommandPaletteProps {
  onClose: () => void;
}

interface Command {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  category: 'ai' | 'navigation' | 'security' | 'tools' | 'settings';
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    addTab,
    toggleAdBlock,
    isAdBlockEnabled,
    toggleTrackingProtection,
    isTrackingProtectionEnabled,
    toggleHttpsOnly,
    isHttpsOnlyMode,
    runSecurityScan,
  } = useBrowserStore();

  const commands: Command[] = [
    {
      id: 'new-tab',
      icon: Plus,
      title: 'New Tab',
      description: 'Open a new browser tab',
      category: 'navigation',
      action: () => { addTab(); onClose(); },
      shortcut: 'Ctrl+T',
    },
    {
      id: 'ai-ask',
      icon: Sparkles,
      title: 'Ask Nova AI',
      description: 'Get intelligent assistance with AI',
      category: 'ai',
      action: () => onClose(),
      shortcut: 'Ctrl+J',
    },
    {
      id: 'security-scan',
      icon: ShieldCheck,
      title: 'Run Security Scan',
      description: 'Scan for threats with AI-Defender',
      category: 'security',
      action: () => { runSecurityScan(); onClose(); },
    },
    {
      id: 'toggle-adblock',
      icon: Shield,
      title: isAdBlockEnabled ? 'Disable Ad Blocker' : 'Enable Ad Blocker',
      description: 'Block ads and trackers',
      category: 'security',
      action: () => { toggleAdBlock(); onClose(); },
    },
    {
      id: 'toggle-tracking',
      icon: Eye,
      title: isTrackingProtectionEnabled ? 'Disable Tracking Protection' : 'Enable Tracking Protection',
      description: 'Block trackers and fingerprinting',
      category: 'security',
      action: () => { toggleTrackingProtection(); onClose(); },
    },
    {
      id: 'toggle-https',
      icon: Lock,
      title: isHttpsOnlyMode ? 'Disable HTTPS-Only' : 'Enable HTTPS-Only',
      description: 'Force secure connections',
      category: 'security',
      action: () => { toggleHttpsOnly(); onClose(); },
    },
    {
      id: 'history',
      icon: History,
      title: 'View History',
      description: 'Browse recently visited pages',
      category: 'navigation',
      action: () => onClose(),
      shortcut: 'Ctrl+H',
    },
    {
      id: 'bookmarks',
      icon: Bookmark,
      title: 'Bookmarks',
      description: 'View and manage bookmarks',
      category: 'navigation',
      action: () => onClose(),
      shortcut: 'Ctrl+B',
    },
    {
      id: 'downloads',
      icon: Download,
      title: 'Downloads',
      description: 'View downloaded files',
      category: 'navigation',
      action: () => onClose(),
    },
    {
      id: 'reader-mode',
      icon: FileText,
      title: 'Reader Mode',
      description: 'Read without distractions',
      category: 'tools',
      action: () => onClose(),
    },
    {
      id: 'dev-tools',
      icon: Terminal,
      title: 'Developer Tools',
      description: 'Open DevTools',
      category: 'tools',
      action: () => onClose(),
      shortcut: 'F12',
    },
    {
      id: 'performance',
      icon: Zap,
      title: 'Performance',
      description: 'View memory and CPU usage',
      category: 'tools',
      action: () => onClose(),
    },
    {
      id: 'pip',
      icon: Layout,
      title: 'Picture in Picture',
      description: 'Watch video in floating window',
      category: 'tools',
      action: () => onClose(),
    },
    {
      id: 'settings',
      icon: Settings,
      title: 'Settings',
      description: 'Adjust browser preferences',
      category: 'settings',
      action: () => onClose(),
    },
  ];

  const filteredCommands = commands.filter(
    cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const groupedCommands = {
    ai: filteredCommands.filter(c => c.category === 'ai'),
    security: filteredCommands.filter(c => c.category === 'security'),
    navigation: filteredCommands.filter(c => c.category === 'navigation'),
    tools: filteredCommands.filter(c => c.category === 'tools'),
    settings: filteredCommands.filter(c => c.category === 'settings'),
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredCommands[selectedIndex]?.action();
    }
  };

  const categoryLabels: Record<string, string> = {
    ai: 'AI Assistant',
    security: 'Security',
    navigation: 'Navigation',
    tools: 'Tools',
    settings: 'Settings',
  };

  let globalIndex = -1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh] z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-xl bg-nova-white rounded-2xl shadow-tech-hover border border-black/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-black/5">
          <Search className="w-5 h-5 text-nova-graphite" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-nova-black placeholder-nova-graphite outline-none text-[15px]"
          />
          <kbd className="px-2 py-1 bg-nova-pearl rounded text-[11px] text-nova-graphite border border-black/10 font-medium">ESC</kbd>
        </div>

        {/* Commands list */}
        <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
          {Object.entries(groupedCommands).map(([category, cmds]) => {
            if (cmds.length === 0) return null;

            return (
              <div key={category} className="mb-3">
                <p className="text-[10px] text-nova-graphite uppercase tracking-wider px-3 py-2 font-medium">
                  {categoryLabels[category]}
                </p>
                {cmds.map(cmd => {
                  globalIndex++;
                  const isSelected = globalIndex === selectedIndex;

                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={cmd.action}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-nova-black text-white'
                          : 'hover:bg-nova-pearl text-nova-charcoal'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-white/10' : 'bg-nova-pearl'
                        }`}
                      >
                        <cmd.icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-nova-graphite'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`text-[13px] ${isSelected ? 'text-white font-medium' : 'text-nova-charcoal'}`}>
                          {cmd.title}
                        </p>
                        <p className={`text-[11px] ${isSelected ? 'text-white/60' : 'text-nova-graphite'}`}>
                          {cmd.description}
                        </p>
                      </div>
                      {cmd.shortcut && (
                        <kbd className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isSelected ? 'bg-white/10 text-white/60' : 'bg-nova-pearl text-nova-graphite'
                        }`}>
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="text-center py-12">
              <p className="text-nova-graphite text-[13px]">No commands found</p>
              <button
                type="button"
                className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-nova-black rounded-lg text-white text-[13px] font-medium"
              >
                <Sparkles className="w-4 h-4" />
                Ask Nova AI
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/5 bg-nova-pearl/50">
          <div className="flex items-center gap-4 text-[11px] text-nova-graphite">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-black/10 font-medium">↑↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-black/10 font-medium">↵</kbd>
              <span>select</span>
            </span>
          </div>
          <span className="text-[10px] text-nova-steel font-medium">NOVA Browser</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
