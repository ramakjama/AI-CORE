"use client";

import { useEffect } from 'react';
import { useAppStore } from '@/store/app.store';

export function useCommandK() {
  const { toggleCommandMenu } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleCommandMenu]);

  return { toggleCommandMenu };
}
