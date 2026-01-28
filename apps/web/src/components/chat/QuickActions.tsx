'use client';

import type { QuickActionsProps } from '@/types/chat';
import { Zap } from 'lucide-react';

export function QuickActions({
  actions,
  onActionClick,
  columns = 2,
}: QuickActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-purple-500" />
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Acciones rápidas
        </h3>
      </div>

      <div
        className={`grid gap-2`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            className="group relative p-4 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              {action.icon && (
                <span className="text-2xl flex-shrink-0">{action.icon}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-400 line-clamp-2">
                  {action.label}
                </p>
                {action.category && (
                  <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {action.category}
                  </span>
                )}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 transition-all duration-200" />
          </button>
        ))}
      </div>
    </div>
  );
}
