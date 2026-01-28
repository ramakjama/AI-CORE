'use client';

import type { ContextPanelProps } from '@/types/chat';
import {
  Info,
  User,
  FileText,
  AlertCircle,
  Package,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

const contextIcons = {
  client: User,
  policy: FileText,
  claim: AlertCircle,
  product: Package,
  general: Info,
};

const contextLabels = {
  client: 'Cliente',
  policy: 'Póliza',
  claim: 'Siniestro',
  product: 'Producto',
  general: 'General',
};

export function ContextPanel({
  context,
  suggestions = [],
  onSuggestionClick,
}: ContextPanelProps) {
  const Icon = context?.type ? contextIcons[context.type] : Info;
  const label = context?.type ? contextLabels[context.type] : 'Contexto';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Información de contexto
        </h2>
      </div>

      {/* Context Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        {context && context.type !== 'general' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Icon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                  {label}
                </p>
                {context.entityName && (
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {context.entityName}
                  </p>
                )}
                {context.entityId && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    ID: {context.entityId}
                  </p>
                )}
              </div>
            </div>

            {context.pageUrl && (
              <a
                href={context.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                <span>Ver detalles</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                La IA tiene acceso al contexto de este {label.toLowerCase()} y
                puede responder preguntas específicas.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No hay contexto específico. La IA responderá de forma general.
            </p>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sugerencias
            </h3>
          </div>

          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onSuggestionClick?.(suggestion)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-yellow-500 dark:hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all"
              >
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {suggestion.label}
                </p>
                {suggestion.category && (
                  <span className="inline-block mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            <strong>Consejo:</strong>
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Sé específico en tus preguntas</li>
            <li>• Puedes preguntar sobre productos Occident</li>
            <li>• Pregunta cómo usar funciones del ERP</li>
            <li>• Solicita procedimientos paso a paso</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
