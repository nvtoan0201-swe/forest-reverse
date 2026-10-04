import { useTranslation } from 'react-i18next';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Button } from '../../../core/designsystem/components/Button';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { getAudio } from '../../../core/audio/AudioManager';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { useUnlockedSounds } from '../../plant/application/hooks';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useLiveQuery } from 'dexie-react-hooks';

export function SoundPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const repos = useRepos();
  const sounds = useLiveQuery(() => repos.catalog.ambientSounds(), [], []) ?? [];
  const unlocked = useUnlockedSounds();
  const [selectedGid, setSelectedGid] = usePref<number>(UDKeys.SELECTED_BG_MUSIC, 0);
  const audio = getAudio();

  return (
    <Sheet open={open} onClose={onClose} title={t('growing.chooseSound')}>
      <button
        onClick={() => {
          audio.stopBgm();
          onClose();
        }}
        className="mb-2 flex w-full items-center gap-3 rounded-[var(--radius-m)] p-3 text-left"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <Icon name="mute" size={20} className="text-[var(--text-tertiary)]" />
        <span className="text-subtitle1">{t('growing.mute')}</span>
      </button>
      <ul className="space-y-1">
        {sounds.map((sound) => {
          const isUnlocked = unlocked.includes(sound.gid);
          const selected = selectedGid === sound.gid;
          return (
            <li key={sound.gid}>
              <button
                disabled={!isUnlocked}
                onClick={() => {
                  setSelectedGid(sound.gid);
                  audio.playBgm(sound.gid);
                }}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-m)] p-3 text-left ${
                  isUnlocked ? '' : 'opacity-50'
                }`}
                style={{ background: selected ? 'var(--bg-secondary)' : 'transparent' }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: 'var(--forest-teal-100)' }}
                >
                  <Icon name="sound" size={18} className="text-[var(--brand-variant)]" />
                </span>
                <span className="flex-1 text-subtitle2">{sound.title}</span>
                {!isUnlocked && <Icon name="lock" size={14} className="text-[var(--text-tertiary)]" />}
                {selected && <Icon name="check" size={18} className="text-[var(--brand)]" />}
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="gray" full className="mt-4" onClick={onClose}>
        {t('common.close')}
      </Button>
    </Sheet>
  );
}
