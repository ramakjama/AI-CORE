/**
 * Tests for useCall hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useCall } from '../useCall';
import { CallState, CallDirection } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';
import { getAudioManager } from '@/lib/pbx/audio-utils';

// Mock dependencies
jest.mock('@/lib/pbx/websocket-client');
jest.mock('@/lib/pbx/audio-utils');
jest.mock('@/lib/pbx/notification-utils');

describe('useCall', () => {
  let mockPBXClient: any;
  let mockAudioManager: any;
  const mockAgentId = 'agent-123';

  beforeEach(() => {
    // Setup mocks
    mockPBXClient = {
      on: jest.fn((event, handler) => jest.fn()),
      answerCall: jest.fn(),
      hangupCall: jest.fn(),
      holdCall: jest.fn(),
      muteCall: jest.fn(),
      transferCall: jest.fn(),
      makeCall: jest.fn(),
      sendDTMF: jest.fn(),
      toggleRecording: jest.fn(),
    };

    mockAudioManager = {
      playRingtone: jest.fn(),
      stopRingtone: jest.fn(),
      playConnectSound: jest.fn(),
      playHangupSound: jest.fn(),
      playDTMF: jest.fn(),
    };

    (getPBXClient as jest.Mock).mockReturnValue(mockPBXClient);
    (getAudioManager as jest.Mock).mockReturnValue(mockAudioManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with IDLE state', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    expect(result.current.callState).toBe(CallState.IDLE);
    expect(result.current.currentCall).toBeNull();
    expect(result.current.callStats).toBeNull();
  });

  it('should handle incoming call event', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Simulate incoming call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        clientId: 'client-456',
        clientName: 'John Doe',
        timestamp: new Date().toISOString(),
      });
    });

    expect(result.current.callState).toBe(CallState.RINGING);
    expect(result.current.currentCall).toMatchObject({
      id: 'call-123',
      phoneNumber: '+1234567890',
      direction: CallDirection.INBOUND,
    });
    expect(mockAudioManager.playRingtone).toHaveBeenCalled();
  });

  it('should answer call', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Answer call
    act(() => {
      result.current.answer();
    });

    expect(mockPBXClient.answerCall).toHaveBeenCalledWith('call-123');
    expect(mockAudioManager.stopRingtone).toHaveBeenCalled();
    expect(mockAudioManager.playConnectSound).toHaveBeenCalled();
  });

  it('should hangup call', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup active call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Hangup
    act(() => {
      result.current.hangup();
    });

    expect(mockPBXClient.hangupCall).toHaveBeenCalledWith('call-123');
    expect(mockAudioManager.playHangupSound).toHaveBeenCalled();
  });

  it('should mute and unmute call', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup active call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Mute
    act(() => {
      result.current.mute();
    });

    expect(result.current.isMuted).toBe(true);
    expect(mockPBXClient.muteCall).toHaveBeenCalledWith('call-123', true);

    // Unmute
    act(() => {
      result.current.unmute();
    });

    expect(result.current.isMuted).toBe(false);
    expect(mockPBXClient.muteCall).toHaveBeenCalledWith('call-123', false);
  });

  it('should hold and unhold call', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup active call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Hold
    act(() => {
      result.current.hold();
    });

    expect(result.current.isOnHold).toBe(true);
    expect(mockPBXClient.holdCall).toHaveBeenCalledWith('call-123', true);

    // Unhold
    act(() => {
      result.current.unhold();
    });

    expect(result.current.isOnHold).toBe(false);
    expect(mockPBXClient.holdCall).toHaveBeenCalledWith('call-123', false);
  });

  it('should send DTMF tones', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup active call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Send DTMF
    act(() => {
      result.current.sendDTMF('1');
    });

    expect(mockPBXClient.sendDTMF).toHaveBeenCalledWith('call-123', '1');
    expect(mockAudioManager.playDTMF).toHaveBeenCalledWith('1');
  });

  it('should make outbound call', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    act(() => {
      result.current.makeCall('+1234567890', 'client-456');
    });

    expect(mockPBXClient.makeCall).toHaveBeenCalledWith('+1234567890', 'client-456');
  });

  it('should toggle recording', () => {
    const { result } = renderHook(() => useCall(mockAgentId));

    // Setup active call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    // Start recording
    act(() => {
      result.current.toggleRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(mockPBXClient.toggleRecording).toHaveBeenCalledWith('call-123', true);

    // Stop recording
    act(() => {
      result.current.toggleRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(mockPBXClient.toggleRecording).toHaveBeenCalledWith('call-123', false);
  });

  it('should update call stats during active call', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useCall(mockAgentId));

    // Start call
    const incomingCallHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.incoming'
    )?.[1];

    const answeredHandler = mockPBXClient.on.mock.calls.find(
      (call: any) => call[0] === 'call.answered'
    )?.[1];

    act(() => {
      incomingCallHandler?.({
        callId: 'call-123',
        phoneNumber: '+1234567890',
        timestamp: new Date().toISOString(),
      });
    });

    act(() => {
      answeredHandler?.({ callId: 'call-123' });
    });

    // Wait for stats update
    act(() => {
      jest.advanceTimersByTime(5000); // 5 seconds
    });

    await waitFor(() => {
      expect(result.current.callStats).toBeTruthy();
      expect(result.current.callStats?.duration).toBeGreaterThan(0);
    });

    jest.useRealTimers();
  });
});
