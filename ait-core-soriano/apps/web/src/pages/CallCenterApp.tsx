/**
 * Call Center App - Complete Integration Example
 *
 * This is a COMPLETE working example that integrates:
 * - AIT-COMMS-DEVICE (UI)
 * - useAITCore hook (API + WebSocket)
 * - All backend services
 */

import React, { useState, useEffect } from 'react';
import { AITECHDevice } from '@ait-core/ait-comms-device';
import { useAITCore } from '../hooks/useAITCore';

export function CallCenterApp() {
  // AIT-CORE integration
  const aitCore = useAITCore({
    apiBaseURL: 'http://localhost:3000',
    wsBaseURL: 'http://localhost:4000',
    onTokenRequest: async () => {
      // Get token from localStorage or auth context
      return localStorage.getItem('accessToken') || '';
    }
  });

  // Local state
  const [showQuotePanel, setShowQuotePanel] = useState(false);
  const [quoteResults, setQuoteResults] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    // When call comes in, automatically join the call room
    if (aitCore.currentCall) {
      aitCore.joinCall(aitCore.currentCall.callSid);

      // Set agent status to "in_call"
      aitCore.changeAgentStatus('in_call');
    } else {
      // No call, set to available
      if (aitCore.agentStatus === 'in_call') {
        aitCore.changeAgentStatus('available');
      }
    }

    return () => {
      if (aitCore.currentCall) {
        aitCore.leaveCall(aitCore.currentCall.callSid);
      }
    };
  }, [aitCore.currentCall]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Handle quote request
   */
  const handleQuoteRequest = async () => {
    if (!aitCore.currentCall || !aitCore.callContext?.customer) {
      alert('No active call or customer');
      return;
    }

    setShowQuotePanel(true);
    setLoadingQuote(true);

    try {
      // Example: Auto insurance quote
      const quote = await aitCore.createQuote({
        customerId: aitCore.callContext.customer.id,
        type: 'auto',
        callSid: aitCore.currentCall.callSid,
        vehicleData: {
          licensePlate: '1234ABC',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          usage: 'personal',
          annualKm: 15000,
          parkingType: 'garage',
          drivers: [
            {
              name: aitCore.callContext.customer.name,
              dni: aitCore.callContext.customer.dni,
              dateOfBirth: new Date('1985-01-15'),
              licenseDate: new Date('2003-05-20'),
              age: 39,
              experience: 21,
              claims: 0,
              isPrimary: true
            }
          ]
        }
      });

      setQuoteResults(quote);
    } catch (err: any) {
      console.error('Quote error:', err);
      alert('Error creating quote: ' + err.message);
    } finally {
      setLoadingQuote(false);
    }
  };

  /**
   * Accept quote and create policy
   */
  const handleAcceptQuote = async () => {
    if (!quoteResults) return;

    try {
      const policy = await aitCore.createPolicy({
        customerId: quoteResults.customerId,
        quoteId: quoteResults.id,
        type: quoteResults.type,
        premium: quoteResults.calculatedPremium,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 year
        vehicleData: quoteResults.vehicleData,
        status: 'pending_payment',
        createdDuringCallSid: aitCore.currentCall?.callSid
      });

      alert('Policy created successfully: ' + policy.policyNumber);

      setShowQuotePanel(false);
      setQuoteResults(null);
    } catch (err: any) {
      console.error('Policy creation error:', err);
      alert('Error creating policy: ' + err.message);
    }
  };

  /**
   * Handle call end
   */
  const handleCallEnd = async (callData: any) => {
    if (!aitCore.currentCall) return;

    try {
      // Create interaction record
      await aitCore.createInteraction({
        customerId: aitCore.callContext?.customer?.id,
        agentId: aitCore.user?.agentId,
        type: 'phone_call',
        direction: 'inbound',
        channel: 'phone',
        duration: callData.duration,
        outcome: callData.outcome,
        callSid: aitCore.currentCall.callSid,
        summary: callData.summary || '',
        metadata: {
          callSid: aitCore.currentCall.callSid,
          quality: callData.quality
        }
      });

      console.log('✅ Interaction created');
    } catch (err) {
      console.error('Error creating interaction:', err);
    }
  };

  /**
   * Schedule callback task
   */
  const handleScheduleCallback = async () => {
    if (!aitCore.callContext?.customer) return;

    try {
      const task = await aitCore.createTask({
        type: 'callback',
        title: 'Follow-up call',
        description: 'Customer requested callback',
        customerId: aitCore.callContext.customer.id,
        assignedTo: aitCore.user?.agentId,
        priority: 'normal',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        callbackPhone: aitCore.callContext.customer.phone,
        source: 'manual',
        metadata: {
          requestedDuringCall: aitCore.currentCall?.callSid
        }
      });

      alert('Callback scheduled for tomorrow');
    } catch (err: any) {
      console.error('Task creation error:', err);
      alert('Error scheduling callback: ' + err.message);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0f1117 50%, #000000 100%)'
      }}
    >
      {/* LEFT PANEL - AINTECH Device */}
      <div
        style={{
          flex: '0 0 450px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 20px'
        }}
      >
        <AITECHDevice />
      </div>

      {/* RIGHT PANEL - Customer Context & Tools */}
      <div
        style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          color: '#fff'
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            Agent Dashboard
          </h1>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <strong>Agent:</strong> {aitCore.user?.name || 'Loading...'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <span
                style={{
                  color:
                    aitCore.agentStatus === 'available'
                      ? '#00FF88'
                      : aitCore.agentStatus === 'in_call'
                      ? '#00D9FF'
                      : '#666'
                }}
              >
                {aitCore.agentStatus}
              </span>
            </div>
            <div>
              <strong>WebSocket:</strong>{' '}
              <span style={{ color: aitCore.connected ? '#00FF88' : '#FF3366' }}>
                {aitCore.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* ACTIVE CALL SECTION */}
        {aitCore.currentCall && aitCore.callContext && (
          <div
            style={{
              background: 'rgba(0, 217, 255, 0.05)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#00D9FF'
              }}
            >
              📞 Active Call
            </h2>

            {/* Customer Info */}
            {aitCore.callContext.customer && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                  {aitCore.callContext.customer.name}
                </h3>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  📱 {aitCore.callContext.customer.phone}
                  <br />
                  📧 {aitCore.callContext.customer.email}
                  <br />
                  ⭐ Segment: {aitCore.callContext.customer.segment}
                  <br />
                  📅 Customer since {aitCore.callContext.customer.yearsAsCustomer} years
                </div>
              </div>
            )}

            {/* Policies */}
            {aitCore.callContext.policies && aitCore.callContext.policies.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>
                  Active Policies ({aitCore.callContext.policies.length})
                </h4>
                {aitCore.callContext.policies.map((policy: any) => (
                  <div
                    key={policy.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <strong>{policy.type.toUpperCase()}</strong> - {policy.policyNumber}
                    <br />
                    Premium: {policy.premium}€/year
                    <br />
                    Renewal: {new Date(policy.renewalDate).toLocaleDateString()}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleQuoteRequest}
                disabled={loadingQuote}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #00D9FF, #00FFA3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {loadingQuote ? 'Loading...' : '💰 Create Quote'}
              </button>

              <button
                onClick={handleScheduleCallback}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(180, 255, 57, 0.2)',
                  border: '1px solid #B4FF39',
                  borderRadius: '8px',
                  color: '#B4FF39',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                📞 Schedule Callback
              </button>
            </div>
          </div>
        )}

        {/* QUOTE RESULTS PANEL */}
        {showQuotePanel && quoteResults && (
          <div
            style={{
              background: 'rgba(180, 255, 57, 0.05)',
              border: '1px solid rgba(180, 255, 57, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#B4FF39'
              }}
            >
              💰 Quote Results
            </h2>

            <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>
              {quoteResults.calculatedPremium}€ / year
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h4>Breakdown:</h4>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                Base: {quoteResults.breakdown.base}€
                <br />
                Discounts applied: {JSON.stringify(quoteResults.breakdown.discounts)}
                <br />
                Final: {quoteResults.breakdown.final}€
              </div>
            </div>

            {quoteResults.competitorPrices &&
              quoteResults.competitorPrices.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>Competitor Prices:</h4>
                  {quoteResults.competitorPrices.map((comp: any, idx: number) => (
                    <div key={idx} style={{ fontSize: '14px' }}>
                      {comp.carrier}: {comp.price}€
                    </div>
                  ))}
                </div>
              )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAcceptQuote}
                style={{
                  padding: '12px 24px',
                  background: '#00FF88',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✅ Accept & Create Policy
              </button>

              <button
                onClick={() => setShowQuotePanel(false)}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 51, 102, 0.2)',
                  border: '1px solid #FF3366',
                  borderRadius: '8px',
                  color: '#FF3366',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {aitCore.notifications.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>
              🔔 Notifications ({aitCore.notifications.filter((n) => !n.read).length})
            </h3>

            {aitCore.notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                onClick={() => aitCore.markNotificationRead(notif.id)}
                style={{
                  background: notif.read ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 217, 255, 0.1)',
                  border: `1px solid ${notif.read ? '#333' : '#00D9FF'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  opacity: notif.read ? 0.5 : 1
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {notif.title}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  {notif.message}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                  {new Date(notif.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NO ACTIVE CALL */}
        {!aitCore.currentCall && (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 32px',
              opacity: 0.5
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📞</div>
            <div style={{ fontSize: '18px' }}>Waiting for calls...</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Your status: {aitCore.agentStatus}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallCenterApp;
