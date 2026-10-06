import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { EASING } from '../motion';
import { Button } from './Button';

/**
 * Dialog — 300dp wide, radius 5dp, dim 0.6.
 * Enter: translateY -100% -> 0, 300ms overshoot.
 * Exit:  translateY 0 -> 100%, 150ms.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  width = 300,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  width?: number;
  dismissible?: boolean;
}) {
  const reduce = useReducedMotion();
  const enter = reduce ? { opacity: 0, y: 0 } : { opacity: 1, y: '-100%' };
  const shown = { opacity: 1, y: 0 };
  const leave = reduce
    ? { opacity: 0, y: 0, transition: { duration: 0.05 } }
    : { opacity: 1, y: '100%', transition: { duration: 0.15, ease: 'linear' as const } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0.05 : 0.15 } }}
          transition={{ duration: 0.3 }}
          style={{ background: 'var(--dim)' }}
          onClick={dismissible ? onClose : undefined}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={enter}
            animate={shown}
            exit={leave}
            transition={{ duration: reduce ? 0.05 : 0.3, ease: EASING.overshoot }}
            className="max-h-[85%] overflow-y-auto p-5"
            style={{
              width,
              background: 'var(--bg-dialog)',
              borderRadius: 'var(--radius-dialog)',
              boxShadow: 'var(--shadow-dialog)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && <h2 className="mb-2 text-headline5">{title}</h2>}
            <div className="text-body2 text-[var(--text-secondary)]">{children}</div>
            {actions && <div className="mt-5 flex justify-end gap-2">{actions}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  danger = false,
  dismissible = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  dismissible?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      dismissible={dismissible}
      actions={
        <>
          <Button variant="gray" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'red' : 'brand'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {body}
    </Dialog>
  );
}
