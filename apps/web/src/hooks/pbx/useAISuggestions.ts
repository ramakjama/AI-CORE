/**
 * useAISuggestions hook - Manages AI-powered suggestions during calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AISuggestion, SuggestionType } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';

export interface UseAISuggestionsReturn {
  suggestions: AISuggestion[];
  activeSuggestion: AISuggestion | null;
  unreadCount: number;
  filterByType: (type: SuggestionType | null) => AISuggestion[];
  dismissSuggestion: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearSuggestions: () => void;
  getSuggestionsByPriority: (priority: 'low' | 'medium' | 'high') => AISuggestion[];
}

interface SuggestionWithRead extends AISuggestion {
  read: boolean;
}

export function useAISuggestions(callId: string | null): UseAISuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SuggestionWithRead[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<AISuggestion | null>(null);

  const pbxClientRef = useRef(getPBXClient());

  // Add new suggestion
  const addSuggestion = useCallback((suggestion: AISuggestion) => {
    setSuggestions((prev) => [
      {
        ...suggestion,
        read: false,
      },
      ...prev,
    ]);

    // Set as active if high priority
    if (suggestion.priority === 'high') {
      setActiveSuggestion(suggestion);
    }
  }, []);

  // Dismiss suggestion
  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    setActiveSuggestion((current) => (current?.id === id ? null : current));
  }, []);

  // Mark suggestion as read
  const markAsRead = useCallback((id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, read: true } : s))
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, read: true })));
  }, []);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveSuggestion(null);
  }, []);

  // Filter suggestions by type
  const filterByType = useCallback(
    (type: SuggestionType | null): AISuggestion[] => {
      if (!type) return suggestions;
      return suggestions.filter((s) => s.type === type);
    },
    [suggestions]
  );

  // Get suggestions by priority
  const getSuggestionsByPriority = useCallback(
    (priority: 'low' | 'medium' | 'high'): AISuggestion[] => {
      return suggestions.filter((s) => s.priority === priority);
    },
    [suggestions]
  );

  // Calculate unread count
  const unreadCount = suggestions.filter((s) => !s.read).length;

  // Setup WebSocket listeners
  useEffect(() => {
    if (!callId) {
      clearSuggestions();
      return;
    }

    const pbxClient = pbxClientRef.current;

    // Handle new AI suggestion
    const unsubSuggestion = pbxClient.on('ai.suggestion', (data) => {
      if (data.callId !== callId) return;

      addSuggestion(data.suggestion);
    });

    // Handle sentiment updates (convert to suggestions)
    const unsubSentiment = pbxClient.on('sentiment.update', (data) => {
      if (data.callId !== callId) return;

      // Create alert if sentiment is negative
      if (data.sentiment === 'NEGATIVE' && data.score < -0.5) {
        addSuggestion({
          id: `sentiment-${Date.now()}`,
          type: SuggestionType.ALERT,
          title: 'Negative Sentiment Detected',
          content: 'Customer appears frustrated. Consider offering assistance or escalation.',
          priority: 'high',
          timestamp: new Date(),
          metadata: {
            sentiment: data.sentiment,
            score: data.score,
          },
        });
      }
    });

    // Cleanup
    return () => {
      unsubSuggestion();
      unsubSentiment();
    };
  }, [callId, addSuggestion, clearSuggestions]);

  return {
    suggestions,
    activeSuggestion,
    unreadCount,
    filterByType,
    dismissSuggestion,
    markAsRead,
    markAllAsRead,
    clearSuggestions,
    getSuggestionsByPriority,
  };
}
