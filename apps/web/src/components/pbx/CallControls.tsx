/**
 * CallControls component - Control buttons for call operations
 */

import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneForwarded,
  Circle,
  Square,
} from 'lucide-react';
import { CallState } from '@/types/pbx';

interface CallControlsProps {
  callState: CallState;
  isOnHold: boolean;
  isMuted: boolean;
  isRecording: boolean;
  onAnswer?: () => void;
  onHangup?: () => void;
  onHold?: () => void;
  onUnhold?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onTransfer?: () => void;
  onToggleRecording?: () => void;
  duration?: number;
}

export function CallControls({
  callState,
  isOnHold,
  isMuted,
  isRecording,
  onAnswer,
  onHangup,
  onHold,
  onUnhold,
  onMute,
  onUnmute,
  onTransfer,
  onToggleRecording,
  duration = 0,
}: CallControlsProps) {
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isInCall = callState === CallState.IN_CALL || callState === CallState.ON_HOLD;
  const isRinging = callState === CallState.RINGING;

  return (
    <div className="space-y-4">
      {/* Call Duration */}
      {isInCall && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
            <div className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm font-mono font-medium text-gray-700">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      )}

      {/* Primary Controls */}
      <div className="flex items-center justify-center gap-3">
        {/* Answer Button (only when ringing) */}
        {isRinging && onAnswer && (
          <button
            onClick={onAnswer}
            className="flex items-center justify-center h-14 w-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            title="Answer Call"
            type="button"
          >
            <Phone className="h-6 w-6" />
          </button>
        )}

        {/* Hangup Button */}
        {(isInCall || isRinging) && onHangup && (
          <button
            onClick={onHangup}
            className="flex items-center justify-center h-14 w-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            title="Hang Up"
            type="button"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Secondary Controls (only during active call) */}
      {isInCall && (
        <div className="grid grid-cols-4 gap-2">
          {/* Hold/Unhold */}
          <button
            onClick={isOnHold ? onUnhold : onHold}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
              isOnHold
                ? 'bg-yellow-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isOnHold ? 'Resume' : 'Hold'}
            type="button"
          >
            {isOnHold ? (
              <Play className="h-5 w-5 mb-1" />
            ) : (
              <Pause className="h-5 w-5 mb-1" />
            )}
            <span className="text-xs font-medium">
              {isOnHold ? 'Resume' : 'Hold'}
            </span>
          </button>

          {/* Mute/Unmute */}
          <button
            onClick={isMuted ? onUnmute : onMute}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
              isMuted
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
            type="button"
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 mb-1" />
            ) : (
              <Mic className="h-5 w-5 mb-1" />
            )}
            <span className="text-xs font-medium">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Transfer */}
          {onTransfer && (
            <button
              onClick={() => setShowTransferDialog(true)}
              className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
              title="Transfer Call"
              type="button"
            >
              <PhoneForwarded className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Transfer</span>
            </button>
          )}

          {/* Record */}
          {onToggleRecording && (
            <button
              onClick={onToggleRecording}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                isRecording
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              type="button"
            >
              {isRecording ? (
                <Square className="h-5 w-5 mb-1 fill-current" />
              ) : (
                <Circle className="h-5 w-5 mb-1" />
              )}
              <span className="text-xs font-medium">
                {isRecording ? 'Stop' : 'Record'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Transfer Call</h3>
            <input
              type="text"
              placeholder="Enter phone number or extension"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowTransferDialog(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onTransfer?.();
                  setShowTransferDialog(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                type="button"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
