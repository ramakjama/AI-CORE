/**
 * CallInfo component - Displays information about the current call
 */

import React from 'react';
import { CallInfo as CallInfoType, CallDirection, CallState } from '@/types/pbx';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, User } from 'lucide-react';

interface CallInfoProps {
  call: CallInfoType | null;
  callState: CallState;
  duration?: number;
}

export function CallInfo({ call, callState, duration }: CallInfoProps) {
  if (!call) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Phone className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No active call</p>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStateLabel = (): string => {
    switch (callState) {
      case CallState.RINGING:
        return call.direction === CallDirection.INBOUND ? 'Incoming Call' : 'Calling...';
      case CallState.IN_CALL:
        return 'In Call';
      case CallState.ON_HOLD:
        return 'On Hold';
      case CallState.ENDED:
        return 'Call Ended';
      default:
        return '';
    }
  };

  const getCallStateColor = (): string => {
    switch (callState) {
      case CallState.RINGING:
        return 'text-blue-600 bg-blue-100';
      case CallState.IN_CALL:
        return 'text-green-600 bg-green-100';
      case CallState.ON_HOLD:
        return 'text-yellow-600 bg-yellow-100';
      case CallState.ENDED:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const DirectionIcon = call.direction === CallDirection.INBOUND ? PhoneIncoming : PhoneOutgoing;

  return (
    <div className="space-y-4">
      {/* Call State Badge */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getCallStateColor()}`}>
          <DirectionIcon className="h-3.5 w-3.5" />
          <span>{getCallStateLabel()}</span>
        </div>

        {callState === CallState.IN_CALL && duration !== undefined && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Caller Information */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {call.clientPhoto ? (
            <img
              src={call.clientPhoto}
              alt={call.clientName || 'Caller'}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-lg"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-white shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
          )}

          {/* Segment Badge */}
          {call.clientSegment && (
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full border-2 border-white shadow">
              {call.clientSegment}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {call.clientName || 'Unknown Caller'}
          </h3>
          <p className="text-sm text-gray-600 font-mono">{call.phoneNumber}</p>

          {call.predictedReason && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md">
              <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" />
              {call.predictedReason}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {call.clientId && (
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <div className="text-xs text-gray-500">Active Policies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">2</div>
            <div className="text-xs text-gray-500">Pending Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-xs text-gray-500">Open Claims</div>
          </div>
        </div>
      )}
    </div>
  );
}
