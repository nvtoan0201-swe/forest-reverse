import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Switch } from '../../../core/designsystem/components/primitives';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useTranslation } from 'react-i18next';
import type { CountMode, FocusMode } from '../../../data/types';

export function ModeDialog({
  open,
  onClose,
  countMode,
  focusMode,
  onChangeCountMode,
  onChangeFocusMode,
}: {
  open: boolean;
  onClose: () => void;
  countMode: CountMode;
  focusMode: FocusMode;
  onChangeCountMode: (mode: CountMode) => void;
  onChangeFocusMode: (mode: FocusMode) => void;
}) {
  const { t } = useTranslation();

  const option = (
    value: CountMode,
    title: string,
    description: string,
    icon: 'timer' | 'play',
  ) => (
    <button
      onClick={() => onChangeCountMode(value)}
      className="flex w-full items-start gap-3 rounded-[var(--radius-m)] p-3 text-left"
      style={{ background: countMode === value ? 'var(--bg-secondary)' : 'transparent' }}
    >
      <Icon name={icon} size={22} className="mt-0.5 text-[var(--brand-variant)]" />
      <span className="flex-1">
        <span className="block text-subtitle1">{title}</span>
        <span className="block text-caption1 text-[var(--text-tertiary)]">{description}</span>
      </span>
      {countMode === value && <Icon name="check" size={18} className="text-[var(--brand)]" />}
    </button>
  );

  return (
    <Sheet open={open} onClose={onClose} title={t('mode.title')}>
      <div className="space-y-1">
        {option('DOWN', t('mode.timer'), t('mode.timerDesc'), 'timer')}
        {option('UP', t('mode.stopwatch'), t('mode.stopwatchDesc'), 'play')}
      </div>
      <div className="my-3 h-px" style={{ background: 'var(--divider)' }} />
      <div className="flex items-start gap-3 p-3">
        <Icon name="focus" size={22} className="mt-0.5 text-[var(--brand-variant)]" />
        <div className="flex-1">
          <p className="text-subtitle1">{t('mode.deepFocus')}</p>
          <p className="text-caption1 text-[var(--text-tertiary)]">{t('mode.deepFocusDesc')}</p>
        </div>
        <Switch
          checked={focusMode === 'DEEP'}
          onChange={(value) => onChangeFocusMode(value ? 'DEEP' : 'NORMAL')}
          label={t('mode.deepFocus')}
        />
      </div>
      <div className="my-3 h-px" style={{ background: 'var(--divider)' }} />
      <div className="flex items-center gap-3 p-3 opacity-50">
        <Icon name="friends" size={22} className="text-[var(--brand-variant)]" />
        <div className="flex-1">
          <p className="text-subtitle1">{t('mode.together')}</p>
          <p className="text-caption1 text-[var(--text-tertiary)]">{t('mode.togetherSoon')}</p>
        </div>
      </div>
    </Sheet>
  );
}
