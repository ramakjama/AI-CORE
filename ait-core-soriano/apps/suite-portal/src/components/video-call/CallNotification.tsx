/**
 * Call Notification Component
 * Shows incoming call notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, User } from 'lucide-react';
import * as Avatar from '@radix-ui/react-avatar';

export interface CallNotificationProps {
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
  autoDismissTimeout?: number;
  playRingtone?: boolean;
}

export function CallNotification({
  callerName,
  callerAvatar,
  onAccept,
  onDecline,
  autoDismissTimeout = 30000,
  playRingtone = false,
}: CallNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(autoDismissTimeout / 1000);

  useEffect(() => {
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      onDecline();
    }, autoDismissTimeout);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(dismissTimer);
      clearInterval(countdownInterval);
    };
  }, [autoDismissTimeout, onDecline]);

  // Play ringtone (optional)
  useEffect(() => {
    if (!playRingtone) return;

    // You can add actual audio playback here
    // const audio = new Audio('/sounds/ringtone.mp3');
    // audio.loop = true;
    // audio.play();

    // return () => {
    //   audio.pause();
    //   audio.currentTime = 0;
    // };
  }, [playRingtone]);

  const handleAccept = () => {
    setIsVisible(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsVisible(false);
    onDecline();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-4 right-4 z-[9999] w-96"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header with animated gradient */}
            <div className="relative h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>

            <div className="p-6">
              {/* Caller info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar.Root className="w-16 h-16">
                    <Avatar.Image
                      src={callerAvatar}
                      alt={callerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                    <Avatar.Fallback className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
                      {callerName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>

                  {/* Pulsing ring animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-500"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {callerName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Incoming video call...
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                {/* Decline button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDecline}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Decline</span>
                </motion.button>

                {/* Accept button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors relative overflow-hidden"
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(34, 197, 94, 0.7)',
                      '0 0 0 10px rgba(34, 197, 94, 0)',
                      '0 0 0 0 rgba(34, 197, 94, 0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                >
                  <Phone className="w-5 h-5" />
                  <span>Accept</span>
                </motion.button>
              </div>

              {/* Countdown */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: autoDismissTimeout / 1000, ease: 'linear' }}
                  />
                </div>
                <span className="text-sm font-medium whitespace-nowrap">
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
