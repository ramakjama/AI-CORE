// WebSocket Store - Zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types';

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
}

interface WebSocketActions {
  connect: (userId: string, token: string) => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setError: (error: string | null) => void;
  setLastMessage: (message: WebSocketMessage | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

type WebSocketStore = WebSocketState & WebSocketActions;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;

export const useWebSocketStore = create<WebSocketStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      socket: null,
      isConnected: false,
      isReconnecting: false,
      error: null,
      lastMessage: null,
      reconnectAttempts: 0,

      // Actions
      connect: (userId, token) => {
        const { socket: existingSocket, isConnected } = get();

        // Don't create a new connection if already connected
        if (existingSocket && isConnected) {
          console.log('WebSocket already connected');
          return;
        }

        // Disconnect existing socket if any
        if (existingSocket) {
          existingSocket.disconnect();
        }

        console.log('Connecting to WebSocket server...', WS_URL);

        const socket = io(WS_URL, {
          auth: {
            userId,
            token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          reconnectionDelay: RECONNECT_INTERVAL,
        });

        // Connection events
        socket.on('connect', () => {
          console.log('WebSocket connected');
          set({
            socket,
            isConnected: true,
            isReconnecting: false,
            error: null,
          });
          get().resetReconnectAttempts();
        });

        socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          set({
            isConnected: false,
            error: `Disconnected: ${reason}`,
          });
        });

        socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          set({
            isConnected: false,
            error: error.message,
          });
          get().incrementReconnectAttempts();
        });

        socket.on('reconnect', (attemptNumber) => {
          console.log('WebSocket reconnected after', attemptNumber, 'attempts');
          set({
            isReconnecting: false,
            error: null,
          });
          get().resetReconnectAttempts();
        });

        socket.on('reconnect_attempt', () => {
          console.log('WebSocket attempting to reconnect...');
          set({ isReconnecting: true });
        });

        socket.on('reconnect_error', (error) => {
          console.error('WebSocket reconnection error:', error);
          set({ error: error.message });
        });

        socket.on('reconnect_failed', () => {
          console.error('WebSocket reconnection failed');
          set({
            isReconnecting: false,
            error: 'Failed to reconnect after maximum attempts',
          });
        });

        // Message handling
        socket.onAny((event, data) => {
          const message: WebSocketMessage = {
            event,
            data,
            timestamp: new Date(),
            userId,
          };
          set({ lastMessage: message });
        });

        set({ socket });
      },

      disconnect: () => {
        const { socket } = get();
        if (socket) {
          console.log('Disconnecting WebSocket...');
          socket.disconnect();
          set({
            socket: null,
            isConnected: false,
            isReconnecting: false,
            error: null,
            lastMessage: null,
            reconnectAttempts: 0,
          });
        }
      },

      emit: (event, data) => {
        const { socket, isConnected } = get();
        if (socket && isConnected) {
          socket.emit(event, data);
        } else {
          console.warn('Cannot emit event: WebSocket not connected');
        }
      },

      subscribe: (event, callback) => {
        const { socket } = get();
        if (socket) {
          socket.on(event, callback);
          return () => {
            socket.off(event, callback);
          };
        }
        return () => {};
      },

      setConnected: (connected) => set({ isConnected: connected }),
      setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
      setError: (error) => set({ error }),
      setLastMessage: (message) => set({ lastMessage: message }),

      incrementReconnectAttempts: () => {
        set((state) => ({
          reconnectAttempts: state.reconnectAttempts + 1,
        }));
      },

      resetReconnectAttempts: () => {
        set({ reconnectAttempts: 0 });
      },
    }),
    { name: 'WebSocketStore' }
  )
);
