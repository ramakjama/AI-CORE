/**
 * useAITCore - Unified hook for AIT-CORE ecosystem
 *
 * Provides access to:
 * - API Gateway (HTTP requests)
 * - WebSocket (real-time events)
 * - Event handlers
 * - State management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES
// ============================================================================

interface AITCoreConfig {
  apiBaseURL: string;
  wsBaseURL: string;
  onTokenRequest: () => Promise<string>;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  agentId?: string;
  permissions: string[];
}

interface Call {
  callSid: string;
  from: string;
  to: string;
  customerId?: string;
  status: string;
  state: 'idle' | 'ringing' | 'active' | 'hold';
  startedAt: Date;
  duration?: number;
}

interface CallContext {
  call: Call;
  customer?: any;
  policies?: any[];
  claims?: any[];
  interactions?: any[];
  tasks?: any[];
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAITCore(config: AITCoreConfig) {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callContext, setCallContext] = useState<CallContext | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('offline');

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const apiClientRef = useRef<AxiosInstance | null>(null);

  // =========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    initializeAPIClient();
    initializeWebSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  /**
   * Initialize API client
   */
  const initializeAPIClient = useCallback(() => {
    const client = axios.create({
      baseURL: config.apiBaseURL,
      timeout: 30000
    });

    // Request interceptor - add auth token
    client.interceptors.request.use(async (config) => {
      const token = await config.onTokenRequest();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response interceptor - handle errors
    client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );

    apiClientRef.current = client;
  }, [config]);

  /**
   * Initialize WebSocket connection
   */
  const initializeWebSocket = useCallback(async () => {
    const token = await config.onTokenRequest();

    const socket = io(config.wsBaseURL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('WebSocket server says:', data.message);
      setUser(data.user);
    });

    // ──────────────────────────────────────────────────────────────────────
    // CALL EVENTS
    // ──────────────────────────────────────────────────────────────────────

    socket.on('call:incoming', async (data) => {
      console.log('📞 Incoming call:', data);

      // Fetch call context
      const context = await fetchCallContext(data.callSid, data.customerId);

      setCurrentCall({
        callSid: data.callSid,
        from: data.from,
        to: 'me',
        customerId: data.customerId,
        status: 'ringing',
        state: 'ringing',
        startedAt: new Date(data.timestamp)
      });

      setCallContext(context);
    });

    socket.on('call:answered', (data) => {
      console.log('✅ Call answered:', data);

      setCurrentCall((prev) =>
        prev?.callSid === data.callSid
          ? { ...prev, status: 'in-progress', state: 'active' }
          : prev
      );
    });

    socket.on('call:completed', (data) => {
      console.log('📴 Call completed:', data);

      setCurrentCall(null);
      setCallContext(null);
    });

    socket.on('call:status-updated', (data) => {
      setCurrentCall((prev) =>
        prev?.callSid === data.callSid
          ? { ...prev, status: data.status }
          : prev
      );
    });

    // ──────────────────────────────────────────────────────────────────────
    // TRANSCRIPTION (real-time)
    // ──────────────────────────────────────────────────────────────────────

    socket.on('transcription', (data) => {
      console.log(`💬 [${data.speaker}]:`, data.text);
      // You can update UI with real-time transcription
    });

    // ──────────────────────────────────────────────────────────────────────
    // NOTIFICATIONS
    // ──────────────────────────────────────────────────────────────────────

    socket.on('notification', (data) => {
      console.log('🔔 Notification:', data);

      setNotifications((prev) => [
        {
          id: data.id || `notif-${Date.now()}`,
          type: data.type,
          title: data.title,
          message: data.message,
          read: false,
          timestamp: data.timestamp
        },
        ...prev
      ]);
    });

    // ──────────────────────────────────────────────────────────────────────
    // TASK EVENTS
    // ──────────────────────────────────────────────────────────────────────

    socket.on('task:new', (data) => {
      console.log('📋 New task assigned:', data);

      setNotifications((prev) => [
        {
          id: `task-${data.taskId}`,
          type: 'task_assigned',
          title: 'New Task',
          message: `${data.type}: Priority ${data.priority}`,
          read: false,
          timestamp: data.timestamp
        },
        ...prev
      ]);
    });

    // ──────────────────────────────────────────────────────────────────────
    // POLICY/QUOTE EVENTS
    // ──────────────────────────────────────────────────────────────────────

    socket.on('quote:created', (data) => {
      console.log('💰 Quote created:', data);
      // Update UI with quote details
    });

    socket.on('policy:created', (data) => {
      console.log('📄 Policy created:', data);
      // Show success message
    });

    socketRef.current = socket;
  }, [config]);

  // ==========================================================================
  // API METHODS
  // ==========================================================================

  /**
   * Fetch call context (customer data, policies, etc.)
   */
  const fetchCallContext = useCallback(
    async (callSid: string, customerId?: string): Promise<CallContext> => {
      const response = await apiClientRef.current!.get(
        `/api/calls/${callSid}/context`
      );
      return response.data;
    },
    []
  );

  /**
   * Get customer by phone
   */
  const searchCustomerByPhone = useCallback(async (phone: string) => {
    const response = await apiClientRef.current!.get('/api/customers/search', {
      params: { phone }
    });
    return response.data;
  }, []);

  /**
   * Create quote
   */
  const createQuote = useCallback(
    async (params: {
      customerId: string;
      type: 'auto' | 'home' | 'life';
      vehicleData?: any;
      propertyData?: any;
      lifeData?: any;
      callSid?: string;
    }) => {
      const endpoint =
        params.type === 'auto'
          ? '/api/quotes/auto'
          : params.type === 'home'
          ? '/api/quotes/home'
          : '/api/quotes/life';

      const response = await apiClientRef.current!.post(endpoint, params);
      return response.data;
    },
    []
  );

  /**
   * Create policy from quote
   */
  const createPolicy = useCallback(async (policyData: any) => {
    const response = await apiClientRef.current!.post(
      '/api/policies',
      policyData
    );
    return response.data;
  }, []);

  /**
   * Create interaction (after call)
   */
  const createInteraction = useCallback(async (interactionData: any) => {
    const response = await apiClientRef.current!.post(
      '/api/interactions',
      interactionData
    );
    return response.data;
  }, []);

  /**
   * Create task
   */
  const createTask = useCallback(async (taskData: any) => {
    const response = await apiClientRef.current!.post('/api/tasks', taskData);
    return response.data;
  }, []);

  /**
   * Get analytics
   */
  const getAnalytics = useCallback(
    async (period: 'today' | 'week' | 'month' = 'today') => {
      const response = await apiClientRef.current!.get('/api/analytics/calls', {
        params: { period }
      });
      return response.data;
    },
    []
  );

  // ==========================================================================
  // WEBSOCKET METHODS
  // ==========================================================================

  /**
   * Join call room (to receive real-time updates)
   */
  const joinCall = useCallback((callSid: string) => {
    socketRef.current?.emit('call:join', { callSid });
  }, []);

  /**
   * Leave call room
   */
  const leaveCall = useCallback((callSid: string) => {
    socketRef.current?.emit('call:leave', { callSid });
  }, []);

  /**
   * Update call status
   */
  const updateCallStatus = useCallback((callSid: string, status: string) => {
    socketRef.current?.emit('call:update-status', { callSid, status });
  }, []);

  /**
   * Change agent status
   */
  const changeAgentStatus = useCallback(
    (status: 'available' | 'busy' | 'in_call' | 'wrap_up' | 'break' | 'offline') => {
      socketRef.current?.emit('agent:status-change', { status });
      setAgentStatus(status);
    },
    []
  );

  /**
   * Send real-time transcription
   */
  const sendTranscription = useCallback(
    (callSid: string, text: string, speaker: 'agent' | 'customer') => {
      socketRef.current?.emit('transcription', { callSid, text, speaker });
    },
    []
  );

  /**
   * Mark notification as read
   */
  const markNotificationRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('notification:read', { notificationId });

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    user,
    connected,
    currentCall,
    callContext,
    notifications,
    agentStatus,

    // API methods
    searchCustomerByPhone,
    createQuote,
    createPolicy,
    createInteraction,
    createTask,
    getAnalytics,

    // WebSocket methods
    joinCall,
    leaveCall,
    updateCallStatus,
    changeAgentStatus,
    sendTranscription,
    markNotificationRead,

    // Direct access (for advanced use)
    api: apiClientRef.current,
    socket: socketRef.current
  };
}
