'use client';

import type { TypingIndicatorProps } from '@/types/chat';

export function TypingIndicator({ show, message = 'Pensando...' }: TypingIndicatorProps) {
  if (!show) return null;

  return (
    <div className="flex w-full mb-4 justify-start">
      <div className="flex gap-3 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
            AI
          </div>
        </div>

        {/* Typing Animation */}
        <div className="flex flex-col gap-1">
          <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {message}
              </span>
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
