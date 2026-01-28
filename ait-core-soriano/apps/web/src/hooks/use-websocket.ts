import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketState {
  socket: Socket | null
  isConnected: boolean
  lastMessage: any
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    lastMessage: null,
  })

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      setState(prev => ({ ...prev, isConnected: true }))
    })

    socket.on('disconnect', () => {
      setState(prev => ({ ...prev, isConnected: false }))
    })

    socket.on('message', (data: any) => {
      setState(prev => ({ ...prev, lastMessage: data }))
    })

    socket.on('module:update', (data: any) => {
      setState(prev => ({ ...prev, lastMessage: data }))
    })

    socket.on('system:alert', (data: any) => {
      setState(prev => ({ ...prev, lastMessage: data }))
    })

    setState(prev => ({ ...prev, socket }))

    return () => {
      socket.close()
    }
  }, [])

  const emit = useCallback((event: string, data: any) => {
    if (state.socket?.connected) {
      state.socket.emit(event, data)
    }
  }, [state.socket])

  return {
    socket: state.socket,
    isConnected: state.isConnected,
    lastMessage: state.lastMessage,
    emit,
  }
}
