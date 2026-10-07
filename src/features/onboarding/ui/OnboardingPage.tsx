import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { Dialog } from '../../../core/designsystem/components/Dialog';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { isOriginalMode, landingUrl, uiUrl } from '../../../core/designsystem/assets';
import { MOTION } from '../../../core/designsystem/motion';

function ForestArt() {
  const repos = useRepos();
  const gids = [8, 0, 12, 26, 64, 81, 23, 106, 74];
  return (
    <div className="flex items-end justify-center gap-1 px-4" aria-hidden="true">
      {gids.map((gid, i) => (
        <img
          key={gid}
          src={repos.treeAssets.phaseUrl(gid, 5 + (i % 3))}
          alt=""
          className="w-10 object-contain sm:w-12"
          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
        />
      ))}
    </div>
  );
}

const WALKTHROUGH_ART = ['walkthrough_1.webp', 'walkthrough_2.webp', 'walkthrough_3.webp', 'walkthrough_3.webp', 'walkthrough_3.webp', 'walkthrough_3.webp'];

/**
 * Landing in original mode is served verbatim from the bundled webview
 * (res/raw/landing_html.html) and bridged with postMessage (P-210).
 */
function OriginalLanding({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (type === 'start_walkthrough' || type === 'start_auth') onStart();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onStart]);

  // The bundled webview reports its CTA clicks with window.postMessage, which
  // stays inside the frame; forward them to the React parent (same origin).
  const bridge = (event: SyntheticEvent<HTMLIFrameElement>) => {
    const win = event.currentTarget.contentWindow as (Window & { __fgBridged?: boolean }) | null;
    if (!win || win.__fgBridged) return;
    win.__fgBridged = true;
    const original = win.postMessage.bind(win);
    win.postMessage = ((message: unknown, targetOrigin?: string, transfer?: Transferable[]) => {
      try {
        window.postMessage(message, '*');
      } catch {
        /* ignore */
      }
      return original(message as never, (targetOrigin ?? '*') as never, transfer as never);
    }) as typeof win.postMessage;
  };

  return (
    <iframe
      src={`${landingUrl()}#language=en`}
      title="Plant your Forest"
      className="h-full w-full border-0"
      sandbox="allow-scripts allow-same-origin"
      onLoad={bridge}
    />
  );
}

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setFinished] = usePref<boolean>(UDKeys.WALKTHROUGH_FINISHED, false);
  const [step, setStep] = useState<'landing' | number>('landing');
  const [legalOpen, setLegalOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);

  const finish = () => {
    setFinished(true);
    navigate('/main', { replace: true });
  };

  if (step === 'landing' && isOriginalMode) {
    return <OriginalLanding onStart={() => setStep(0)} />;
  }

  if (step === 'landing') {
    return (
      <div
        className="safe-top safe-bottom flex h-full flex-col"
        style={{ background: 'var(--gradient-splash)' }}
      >
        <div className="flex flex-1 items-end justify-center pb-8 pt-16">
          <ForestArt />
        </div>
        <div className="px-6 pb-8 text-center">
          <h1 className="text-headline2 text-white">
            {t('onboarding.title1')}
            <br />
            {t('onboarding.title2')}
          </h1>
          <div className="mt-8 space-y-3">
            <button
              onClick={() => setStep(0)}
              className="h-14 w-full rounded-[8px] text-button2 font-bold text-white"
              style={{ background: 'var(--walkthrough-button)' }}
            >
              {t('onboarding.start')}
            </button>
            <button
              onClick={() => setStep(0)}
              className="h-14 w-full rounded-[8px] text-button2 font-bold"
              style={{ background: 'var(--walkthrough-mint)', color: 'var(--walkthrough-button)' }}
            >
              {t('onboarding.already')}
            </button>
          </div>
          <p className="mt-5 text-caption1 text-white/85">
            {t('onboarding.legal').split('Privacy Policy')[0]}
            <button className="underline" onClick={() => setLegalOpen(true)}>
              Privacy Policy
            </button>
            {t('onboarding.legal').split('Privacy Policy')[1]?.split('Terms of Service')[0]}
            <button className="underline" onClick={() => setLegalOpen(true)}>
              Terms of Service
            </button>
            .
          </p>
        </div>
        <Dialog open={legalOpen} onClose={() => setLegalOpen(false)} title="Legal">
          This is a study project. It does not collect, store or transmit any personal data. All data
          stays in your browser's local storage.
        </Dialog>
      </div>
    );
  }

  const pages = [
    { title: t('onboarding.walkTitle1'), text: t('onboarding.walkText1') },
    { title: t('onboarding.walkTitle2'), text: t('onboarding.walkText2') },
    { title: t('onboarding.walkTitle3'), text: t('onboarding.walkText3') },
    { title: t('onboarding.walkTitle4'), text: t('onboarding.walkText4') },
    { title: t('onboarding.walkTitle5'), text: t('onboarding.walkText5') },
    { title: t('onboarding.walkTitle6'), text: t('onboarding.walkText6') },
  ];
  const page = pages[step] ?? pages[0]!;
  const next = () => (step >= pages.length - 1 ? finish() : setStep(step + 1));
  const dark = isOriginalMode && step >= 3;
  const last = step >= pages.length - 1;
  const buttonLabels = [
    null,
    t('onboarding.walkButton2'),
    t('onboarding.walkButton3'),
    t('onboarding.walkButton4'),
    t('onboarding.walkButton5'),
    t('onboarding.finish'),
  ] as const;
  const buttonLabel = buttonLabels[step];

  return (
    <div
      className="safe-top safe-bottom relative flex h-full flex-col overflow-hidden"
      style={
        dark
          ? {
              backgroundImage: `url(${uiUrl('walkthrough_bg_1.webp')})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { background: '#ffffff' }
      }
    >
      <div className="relative z-10 flex items-center gap-3" style={{ padding: '12px 16px 0' }}>
        <button
          onClick={() => (step === 0 ? setStep('landing') : setStep(step - 1))}
          aria-label={t('common.back')}
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            background: dark ? 'rgba(255,255,255,0.9)' : '#e9e9e9',
            color: 'var(--forest-teal-600)',
          }}
        >
          <Icon name="back" size={22} />
        </button>
        <div
          className="flex flex-1"
          style={{ gap: 8 }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={6}
        >
          {pages.map((_, i) => (
            <span
              key={i}
              className="flex-1 rounded-[3px]"
              style={{
                height: 6,
                background:
                  i === step
                    ? 'var(--walkthrough-active)'
                    : dark
                      ? 'rgba(255,255,255,0.4)'
                      : 'var(--walkthrough-inactive)',
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={step}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80) next();
        }}
        onPointerDown={(e) => {
          dragStartY.current = e.clientY;
        }}
        onPointerUp={(e) => {
          if (dragStartY.current !== null && e.clientY - dragStartY.current > 80) next();
          dragStartY.current = null;
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.treeCrossFade.duration / 1000 }}
        className="relative z-10 flex flex-1 cursor-grab flex-col items-center px-8 pt-8 text-center"
      >
        <h2
          className="text-headline3"
          style={{
            color: isOriginalMode ? '#ffffff' : 'var(--text-primary)',
            textShadow: isOriginalMode ? '0 0 18px rgba(173,216,134,0.9), 0 0 6px rgba(103,208,172,0.7)' : 'none',
          }}
        >
          {page.title}
        </h2>
        {page.text && <p className="mt-2 text-body1 text-[var(--text-secondary)]">{page.text}</p>}
        {last && (
          <ul className="mt-4 space-y-1 text-caption1 text-[var(--forest-teal-600)]">
            <li>✓ {t('onboarding.walkFeature1')}</li>
            <li>✓ {t('onboarding.walkFeature2')}</li>
          </ul>
        )}
        {isOriginalMode ? (
          <img
            src={uiUrl(WALKTHROUGH_ART[step] ?? 'walkthrough_3.webp')}
            alt=""
            className="mt-6 w-[76%] object-contain"
            draggable={false}
            style={{ filter: dark ? 'brightness(1.05)' : 'none' }}
          />
        ) : (
          <div className="mt-8 h-32">
            <ForestArt />
          </div>
        )}
      </motion.div>

      {buttonLabel && (
        <div className="relative z-10 flex flex-col items-center px-6 pb-6" style={{ gap: 12 }}>
          {isOriginalMode && step === 0 && (
            <p className="text-body2 font-bold" style={{ color: 'var(--walkthrough-button)' }}>
              {t('onboarding.swipeDown')}
            </p>
          )}
          <button
            onClick={next}
            className="h-[50px] w-full rounded-[12px] text-subtitle1 text-white"
            style={{ background: 'var(--walkthrough-button)' }}
          >
            {buttonLabel}
          </button>
        </div>
      )}

      {isOriginalMode && !last && buttonLabel === null && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 flex items-end justify-center pb-16"
          style={{
            height: '22%',
            background: 'var(--gradient-walkthrough-footer)',
          }}
        >
          <span className="text-body2 text-white">{t('onboarding.swipeDown')}</span>
        </div>
      )}
    </div>
  );
}
