import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PageShell } from '../../../app/layout/PageShell';
import { Button } from '../../../core/designsystem/components/Button';
import { formatClock } from '../../../core/lib/format';

export function RelaxPage() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const phase = Math.floor(seconds / 4) % 4;

  return (
    <PageShell title={t('relax.title')}>
      <div className="flex flex-col items-center gap-6 p-6">
        <div className="relative flex h-56 w-56 items-center justify-center">
          <motion.div
            className="absolute h-40 w-40 rounded-full"
            style={{ background: 'var(--forest-teal-100)' }}
            animate={
              running
                ? { scale: phase === 0 ? 1.25 : phase === 2 ? 0.85 : 1.05 }
                : { scale: 1 }
            }
            transition={{ duration: 4, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute h-28 w-28 rounded-full"
            style={{ background: 'var(--forest-teal-300)' }}
            animate={running ? { scale: phase === 1 ? 1.15 : 0.95 } : { scale: 1 }}
            transition={{ duration: 4, ease: 'easeInOut' }}
          />
          <span className="relative text-headline3 text-[var(--forest-teal-800)]">
            {formatClock(seconds)}
          </span>
        </div>
        <p className="text-center text-body2 text-[var(--text-secondary)]">{t('relax.stub')}</p>
        <Button
          variant={running ? 'gray' : 'accentTeal'}
          long
          onClick={() => {
            setRunning((r) => !r);
            if (running) setSeconds(0);
          }}
        >
          {running ? t('relax.stop') : t('relax.start')}
        </Button>
      </div>
    </PageShell>
  );
}
