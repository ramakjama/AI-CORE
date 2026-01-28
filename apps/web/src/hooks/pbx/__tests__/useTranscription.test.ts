/**
 * Tests for useTranscription hook
 */

import { renderHook, act } from '@testing-library/react';
import { useTranscription } from '../useTranscription';
import { SpeakerType } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';

jest.mock('@/lib/pbx/websocket-client');

describe('useTranscription', () => {
  let mockPBXClient: any;
  const mockCallId = 'call-123';

  beforeEach(() => {
    mockPBXClient = {
      on: jest.fn((event, handler) => jest.fn()),
    };

    (getPBXClient as jest.Mock).mockReturnValue(mockPBXClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty segments', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    expect(result.current.segments).toEqual([]);
    expect(result.current.currentSegment).toBeNull();
    expect(result.current.isTranscribing).toBe(true);
  });

  it('should handle transcription updates', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const updateHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.update'
    )?.[1];

    const mockSegment = {
      id: 'seg-1',
      speaker: SpeakerType.CLIENT,
      text: 'Hello, I need help...',
      timestamp: new Date(),
      confidence: 0.95,
    };

    act(() => {
      updateHandler?.({
        callId: mockCallId,
        segment: mockSegment,
      });
    });

    expect(result.current.currentSegment).toMatchObject(mockSegment);
  });

  it('should add final transcription segments', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const finalHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.final'
    )?.[1];

    const mockSegment = {
      id: 'seg-1',
      speaker: SpeakerType.AGENT,
      text: 'How can I help you today?',
      timestamp: new Date(),
      confidence: 0.98,
    };

    act(() => {
      finalHandler?.({
        callId: mockCallId,
        segment: mockSegment,
      });
    });

    expect(result.current.segments).toHaveLength(1);
    expect(result.current.segments[0]).toMatchObject(mockSegment);
    expect(result.current.currentSegment).toBeNull();
  });

  it('should filter segments by search query', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const finalHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.final'
    )?.[1];

    // Add multiple segments
    act(() => {
      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-1',
          speaker: SpeakerType.CLIENT,
          text: 'I need insurance information',
          timestamp: new Date(),
        },
      });

      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-2',
          speaker: SpeakerType.AGENT,
          text: 'Sure, what type of policy?',
          timestamp: new Date(),
        },
      });

      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-3',
          speaker: SpeakerType.CLIENT,
          text: 'Auto insurance please',
          timestamp: new Date(),
        },
      });
    });

    // Set search query
    act(() => {
      result.current.setSearchQuery('insurance');
    });

    expect(result.current.filteredSegments).toHaveLength(2);
    expect(result.current.filteredSegments[0].text).toContain('insurance');
    expect(result.current.filteredSegments[1].text).toContain('insurance');
  });

  it('should export transcription as text', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const finalHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.final'
    )?.[1];

    act(() => {
      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-1',
          speaker: SpeakerType.AGENT,
          text: 'Hello',
          timestamp: new Date(),
        },
      });

      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-2',
          speaker: SpeakerType.CLIENT,
          text: 'Hi there',
          timestamp: new Date(),
        },
      });
    });

    const exported = result.current.exportTranscription();

    expect(exported).toContain('Agent: Hello');
    expect(exported).toContain('Client: Hi there');
  });

  it('should get transcription by speaker', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const finalHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.final'
    )?.[1];

    act(() => {
      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-1',
          speaker: SpeakerType.AGENT,
          text: 'Agent message 1',
          timestamp: new Date(),
        },
      });

      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-2',
          speaker: SpeakerType.CLIENT,
          text: 'Client message 1',
          timestamp: new Date(),
        },
      });

      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-3',
          speaker: SpeakerType.AGENT,
          text: 'Agent message 2',
          timestamp: new Date(),
        },
      });
    });

    const agentSegments = result.current.getTranscriptionBySpeaker(SpeakerType.AGENT);
    const clientSegments = result.current.getTranscriptionBySpeaker(SpeakerType.CLIENT);

    expect(agentSegments).toHaveLength(2);
    expect(clientSegments).toHaveLength(1);
  });

  it('should clear transcription', () => {
    const { result } = renderHook(() => useTranscription(mockCallId));

    const finalHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'transcription.final'
    )?.[1];

    act(() => {
      finalHandler?.({
        callId: mockCallId,
        segment: {
          id: 'seg-1',
          speaker: SpeakerType.AGENT,
          text: 'Test',
          timestamp: new Date(),
        },
      });
    });

    expect(result.current.segments).toHaveLength(1);

    act(() => {
      result.current.clearTranscription();
    });

    expect(result.current.segments).toHaveLength(0);
    expect(result.current.currentSegment).toBeNull();
  });

  it('should stop transcribing when callId is null', () => {
    const { result, rerender } = renderHook(
      ({ callId }) => useTranscription(callId),
      { initialProps: { callId: mockCallId } }
    );

    expect(result.current.isTranscribing).toBe(true);

    rerender({ callId: null });

    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.segments).toHaveLength(0);
  });
});
