import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { iconUrl } from '../../../core/designsystem/assets';

export function SplashPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [finished] = usePref<boolean>(UDKeys.WALKTHROUGH_FINISHED, false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate(finished ? '/main' : '/onboarding', { replace: true });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [finished, navigate]);

  return (
    <div className="relative flex h-full flex-col items-center bg-[var(--gray-000)]">
      <div className="flex flex-1 flex-col items-center pt-[34%]">
        <img src={iconUrl('splash') ?? 'icons/icon.svg'} alt="" width={80} height={80} />
        <p className="mt-4 text-[14px]" style={{ color: 'var(--brown-500)' }}>
          {t('splash.slogan')}
        </p>
      </div>
      <p className="absolute bottom-6 text-caption2 text-[var(--gray-400)]">© 2014–2026 · study build</p>
    </div>
  );
}
