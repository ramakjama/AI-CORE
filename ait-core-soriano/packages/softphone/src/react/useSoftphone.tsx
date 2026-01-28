/**
 * React Hook for Softphone
 * Easy integration of VoIP softphone in React apps
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TwilioSoftphone } from '../TwilioSoftphone';
import type { Call, CallOptions, CallQuality, TwilioConfig } from '../types';

export interface UseSoftphoneOptions {
  config: TwilioConfig;
  onTokenRequest: () => Promise<string>;
  autoConnect?: boolean;
}

export interface UseSoftphoneReturn {
  // State
  isReady: boolean;
  isInCall: boolean;
  currentCall: Call | null;
  allCalls: Call[];
  isMuted: boolean;
  callQuality: CallQuality | null;
  error: string | null;

  // Actions
  makeCall: (options: CallOptions) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  sendDigits: (digits: string) => void;
  clearError: () => void;

  // Softphone instance (for advanced usage)
  softphone: TwilioSoftphone | null;
}

export function useSoftphone(options: UseSoftphoneOptions): UseSoftphoneReturn {
  const { config, onTokenRequest, autoConnect = true } = options;

  const softphoneRef = useRef<TwilioSoftphone | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [allCalls, setAllCalls] = useState<Call[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [callQuality, setCallQuality] = useState<CallQuality | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize softphone
  useEffect(() => {
    if (!autoConnect) return;

    const init = async () => {
      try {
        // Create softphone instance
        const softphone = new TwilioSoftphone(config);
        softphoneRef.current = softphone;

        // Setup event listeners
        setupEventListeners(softphone);

        // Get access token
        const token = await onTokenRequest();

        // Initialize
        await softphone.initialize(token);

        setIsReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    init();

    return () => {
      if (softphoneRef.current) {
        softphoneRef.current.destroy();
      }
    };
  }, [autoConnect, config, onTokenRequest]);

  // Setup event listeners
  const setupEventListeners = (softphone: TwilioSoftphone) => {
    softphone.on('device:ready', () => {
      console.log('[useSoftphone] Device ready');
      setIsReady(true);
    });

    softphone.on('device:error', (err) => {
      console.error('[useSoftphone] Device error:', err);
      setError(err.message);
      setIsReady(false);
    });

    softphone.on('device:offline', () => {
      console.log('[useSoftphone] Device offline');
      setIsReady(false);
    });

    softphone.on('call:incoming', (call) => {
      console.log('[useSoftphone] Incoming call from:', call.from);
      setCurrentCall(call);
      setIsInCall(true);
      updateCallsList();
    });

    softphone.on('call:connecting', (call) => {
      console.log('[useSoftphone] Call connecting');
      setCurrentCall(call);
      updateCallsList();
    });

    softphone.on('call:ringing', (call) => {
      console.log('[useSoftphone] Call ringing');
      setCurrentCall(call);
      updateCallsList();
    });

    softphone.on('call:answered', (call) => {
      console.log('[useSoftphone] Call answered');
      setCurrentCall(call);
      setIsInCall(true);
      updateCallsList();

      // Start quality monitoring
      startQualityMonitoring();
    });

    softphone.on('call:ended', (call) => {
      console.log('[useSoftphone] Call ended');
      setCurrentCall(null);
      setIsInCall(false);
      setIsMuted(false);
      setCallQuality(null);
      updateCallsList();
    });

    softphone.on('call:failed', (call, err) => {
      console.error('[useSoftphone] Call failed:', err);
      setError(err.message);
      setCurrentCall(null);
      setIsInCall(false);
      setIsMuted(false);
      setCallQuality(null);
      updateCallsList();
    });
  };

  // Update calls list
  const updateCallsList = useCallback(() => {
    if (softphoneRef.current) {
      setAllCalls(softphoneRef.current.getAllCalls());
    }
  }, []);

  // Start quality monitoring
  const startQualityMonitoring = () => {
    const interval = setInterval(() => {
      if (softphoneRef.current && isInCall) {
        const quality = softphoneRef.current.getCallQuality();
        setCallQuality(quality);
      } else {
        clearInterval(interval);
      }
    }, 1000);
  };

  // Make a call
  const makeCall = useCallback(
    async (callOptions: CallOptions) => {
      if (!softphoneRef.current) {
        throw new Error('Softphone not initialized');
      }

      try {
        const call = await softphoneRef.current.makeCall(callOptions);
        setCurrentCall(call);
        setIsInCall(true);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    []
  );

  // Answer call
  const answerCall = useCallback(async () => {
    if (!softphoneRef.current) {
      throw new Error('Softphone not initialized');
    }

    try {
      await softphoneRef.current.answerCall();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }, []);

  // Reject call
  const rejectCall = useCallback(() => {
    if (!softphoneRef.current) {
      throw new Error('Softphone not initialized');
    }

    softphoneRef.current.rejectCall();
  }, []);

  // Hang up
  const hangUp = useCallback(() => {
    if (!softphoneRef.current) {
      throw new Error('Softphone not initialized');
    }

    softphoneRef.current.hangUp();
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!softphoneRef.current) {
      throw new Error('Softphone not initialized');
    }

    const newMutedState = !isMuted;
    softphoneRef.current.setMuted(newMutedState);
    setIsMuted(newMutedState);
  }, [isMuted]);

  // Send digits (DTMF)
  const sendDigits = useCallback((digits: string) => {
    if (!softphoneRef.current) {
      throw new Error('Softphone not initialized');
    }

    softphoneRef.current.sendDigits(digits);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isReady,
    isInCall,
    currentCall,
    allCalls,
    isMuted,
    callQuality,
    error,
    makeCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    sendDigits,
    clearError,
    softphone: softphoneRef.current,
  };
}
