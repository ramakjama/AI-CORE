/**
 * Video Call Modal Component
 * Full-screen modal for video calls with participant grid
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Signal,
  User,
} from 'lucide-react';
import { RemoteParticipant } from '@/hooks/use-video-call';

export interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  localUserName?: string;
}

export function VideoCallModal({
  isOpen,
  onClose,
  localStream,
  remoteParticipants,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  connectionQuality,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  localUserName = 'You',
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null);
  const [remoteMutedStates, setRemoteMutedStates] = useState<Map<string, boolean>>(new Map());

  /**
   * Setup local video stream
   */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /**
   * Setup remote video streams
   */
  useEffect(() => {
    remoteParticipants.forEach((participant) => {
      const videoElement = remoteVideoRefs.current.get(participant.id);
      if (videoElement && participant.stream) {
        videoElement.srcObject = participant.stream;

        // Listen for muted state changes
        participant.stream.getAudioTracks().forEach((track) => {
          track.onmute = () => {
            setRemoteMutedStates((prev) => new Map(prev).set(participant.id, true));
          };
          track.onunmute = () => {
            setRemoteMutedStates((prev) => new Map(prev).set(participant.id, false));
          };
        });
      }
    });
  }, [remoteParticipants]);

  /**
   * Handle end call
   */
  const handleEndCall = () => {
    onEndCall();
    onClose();
  };

  /**
   * Toggle fullscreen
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /**
   * Get grid layout class
   */
  const getGridLayoutClass = () => {
    const participantCount = remoteParticipants.length;

    if (participantCount === 0) {
      return 'grid-cols-1 grid-rows-1';
    } else if (participantCount === 1) {
      return 'grid-cols-1 grid-rows-1';
    } else if (participantCount === 2) {
      return 'grid-cols-2 grid-rows-1';
    } else if (participantCount <= 4) {
      return 'grid-cols-2 grid-rows-2';
    } else if (participantCount <= 6) {
      return 'grid-cols-3 grid-rows-2';
    } else {
      return 'grid-cols-3 grid-rows-3';
    }
  };

  /**
   * Get connection quality color and icon
   */
  const getConnectionQualityIndicator = () => {
    switch (connectionQuality) {
      case 'excellent':
        return { color: 'text-green-500', bars: 4 };
      case 'good':
        return { color: 'text-yellow-500', bars: 3 };
      case 'poor':
        return { color: 'text-orange-500', bars: 2 };
      case 'disconnected':
        return { color: 'text-red-500', bars: 1 };
      default:
        return { color: 'text-gray-500', bars: 0 };
    }
  };

  const qualityIndicator = getConnectionQualityIndicator();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-gray-900"
      >
        {/* Main video grid */}
        <div className="absolute inset-0 p-4">
          {remoteParticipants.length > 0 ? (
            <div className={`grid ${getGridLayoutClass()} gap-4 h-full`}>
              {remoteParticipants.map((participant) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative bg-gray-800 rounded-xl overflow-hidden group"
                  onMouseEnter={() => setHoveredParticipant(participant.id)}
                  onMouseLeave={() => setHoveredParticipant(null)}
                >
                  {/* Video element */}
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideoRefs.current.set(participant.id, el);
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Participant info overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredParticipant === participant.id ? 1 : 0 }}
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"
                  />

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                      <User className="w-4 h-4 text-white" />
                      <span className="text-white font-medium text-sm">
                        {participant.name}
                      </span>
                    </div>

                    {remoteMutedStates.get(participant.id) && (
                      <div className="bg-red-500 rounded-lg p-2">
                        <MicOff className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Connection status */}
                  {!participant.isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-3" />
                        <p className="text-white text-sm">Connecting...</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-600" />
                </div>
                <p className="text-white text-xl font-medium mb-2">
                  Waiting for participants...
                </p>
                <p className="text-gray-400 text-sm">
                  Your call will start when someone joins
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video preview (bottom-right corner) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20, y: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          className="absolute bottom-24 right-4 w-64 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10"
        >
          {isVideoEnabled && localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-2">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 text-xs">Camera off</p>
              </div>
            </div>
          )}

          {/* Local user info */}
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-white text-xs font-medium">{localUserName}</span>
          </div>

          {/* Muted indicator */}
          {isMuted && (
            <div className="absolute top-2 right-2 bg-red-500 rounded-lg p-1.5">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
        </motion.div>

        {/* Control bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between">
                {/* Left controls */}
                <div className="flex items-center gap-2">
                  {/* Connection quality */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg"
                    title={`Connection: ${connectionQuality}`}
                  >
                    <Signal className={`w-4 h-4 ${qualityIndicator.color}`} />
                    <span className="text-white text-xs font-medium capitalize">
                      {connectionQuality}
                    </span>
                  </div>
                </div>

                {/* Center controls */}
                <div className="flex items-center gap-3">
                  {/* Mute/Unmute */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isMuted
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  {/* Enable/Disable Video */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      !isVideoEnabled
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? (
                      <Video className="w-5 h-5 text-white" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-white" />
                    )}
                  </motion.button>

                  {/* Screen Share */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onToggleScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isScreenSharing
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    <Monitor className="w-5 h-5 text-white" />
                  </motion.button>

                  {/* End Call */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEndCall}
                    className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                    title="End call"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </motion.button>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  {/* Fullscreen toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFullscreen}
                    className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4 text-white" />
                    ) : (
                      <Maximize2 className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
