import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '../../../core/designsystem/components/Button';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { Dialog } from '../../../core/designsystem/components/Dialog';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { useRepos } from '../../../app/providers/RepositoryProvider';

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

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setFinished] = usePref<boolean>(UDKeys.WALKTHROUGH_FINISHED, false);
  const [step, setStep] = useState<'landing' | number>('landing');
  const [legalOpen, setLegalOpen] = useState(false);

  const finish = () => {
    setFinished(true);
    navigate('/main', { replace: true });
  };

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
              className="fg-button h-14 w-full rounded-[8px] text-button1"
              style={{ '--fg-bg': '#165943', '--fg-shadow-color': '#0c3c2e' } as CSSProperties}
            >
              {t('onboarding.start')}
            </button>
            <button
              onClick={() => setStep(0)}
              className="h-14 w-full rounded-[8px] text-button2 font-bold"
              style={{ background: 'var(--forest-teal-100)', color: 'var(--forest-teal-600)' }}
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

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 px-4 pt-3">
        <button
          onClick={() => (step === 0 ? setStep('landing') : setStep(step - 1))}
          aria-label={t('common.back')}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] shadow"
          style={{ color: 'var(--forest-teal-600)' }}
        >
          <Icon name="back" size={20} />
        </button>
        <div className="flex flex-1 gap-2" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={6}>
          {pages.map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= step ? 'var(--forest-teal-600)' : 'var(--gray-300)' }}
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 cursor-grab flex-col items-center justify-center px-8 text-center"
      >
        <h2 className="text-headline3">{page.title}</h2>
        <p className="mt-2 text-body1 text-[var(--text-secondary)]">{page.text}</p>
        <div className="mt-8 h-32">
          <ForestArt />
        </div>
      </motion.div>

      <div
        className="mx-4 mb-4 rounded-[var(--radius-l)] p-4 text-center"
        style={{ background: 'var(--forest-teal-000)' }}
      >
        <p className="text-body2 text-[var(--forest-teal-600)]">{t('onboarding.swipeDown')}</p>
      </div>

      <div className="px-6 pb-6">
        <Button variant="accentTeal" long full onClick={next}>
          {step >= pages.length - 1 ? t('onboarding.finish') : t('onboarding.continue')}
        </Button>
      </div>
    </div>
  );
}
