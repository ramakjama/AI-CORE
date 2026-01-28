'use client';

import { useRef, useEffect, useState } from 'react';
import type { ChatInterfaceProps, QuickAction } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { QuickActions } from './QuickActions';
import { useChat } from '@/hooks/chat';
import {
  Send,
  Minimize2,
  PlusCircle,
  Settings,
  Paperclip,
  Bot,
} from 'lucide-react';

const defaultQuickActions: QuickAction[] = [
  {
    id: '1',
    label: '¿Cómo emitir una póliza de auto?',
    prompt: '¿Cómo puedo emitir una nueva póliza de seguro de auto en el sistema?',
    icon: '🚗',
    category: 'Pólizas',
  },
  {
    id: '2',
    label: '¿Qué coberturas tiene Occident Hogar?',
    prompt: '¿Cuáles son las coberturas del seguro Occident Hogar y qué incluyen?',
    icon: '🏠',
    category: 'Productos',
  },
  {
    id: '3',
    label: '¿Cómo gestionar un siniestro?',
    prompt: '¿Cuál es el procedimiento para gestionar un siniestro paso a paso?',
    icon: '📋',
    category: 'Siniestros',
  },
  {
    id: '4',
    label: '¿Cómo funciona el sistema SORIS?',
    prompt: '¿Puedes explicarme las funcionalidades principales del sistema SORIS?',
    icon: '💼',
    category: 'Sistema',
  },
];

export function ChatInterface({
  conversationId,
  context,
  onMinimize,
  onNewConversation,
  showHeader = true,
  showQuickActions = true,
  className = '',
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentConversation,
    isStreaming,
    error,
    sendMessage,
    createConversation,
    submitFeedback,
    regenerateMessage,
  } = useChat({
    conversationId,
    userId: 'current-user-id',
    companyId: 'current-company-id',
    context,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, isStreaming]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setCharCount(value.length);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || isStreaming) return;

    const message = inputValue.trim();
    setInputValue('');
    setCharCount(0);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    setInputValue(action.prompt);
    await sendMessage(action.prompt);
  };

  const handleNewConversation = async () => {
    await createConversation();
    setInputValue('');
    onNewConversation?.();
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Asistente IA Soriano
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isStreaming ? 'Escribiendo...' : 'Disponible'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNewConversation && (
              <button
                onClick={handleNewConversation}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Nueva conversación"
              >
                <PlusCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Minimizar"
              >
                <Minimize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4"
      >
        {!hasMessages && showQuickActions && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¿En qué puedo ayudarte?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
              Pregúntame sobre seguros, productos Occident, o cómo usar el ERP
            </p>
            <QuickActions actions={defaultQuickActions} onActionClick={handleQuickAction} />
          </div>
        )}

        {hasMessages && (
          <div className="space-y-4">
            {currentConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={message.status === 'streaming'}
                onFeedback={(feedback) => submitFeedback(message.id, feedback)}
                onRegenerate={() => regenerateMessage(message.id)}
              />
            ))}

            {isStreaming && <TypingIndicator show={true} />}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors self-end mb-2"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntame sobre seguros, productos Occident, o cómo usar el ERP..."
                className="w-full px-4 py-3 pr-12 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={1}
                disabled={isStreaming}
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />

              {charCount > 0 && (
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {charCount}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isStreaming}
              className="flex-shrink-0 p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors self-end"
              title="Enviar mensaje"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <p>
              Presiona <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd>{' '}
              para enviar, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Shift+Enter</kbd>{' '}
              para nueva línea
            </p>
          </div>
        </form>

        {/* Disclaimer */}
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            La IA puede cometer errores. Verifica información crítica antes de actuar.
          </p>
        </div>
      </div>
    </div>
  );
}
