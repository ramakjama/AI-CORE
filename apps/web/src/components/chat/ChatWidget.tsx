'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatWidgetProps } from '@/types/chat';
import { ChatInterface } from './ChatInterface';
import { MessageCircle, X, Maximize2 } from 'lucide-react';
import { useChatContext } from '@/hooks/chat';

export function ChatWidget({
  userId,
  companyId,
  position = { bottom: 24, right: 24 },
  defaultMinimized = true,
  showNotificationBadge = false,
  onClose,
}: ChatWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(position);
  const [notificationCount, setNotificationCount] = useState(0);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const { context } = useChatContext();

  useEffect(() => {
    if (showNotificationBadge) {
      const timer = setInterval(() => {
        setNotificationCount((prev) => (prev < 5 ? prev + 1 : prev));
      }, 30000);

      return () => clearInterval(timer);
    }
  }, [showNotificationBadge]);

  const handleMinimize = () => {
    setIsMinimized(true);
    setNotificationCount(0);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setNotificationCount(0);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (isMinimized) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - (dragPosition.right || 0),
        y: e.clientY - (dragPosition.bottom || 0),
      };
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (isDragging && isMinimized) {
      const newRight = Math.max(
        0,
        Math.min(window.innerWidth - 80, dragStartPos.current.x - e.clientX)
      );
      const newBottom = Math.max(
        0,
        Math.min(window.innerHeight - 80, dragStartPos.current.y - e.clientY)
      );

      setDragPosition({ right: newRight, bottom: newBottom });
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);

      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={widgetRef}
      className="fixed z-50"
      style={{
        bottom: `${dragPosition.bottom}px`,
        right: `${dragPosition.right}px`,
        ...(dragPosition.left && { left: `${dragPosition.left}px` }),
        ...(dragPosition.top && { top: `${dragPosition.top}px` }),
      }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <button
              onClick={handleMaximize}
              onMouseDown={handleDragStart}
              className={`group relative w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              title="Abrir asistente IA"
            >
              <MessageCircle className="w-7 h-7 text-white" />

              {/* Notification Badge */}
              {showNotificationBadge && notificationCount > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce">
                  {notificationCount}
                </div>
              )}

              {/* Pulse Animation */}
              <div className="absolute inset-0 rounded-full bg-purple-400 opacity-0 group-hover:opacity-25 animate-ping" />
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                Asistente IA Soriano
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="w-[400px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
            style={{
              backdropFilter: 'blur(20px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <ChatInterface
              context={context}
              onMinimize={handleMinimize}
              showHeader={true}
              showQuickActions={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
