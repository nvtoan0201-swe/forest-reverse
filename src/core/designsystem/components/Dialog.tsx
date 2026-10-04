import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './Button';

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  width = 300,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ background: 'var(--dim)' }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="max-h-[85%] overflow-y-auto rounded-[var(--radius-dialog)] p-5"
            style={{ width, background: 'var(--bg-dialog)', boxShadow: 'var(--shadow-dialog)' }}
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
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
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
