/**
 * Softphone App
 * High-tech FUI softphone interface for AINTECH Device
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, PhoneMissed, Mic, MicOff, Pause, Play, Users, PhoneForwarded } from 'lucide-react';
import { HolographicPanel } from './components/HolographicPanel';
import { WaveformVisualizer } from './components/WaveformVisualizer';

interface SoftphoneAppProps {
  onCallStateChange: (state: 'idle' | 'ringing' | 'active') => void;
}

type CallState = 'idle' | 'incoming' | 'outgoing' | 'active' | 'hold';

interface Call {
  id: string;
  name: string;
  number: string;
  avatar?: string;
  duration?: number;
  quality?: number;
}

export const SoftphoneApp: React.FC<SoftphoneAppProps> = ({ onCallStateChange }) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  // Simulate incoming call
  const simulateIncomingCall = () => {
    const call: Call = {
      id: 'call-1',
      name: 'Juan Pérez',
      number: '+34 612 345 678',
      quality: 4.2
    };
    setCurrentCall(call);
    setCallState('incoming');
    onCallStateChange('ringing');
  };

  const answerCall = () => {
    setCallState('active');
    onCallStateChange('active');

    // Start duration counter
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  };

  const rejectCall = () => {
    setCurrentCall(null);
    setCallState('idle');
    setCallDuration(0);
    onCallStateChange('idle');
  };

  const endCall = () => {
    setCurrentCall(null);
    setCallState('idle');
    setCallDuration(0);
    setIsMuted(false);
    onCallStateChange('idle');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dialpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <div className="softphone-app">
      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {callState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="softphone-idle"
          >
            <HolographicPanel title="SOFTPHONE">
              {/* Dialpad */}
              <div className="dialpad-container">
                <input
                  type="tel"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter number..."
                  className="dial-input"
                />

                <div className="dialpad-grid">
                  {dialpadKeys.map((row, i) => (
                    <div key={i} className="dialpad-row">
                      {row.map((key) => (
                        <button
                          key={key}
                          className="dialpad-key"
                          onClick={() => setDialNumber(prev => prev + key)}
                        >
                          <span className="key-number">{key}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <button
                  className="call-button call-button--primary"
                  onClick={simulateIncomingCall}
                  disabled={!dialNumber}
                >
                  <Phone size={24} />
                  <span>Call</span>
                </button>
              </div>
            </HolographicPanel>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="quick-action-btn">
                <Users size={20} />
                <span>Contacts</span>
              </button>
              <button className="quick-action-btn">
                <PhoneMissed size={20} />
                <span>Recent</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* INCOMING CALL */}
        {callState === 'incoming' && currentCall && (
          <motion.div
            key="incoming"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="softphone-incoming"
          >
            <HolographicPanel variant="alert" glowIntensity={1.5}>
              <div className="incoming-call-header">
                <div className="incoming-pulse" />
                <span className="incoming-label">INCOMING CALL</span>
              </div>

              <div className="caller-info">
                <div className="caller-avatar">
                  <div className="avatar-ring" />
                  <span className="avatar-icon">👤</span>
                </div>

                <div className="caller-details">
                  <h2 className="caller-name">{currentCall.name}</h2>
                  <p className="caller-number">{currentCall.number}</p>
                </div>
              </div>

              {/* Context preview */}
              <div className="context-preview">
                <div className="context-item">
                  <span className="context-label">Last contact:</span>
                  <span className="context-value">2 months ago</span>
                </div>
                <div className="context-item">
                  <span className="context-label">Policy:</span>
                  <span className="context-value">Vida #4567</span>
                </div>
              </div>

              {/* Actions */}
              <div className="call-actions-incoming">
                <button className="action-btn action-btn--reject" onClick={rejectCall}>
                  <PhoneOff size={28} />
                  <span>Reject</span>
                </button>
                <button className="action-btn action-btn--answer" onClick={answerCall}>
                  <Phone size={28} />
                  <span>Answer</span>
                </button>
              </div>
            </HolographicPanel>
          </motion.div>
        )}

        {/* ACTIVE CALL */}
        {callState === 'active' && currentCall && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="softphone-active"
          >
            <HolographicPanel title="ACTIVE CALL" variant="primary" glowIntensity={1.2}>
              {/* Call status */}
              <div className="call-status-bar">
                <div className="status-dot status-dot--active" />
                <span className="call-duration">{formatDuration(callDuration)}</span>
                <div className="quality-indicator">
                  <span className="quality-label">MOS:</span>
                  <span className="quality-value">{currentCall.quality}</span>
                </div>
              </div>

              {/* Caller info */}
              <div className="active-caller-info">
                <div className="active-caller-avatar">
                  <span className="avatar-icon">👤</span>
                  <div className="speaking-ring" />
                </div>
                <h2 className="active-caller-name">{currentCall.name}</h2>
                <p className="active-caller-number">{currentCall.number}</p>
              </div>

              {/* Waveform visualizer */}
              <div className="waveform-container">
                <WaveformVisualizer isActive={!isMuted} />
              </div>

              {/* Network quality */}
              <div className="network-quality">
                <div className="quality-bar">
                  <div className="quality-fill" style={{ width: '85%' }} />
                </div>
                <span className="quality-text">Network: Good</span>
              </div>

              {/* Controls */}
              <div className="call-controls">
                <button
                  className={`control-btn ${isMuted ? 'control-btn--active' : ''}`}
                  onClick={toggleMute}
                >
                  {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>

                <button className="control-btn">
                  <Pause size={24} />
                  <span>Hold</span>
                </button>

                <button className="control-btn">
                  <PhoneForwarded size={24} />
                  <span>Transfer</span>
                </button>

                <button className="control-btn control-btn--danger" onClick={endCall}>
                  <PhoneOff size={24} />
                  <span>End</span>
                </button>
              </div>
            </HolographicPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .softphone-app {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* DIALPAD */
        .dialpad-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dial-input {
          width: 100%;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          color: #FFFFFF;
          text-align: center;
          letter-spacing: 0.1em;
        }

        .dial-input::placeholder {
          color: rgba(160, 168, 193, 0.5);
        }

        .dialpad-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .dialpad-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .dialpad-key {
          aspect-ratio: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dialpad-key:hover {
          background: rgba(0, 217, 255, 0.1);
          border-color: rgba(0, 217, 255, 0.5);
          transform: translateY(-2px);
        }

        .dialpad-key:active {
          transform: scale(0.95);
          box-shadow: 0 0 20px rgba(0, 217, 255, 0.4);
        }

        .key-number {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .call-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          background: #00D9FF;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #0A0E17;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .call-button:hover {
          background: #00B8E6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 217, 255, 0.4);
        }

        .call-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          transform: none;
        }

        /* QUICK ACTIONS */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: rgba(20, 24, 36, 0.7);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 12px;
          color: #A0A8C1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          border-color: rgba(0, 217, 255, 0.5);
          color: #00D9FF;
          transform: translateY(-2px);
        }

        /* INCOMING CALL */
        .incoming-call-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .incoming-pulse {
          width: 12px;
          height: 12px;
          background: #FF3366;
          border-radius: 50%;
          animation: pulse-glow 1.5s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }

        .incoming-label {
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #FF3366;
        }

        .caller-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .caller-avatar {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00D9FF, #B4FF39);
          border-radius: 50%;
          font-size: 40px;
        }

        .avatar-ring {
          position: absolute;
          inset: -4px;
          border: 2px solid #FF3366;
          border-radius: 50%;
          animation: pulse-ring 2s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0; }
        }

        .caller-details {
          text-align: center;
        }

        .caller-name {
          font-size: 24px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 4px;
        }

        .caller-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          color: #A0A8C1;
        }

        .context-preview {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 24px;
        }

        .context-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 12px;
        }

        .context-label {
          color: #6B7280;
        }

        .context-value {
          color: #00D9FF;
          font-weight: 600;
        }

        .call-actions-incoming {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          border: 2px solid;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn--reject {
          background: rgba(255, 51, 102, 0.1);
          border-color: #FF3366;
          color: #FF3366;
        }

        .action-btn--reject:hover {
          background: #FF3366;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255, 51, 102, 0.4);
        }

        .action-btn--answer {
          background: rgba(0, 255, 136, 0.1);
          border-color: #00FF88;
          color: #00FF88;
        }

        .action-btn--answer:hover {
          background: #00FF88;
          color: #0A0E17;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 255, 136, 0.4);
        }

        /* ACTIVE CALL */
        .call-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .status-dot--active {
          background: #00FF88;
        }

        .call-duration {
          font-family: 'JetBrains Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .quality-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
        }

        .quality-label {
          color: #6B7280;
        }

        .quality-value {
          color: #00D9FF;
          font-weight: 700;
        }

        .active-caller-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .active-caller-avatar {
          position: relative;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00D9FF, #B4FF39);
          border-radius: 50%;
          font-size: 32px;
        }

        .speaking-ring {
          position: absolute;
          inset: -4px;
          border: 2px solid #00FF88;
          border-radius: 50%;
          animation: pulse-ring 1.5s ease-in-out infinite;
        }

        .active-caller-name {
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .active-caller-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #A0A8C1;
        }

        .waveform-container {
          margin: 24px 0;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          border: 1px solid rgba(0, 217, 255, 0.2);
        }

        .network-quality {
          margin-bottom: 24px;
        }

        .quality-bar {
          width: 100%;
          height: 4px;
          background: rgba(107, 114, 128, 0.3);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .quality-fill {
          height: 100%;
          background: linear-gradient(90deg, #00FF88, #00D9FF);
          transition: width 0.3s ease;
        }

        .quality-text {
          font-size: 12px;
          color: #6B7280;
        }

        .call-controls {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .control-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 217, 255, 0.2);
          border-radius: 8px;
          color: #A0A8C1;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover {
          background: rgba(0, 217, 255, 0.1);
          border-color: rgba(0, 217, 255, 0.5);
          color: #00D9FF;
          transform: translateY(-2px);
        }

        .control-btn--active {
          background: rgba(255, 51, 102, 0.2);
          border-color: #FF3366;
          color: #FF3366;
        }

        .control-btn--danger {
          grid-column: span 2;
          background: rgba(255, 51, 102, 0.1);
          border-color: #FF3366;
          color: #FF3366;
        }

        .control-btn--danger:hover {
          background: #FF3366;
          color: #FFFFFF;
        }
      `}</style>
    </div>
  );
};
