"use client";

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Minimize2,
  Maximize2,
  Send,
  Trash2,
  Sparkles,
  Loader2,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useAIAssistant } from '@/hooks/use-ai-assistant';
import { useAIAssistantStore } from '@/store/ai-assistant.store';
import { cn } from '@/lib/utils';

export function AIAssistantPanel() {
  const { isAIAssistantOpen, setAIAssistantOpen } = useAppStore();
  const { resetUnreadCount } = useAIAssistantStore();
  const {
    messages,
    sendMessage,
    isTyping,
    clearConversation,
    suggestions,
    createNewConversation,
  } = useAIAssistant();

  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Reset unread count when panel opens
  useEffect(() => {
    if (isAIAssistantOpen) {
      resetUnreadCount();
    }
  }, [isAIAssistantOpen, resetUnreadCount]);

  // Focus input when panel opens
  useEffect(() => {
    if (isAIAssistantOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isAIAssistantOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleSuggestionClick = async (prompt: string) => {
    if (isTyping) return;
    await sendMessage(prompt);
  };

  if (!isAIAssistantOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed right-0 top-0 h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 flex flex-col',
          isMinimized ? 'w-80' : 'w-[400px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={createNewConversation}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setAIAssistantOpen(false)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Welcome to AI Assistant
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
                    I'm here to help you with documents, translations, explanations, and
                    more. Try one of the suggestions below!
                  </p>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion.prompt)}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                      >
                        {suggestion.icon && <span>{suggestion.icon}</span>}
                        <span>{suggestion.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5',
                          message.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        )}
                      >
                        {message.isTyping ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">
                              {message.content || 'Thinking...'}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                        <p
                          className={cn(
                            'text-xs mt-1',
                            message.role === 'user'
                              ? 'text-purple-100'
                              : 'text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Show suggestions when there are messages */}
            {messages.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion.prompt)}
                      disabled={isTyping}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion.icon && <span className="text-sm">{suggestion.icon}</span>}
                      <span>{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTyping ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  disabled={isTyping}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear conversation</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI Assistant
              <br />
              Minimized
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
