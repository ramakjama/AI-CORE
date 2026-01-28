/**
 * AISuggestions component - AI-powered suggestions during calls
 */

import React, { useState } from 'react';
import {
  AISuggestion,
  SuggestionType,
} from '@/types/pbx';
import {
  Sparkles,
  MessageSquare,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

interface AISuggestionsProps {
  suggestions: AISuggestion[];
  unreadCount: number;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function AISuggestions({
  suggestions,
  unreadCount,
  onDismiss,
  onMarkAsRead,
  onMarkAllAsRead,
}: AISuggestionsProps) {
  const [selectedType, setSelectedType] = useState<SuggestionType | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSuggestions = selectedType
    ? suggestions.filter((s) => s.type === selectedType)
    : suggestions;

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      onMarkAsRead(id);
    }
    setExpandedSuggestions(newExpanded);
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.SCRIPT:
        return MessageSquare;
      case SuggestionType.RESPONSE:
        return MessageSquare;
      case SuggestionType.ALERT:
        return AlertTriangle;
      case SuggestionType.PRODUCT:
        return ShoppingBag;
      case SuggestionType.OPPORTUNITY:
        return TrendingUp;
      case SuggestionType.INFO:
        return Info;
      default:
        return Sparkles;
    }
  };

  const getTypeColor = (type: SuggestionType) => {
    switch (type) {
      case SuggestionType.SCRIPT:
        return 'text-blue-600 bg-blue-100';
      case SuggestionType.RESPONSE:
        return 'text-green-600 bg-green-100';
      case SuggestionType.ALERT:
        return 'text-red-600 bg-red-100';
      case SuggestionType.PRODUCT:
        return 'text-purple-600 bg-purple-100';
      case SuggestionType.OPPORTUNITY:
        return 'text-amber-600 bg-amber-100';
      case SuggestionType.INFO:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-gray-300';
      default:
        return 'border-l-gray-300';
    }
  };

  const suggestionTypes = Object.values(SuggestionType);
  const getTypeCount = (type: SuggestionType) =>
    suggestions.filter((s) => s.type === type).length;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            type="button"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Type Filters */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              selectedType === null
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
          >
            All ({suggestions.length})
          </button>

          {suggestionTypes.map((type) => {
            const count = getTypeCount(type);
            if (count === 0) return null;

            const Icon = getTypeIcon(type);
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedType === type
                    ? getTypeColor(type)
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                {type} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Sparkles className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No suggestions yet</p>
            <p className="text-xs text-gray-400 mt-1">
              AI will provide suggestions during the call
            </p>
          </div>
        ) : (
          filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isExpanded={expandedSuggestions.has(suggestion.id)}
              isCopied={copiedId === suggestion.id}
              onToggle={() => toggleExpanded(suggestion.id)}
              onDismiss={() => onDismiss(suggestion.id)}
              onCopy={() => handleCopy(suggestion.id, suggestion.content)}
              getTypeIcon={getTypeIcon}
              getTypeColor={getTypeColor}
              getPriorityColor={getPriorityColor}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AISuggestion;
  isExpanded: boolean;
  isCopied: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onCopy: () => void;
  getTypeIcon: (type: SuggestionType) => React.ComponentType<any>;
  getTypeColor: (type: SuggestionType) => string;
  getPriorityColor: (priority: string) => string;
}

function SuggestionCard({
  suggestion,
  isExpanded,
  isCopied,
  onToggle,
  onDismiss,
  onCopy,
  getTypeIcon,
  getTypeColor,
  getPriorityColor,
}: SuggestionCardProps) {
  const Icon = getTypeIcon(suggestion.type);
  const typeColor = getTypeColor(suggestion.type);
  const priorityColor = getPriorityColor(suggestion.priority);

  return (
    <div
      className={`border-l-4 ${priorityColor} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg ${typeColor}`}>
            <Icon className="h-4 w-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm text-gray-900 truncate">
                {suggestion.title}
              </h4>
              {suggestion.priority === 'high' && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                  HIGH
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {suggestion.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            type="button"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="pt-3">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {suggestion.content}
            </p>
          </div>

          {/* Metadata */}
          {suggestion.metadata && Object.keys(suggestion.metadata).length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              {Object.entries(suggestion.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-600 font-medium">{key}:</span>
                  <span className="text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              type="button"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
