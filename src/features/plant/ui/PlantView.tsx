import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { PlantBall } from './PlantBall';
import { SpeciesPicker } from './SpeciesPicker';
import { TagPicker } from './TagPicker';
import { ModeDialog } from './ModeDialog';
import { Button } from '../../../core/designsystem/components/Button';
import { MainTopBar } from '../../../core/designsystem/components/MainTopBar';
import { TagChip, ProgressRing } from '../../../core/designsystem/components/primitives';
import { Dialog } from '../../../core/designsystem/components/Dialog';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { config } from '../../../core/config';
import { useSessionStore } from '../../../core/session/sessionStore';
import { getSessionEngine } from '../../../core/session/SessionEngine';
import { useTags, useTodayFocusMinutes, useTreeTypes, useWallet } from '../application/hooks';
import { MOTION, transitionFor } from '../../../core/designsystem/motion';
import type { CountMode, FocusMode } from '../../../data/types';

const TUTORIAL_SECONDS = 12;

export function PlantView({ onMenu }: { onMenu: () => void }) {
  const { t } = useTranslation();
  const repos = useRepos();
  const wallet = useWallet();
  const treeTypes = useTreeTypes();
  const tags = useTags();
  const tagColors = useLiveQuery(() => repos.catalog.tagColors(), [], []) ?? [];
  const todayMinutes = useTodayFocusMinutes();
  const [threeHours] = usePref<boolean>(UDKeys.THREE_HOURS, false);
  const [premium] = usePref<boolean>(UDKeys.IS_PREMIUM_DEV, false);
  const [tutorialFinished, setTutorialFinished] = usePref<boolean>(
    UDKeys.ONBOARDING_TOOLTIP_FIRST_TIME_FINISHED,
    false,
  );

  const {
    countMode,
    focusMode,
    selectedSpeciesId,
    plantTimeMinutes,
    tagId,
    setCountMode,
    setFocusMode,
    selectSpecies,
    setPlantTimeMinutes,
    setTagId,
  } = useSessionStore();

  const [speciesOpen, setSpeciesOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialLeft, setTutorialLeft] = useState(TUTORIAL_SECONDS);
  const [leaving, setLeaving] = useState(false);

  const maxMinutes = threeHours ? 180 : 120;
  const activeTag = tags.find((tag) => tag.id === tagId) ?? null;
  const tagColor = tagColors.find((c) => c.tcid === activeTag?.tagColorTcid)?.hexCode;

  const plantCount = useLiveQuery(() => repos.db.plants.count(), [], 0) ?? 0;

  useEffect(() => {
    if (!tutorialFinished && plantCount === 0 && treeTypes.length > 0) {
      setTutorialOpen(true);
    }
  }, [tutorialFinished, plantCount, treeTypes.length]);

  const startPlant = (auto = false) => {
    const limitReached = !premium && todayMinutes + plantTimeMinutes > config.dailyFocusLimitFree;
    if (limitReached) {
      setLimitOpen(true);
      setTutorialOpen(false);
      return;
    }
    if (!auto && tutorialOpen) {
      setTutorialOpen(false);
      setTutorialFinished(true);
    }
    setLeaving(true);
    window.setTimeout(() => {
      void getSessionEngine().start({
        countMode,
        focusMode,
        plantMode: 'SINGLE',
        plantTimeSeconds: plantTimeMinutes * 60,
        tagId,
        speciesId: selectedSpeciesId,
      });
    }, MOTION.buttonFall.duration);
  };

  useEffect(() => {
    if (!tutorialOpen) return;
    setTutorialLeft(TUTORIAL_SECONDS);
    const interval = window.setInterval(() => {
      setTutorialLeft((left) => {
        const next = left - 1;
        if (next <= 0) {
          window.clearInterval(interval);
          setTutorialFinished(true);
          setTutorialOpen(false);
          startPlant(true);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialOpen]);

  const tutorialStep =
    tutorialLeft > 9 ? 0 : tutorialLeft > 6 ? 1 : tutorialLeft > 3 ? 2 : 3;
  const tutorialText = [t('onboarding.tooltip1'), t('onboarding.tooltip2'), t('onboarding.tooltip3'), t('onboarding.tooltip4')][
    tutorialStep
  ];

  return (
    <div className="relative flex h-full flex-col" style={{ background: 'var(--brand)' }}>
      <MainTopBar
        leading="menu"
        onLeading={onMenu}
        countMode={countMode}
        focusMode={focusMode}
        onModeClick={() => setModeOpen(true)}
        coin={wallet.coin}
        onAddCoin={() => setLimitOpen(true)}
      />

      <div className="px-6 pb-1 pt-3 text-center">
        <h1 className="text-headline5 text-white">
          {todayMinutes > 0 ? t('plant.focusedToday', { minutes: todayMinutes }) : t('plant.startToday')}
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative" style={{ width: '78%', maxWidth: 320 }}>
          <PlantBall
            minutes={plantTimeMinutes}
            maxMinutes={maxMinutes}
            onChange={setPlantTimeMinutes}
            speciesId={selectedSpeciesId}
          />
          <button
            aria-label={t('plant.tapTree')}
            title={t('plant.tapTree')}
            onClick={() => setSpeciesOpen(true)}
            className="absolute left-1/2 top-[24%] h-28 w-24 -translate-x-1/2 rounded-full"
          />
        </div>
      </div>

      <motion.div
        className="flex flex-col"
        animate={leaving ? { y: '100%', opacity: 0 } : { y: 0, opacity: 1 }}
        transition={leaving ? transitionFor('buttonFall') : { duration: 0.1 }}
      >
        <div className="flex flex-col items-center gap-3 px-6 pb-2">
          <TagChip
            name={activeTag?.tag ?? t('plant.tagUnset')}
            color={tagColor}
            editable
            light
            onClick={() => setTagOpen(true)}
          />
          <p className="text-numbers text-[36px] leading-none text-white" aria-live="polite">
            {plantTimeMinutes}:00
          </p>
          <Button size="default" onClick={() => startPlant()} data-testid="plant-button">
            {t('plant.button')}
          </Button>
        </div>

        <footer className="safe-bottom px-6 pb-4 pt-2">
          <div className="flex items-center gap-2">
            <ProgressRing
              size={28}
              strokeWidth={3}
              progress={Math.min(1, todayMinutes / config.dailyFocusLimitFree)}
            >
              <span className="text-[8px] font-bold text-white">
                {Math.round((todayMinutes / config.dailyFocusLimitFree) * 100)}%
              </span>
            </ProgressRing>
            <p className="flex-1 text-caption1 text-white/80">
              {premium
                ? 'Premium'
                : t('plant.limitFooter', { used: todayMinutes, limit: config.dailyFocusLimitFree })}
            </p>
          </div>
        </footer>
      </motion.div>

      <SpeciesPicker
        open={speciesOpen}
        onClose={() => setSpeciesOpen(false)}
        selectedId={selectedSpeciesId}
        onSelect={selectSpecies}
      />
      <TagPicker
        open={tagOpen}
        onClose={() => setTagOpen(false)}
        selectedTagId={tagId}
        onSelect={setTagId}
      />
      <ModeDialog
        open={modeOpen}
        onClose={() => setModeOpen(false)}
        countMode={countMode}
        focusMode={focusMode}
        onChangeCountMode={(mode: CountMode) => setCountMode(mode)}
        onChangeFocusMode={(mode: FocusMode) => setFocusMode(mode)}
      />

      <Dialog
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title={t('plant.limitReached')}
        actions={<Button onClick={() => setLimitOpen(false)}>{t('common.ok')}</Button>}
      >
        <p>
          {t('plant.limitFooter', { used: todayMinutes, limit: config.dailyFocusLimitFree })}. You can
          enable Premium in Settings (dev toggle) to test the full range.
        </p>
      </Dialog>

      {/* First-plant tutorial: 12s countdown, tooltips at 12/9/6/3, coach mark. */}
      <AnimatePresence>
        {tutorialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION.firstPlantFadeIn.duration / 1000 }}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            onClick={() => {
              setTutorialOpen(false);
              setTutorialFinished(true);
            }}
          >
            <div className="absolute bottom-[34px] left-1/2 h-[54px] w-[132px] -translate-x-1/2 rounded-full border-2 border-white/90" />
            <motion.div
              key={tutorialStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={transitionFor('hintEnter')}
              className="absolute bottom-[150px] left-1/2 mx-6 w-[300px] -translate-x-1/2 rounded-[var(--radius-l)] bg-white p-4 text-center"
              style={{ transformOrigin: '50% 100%' }}
            >
              <p className="text-headline5">{tutorialText}</p>
              <p className="mt-1 text-caption1 text-[var(--text-tertiary)]">
                {t('onboarding.notNow')} · {tutorialLeft}s
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
