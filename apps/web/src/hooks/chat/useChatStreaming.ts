import { useState, useCallback, useRef, useEffect } from 'react';

interface UseChatStreamingOptions {
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

interface UseChatStreamingReturn {
  streamingText: string;
  isStreaming: boolean;
  appendToken: (token: string) => void;
  reset: () => void;
  complete: () => void;
  setError: (error: string) => void;
}

export function useChatStreaming(
  options: UseChatStreamingOptions = {}
): UseChatStreamingReturn {
  const { onComplete, onError } = options;

  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingTextRef = useRef('');

  const appendToken = useCallback((token: string) => {
    streamingTextRef.current += token;
    setStreamingText(streamingTextRef.current);

    if (!isStreaming) {
      setIsStreaming(true);
    }
  }, [isStreaming]);

  const reset = useCallback(() => {
    streamingTextRef.current = '';
    setStreamingText('');
    setIsStreaming(false);
  }, []);

  const complete = useCallback(() => {
    setIsStreaming(false);
    if (onComplete) {
      onComplete(streamingTextRef.current);
    }
  }, [onComplete]);

  const setError = useCallback((error: string) => {
    setIsStreaming(false);
    if (onError) {
      onError(error);
    }
  }, [onError]);

  useEffect(() => {
    return () => {
      streamingTextRef.current = '';
    };
  }, []);

  return {
    streamingText,
    isStreaming,
    appendToken,
    reset,
    complete,
    setError,
  };
}
