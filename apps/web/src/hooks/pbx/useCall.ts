/**
 * useCall hook - Manages call state and operations
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CallState, CallInfo, CallDirection, CallStats } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';
import { getAudioManager } from '@/lib/pbx/audio-utils';
import { getNotificationManager } from '@/lib/pbx/notification-utils';

export interface UseCallReturn {
  callState: CallState;
  currentCall: CallInfo | null;
  callStats: CallStats | null;
  isOnHold: boolean;
  isMuted: boolean;
  isRecording: boolean;
  answer: () => void;
  hangup: () => void;
  hold: () => void;
  unhold: () => void;
  mute: () => void;
  unmute: () => void;
  transfer: (targetNumber: string) => void;
  makeCall: (phoneNumber: string, clientId?: string) => void;
  sendDTMF: (digit: string) => void;
  toggleRecording: () => void;
}

export function useCall(agentId: string): UseCallReturn {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [isOnHold, setIsOnHold] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const callStartTimeRef = useRef<number | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pbxClientRef = useRef(getPBXClient(agentId));
  const audioManagerRef = useRef(getAudioManager());
  const notificationManagerRef = useRef(getNotificationManager());

  // Update call stats
  const updateCallStats = useCallback(() => {
    if (!callStartTimeRef.current) return;

    const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
    setCallStats((prev) => ({
      duration,
      holdTime: prev?.holdTime || 0,
      talkTime: duration - (prev?.holdTime || 0),
      sentimentScore: prev?.sentimentScore || 0,
      transcriptionAccuracy: prev?.transcriptionAccuracy || 0,
    }));
  }, []);

  // Start stats tracking
  const startStatsTracking = useCallback(() => {
    callStartTimeRef.current = Date.now();
    statsIntervalRef.current = setInterval(updateCallStats, 1000);
  }, [updateCallStats]);

  // Stop stats tracking
  const stopStatsTracking = useCallback(() => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    callStartTimeRef.current = null;
  }, []);

  // Answer call
  const answer = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.answerCall(currentCall.id);
    audioManagerRef.current.stopRingtone();
    audioManagerRef.current.playConnectSound();
    notificationManagerRef.current.closeNotification('incoming-call');
  }, [currentCall]);

  // Hangup call
  const hangup = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.hangupCall(currentCall.id);
    audioManagerRef.current.playHangupSound();
    audioManagerRef.current.stopRingtone();
  }, [currentCall]);

  // Hold call
  const hold = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.holdCall(currentCall.id, true);
    setIsOnHold(true);
  }, [currentCall]);

  // Unhold call
  const unhold = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.holdCall(currentCall.id, false);
    setIsOnHold(false);
  }, [currentCall]);

  // Mute call
  const mute = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.muteCall(currentCall.id, true);
    setIsMuted(true);
  }, [currentCall]);

  // Unmute call
  const unmute = useCallback(() => {
    if (!currentCall) return;

    pbxClientRef.current.muteCall(currentCall.id, false);
    setIsMuted(false);
  }, [currentCall]);

  // Transfer call
  const transfer = useCallback(
    (targetNumber: string) => {
      if (!currentCall) return;

      pbxClientRef.current.transferCall(currentCall.id, targetNumber);
    },
    [currentCall]
  );

  // Make outbound call
  const makeCall = useCallback((phoneNumber: string, clientId?: string) => {
    pbxClientRef.current.makeCall(phoneNumber, clientId);
  }, []);

  // Send DTMF tone
  const sendDTMF = useCallback(
    (digit: string) => {
      if (!currentCall) return;

      pbxClientRef.current.sendDTMF(currentCall.id, digit);
      audioManagerRef.current.playDTMF(digit);
    },
    [currentCall]
  );

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (!currentCall) return;

    const newRecordingState = !isRecording;
    pbxClientRef.current.toggleRecording(currentCall.id, newRecordingState);
    setIsRecording(newRecordingState);
  }, [currentCall, isRecording]);

  // Setup WebSocket event listeners
  useEffect(() => {
    const pbxClient = pbxClientRef.current;

    // Handle incoming call
    const unsubIncoming = pbxClient.on('call.incoming', (data) => {
      const callInfo: CallInfo = {
        id: data.callId,
        direction: CallDirection.INBOUND,
        phoneNumber: data.phoneNumber,
        startTime: new Date(data.timestamp),
        clientId: data.clientId,
        clientName: data.clientName,
        clientPhoto: data.clientPhoto,
        clientSegment: data.clientSegment,
        predictedReason: data.predictedReason,
      };

      setCurrentCall(callInfo);
      setCallState(CallState.RINGING);
      audioManagerRef.current.playRingtone();

      notificationManagerRef.current.showIncomingCallNotification(
        callInfo.clientName || 'Unknown',
        callInfo.phoneNumber,
        answer
      );
    });

    // Handle call answered
    const unsubAnswered = pbxClient.on('call.answered', (data) => {
      setCallState(CallState.IN_CALL);
      startStatsTracking();
    });

    // Handle call ended
    const unsubEnded = pbxClient.on('call.ended', (data) => {
      setCallState(CallState.ENDED);
      audioManagerRef.current.stopRingtone();
      stopStatsTracking();

      if (callStats) {
        const minutes = Math.floor(callStats.duration / 60);
        const seconds = callStats.duration % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        notificationManagerRef.current.showCallEndedNotification(duration);
      }

      // Reset after a delay
      setTimeout(() => {
        setCallState(CallState.IDLE);
        setCurrentCall(null);
        setCallStats(null);
        setIsOnHold(false);
        setIsMuted(false);
        setIsRecording(false);
      }, 3000);
    });

    // Handle call hold
    const unsubHold = pbxClient.on('call.hold', (data) => {
      setIsOnHold(data.hold);
      if (data.hold) {
        setCallState(CallState.ON_HOLD);
      } else {
        setCallState(CallState.IN_CALL);
      }
    });

    // Handle call mute
    const unsubMute = pbxClient.on('call.muted', (data) => {
      setIsMuted(data.mute);
    });

    // Handle outbound call initiated
    const unsubOutbound = pbxClient.on('call.outbound', (data) => {
      const callInfo: CallInfo = {
        id: data.callId,
        direction: CallDirection.OUTBOUND,
        phoneNumber: data.phoneNumber,
        startTime: new Date(data.timestamp),
        clientId: data.clientId,
        clientName: data.clientName,
      };

      setCurrentCall(callInfo);
      setCallState(CallState.RINGING);
    });

    // Cleanup
    return () => {
      unsubIncoming();
      unsubAnswered();
      unsubEnded();
      unsubHold();
      unsubMute();
      unsubOutbound();
      stopStatsTracking();
    };
  }, [answer, callStats, startStatsTracking, stopStatsTracking]);

  return {
    callState,
    currentCall,
    callStats,
    isOnHold,
    isMuted,
    isRecording,
    answer,
    hangup,
    hold,
    unhold,
    mute,
    unmute,
    transfer,
    makeCall,
    sendDTMF,
    toggleRecording,
  };
}
