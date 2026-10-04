import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function Sheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '85%',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'var(--dim)' }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="flex w-full flex-col rounded-t-2xl"
            style={{
              background: 'var(--bg-dialog)',
              maxHeight,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="sheet-handle" />
            </div>
            {title && <h2 className="px-5 pb-1 pt-3 text-headline4">{title}</h2>}
            <div className="scroll-area flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
