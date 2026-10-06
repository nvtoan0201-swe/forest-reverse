import type { ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/** M3 emphasized easing, used by m3_bottom_sheet_slide_in/out. */
const EMPHASIZED = [0.2, 0, 0, 1] as const;

/**
 * Bottom sheet.
 * In:  translateY 20% -> 0, alpha 0 -> 1, 400ms emphasized (m3 medium4).
 * Out: translate 350ms + fade 300ms (m3 medium3/medium2).
 */
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
  const reduce = useReducedMotion();
  const enter = reduce ? { opacity: 0, y: 0 } : { opacity: 1, y: '20%' };
  const leave = reduce
    ? { opacity: 0, y: 0, transition: { duration: 0.05 } }
    : { opacity: 0, y: '20%', transition: { duration: 0.35, ease: EMPHASIZED } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex flex-col justify-end overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0.05 : 0.3 } }}
          transition={{ duration: 0.4 }}
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
            initial={enter}
            animate={{ opacity: 1, y: 0 }}
            exit={leave}
            transition={{ duration: reduce ? 0.05 : 0.4, ease: EMPHASIZED }}
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
