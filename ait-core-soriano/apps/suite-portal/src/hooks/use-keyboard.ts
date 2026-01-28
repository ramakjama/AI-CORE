import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
}

export function useKeyboard(
  callback: (event: KeyboardEvent) => void,
  options: KeyboardShortcutOptions
) {
  const {
    key,
    ctrl = false,
    shift = false,
    alt = false,
    meta = false,
    preventDefault = true,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = ctrl ? event.ctrlKey : !event.ctrlKey;
      const matchesShift = shift ? event.shiftKey : !event.shiftKey;
      const matchesAlt = alt ? event.altKey : !event.altKey;
      const matchesMeta = meta ? event.metaKey : !event.metaKey;

      if (
        matchesKey &&
        matchesCtrl &&
        matchesShift &&
        matchesAlt &&
        matchesMeta
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [key, ctrl, shift, alt, meta, preventDefault, enabled, callback]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export function useCommandK(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 'k',
    ctrl: true,
    meta: true,
    preventDefault: true,
    enabled,
  });
}

// Additional common shortcuts
export function useEscape(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 'Escape',
    preventDefault: true,
    enabled,
  });
}

export function useEnter(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 'Enter',
    preventDefault: false,
    enabled,
  });
}

export function useCtrlS(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 's',
    ctrl: true,
    meta: true,
    preventDefault: true,
    enabled,
  });
}

export function useCtrlZ(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 'z',
    ctrl: true,
    meta: true,
    preventDefault: true,
    enabled,
  });
}

export function useCtrlShiftZ(
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useKeyboard(callback, {
    key: 'z',
    ctrl: true,
    meta: true,
    shift: true,
    preventDefault: true,
    enabled,
  });
}
