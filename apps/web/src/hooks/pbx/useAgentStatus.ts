/**
 * useAgentStatus hook - Manages agent availability status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AgentStatus } from '@/types/pbx';
import { getPBXClient } from '@/lib/pbx/websocket-client';

export interface UseAgentStatusReturn {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
  isAvailable: boolean;
  statusDuration: number;
  lastStatusChange: Date | null;
}

export function useAgentStatus(agentId: string, initialStatus: AgentStatus = AgentStatus.OFFLINE): UseAgentStatusReturn {
  const [status, setStatusState] = useState<AgentStatus>(initialStatus);
  const [lastStatusChange, setLastStatusChange] = useState<Date | null>(null);
  const [statusDuration, setStatusDuration] = useState(0);

  const pbxClientRef = useRef(getPBXClient(agentId));
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate if agent is available
  const isAvailable = status === AgentStatus.AVAILABLE;

  // Set status with server sync
  const setStatus = useCallback(
    (newStatus: AgentStatus) => {
      if (newStatus === status) return;

      pbxClientRef.current.updateAgentStatus(newStatus);
      setStatusState(newStatus);
      setLastStatusChange(new Date());
      setStatusDuration(0);
    },
    [status]
  );

  // Update status duration
  useEffect(() => {
    if (!lastStatusChange) return;

    durationIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastStatusChange.getTime()) / 1000);
      setStatusDuration(elapsed);
    }, 1000);

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [lastStatusChange]);

  // Auto-update status based on call state
  useEffect(() => {
    const pbxClient = pbxClientRef.current;

    const unsubIncoming = pbxClient.on('call.incoming', () => {
      if (status === AgentStatus.AVAILABLE) {
        setStatusState(AgentStatus.ON_CALL);
      }
    });

    const unsubAnswered = pbxClient.on('call.answered', () => {
      setStatusState(AgentStatus.ON_CALL);
    });

    const unsubEnded = pbxClient.on('call.ended', () => {
      if (status === AgentStatus.ON_CALL) {
        setStatusState(AgentStatus.AVAILABLE);
      }
    });

    return () => {
      unsubIncoming();
      unsubAnswered();
      unsubEnded();
    };
  }, [status]);

  // Initialize status on mount
  useEffect(() => {
    setLastStatusChange(new Date());
  }, []);

  return {
    status,
    setStatus,
    isAvailable,
    statusDuration,
    lastStatusChange,
  };
}
