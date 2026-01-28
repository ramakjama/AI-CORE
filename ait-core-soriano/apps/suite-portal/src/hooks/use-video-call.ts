/**
 * useVideoCall Hook
 * Custom hook for managing WebRTC video calls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PeerConnection, SignalData } from '@/lib/webrtc/peer-connection';
import { SignalingClient, SignalingMessage } from '@/lib/webrtc/signaling-client';
import { nanoid } from 'nanoid';

export interface RemoteParticipant {
  id: string;
  name: string;
  stream: MediaStream | null;
  isConnected: boolean;
}

export interface IncomingCall {
  from: string;
  fromName: string;
  timestamp: number;
}

export interface UseVideoCallOptions {
  signalingUrl?: string;
  userId?: string;
  userName?: string;
  autoConnect?: boolean;
}

export interface UseVideoCallReturn {
  // Connection state
  isConnected: boolean;
  isInCall: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';

  // Streams
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];

  // Media controls
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;

  // Call management
  startCall: (targetUserId: string, targetUserName?: string) => Promise<void>;
  endCall: () => void;
  acceptCall: (fromUserId: string) => Promise<void>;
  declineCall: (fromUserId: string) => void;

  // Incoming calls
  incomingCall: IncomingCall | null;
  clearIncomingCall: () => void;

  // Errors
  error: string | null;
  clearError: () => void;
}

export function useVideoCall(options: UseVideoCallOptions = {}): UseVideoCallReturn {
  const {
    signalingUrl = 'ws://localhost:1234',
    userId = nanoid(),
    userName = 'Anonymous User',
    autoConnect = true,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const signalingClient = useRef<SignalingClient | null>(null);
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  const screenStream = useRef<MediaStream | null>(null);
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);

  /**
   * Initialize signaling client
   */
  useEffect(() => {
    if (!autoConnect) return;

    const client = new SignalingClient({
      onConnect: () => {
        console.log('Signaling connected');
        setIsConnected(true);
        setConnectionQuality('excellent');
      },
      onDisconnect: () => {
        console.log('Signaling disconnected');
        setIsConnected(false);
        setConnectionQuality('disconnected');
      },
      onMessage: handleSignalingMessage,
      onUserJoined: handleUserJoined,
      onUserLeft: handleUserLeft,
      onCallRequest: handleCallRequest,
      onCallAccepted: handleCallAccepted,
      onCallDeclined: handleCallDeclined,
      onError: (err) => {
        console.error('Signaling error:', err);
        setError(err.message);
      },
    });

    signalingClient.current = client;
    client.connect(signalingUrl, userId, userName);

    return () => {
      client.disconnect();
      cleanupPeerConnections();
    };
  }, [autoConnect, signalingUrl, userId, userName]);

  /**
   * Handle signaling messages
   */
  const handleSignalingMessage = useCallback((message: SignalingMessage) => {
    const { type, from, data } = message;
    if (!from) return;

    const peer = peerConnections.current.get(from);
    if (!peer) {
      console.warn('Received signal for unknown peer:', from);
      return;
    }

    if (type === 'offer' || type === 'answer' || type === 'ice-candidate') {
      peer.signal(data);
    }
  }, []);

  /**
   * Handle user joined room
   */
  const handleUserJoined = useCallback(async (joinedUserId: string, joinedUserName: string) => {
    if (joinedUserId === userId) return;

    console.log('User joined, creating peer connection:', joinedUserId);
    await createPeerConnection(joinedUserId, joinedUserName, true);
  }, [userId]);

  /**
   * Handle user left room
   */
  const handleUserLeft = useCallback((leftUserId: string) => {
    console.log('User left:', leftUserId);
    removePeerConnection(leftUserId);
  }, []);

  /**
   * Handle incoming call request
   */
  const handleCallRequest = useCallback((from: string, fromName: string) => {
    console.log('Incoming call from:', fromName);
    setIncomingCall({
      from,
      fromName,
      timestamp: Date.now(),
    });
  }, []);

  /**
   * Handle call accepted
   */
  const handleCallAccepted = useCallback(async (from: string) => {
    console.log('Call accepted by:', from);
    await createPeerConnection(from, 'Remote User', true);
  }, []);

  /**
   * Handle call declined
   */
  const handleCallDeclined = useCallback((from: string) => {
    console.log('Call declined by:', from);
    setError('Call was declined');
    setTimeout(() => setError(null), 5000);
  }, []);

  /**
   * Create peer connection
   */
  const createPeerConnection = useCallback(async (
    targetUserId: string,
    targetUserName: string,
    initiator: boolean
  ) => {
    try {
      // Get user media if not already available
      let stream = localStream;
      if (!stream) {
        const peer = new PeerConnection({
          onSignal: () => {},
          onStream: () => {},
          onConnect: () => {},
          onDisconnect: () => {},
          onError: () => {},
        });
        stream = await peer.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        peer.disconnect();
      }

      // Create peer connection
      const peer = new PeerConnection({
        onSignal: (signal: SignalData) => {
          if (!signalingClient.current) return;

          if (signal.type === 'offer') {
            signalingClient.current.sendOffer(targetUserId, signal.data);
          } else if (signal.type === 'answer') {
            signalingClient.current.sendAnswer(targetUserId, signal.data);
          } else if (signal.type === 'ice-candidate') {
            signalingClient.current.sendIceCandidate(targetUserId, signal.data);
          }
        },
        onStream: (remoteStream: MediaStream) => {
          console.log('Received remote stream from:', targetUserId);
          setRemoteParticipants((prev) => {
            const existing = prev.find((p) => p.id === targetUserId);
            if (existing) {
              return prev.map((p) =>
                p.id === targetUserId
                  ? { ...p, stream: remoteStream, isConnected: true }
                  : p
              );
            }
            return [
              ...prev,
              {
                id: targetUserId,
                name: targetUserName,
                stream: remoteStream,
                isConnected: true,
              },
            ];
          });
        },
        onConnect: () => {
          console.log('Peer connected:', targetUserId);
          setConnectionQuality('excellent');
        },
        onDisconnect: () => {
          console.log('Peer disconnected:', targetUserId);
          removePeerConnection(targetUserId);
        },
        onError: (err: Error) => {
          console.error('Peer error:', err);
          setError(err.message);
          removePeerConnection(targetUserId);
        },
      });

      await peer.create({
        initiator,
        stream,
      });

      peerConnections.current.set(targetUserId, peer);
      setIsInCall(true);
    } catch (err) {
      console.error('Error creating peer connection:', err);
      setError((err as Error).message);
    }
  }, [localStream]);

  /**
   * Remove peer connection
   */
  const removePeerConnection = useCallback((userId: string) => {
    const peer = peerConnections.current.get(userId);
    if (peer) {
      peer.disconnect();
      peerConnections.current.delete(userId);
    }

    setRemoteParticipants((prev) => prev.filter((p) => p.id !== userId));

    if (peerConnections.current.size === 0) {
      setIsInCall(false);
      setConnectionQuality('disconnected');
    }
  }, []);

  /**
   * Cleanup all peer connections
   */
  const cleanupPeerConnections = useCallback(() => {
    peerConnections.current.forEach((peer) => {
      peer.disconnect();
    });
    peerConnections.current.clear();
    setRemoteParticipants([]);
    setIsInCall(false);
  }, []);

  /**
   * Start a call
   */
  const startCall = useCallback(async (targetUserId: string, targetUserName: string = 'Remote User') => {
    try {
      if (!signalingClient.current) {
        throw new Error('Signaling client not connected');
      }

      signalingClient.current.requestCall(targetUserId, userName);
    } catch (err) {
      console.error('Error starting call:', err);
      setError((err as Error).message);
    }
  }, [userName]);

  /**
   * End call
   */
  const endCall = useCallback(() => {
    cleanupPeerConnections();

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
    }

    setIsInCall(false);
    setIsScreenSharing(false);
    setConnectionQuality('disconnected');
  }, [localStream, cleanupPeerConnections]);

  /**
   * Accept incoming call
   */
  const acceptCall = useCallback(async (fromUserId: string) => {
    try {
      if (!signalingClient.current) {
        throw new Error('Signaling client not connected');
      }

      signalingClient.current.acceptCall(fromUserId);
      await createPeerConnection(fromUserId, incomingCall?.fromName || 'Remote User', false);
      setIncomingCall(null);
    } catch (err) {
      console.error('Error accepting call:', err);
      setError((err as Error).message);
    }
  }, [incomingCall, createPeerConnection]);

  /**
   * Decline incoming call
   */
  const declineCall = useCallback((fromUserId: string) => {
    if (!signalingClient.current) return;

    signalingClient.current.declineCall(fromUserId);
    setIncomingCall(null);
  }, []);

  /**
   * Toggle mute
   */
  const toggleMute = useCallback(() => {
    if (!localStream) return;

    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsMuted((prev) => !prev);
  }, [localStream]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsVideoEnabled((prev) => !prev);
  }, [localStream]);

  /**
   * Toggle screen share
   */
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => track.stop());
          screenStream.current = null;
        }

        // Restore original video track
        if (originalVideoTrack.current && localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            localStream.removeTrack(videoTrack);
            videoTrack.stop();
          }
          localStream.addTrack(originalVideoTrack.current);

          // Replace track in all peer connections
          for (const peer of peerConnections.current.values()) {
            await peer.replaceVideoTrack(localStream);
          }

          originalVideoTrack.current = null;
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        if (!localStream) {
          throw new Error('No local stream available');
        }

        const peer = new PeerConnection({
          onSignal: () => {},
          onStream: () => {},
          onConnect: () => {},
          onDisconnect: () => {},
          onError: () => {},
        });
        const displayStream = await peer.getDisplayMedia({ video: true, audio: false });
        peer.disconnect();

        screenStream.current = displayStream;

        // Save original video track
        const originalTrack = localStream.getVideoTracks()[0];
        if (originalTrack) {
          originalVideoTrack.current = originalTrack;
        }

        // Replace video track with screen share
        const screenTrack = displayStream.getVideoTracks()[0];
        if (screenTrack) {
          if (originalTrack) {
            localStream.removeTrack(originalTrack);
            originalTrack.stop();
          }
          localStream.addTrack(screenTrack);

          // Replace track in all peer connections
          for (const peer of peerConnections.current.values()) {
            await peer.replaceVideoTrack(localStream);
          }

          // Handle screen share stop
          screenTrack.onended = () => {
            toggleScreenShare();
          };
        }

        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      setError((err as Error).message);
    }
  }, [isScreenSharing, localStream]);

  /**
   * Clear incoming call
   */
  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isInCall,
    connectionQuality,
    localStream,
    remoteParticipants,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    startCall,
    endCall,
    acceptCall,
    declineCall,
    incomingCall,
    clearIncomingCall,
    error,
    clearError,
  };
}
