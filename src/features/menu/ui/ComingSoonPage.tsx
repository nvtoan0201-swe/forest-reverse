import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { PageShell } from '../../../app/layout/PageShell';
import { EmptyState } from '../../../core/designsystem/components/primitives';
import { Icon } from '../../../core/designsystem/icons/Icon';

export function ComingSoonPage() {
  const { t } = useTranslation();
  const { section } = useParams();
  return (
    <PageShell title={section ? t(`nav.${section}`, section) : t('common.comingSoon')}>
      <EmptyState
        title={t('common.comingSoon')}
        hint={t('comingSoon.body')}
        icon={<Icon name="leaf" size={40} />}
      />
    </PageShell>
  );
}
