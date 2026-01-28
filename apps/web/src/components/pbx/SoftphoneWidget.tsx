/**
 * SoftphoneWidget component - Main integrated softphone for the ERP
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Minimize2,
  Maximize2,
  X,
  PhoneCall,
  Clock,
  Grid3x3,
  MessageSquare,
  Sparkles,
  User,
  History,
  Star,
} from 'lucide-react';
import { SoftphoneConfig, CallState, AgentStatus, ClientContextData } from '@/types/pbx';
import { useCall } from '@/hooks/pbx/useCall';
import { useTranscription } from '@/hooks/pbx/useTranscription';
import { useAISuggestions } from '@/hooks/pbx/useAISuggestions';
import { useAgentStatus } from '@/hooks/pbx/useAgentStatus';
import { getPBXClient } from '@/lib/pbx/websocket-client';
import { getNotificationManager } from '@/lib/pbx/notification-utils';
import { CallInfo } from './CallInfo';
import { NumericKeypad } from './NumericKeypad';
import { CallControls } from './CallControls';
import { LiveTranscription } from './LiveTranscription';
import { AISuggestions } from './AISuggestions';
import { ClientContext } from './ClientContext';

export interface SoftphoneWidgetProps extends SoftphoneConfig {
  onClose?: () => void;
  className?: string;
}

type ActiveTab = 'keypad' | 'transcription' | 'suggestions' | 'client' | 'history';

export function SoftphoneWidget({
  agentId,
  position = 'bottom-right',
  defaultMinimized = true,
  enableNotifications = true,
  enableDesktopNotifications = true,
  enableSounds = true,
  autoAnswer = false,
  recordingEnabled = true,
  onClose,
  className = '',
}: SoftphoneWidgetProps) {
  // State
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<ActiveTab>('keypad');
  const [clientData, setClientData] = useState<ClientContextData | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);

  // Hooks
  const {
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
  } = useCall(agentId);

  const {
    segments,
    currentSegment,
    isTranscribing,
    searchQuery,
    setSearchQuery,
    filteredSegments,
    clearTranscription,
    exportTranscription,
  } = useTranscription(currentCall?.id || null);

  const {
    suggestions,
    unreadCount,
    filterByType,
    dismissSuggestion,
    markAsRead,
    markAllAsRead,
  } = useAISuggestions(currentCall?.id || null);

  const { status, setStatus, isAvailable, statusDuration } = useAgentStatus(
    agentId,
    AgentStatus.AVAILABLE
  );

  // WebSocket connection
  useEffect(() => {
    const pbxClient = getPBXClient(agentId);
    pbxClient.connect().catch((error) => {
      console.error('Failed to connect to PBX:', error);
    });

    return () => {
      pbxClient.disconnect();
    };
  }, [agentId]);

  // Desktop notifications
  useEffect(() => {
    if (enableDesktopNotifications) {
      const notificationManager = getNotificationManager();
      notificationManager.requestPermission();
    }
  }, [enableDesktopNotifications]);

  // Auto-expand when call comes in
  useEffect(() => {
    if (callState === CallState.RINGING && isMinimized) {
      setIsMinimized(false);
    }
  }, [callState, isMinimized]);

  // Load client data when call starts
  useEffect(() => {
    if (currentCall?.clientId && !clientData) {
      loadClientData(currentCall.clientId);
    }
  }, [currentCall?.clientId]);

  // Auto-answer if enabled
  useEffect(() => {
    if (autoAnswer && callState === CallState.RINGING) {
      answer();
    }
  }, [autoAnswer, callState, answer]);

  // Switch to relevant tab based on call state
  useEffect(() => {
    if (callState === CallState.IN_CALL && activeTab === 'keypad') {
      setActiveTab('transcription');
    }
  }, [callState]);

  // Load client data
  const loadClientData = async (clientId: string) => {
    setIsLoadingClient(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();
      setClientData(data);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setIsLoadingClient(false);
    }
  };

  // Get position classes
  const getPositionClasses = () => {
    if (isDragging) return '';

    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'top-right':
        return 'top-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'bottom-6 right-6';
    }
  };

  // Handle drag
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    setDragPosition({ x: info.point.x, y: info.point.y });
  };

  // Get agent status color
  const getStatusColor = () => {
    switch (status) {
      case AgentStatus.AVAILABLE:
        return 'bg-green-500';
      case AgentStatus.ON_CALL:
        return 'bg-blue-500';
      case AgentStatus.BREAK:
        return 'bg-yellow-500';
      case AgentStatus.BUSY:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'keypad' as ActiveTab, label: 'Keypad', icon: Grid3x3 },
    { id: 'transcription' as ActiveTab, label: 'Transcript', icon: MessageSquare, badge: segments.length },
    { id: 'suggestions' as ActiveTab, label: 'AI', icon: Sparkles, badge: unreadCount },
    { id: 'client' as ActiveTab, label: 'Client', icon: User },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
  ];

  // Minimized view
  if (isMinimized) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`fixed ${getPositionClasses()} ${className} z-50`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={`relative group h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 ${
            callState === CallState.RINGING
              ? 'bg-green-500 animate-bounce'
              : callState === CallState.IN_CALL
              ? 'bg-blue-600'
              : 'bg-gradient-to-br from-blue-600 to-purple-600'
          }`}
          type="button"
        >
          {/* Status indicator */}
          <div className={`absolute -top-1 -right-1 h-4 w-4 ${getStatusColor()} rounded-full border-2 border-white`} />

          {/* Icon */}
          {callState === CallState.IN_CALL ? (
            <PhoneCall className="h-8 w-8 text-white animate-pulse" />
          ) : (
            <Phone className="h-8 w-8 text-white" />
          )}

          {/* Badge */}
          {(unreadCount > 0 || callState === CallState.RINGING) && (
            <div className="absolute -top-1 -left-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-white text-xs font-bold">
                {callState === CallState.RINGING ? '!' : unreadCount}
              </span>
            </div>
          )}
        </button>
      </motion.div>
    );
  }

  // Expanded view
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`fixed ${getPositionClasses()} ${className} z-50`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={
        isDragging
          ? {
              x: dragPosition.x,
              y: dragPosition.y,
            }
          : {}
      }
    >
      <div className="w-[420px] h-[700px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          {/* Drag handle */}
          <div className="absolute inset-0 cursor-move" />

          <div className="relative flex items-center gap-3">
            <div className="relative">
              <Phone className="h-5 w-5" />
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${getStatusColor()} rounded-full border-2 border-white`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Softphone</h2>
              <p className="text-xs opacity-90">{status}</p>
            </div>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              type="button"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Call Info */}
        <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
          <CallInfo call={currentCall} callState={callState} duration={callStats?.duration} />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                type="button"
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <div className="absolute top-1 right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{tab.badge}</span>
                  </div>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'keypad' && (
                <div className="h-full overflow-y-auto p-4">
                  <NumericKeypad
                    onDigitPress={sendDTMF}
                    disabled={callState !== CallState.IN_CALL}
                  />
                </div>
              )}

              {activeTab === 'transcription' && (
                <LiveTranscription
                  segments={segments}
                  currentSegment={currentSegment}
                  isTranscribing={isTranscribing}
                  onExport={exportTranscription}
                />
              )}

              {activeTab === 'suggestions' && (
                <AISuggestions
                  suggestions={suggestions}
                  unreadCount={unreadCount}
                  onDismiss={dismissSuggestion}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              )}

              {activeTab === 'client' && (
                <ClientContext
                  clientData={clientData}
                  loading={isLoadingClient}
                  onViewFullProfile={() => {
                    if (currentCall?.clientId) {
                      window.open(`/clients/${currentCall.clientId}`, '_blank');
                    }
                  }}
                />
              )}

              {activeTab === 'history' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Call history coming soon</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Call Controls */}
        <div className="px-4 py-4 border-t border-gray-200 bg-white">
          <CallControls
            callState={callState}
            isOnHold={isOnHold}
            isMuted={isMuted}
            isRecording={isRecording && recordingEnabled}
            duration={callStats?.duration}
            onAnswer={answer}
            onHangup={hangup}
            onHold={hold}
            onUnhold={unhold}
            onMute={mute}
            onUnmute={unmute}
            onTransfer={() => transfer('1234')} // TODO: Implement transfer dialog
            onToggleRecording={recordingEnabled ? toggleRecording : undefined}
          />
        </div>
      </div>
    </motion.div>
  );
}
