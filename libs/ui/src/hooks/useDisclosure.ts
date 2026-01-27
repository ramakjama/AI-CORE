import { useState, useCallback, useMemo } from 'react';

export interface UseDisclosureOptions {
  defaultIsOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onToggle?: (isOpen: boolean) => void;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  getButtonProps: (props?: Record<string, unknown>) => {
    'aria-expanded': boolean;
    'aria-controls'?: string;
    onClick: () => void;
  };
  getDisclosureProps: (props?: Record<string, unknown>) => {
    id?: string;
    hidden: boolean;
  };
}

/**
 * Hook for managing disclosure state (open/close) for modals, dropdowns, etc.
 *
 * @param options - Configuration options
 * @returns Disclosure state and handlers
 *
 * @example
 * const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
 *
 * @example
 * const { isOpen, getButtonProps, getDisclosureProps } = useDisclosure({
 *   defaultIsOpen: false,
 *   onOpen: () => console.log('Opened'),
 *   onClose: () => console.log('Closed'),
 * });
 */
export function useDisclosure(options: UseDisclosureOptions = {}): UseDisclosureReturn {
  const {
    defaultIsOpen = false,
    onOpen: onOpenCallback,
    onClose: onCloseCallback,
    onToggle: onToggleCallback,
  } = options;

  const [isOpen, setIsOpen] = useState(defaultIsOpen);

  const onOpen = useCallback(() => {
    setIsOpen(true);
    onOpenCallback?.();
  }, [onOpenCallback]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    onCloseCallback?.();
  }, [onCloseCallback]);

  const onToggle = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggleCallback?.(newState);
    if (newState) {
      onOpenCallback?.();
    } else {
      onCloseCallback?.();
    }
  }, [isOpen, onToggleCallback, onOpenCallback, onCloseCallback]);

  const getButtonProps = useCallback(
    (props: Record<string, unknown> = {}) => ({
      ...props,
      'aria-expanded': isOpen,
      'aria-controls': props['aria-controls'] as string | undefined,
      onClick: onToggle,
    }),
    [isOpen, onToggle]
  );

  const getDisclosureProps = useCallback(
    (props: Record<string, unknown> = {}) => ({
      ...props,
      id: props.id as string | undefined,
      hidden: !isOpen,
    }),
    [isOpen]
  );

  return useMemo(
    () => ({
      isOpen,
      onOpen,
      onClose,
      onToggle,
      getButtonProps,
      getDisclosureProps,
    }),
    [isOpen, onOpen, onClose, onToggle, getButtonProps, getDisclosureProps]
  );
}
