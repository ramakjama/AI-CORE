/**
 * useTranscription hook - Manages live call transcription
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TranscriptionSegment, SpeakerType } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';

export interface UseTranscriptionReturn {
  segments: TranscriptionSegment[];
  currentSegment: TranscriptionSegment | null;
  isTranscribing: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredSegments: TranscriptionSegment[];
  clearTranscription: () => void;
  exportTranscription: () => string;
  getTranscriptionBySpeaker: (speaker: SpeakerType) => TranscriptionSegment[];
}

export function useTranscription(callId: string | null): UseTranscriptionReturn {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<TranscriptionSegment | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pbxClientRef = useRef(getPBXClient());

  // Add new transcription segment
  const addSegment = useCallback((segment: TranscriptionSegment) => {
    setSegments((prev) => [...prev, segment]);
    setCurrentSegment(null);
  }, []);

  // Update current streaming segment
  const updateCurrentSegment = useCallback((segment: TranscriptionSegment) => {
    setCurrentSegment(segment);
  }, []);

  // Clear all transcription
  const clearTranscription = useCallback(() => {
    setSegments([]);
    setCurrentSegment(null);
  }, []);

  // Export transcription as text
  const exportTranscription = useCallback((): string => {
    return segments
      .map((segment) => {
        const time = segment.timestamp.toLocaleTimeString();
        const speaker = segment.speaker === SpeakerType.AGENT ? 'Agent' : 'Client';
        return `[${time}] ${speaker}: ${segment.text}`;
      })
      .join('\n');
  }, [segments]);

  // Filter segments by search query
  const filteredSegments = useCallback(() => {
    if (!searchQuery.trim()) {
      return segments;
    }

    const query = searchQuery.toLowerCase();
    return segments.filter((segment) => segment.text.toLowerCase().includes(query));
  }, [segments, searchQuery])();

  // Get transcription by speaker
  const getTranscriptionBySpeaker = useCallback(
    (speaker: SpeakerType): TranscriptionSegment[] => {
      return segments.filter((segment) => segment.speaker === speaker);
    },
    [segments]
  );

  // Highlight keywords in segments
  useEffect(() => {
    const keywords = ['insurance', 'policy', 'claim', 'premium', 'deductible', 'coverage'];

    setSegments((prevSegments) =>
      prevSegments.map((segment) => {
        const foundKeywords = keywords.filter((keyword) =>
          segment.text.toLowerCase().includes(keyword.toLowerCase())
        );

        if (foundKeywords.length > 0 && !segment.keywords) {
          return {
            ...segment,
            keywords: foundKeywords,
          };
        }

        return segment;
      })
    );
  }, [segments.length]);

  // Setup WebSocket listeners
  useEffect(() => {
    if (!callId) {
      clearTranscription();
      setIsTranscribing(false);
      return;
    }

    const pbxClient = pbxClientRef.current;
    setIsTranscribing(true);

    // Handle transcription updates (streaming)
    const unsubUpdate = pbxClient.on('transcription.update', (data) => {
      if (data.callId !== callId) return;

      updateCurrentSegment(data.segment);
    });

    // Handle final transcription segment
    const unsubFinal = pbxClient.on('transcription.final', (data) => {
      if (data.callId !== callId) return;

      addSegment(data.segment);
    });

    // Cleanup
    return () => {
      unsubUpdate();
      unsubFinal();
      setIsTranscribing(false);
    };
  }, [callId, addSegment, updateCurrentSegment, clearTranscription]);

  return {
    segments,
    currentSegment,
    isTranscribing,
    searchQuery,
    setSearchQuery,
    filteredSegments,
    clearTranscription,
    exportTranscription,
    getTranscriptionBySpeaker,
  };
}
