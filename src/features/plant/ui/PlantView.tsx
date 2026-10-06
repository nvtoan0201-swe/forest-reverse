import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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
import type { CountMode, FocusMode } from '../../../data/types';

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

  const maxMinutes = threeHours ? 180 : 120;
  const activeTag = tags.find((tag) => tag.id === tagId) ?? null;
  const tagColor = tagColors.find((c) => c.tcid === activeTag?.tagColorTcid)?.hexCode;

  const plantCount = useLiveQuery(() => repos.db.plants.count(), [], 0) ?? 0;

  useEffect(() => {
    if (!tutorialFinished && plantCount === 0 && treeTypes.length > 0) {
      setTutorialOpen(true);
    }
  }, [tutorialFinished, plantCount, treeTypes.length]);

  useEffect(() => {
    if (!tutorialOpen) return;
    const timer = window.setTimeout(() => {
      setTutorialOpen(false);
      setTutorialFinished(true);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [tutorialOpen, setTutorialFinished]);

  const startPlant = () => {
    const limitReached = !premium && todayMinutes + plantTimeMinutes > config.dailyFocusLimitFree;
    if (limitReached) {
      setLimitOpen(true);
      return;
    }
    void getSessionEngine().start({
      countMode,
      focusMode,
      plantMode: 'SINGLE',
      plantTimeSeconds: plantTimeMinutes * 60,
      tagId,
      speciesId: selectedSpeciesId,
    });
  };

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
        <Button size="default" onClick={startPlant} data-testid="plant-button">
          {t('plant.button')}
        </Button>
      </div>

      <footer className="safe-bottom px-6 pb-4 pt-2">
        <div className="flex items-center gap-2">
          <ProgressRing size={28} strokeWidth={3} progress={Math.min(1, todayMinutes / config.dailyFocusLimitFree)}>
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
        actions={
          <Button onClick={() => setLimitOpen(false)}>{t('common.ok')}</Button>
        }
      >
        <p>
          {t('plant.limitFooter', { used: todayMinutes, limit: config.dailyFocusLimitFree })}. You can
          enable Premium in Settings (dev toggle) to test the full range.
        </p>
      </Dialog>

      {tutorialOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-40 flex flex-col items-center justify-end pb-28"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => {
            setTutorialOpen(false);
            setTutorialFinished(true);
          }}
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mx-8 rounded-[var(--radius-l)] bg-white p-4 text-center"
          >
            <p className="text-headline5">{t('onboarding.tutorialTitle')}</p>
            <p className="mt-1 text-body2 text-[var(--text-secondary)]">{t('onboarding.tutorialText')}</p>
            <p className="mt-2 text-caption1 text-[var(--text-tertiary)]">
              {t('onboarding.notNow')} · 12s
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
