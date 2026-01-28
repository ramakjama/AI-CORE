/**
 * Softphone Widget Component
 * Floating softphone UI for web apps
 */

import React, { useState } from 'react';
import { useSoftphone, UseSoftphoneOptions } from './useSoftphone';

interface SoftphoneWidgetProps extends UseSoftphoneOptions {
  className?: string;
}

export const SoftphoneWidget: React.FC<SoftphoneWidgetProps> = ({
  config,
  onTokenRequest,
  autoConnect = true,
  className = '',
}) => {
  const softphone = useSoftphone({ config, onTokenRequest, autoConnect });
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialNumber, setDialNumber] = useState('');
  const [showDialer, setShowDialer] = useState(false);

  const handleCall = async () => {
    if (!dialNumber) return;

    try {
      await softphone.makeCall({
        to: dialNumber,
        record: true,
      });
      setDialNumber('');
      setShowDialer(false);
    } catch (error) {
      console.error('Failed to make call:', error);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (softphone.isInCall) {
      softphone.sendDigits(digit);
    } else {
      setDialNumber((prev) => prev + digit);
    }
  };

  const formatCallDuration = (call: any) => {
    if (!call?.startTime) return '00:00';

    const now = new Date();
    const duration = Math.floor((now.getTime() - call.startTime.getTime()) / 1000);
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!softphone.isReady) {
    return (
      <div className={`softphone-widget ${className}`}>
        <div className="softphone-loading">
          <div className="spinner"></div>
          <span>Conectando teléfono...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Button */}
      {!isExpanded && !softphone.isInCall && (
        <button
          className="softphone-fab"
          onClick={() => setIsExpanded(true)}
          title="Abrir teléfono"
        >
          📞
        </button>
      )}

      {/* Incoming Call Notification */}
      {softphone.currentCall?.status === 'ringing' && softphone.currentCall.direction === 'inbound' && (
        <div className="softphone-incoming">
          <div className="softphone-incoming-content">
            <div className="softphone-incoming-avatar">📱</div>
            <div className="softphone-incoming-info">
              <div className="softphone-incoming-title">Llamada entrante</div>
              <div className="softphone-incoming-number">{softphone.currentCall.from}</div>
            </div>
            <div className="softphone-incoming-actions">
              <button
                className="softphone-btn-answer"
                onClick={() => softphone.answerCall()}
              >
                ✅ Contestar
              </button>
              <button
                className="softphone-btn-reject"
                onClick={() => softphone.rejectCall()}
              >
                ❌ Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Widget */}
      {(isExpanded || softphone.isInCall) && (
        <div className={`softphone-widget expanded ${className}`}>
          {/* Header */}
          <div className="softphone-header">
            <div className="softphone-title">
              <span className="softphone-icon">📞</span>
              <span>Teléfono VoIP</span>
            </div>
            <button
              className="softphone-close"
              onClick={() => setIsExpanded(false)}
              disabled={softphone.isInCall}
            >
              ✕
            </button>
          </div>

          {/* Active Call */}
          {softphone.isInCall && softphone.currentCall && (
            <div className="softphone-active-call">
              <div className="softphone-call-info">
                <div className="softphone-call-avatar">👤</div>
                <div className="softphone-call-details">
                  <div className="softphone-call-number">
                    {softphone.currentCall.direction === 'inbound'
                      ? softphone.currentCall.from
                      : softphone.currentCall.to}
                  </div>
                  <div className="softphone-call-status">
                    {softphone.currentCall.status === 'in-progress' ? (
                      <span className="softphone-call-duration">
                        {formatCallDuration(softphone.currentCall)}
                      </span>
                    ) : (
                      <span>{softphone.currentCall.status}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Quality */}
              {softphone.callQuality && (
                <div className="softphone-quality">
                  <div className="softphone-quality-label">Calidad:</div>
                  <div className="softphone-quality-bar">
                    <div
                      className="softphone-quality-fill"
                      style={{ width: `${(softphone.callQuality.mos / 5) * 100}%` }}
                    />
                  </div>
                  <div className="softphone-quality-text">
                    {softphone.callQuality.mos >= 4
                      ? 'Excelente'
                      : softphone.callQuality.mos >= 3
                      ? 'Buena'
                      : 'Regular'}
                  </div>
                </div>
              )}

              {/* Call Controls */}
              <div className="softphone-controls">
                <button
                  className={`softphone-control ${softphone.isMuted ? 'active' : ''}`}
                  onClick={() => softphone.toggleMute()}
                  title={softphone.isMuted ? 'Activar micrófono' : 'Silenciar'}
                >
                  {softphone.isMuted ? '🔇' : '🎤'}
                </button>
                <button
                  className="softphone-control"
                  onClick={() => setShowDialer(!showDialer)}
                  title="Teclado"
                >
                  🔢
                </button>
                <button
                  className="softphone-control softphone-hangup"
                  onClick={() => softphone.hangUp()}
                  title="Colgar"
                >
                  📞
                </button>
              </div>
            </div>
          )}

          {/* Dialer */}
          {!softphone.isInCall && (
            <>
              <div className="softphone-input">
                <input
                  type="tel"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Número de teléfono"
                  className="softphone-number-input"
                />
                <button
                  className="softphone-call-btn"
                  onClick={handleCall}
                  disabled={!dialNumber}
                >
                  📞 Llamar
                </button>
              </div>

              {showDialer && (
                <div className="softphone-dialpad">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <button
                      key={digit}
                      className="softphone-dialpad-btn"
                      onClick={() => handleDigitClick(digit)}
                    >
                      {digit}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Error */}
          {softphone.error && (
            <div className="softphone-error">
              <span>{softphone.error}</span>
              <button onClick={() => softphone.clearError()}>✕</button>
            </div>
          )}

          {/* Status */}
          <div className="softphone-status">
            <div className="softphone-status-indicator">
              <span className="softphone-status-dot"></span>
              <span>Listo</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .softphone-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #0066ff;
          color: white;
          font-size: 24px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
          transition: all 0.3s;
          z-index: 9998;
        }

        .softphone-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 102, 255, 0.5);
        }

        .softphone-widget {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 320px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 9999;
          overflow: hidden;
        }

        .softphone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #0066ff;
          color: white;
        }

        .softphone-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .softphone-close {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .softphone-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .softphone-input {
          padding: 16px;
          display: flex;
          gap: 8px;
        }

        .softphone-number-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
        }

        .softphone-call-btn {
          padding: 12px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .softphone-call-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .softphone-dialpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 16px;
        }

        .softphone-dialpad-btn {
          padding: 16px;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .softphone-dialpad-btn:hover {
          background: #e5e7eb;
        }

        .softphone-active-call {
          padding: 24px;
        }

        .softphone-call-info {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .softphone-call-avatar {
          width: 48px;
          height: 48px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .softphone-call-number {
          font-size: 18px;
          font-weight: 600;
        }

        .softphone-call-status {
          font-size: 14px;
          color: #6b7280;
        }

        .softphone-controls {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .softphone-control {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #f3f4f6;
          border: none;
          font-size: 24px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .softphone-control:hover {
          background: #e5e7eb;
        }

        .softphone-control.active {
          background: #ef4444;
          color: white;
        }

        .softphone-hangup {
          background: #ef4444;
          color: white;
        }

        .softphone-hangup:hover {
          background: #dc2626;
        }

        .softphone-status {
          padding: 12px 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .softphone-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .softphone-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .softphone-incoming {
          position: fixed;
          top: 24px;
          right: 24px;
          width: 360px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          padding: 20px;
          z-index: 10000;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .softphone-incoming-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .softphone-incoming-avatar {
          width: 64px;
          height: 64px;
          background: #e5e7eb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin: 0 auto;
        }

        .softphone-incoming-title {
          font-size: 18px;
          font-weight: 600;
          text-align: center;
        }

        .softphone-incoming-number {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          color: #0066ff;
        }

        .softphone-incoming-actions {
          display: flex;
          gap: 12px;
        }

        .softphone-btn-answer,
        .softphone-btn-reject {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .softphone-btn-answer {
          background: #10b981;
          color: white;
        }

        .softphone-btn-answer:hover {
          background: #059669;
        }

        .softphone-btn-reject {
          background: #ef4444;
          color: white;
        }

        .softphone-btn-reject:hover {
          background: #dc2626;
        }
      `}</style>
    </>
  );
};
