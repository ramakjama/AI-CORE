'use client';

import { useState } from 'react';
import type { MessageBubbleProps, MessageFeedback } from '@/types/chat';
import { Copy, ThumbsUp, ThumbsDown, RefreshCw, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function MessageBubble({
  message,
  isStreaming = false,
  onCopy,
  onFeedback,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(
    message.metadata?.feedback?.rating || null
  );

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    const newFeedback: MessageFeedback = {
      rating,
      createdAt: new Date(),
    };
    setFeedback(rating);
    onFeedback?.(newFeedback);
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex gap-3 max-w-[80%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
              AI
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            } ${
              isStreaming ? 'animate-pulse' : ''
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Timestamp and Actions */}
          <div
            className={`flex items-center gap-2 px-2 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(new Date(message.timestamp))}
            </span>

            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-1">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copiar"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-500" />
                  )}
                </button>

                {/* Feedback Buttons */}
                <button
                  onClick={() => handleFeedback('positive')}
                  className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${
                    feedback === 'positive' ? 'text-green-500' : 'text-gray-500'
                  }`}
                  title="Me gusta"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>

                <button
                  onClick={() => handleFeedback('negative')}
                  className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${
                    feedback === 'negative' ? 'text-red-500' : 'text-gray-500'
                  }`}
                  title="No me gusta"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {/* Regenerate Button */}
                {onRegenerate && (
                  <button
                    onClick={() => onRegenerate()}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Regenerar respuesta"
                  >
                    <RefreshCw className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            )}

            {message.status === 'error' && (
              <span className="text-xs text-red-500">Error al enviar</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
