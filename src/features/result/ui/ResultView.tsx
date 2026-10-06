import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { Button } from '../../../core/designsystem/components/Button';
import { MainTopBar } from '../../../core/designsystem/components/MainTopBar';
import { Dialog } from '../../../core/designsystem/components/Dialog';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useSessionStore } from '../../../core/session/sessionStore';
import { useWallet } from '../../plant/application/hooks';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { dayKey, formatMinutes } from '../../../core/lib/format';
import { getAudio } from '../../../core/audio/AudioManager';
import { toast } from '../../../core/designsystem/components/Snackbar';

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function ResultView() {
  const { t } = useTranslation();
  const repos = useRepos();
  const navigate = useNavigate();
  const wallet = useWallet();
  const { result, resetForm, focusMode } = useSessionStore();
  const [coinOpen, setCoinOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [note, setNote] = useState(result?.plant.note ?? '');
  const [boostDate, setBoostDate] = usePref<string>(UDKeys.BOOST_USED_DATE, '');
  const cardRef = useRef<HTMLDivElement>(null);

  const displayedCoins = useCountUp(result?.coins ?? 0);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setCoinOpen(result.success), 450);
    if (result.success) {
      const count = result.trees.filter((tree) => !tree.isDead).length;
      const sfx = count <= 12 ? 'tree0' : count <= 25 ? 'tree1' : 'tree2';
      getAudio().playSfx(sfx);
    }
    return () => window.clearTimeout(timer);
  }, [result]);

  if (!result) return null;
  const { plant, trees, success, coins, gems } = result;
  const alive = trees.filter((tree) => !tree.isDead).length;
  const elapsedMs = Math.max(0, plant.endTime - plant.startTime);
  const failReason =
    plant.dieReason === 'GIVE_UP'
      ? t('result.failGiveUp')
      : plant.dieReason === 'KILL_APP'
        ? t('result.failKill')
        : t('result.failUnknown');
  const today = dayKey(Date.now());
  const boostAvailable = success && boostDate !== today;

  const saveNote = async () => {
    if (plant.id) await repos.plants.update(plant.id, { note: note.trim() || null });
    setNoteOpen(false);
  };

  const share = async () => {
    const node = cardRef.current;
    if (!node) return;
    try {
      const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#51A387' });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'focus-grove-result.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('result.shareTitle') });
      } else {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'focus-grove-result.png';
        link.click();
      }
    } catch {
      toast(t('settings.importFailed'));
    }
  };

  return (
    <div className="relative flex h-full flex-col" style={{ background: 'var(--brand)' }}>
      <MainTopBar
        leading="back"
        onLeading={resetForm}
        countMode={plant.mode === 'countup' ? 'UP' : 'DOWN'}
        focusMode={focusMode}
        onModeClick={resetForm}
        coin={wallet.coin}
        onAddCoin={() => undefined}
      />

      <div className="scroll-area flex-1 overflow-y-auto pb-6 pt-1">
        <div ref={cardRef} style={{ background: 'var(--brand)' }}>
          <h1
            className="text-center text-headline4 text-white"
            style={{ paddingLeft: 'var(--result-top-pad-h)', paddingRight: 'var(--result-top-pad-h)' }}
          >
            {success ? t('result.success', { count: alive }) : t('result.failReason', { reason: failReason })}
          </h1>

          <motion.div
            className="mt-4 flex flex-wrap items-end justify-center gap-x-1 gap-y-2 px-4"
            animate={success ? undefined : { x: [0, -6, 6, -4, 4, 0] }}
            transition={success ? undefined : { duration: 0.3 }}
          >
            {trees.map((tree, index) => (
              <motion.img
                key={tree.id ?? index}
                initial={{ opacity: 0, scaleX: 0.4, scaleY: 0 }}
                animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
                transition={{ delay: index * 0.08, duration: 0.25 }}
                src={
                  tree.isDead
                    ? repos.treeAssets.deadUrl(tree.treeType)
                    : repos.treeAssets.phaseUrl(tree.treeType, tree.phase)
                }
                alt=""
                className={`h-24 w-16 object-contain ${tree.isDead ? 'grayscale' : ''}`}
                style={{ opacity: tree.isDead ? 0.85 : 1, transformOrigin: '50% 100%' }}
              />
            ))}
          </motion.div>

          <p className="mt-3 text-center text-body2 text-white/80">
            {t('result.focusTime')}: {formatMinutes(elapsedMs / 1000)}
            {gems > 0 ? ` · +${gems} ♦` : ''}
          </p>

          {!success && (
            <button
              onClick={() => setReasonOpen(true)}
              className="mx-auto mt-4 block rounded-[var(--radius-s)] px-4 py-2 text-body2 text-white underline"
            >
              {t('result.checkReason')}
            </button>
          )}
        </div>

        <div className="mt-10 flex items-center justify-center" style={{ gap: 'var(--result-action-gap)' }}>
          <button
            onClick={() => setNoteOpen(true)}
            aria-label={t('result.note')}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 'var(--result-action-size)',
              height: 'var(--result-action-size)',
              border: '1px solid rgba(255,255,255,0.9)',
              color: 'var(--color-white)',
            }}
          >
            <Icon name="note" size={20} />
          </button>
          <button
            onClick={() => void share()}
            aria-label={t('result.share')}
            className="flex items-center justify-center"
            style={{ width: 'var(--result-action-size)', height: 'var(--result-action-size)' }}
          >
            <Icon name="share" size={40} />
          </button>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="big"
            style={{ width: 'var(--result-relax-width)', height: 'var(--result-relax-height)' }}
            onClick={() => navigate('/relax')}
          >
            {t('result.relax')}
          </Button>
        </div>
      </div>

      <Dialog
        open={coinOpen}
        onClose={() => setCoinOpen(false)}
        title={success ? t('result.coinsEarned', { count: coins }) : t('timeline.dead')}
        actions={
          <>
            {boostAvailable && (
              <Button
                variant="accentYellow"
                onClick={() => {
                  repos.wallet.earnCoin(coins);
                  setBoostDate(today);
                  toast(t('result.boost'));
                  setCoinOpen(false);
                }}
              >
                x2
              </Button>
            )}
            <Button onClick={() => setCoinOpen(false)}>{t('common.ok')}</Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-2">
          <Icon name="coin" size={64} />
          <p className="text-numbers text-headline2">{success ? displayedCoins : 0}</p>
          {boostAvailable ? (
            <p className="text-caption1">{t('result.boost')}</p>
          ) : success ? (
            <p className="text-caption1">{t('result.boostUsed')}</p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title={t('result.note')}
        actions={
          <>
            <Button variant="gray" onClick={() => setNoteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={() => void saveNote()}>{t('common.save')}</Button>
          </>
        }
      >
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('result.notePlaceholder')}
          rows={3}
          className="w-full rounded-[var(--radius-s)] border px-3 py-2 text-body2"
          style={{ borderColor: 'var(--gray-300)' }}
        />
      </Dialog>

      <Dialog open={reasonOpen} onClose={() => setReasonOpen(false)} title={t('result.witherTitle')}>
        {plant.dieReason === 'GIVE_UP' ? t('result.witherGiveUp') : t('result.witherKill')}
      </Dialog>
    </div>
  );
}
