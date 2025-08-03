import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

/**
 * Utility to merge class names.
 * (The same helper pattern you use elsewhere.)
 */
export const cn = (...classes) =>
  classes.filter(Boolean).join(' ');

/* ---------- Root + Trigger re-exports ---------- */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

/* ---------- Content ---------- */
export const DialogContent = React.forwardRef(
  ({ className = '', children, ...props }, ref) => {

    return (
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in" />

        {/* Panel */}
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'fixed z-50 top-1/2 left-1/2 w-[90%] max-w-2xl',
            '-translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-border bg-card p-6 shadow-xl',
            'focus:outline-none',
            className,
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 text-xl font-bold text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            ×
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
DialogContent.displayName = 'DialogContent';