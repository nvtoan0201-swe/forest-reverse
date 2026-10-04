import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, IconButton } from '../../../core/designsystem/components/Button';
import { ConfirmDialog, Dialog } from '../../../core/designsystem/components/Dialog';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useSessionStore } from '../../../core/session/sessionStore';
import { getSessionEngine } from '../../../core/session/SessionEngine';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { formatClock } from '../../../core/lib/format';
import { SoundPicker } from './SoundPicker';

export function GrowingView({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation();
  const repos = useRepos();
  const { ongoing, growingSeconds, phase, focusMode, distraction, setDistraction } = useSessionStore();
  const [giveUpOpen, setGiveUpOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [selectedSound] = usePref<number>(UDKeys.SELECTED_BG_MUSIC, 0);
  const sounds = useLiveQuery(() => repos.catalog.ambientSounds(), [], []) ?? [];
  const [hintVisible, setHintVisible] = useState(true);

  const plant = ongoing?.plant;
  const treeType = ongoing?.trees[0]?.treeType ?? 0;

  useEffect(() => {
    setHintVisible(true);
    const timer = window.setTimeout(() => setHintVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!plant) return null;

  const isCountup = plant.mode === 'countup';
  const totalSeconds = isCountup
    ? Math.floor((plant.endTime - plant.startTime) / 1000)
    : plant.plantTime;
  const displaySeconds = isCountup
    ? growingSeconds
    : Math.max(0, plant.plantTime - growingSeconds);
  const canStop = isCountup && growingSeconds >= 600;
  const soundName = sounds.find((s) => s.gid === selectedSound)?.title ?? t('growing.defaultSound');

  return (
    <div className="relative flex h-full flex-col" style={{ background: 'var(--brand)' }}>
      <header className="safe-top">
        <div className="flex h-[40px] items-center gap-2 px-2">
          <IconButton label="Menu" onClick={onMenu} className="text-white">
            <Icon name="menu" size={22} />
          </IconButton>
          <div className="flex-1" />
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1"
            style={{ background: 'rgba(51,128,101,0.35)' }}
          >
            <Icon name={isCountup ? 'play' : 'timer'} size={20} className="text-white" />
            <span className="h-4 w-px bg-white/30" />
            <Icon name="focus" size={20} className={focusMode === 'DEEP' ? 'text-white' : 'text-white/50'} />
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setSoundOpen(true)}
            onContextMenu={(e) => {
              e.preventDefault();
              setSoundOpen(true);
            }}
            className="flex max-w-[130px] items-center gap-1.5 rounded-full px-2 py-1 text-white"
            aria-label={t('growing.chooseSound')}
          >
            <span className="truncate text-caption1">{soundName}</span>
            <Icon name={selectedSound >= 0 ? 'headphone' : 'headphoneMute'} size={18} />
          </button>
        </div>
      </header>

      <div className="pointer-events-none px-4 pt-2 text-center">
        {hintVisible && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="text-caption1 text-white"
          >
            {t('growing.soundHint')}
          </motion.p>
        )}
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative" style={{ width: '78%', maxWidth: 300, aspectRatio: '1' }}>
          <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="150"
              cy="150"
              r="132"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="10"
            />
            <circle
              cx="150"
              cy="150"
              r="132"
              fill="none"
              stroke="var(--plantball)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 132}
              strokeDashoffset={2 * Math.PI * 132 * (1 - Math.min(1, growingSeconds / Math.max(1, totalSeconds)))}
            />
          </svg>
          <AnimatePresence mode="popLayout">
            <motion.img
              key={phase}
              src={repos.treeAssets.phaseUrl(treeType, phase)}
              alt=""
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 m-auto h-[82%] w-[82%] object-contain"
              style={{ willChange: 'transform, opacity' }}
            />
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 pb-8">
        <p className="text-headline2 text-white tabular-nums" aria-live="polite">
          {formatClock(displaySeconds)}
        </p>
        <Button
          variant="accentTeal"
          onClick={() => (canStop ? void getSessionEngine().stopCountup() : setGiveUpOpen(true))}
        >
          {canStop ? t('growing.stop') : t('growing.giveUp')}
        </Button>
      </div>

      <ConfirmDialog
        open={giveUpOpen}
        title={t('growing.giveUp')}
        body={t('growing.giveUpConfirm')}
        confirmLabel={t('growing.giveUp')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          setGiveUpOpen(false);
          void getSessionEngine().giveUp();
        }}
        onCancel={() => setGiveUpOpen(false)}
      />

      <SoundPicker open={soundOpen} onClose={() => setSoundOpen(false)} />

      <Dialog
        open={distraction.overlay}
        onClose={() => setDistraction({ overlay: false })}
        title={t('growing.focusOverlayTitle')}
        actions={
          <Button onClick={() => setDistraction({ overlay: false })}>{t('growing.resume')}</Button>
        }
      >
        {t('growing.focusOverlayText')}
      </Dialog>
    </div>
  );
}
