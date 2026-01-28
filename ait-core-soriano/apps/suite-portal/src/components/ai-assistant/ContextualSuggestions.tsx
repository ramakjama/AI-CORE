"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Globe, Sparkles, Lightbulb } from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useAIAssistant } from '@/hooks/use-ai-assistant';

interface Suggestion {
  id: string;
  label: string;
  icon: React.ElementType;
  command: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    icon: FileText,
    command: '/summarize',
  },
  {
    id: 'translate',
    label: 'Translate',
    icon: Globe,
    command: '/translate',
  },
  {
    id: 'improve',
    label: 'Improve',
    icon: Sparkles,
    command: '/improve',
  },
  {
    id: 'explain',
    label: 'Explain',
    icon: Lightbulb,
    command: '/explain',
  },
];

interface Position {
  top: number;
  left: number;
}

export function ContextualSuggestions() {
  const { setAIAssistantOpen } = useAppStore();
  const { sendMessage } = useAIAssistant();

  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<Position | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);

      // Get selection position
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY - 60, // Position above selection
          left: rect.left + window.scrollX + rect.width / 2, // Center horizontally
        });
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
      setSelectedText('');
      setPosition(null);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      timeoutId = setTimeout(handleSelection, 100);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't hide if clicking on suggestions
      const target = e.target as HTMLElement;
      if (target.closest('[data-contextual-suggestions]')) {
        return;
      }

      // Hide suggestions on click outside
      if (isVisible) {
        setIsVisible(false);
        setSelectedText('');
        setPosition(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Hide on Escape
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
        setSelectedText('');
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSelection, isVisible]);

  const handleSuggestionClick = async (command: string) => {
    if (!selectedText) return;

    // Hide suggestions
    setIsVisible(false);

    // Prepare prompt with selected text
    const prompt = `${command} ${selectedText}`;

    // Open AI assistant and send command
    setAIAssistantOpen(true);
    await sendMessage(prompt);

    // Clear selection
    window.getSelection()?.removeAllRanges();
    setSelectedText('');
    setPosition(null);
  };

  if (!isVisible || !position || !selectedText) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-contextual-suggestions
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl p-2 flex items-center gap-1"
      >
        {SUGGESTIONS.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionClick(suggestion.command)}
              className="group relative flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-md transition-colors"
              title={suggestion.label}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{suggestion.label}</span>

              {/* Tooltip for mobile */}
              <span className="sm:hidden absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {suggestion.label}
              </span>
            </button>
          );
        })}

        {/* Arrow pointing to selection */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-900" />
      </motion.div>
    </AnimatePresence>
  );
}
