import { useTranslation } from 'react-i18next';
import { PageShell } from '../../../app/layout/PageShell';
import { Card } from '../../../core/designsystem/components/primitives';
import { config } from '../../../core/config';

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <PageShell title={t('about.title')}>
      <div className="space-y-3 p-4">
        <div className="flex flex-col items-center gap-2 py-6">
          <img src="icons/icon.svg" alt="" width={72} height={72} />
          <h1 className="text-headline4">Focus Grove</h1>
          <p className="text-caption1 text-[var(--text-tertiary)]">{config.version}</p>
        </div>
        <Card>
          <p className="text-body2">{t('about.body')}</p>
        </Card>
        <Card>
          <h2 className="mb-1 text-subtitle2">{t('settings.legal')}</h2>
          <p className="text-caption1 text-[var(--text-tertiary)]">{t('settings.legalText')}</p>
          <p className="mt-2 text-caption2 text-[var(--text-tertiary)]">
            Code licensed under the MIT License. Fonts and dependencies keep their own licenses; see
            THIRD_PARTY_NOTICES.md.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
