import React, { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const modalContentVariants = cva(
  [
    'fixed z-50',
    'bg-white dark:bg-secondary-900',
    'shadow-xl rounded-lg',
    'focus:outline-none',
    'data-[state=open]:animate-scale-in',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm w-full',
        md: 'max-w-md w-full',
        lg: 'max-w-lg w-full',
        xl: 'max-w-xl w-full',
        '2xl': 'max-w-2xl w-full',
        '3xl': 'max-w-3xl w-full',
        full: 'max-w-[calc(100vw-2rem)] w-full',
      },
      position: {
        center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
        top: 'left-1/2 top-20 -translate-x-1/2',
      },
    },
    defaultVariants: {
      size: 'md',
      position: 'center',
    },
  }
);

export interface ModalProps extends VariantProps<typeof modalContentVariants> {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Modal trigger element */
  trigger?: ReactNode;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal content */
  children: ReactNode;
  /** Footer content (typically actions) */
  footer?: ReactNode;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether clicking outside closes the modal */
  closeOnClickOutside?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** Additional class names for the content */
  className?: string;
}

/**
 * Modal component built on Radix UI Dialog primitive.
 *
 * @example
 * <Modal
 *   trigger={<Button>Open Modal</Button>}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 *   footer={
 *     <>
 *       <Button variant="outline">Cancel</Button>
 *       <Button variant="danger">Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Modal content goes here</p>
 * </Modal>
 */
export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  size,
  position,
  className,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      )}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50',
            'bg-black/50 backdrop-blur-sm',
            'data-[state=open]:animate-fade-in',
            'data-[state=closed]:animate-fade-out'
          )}
        />

        <DialogPrimitive.Content
          className={cn(modalContentVariants({ size, position }), className)}
          onPointerDownOutside={(e) => {
            if (!closeOnClickOutside) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (!closeOnEscape) {
              e.preventDefault();
            }
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
              <div className="flex-1">
                {title && (
                  <DialogPrimitive.Title className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                    {title}
                  </DialogPrimitive.Title>
                )}
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>

              {showCloseButton && (
                <DialogPrimitive.Close
                  className={cn(
                    'rounded-md p-1 ml-4',
                    'text-secondary-400 hover:text-secondary-600',
                    'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-colors'
                  )}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-4 border-t border-secondary-200 dark:border-secondary-700">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// Compound components for more flexibility
export const ModalTrigger = DialogPrimitive.Trigger;
export const ModalClose = DialogPrimitive.Close;

Modal.displayName = 'Modal';
