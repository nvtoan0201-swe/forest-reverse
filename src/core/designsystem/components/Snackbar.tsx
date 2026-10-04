/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

export function toast(message: string): void {
  useToast.getState().show(message);
}

export function Snackbar() {
  const message = useToast((s) => s.message);
  const hide = useToast((s) => s.hide);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(hide, 2500);
    return () => window.clearTimeout(timer);
  }, [message, hide]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute inset-x-4 bottom-8 z-[60] flex justify-center"
        >
          <div
            role="status"
            className="max-w-full rounded-[5px] px-4 py-2 text-center text-body2 text-white"
            style={{ background: 'rgba(0,0,0,0.8)' }}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
