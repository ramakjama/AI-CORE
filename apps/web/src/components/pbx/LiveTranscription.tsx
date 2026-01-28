/**
 * LiveTranscription component - Real-time call transcription display
 */

import React, { useEffect, useRef, useState } from 'react';
import { TranscriptionSegment, SpeakerType } from '@/types/pbx';
import { Search, Download, User, Headphones, Sparkles } from 'lucide-react';

interface LiveTranscriptionProps {
  segments: TranscriptionSegment[];
  currentSegment: TranscriptionSegment | null;
  isTranscribing: boolean;
  onExport?: () => string;
}

export function LiveTranscription({
  segments,
  currentSegment,
  isTranscribing,
  onExport,
}: LiveTranscriptionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, currentSegment, autoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Filter segments by search
  const filteredSegments = searchQuery
    ? segments.filter((segment) =>
        segment.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : segments;

  // Highlight search terms
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Highlight keywords
  const highlightKeywords = (text: string, keywords?: string[]): React.ReactNode => {
    if (!keywords || keywords.length === 0) {
      return highlightText(text, searchQuery);
    }

    let result: React.ReactNode = text;

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      const parts = text.split(regex);
      result = parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="font-semibold text-blue-600">
            {part}
          </span>
        ) : (
          part
        )
      );
    });

    return result;
  };

  // Handle export
  const handleExport = () => {
    if (!onExport) return;

    const transcriptionText = onExport();
    const blob = new Blob([transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Headphones className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Live Transcription</h3>
          {isTranscribing && (
            <span className="flex items-center gap-1.5 text-xs text-green-600">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </span>
          )}
        </div>

        {onExport && segments.length > 0 && (
          <button
            onClick={handleExport}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export Transcription"
            type="button"
          >
            <Download className="h-4 w-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-2 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in transcription..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Transcription Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
      >
        {filteredSegments.length === 0 && !currentSegment ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Sparkles className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">Transcription will appear here</p>
          </div>
        ) : (
          <>
            {filteredSegments.map((segment) => (
              <TranscriptionMessage
                key={segment.id}
                segment={segment}
                highlightedText={highlightKeywords(segment.text, segment.keywords)}
              />
            ))}

            {currentSegment && (
              <TranscriptionMessage
                segment={currentSegment}
                highlightedText={highlightKeywords(currentSegment.text, currentSegment.keywords)}
                isStreaming
              />
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            onClick={() => setAutoScroll(true)}
            className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            type="button"
          >
            Scroll to latest
          </button>
        </div>
      )}
    </div>
  );
}

interface TranscriptionMessageProps {
  segment: TranscriptionSegment;
  highlightedText: React.ReactNode;
  isStreaming?: boolean;
}

function TranscriptionMessage({
  segment,
  highlightedText,
  isStreaming = false,
}: TranscriptionMessageProps) {
  const isAgent = segment.speaker === SpeakerType.AGENT;

  return (
    <div className={`flex gap-3 ${isAgent ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isAgent
            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
            : 'bg-gradient-to-br from-purple-500 to-purple-600'
        }`}
      >
        {isAgent ? (
          <Headphones className="h-4 w-4 text-white" />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-900">
            {isAgent ? 'Agent' : 'Client'}
          </span>
          <span className="text-xs text-gray-500">
            {segment.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {segment.confidence && (
            <span className="text-xs text-gray-400">
              {Math.round(segment.confidence * 100)}%
            </span>
          )}
        </div>

        <div
          className={`
            px-4 py-2 rounded-lg max-w-[85%] break-words
            ${
              isAgent
                ? 'bg-blue-100 text-blue-900 rounded-br-none'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }
            ${isStreaming ? 'animate-pulse' : ''}
          `}
        >
          <p className="text-sm leading-relaxed">{highlightedText}</p>

          {segment.keywords && segment.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200/50">
              {segment.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-white/50 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
