import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '../../../core/designsystem/components/Button';
import { ConfirmDialog, Dialog } from '../../../core/designsystem/components/Dialog';
import { MainTopBar } from '../../../core/designsystem/components/MainTopBar';
import { AnimatedTree } from '../../../core/designsystem/components/AnimatedTree';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useSessionStore } from '../../../core/session/sessionStore';
import { getSessionEngine } from '../../../core/session/SessionEngine';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { formatClock } from '../../../core/lib/format';
import { plantBallUrl } from '../../../core/designsystem/assets';
import { MOTION } from '../../../core/designsystem/motion';
import { SoundPicker } from './SoundPicker';

function GrowingBall({ treeType, phase, progress }: { treeType: number; phase: number; progress: number }) {
  const repos = useRepos();
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '1 / 1', maxWidth: 320 }}>
      <img
        src={plantBallUrl()}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
      />
      <AnimatePresence mode="popLayout">
        <motion.div
          key={phase}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: [...MOTION.treeCrossFade.scale] }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION.treeCrossFade.duration / 1000 }}
          className="pointer-events-none absolute left-1/2 h-auto w-[62%] -translate-x-1/2"
          style={{ bottom: '22%', willChange: 'transform, opacity' }}
        >
          <AnimatedTree
            gid={treeType}
            phase={phase}
            className="h-auto w-full"
            onError={(e) => {
              const img = e.currentTarget;
              const fallback = repos.treeAssets.fallbackUrl(treeType, `phase_${phase + 1}`);
              if (fallback && !img.dataset.fallback) {
                img.dataset.fallback = '1';
                img.src = fallback;
              } else {
                img.src = repos.treeAssets.placeholderUrl();
              }
            }}
          />
        </motion.div>
      </AnimatePresence>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--plantball-border)" strokeWidth={7} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--plantball)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
          transform="rotate(135 50 50)"
        />
      </svg>
    </div>
  );
}

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
  const progress = growingSeconds / Math.max(1, totalSeconds);

  const soundCluster = (
    <div className="flex items-center gap-1">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-[110px] truncate text-[14px] leading-none text-white"
      >
        {soundName}
      </motion.span>
      <button
        onClick={() => setSoundOpen(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          setSoundOpen(true);
        }}
        className="flex h-10 w-10 items-center justify-center"
        aria-label={t('growing.chooseSound')}
      >
        <Icon name={selectedSound >= 0 ? 'headphone' : 'headphoneMute'} size={24} />
      </button>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col" style={{ background: 'var(--brand)' }}>
      <MainTopBar
        leading="menu"
        onLeading={onMenu}
        countMode={isCountup ? 'UP' : 'DOWN'}
        focusMode={focusMode}
        onModeClick={() => setSoundOpen(true)}
        right={soundCluster}
      />

      <div className="pointer-events-none px-4 pt-1 text-center" style={{ minHeight: 18 }}>
        <AnimatePresence>
          {hintVisible && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-caption1 text-white"
            >
              {t('growing.soundHint')}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <GrowingBall treeType={treeType} phase={phase} progress={progress} />
      </div>

      <div className="flex flex-col items-center gap-4 pb-8">
        <p className="text-numbers text-[36px] leading-none text-white" aria-live="polite">
          {formatClock(displaySeconds)}
        </p>
        <button
          onClick={() => (canStop ? void getSessionEngine().stopCountup() : setGiveUpOpen(true))}
          className="text-headline5 text-white"
          style={{
            minWidth: 'var(--giveup-min-width)',
            padding: 'var(--giveup-pad-v) var(--giveup-pad-h)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: 'var(--radius-s)',
          }}
        >
          {canStop ? t('growing.stop') : t('growing.giveUp')}
        </button>
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
