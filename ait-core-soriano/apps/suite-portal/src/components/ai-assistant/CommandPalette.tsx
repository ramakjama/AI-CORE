"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  FileText,
  Globe,
  Sparkles,
  Lightbulb,
  Palette,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { cn } from '@/lib/utils';

interface AICommand {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  command: string;
  shortcut?: string;
  category: 'writing' | 'content' | 'language' | 'analysis';
}

const AI_COMMANDS: AICommand[] = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Summarize the current document or selected text',
    icon: FileText,
    command: '/summarize',
    shortcut: '⌘S',
    category: 'analysis',
  },
  {
    id: 'translate',
    name: 'Translate',
    description: 'Translate text to Spanish or English',
    icon: Globe,
    command: '/translate',
    shortcut: '⌘T',
    category: 'language',
  },
  {
    id: 'improve',
    name: 'Improve Writing',
    description: 'Improve grammar, style, and clarity',
    icon: Sparkles,
    command: '/improve',
    shortcut: '⌘I',
    category: 'writing',
  },
  {
    id: 'explain',
    name: 'Explain',
    description: 'Explain concepts in simple terms',
    icon: Lightbulb,
    command: '/explain',
    shortcut: '⌘E',
    category: 'analysis',
  },
  {
    id: 'generate',
    name: 'Generate Content',
    description: 'Generate creative content or ideas',
    icon: Palette,
    command: '/generate',
    shortcut: '⌘G',
    category: 'content',
  },
];

export function CommandPalette() {
  const { setAIAssistantOpen } = useAppStore();
  const { sendMessage } = useAIAssistant();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = AI_COMMANDS.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.command.toLowerCase().includes(search.toLowerCase())
  );

  // Open with Cmd+J or Ctrl+J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
        setSelectedIndex(0);
      }

      // Navigate with arrow keys
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredCommands.length - 1 : prev - 1
        );
      }

      // Execute with Enter
      if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Handle command shortcuts
  useEffect(() => {
    const handleCommandShortcut = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;

      const command = AI_COMMANDS.find((cmd) => {
        const shortcutKey = cmd.shortcut?.split('⌘')[1]?.toLowerCase();
        return shortcutKey && e.key.toLowerCase() === shortcutKey;
      });

      if (command) {
        e.preventDefault();
        executeCommand(command);
      }
    };

    window.addEventListener('keydown', handleCommandShortcut);
    return () => window.removeEventListener('keydown', handleCommandShortcut);
  }, []);

  const executeCommand = useCallback(
    async (command: AICommand) => {
      setIsOpen(false);
      setSearch('');
      setSelectedIndex(0);

      // Get selected text if available
      const selectedText = window.getSelection()?.toString();
      const prompt = selectedText
        ? `${command.command} ${selectedText}`
        : command.command;

      // Open AI assistant and send command
      setAIAssistantOpen(true);
      await sendMessage(prompt);
    },
    [sendMessage, setAIAssistantOpen]
  );

  const handleCommandClick = (command: AICommand) => {
    executeCommand(command);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-[15vh]"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <Command className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search AI commands..."
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              autoFocus
            />
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => {
                  const Icon = command.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      onClick={() => handleCommandClick(command)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {command.name}
                          </span>
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
                            {command.command}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {command.description}
                        </p>
                      </div>

                      {command.shortcut && (
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                          {command.shortcut}
                        </kbd>
                      )}

                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
                    ↑↓
                  </kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
                    ↵
                  </kbd>
                  Select
                </span>
              </div>
              <span>
                Tip: Select text before using commands for context
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
