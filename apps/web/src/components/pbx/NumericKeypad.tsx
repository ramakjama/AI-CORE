/**
 * NumericKeypad component - DTMF keypad for calls
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NumericKeypadProps {
  onDigitPress: (digit: string) => void;
  disabled?: boolean;
}

const KEYPAD_BUTTONS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

export function NumericKeypad({ onDigitPress, disabled = false }: NumericKeypadProps) {
  const [dialedNumber, setDialedNumber] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (digit: string) => {
    if (disabled) return;

    setDialedNumber((prev) => prev + digit);
    setActiveKey(digit);
    onDigitPress(digit);

    // Reset active state after animation
    setTimeout(() => setActiveKey(null), 150);
  };

  const handleClearNumber = () => {
    setDialedNumber('');
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  return (
    <div className="space-y-4">
      {/* Number Display */}
      <div className="relative bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
        <input
          type="text"
          value={dialedNumber}
          readOnly
          placeholder="Enter number..."
          className="w-full bg-transparent text-center text-xl font-mono text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {dialedNumber && (
          <button
            onClick={handleClearNumber}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
            type="button"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {KEYPAD_BUTTONS.map(({ digit, letters }) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            disabled={disabled}
            className={`
              relative h-16 rounded-lg font-semibold transition-all
              ${
                activeKey === digit
                  ? 'bg-blue-600 text-white scale-95'
                  : 'bg-white hover:bg-gray-50 text-gray-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
              border border-gray-200 shadow-sm
            `}
            type="button"
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-2xl">{digit}</span>
              {letters && (
                <span className="text-xs text-gray-500 mt-0.5">{letters}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Backspace Button */}
      {dialedNumber && (
        <button
          onClick={handleBackspace}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          type="button"
        >
          Backspace
        </button>
      )}
    </div>
  );
}
