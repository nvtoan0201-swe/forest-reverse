import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageShell } from '../../../app/layout/PageShell';
import { Button } from '../../../core/designsystem/components/Button';
import { Card, Switch } from '../../../core/designsystem/components/primitives';
import { ConfirmDialog } from '../../../core/designsystem/components/Dialog';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { toast } from '../../../core/designsystem/components/Snackbar';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys, type RingtoneMode } from '../../../core/prefs/UDKeys';
import { setLanguage, type AppLanguage } from '../../../core/i18n';
import { config } from '../../../core/config';
import { getAudio } from '../../../core/audio/AudioManager';
import {
  backupFilename,
  buildBackup,
  csvFilename,
  downloadText,
  exportCsv,
  importBackup,
  type ForestBackup,
} from '../../../data/backup';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3">
      <h2 className="mb-1.5 px-1 text-caption1 uppercase tracking-wide text-[var(--text-tertiary)]">
        {title}
      </h2>
      <Card className="divide-y divide-[var(--divider)] p-0">{children}</Card>
    </section>
  );
}

function Row({
  icon,
  label,
  hint,
  children,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <Icon name={icon} size={20} className="text-[var(--brand-variant)]" />
      <div className="min-w-0 flex-1">
        <p className="text-body2">{label}</p>
        {hint && <p className="text-caption2 text-[var(--text-tertiary)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const repos = useRepos();
  const fileRef = useRef<HTMLInputElement>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [importCandidate, setImportCandidate] = useState<ForestBackup | null>(null);

  const [sfx, setSfx] = usePref<boolean>(UDKeys.IS_SOUND_EFFECT_ENABLED, true);
  const [ringtone, setRingtone] = usePref<RingtoneMode>(UDKeys.RINGTONE_MODE, 'system');
  const [volume, setVolume] = usePref<number>(UDKeys.SOUND_VOLUME, 1);
  const [notifications, setNotifications] = usePref<boolean>(UDKeys.NOTIFICATIONS_ENABLED, true);
  const [threeHours, setThreeHours] = usePref<boolean>(UDKeys.THREE_HOURS, false);
  const [killApp, setKillApp] = usePref<boolean>(UDKeys.KILL_APP_KILL_TREE, true);
  const [exceed, setExceed] = usePref<boolean>(UDKeys.COUNTING_EXCEEDED_TIME, false);
  const [screenOn, setScreenOn] = usePref<boolean>(UDKeys.IS_SCREEN_ON, false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [arrangeByTime, setArrangeByTime] = usePref<boolean>(UDKeys.ARRANGE_BY_TIME, false);
  const [mondayFirst, setMondayFirst] = usePref<boolean>(UDKeys.IS_MONDAY_FIRST, false);
  const [xmas, setXmas] = usePref<boolean>(UDKeys.XMAS_THEME, false);
  const [premium, setPremium] = usePref<boolean>(UDKeys.IS_PREMIUM_DEV, false);

  const changeLanguage = (language: AppLanguage) => {
    setLanguage(language);
    void i18n.changeLanguage(language);
  };

  const requestNotifications = async (value: boolean) => {
    setNotifications(value);
    if (value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const toggleWakeLock = async (value: boolean) => {
    setScreenOn(value);
    try {
      if (value) {
        wakeLockRef.current = (await navigator.wakeLock?.request('screen')) ?? null;
      } else {
        await wakeLockRef.current?.release();
        wakeLockRef.current = null;
      }
    } catch {
      // not supported everywhere
    }
  };

  const doExportJson = async () => {
    const backup = await buildBackup(repos);
    downloadText(backupFilename(), JSON.stringify(backup, null, 2), 'application/json');
  };

  const doExportCsv = async () => {
    downloadText(csvFilename(), await exportCsv(repos), 'text/csv');
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ForestBackup;
      if (parsed.version !== 1) throw new Error('bad version');
      setImportCandidate(parsed);
    } catch {
      toast(t('settings.importFailed'));
    }
  };

  const soundLabel = (mode: RingtoneMode) =>
    mode === 'normal'
      ? t('settings.ringtoneNormal')
      : mode === 'vibrate'
        ? t('settings.ringtoneVibrate')
        : mode === 'silent'
          ? t('settings.ringtoneSilent')
          : 'System';

  return (
    <PageShell title={t('settings.title')}>
      <div className="p-4">
        <Section title={t('settings.language')}>
          <Row icon="globe" label={t('settings.language')}>
            <div className="flex gap-1">
              <Button
                size="chip"
                variant={i18n.language === 'en' ? 'brand' : 'gray'}
                onClick={() => changeLanguage('en')}
              >
                EN
              </Button>
              <Button
                size="chip"
                variant={i18n.language === 'vi' ? 'brand' : 'gray'}
                onClick={() => changeLanguage('vi')}
              >
                VI
              </Button>
            </div>
          </Row>
        </Section>

        <Section title={t('settings.sound')}>
          <Row icon="sound" label={t('settings.sfx')}>
            <Switch
              checked={sfx}
              onChange={(value) => {
                setSfx(value);
                getAudio().setSfxEnabled(value);
              }}
              label={t('settings.sfx')}
            />
          </Row>
          <Row icon="bell" label={t('settings.ringtone')}>
            <select
              value={ringtone}
              onChange={(e) => setRingtone(e.target.value as RingtoneMode)}
              className="rounded-[var(--radius-s)] border px-2 py-1 text-caption1"
              style={{ borderColor: 'var(--gray-300)' }}
              aria-label={t('settings.ringtone')}
            >
              {(['system', 'normal', 'vibrate', 'silent'] as const).map((mode) => (
                <option key={mode} value={mode}>
                  {soundLabel(mode)}
                </option>
              ))}
            </select>
          </Row>
          <Row icon="headphone" label={t('settings.volume')}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={volume}
              onChange={(e) => {
                const value = Number(e.target.value);
                setVolume(value);
                getAudio().setVolume(value);
              }}
              aria-label={t('settings.volume')}
            />
          </Row>
        </Section>

        <Section title={t('settings.notifications')}>
          <Row icon="bell" label={t('settings.notificationsEnable')}>
            <Switch
              checked={notifications}
              onChange={(value) => void requestNotifications(value)}
              label={t('settings.notificationsEnable')}
            />
          </Row>
          <Row icon="bell" label={t('settings.notificationsTest')}>
            <Button
              size="chip"
              variant="accentTeal"
              onClick={() => {
                if (typeof Notification === 'undefined') return;
                void Notification.requestPermission().then((permission) => {
                  if (permission === 'granted') {
                    new Notification('Focus Grove', { body: 'Notifications are working.' });
                  }
                });
              }}
            >
              Test
            </Button>
          </Row>
        </Section>

        <Section title={t('settings.timer')}>
          <Row icon="timer" label={t('settings.threeHours')}>
            <Switch checked={threeHours} onChange={setThreeHours} label={t('settings.threeHours')} />
          </Row>
          <Row icon="close" label={t('settings.killApp')} hint={t('settings.killAppHint')}>
            <Switch checked={killApp} onChange={setKillApp} label={t('settings.killApp')} />
          </Row>
          <Row icon="plus" label={t('settings.exceed')}>
            <Switch checked={exceed} onChange={setExceed} label={t('settings.exceed')} />
          </Row>
          <Row icon="sun" label={t('settings.screenOn')}>
            <Switch checked={screenOn} onChange={(v) => void toggleWakeLock(v)} label={t('settings.screenOn')} />
          </Row>
        </Section>

        <Section title={t('settings.forest')}>
          <Row icon="tree" label={t('settings.arrangeByTime')}>
            <Switch checked={arrangeByTime} onChange={setArrangeByTime} label={t('settings.arrangeByTime')} />
          </Row>
          <Row icon="timeline" label={t('settings.mondayFirst')}>
            <Switch checked={mondayFirst} onChange={setMondayFirst} label={t('settings.mondayFirst')} />
          </Row>
        </Section>

        <Section title={t('settings.theme')}>
          <Row icon="snow" label={t('settings.xmas')}>
            <Switch checked={xmas} onChange={setXmas} label={t('settings.xmas')} />
          </Row>
          <Row icon="gem" label={t('settings.premium')}>
            <Switch checked={premium} onChange={setPremium} label={t('settings.premium')} />
          </Row>
        </Section>

        <Section title={t('settings.data')}>
          <Row icon="download" label={t('settings.exportJson')}>
            <Button size="chip" variant="accentTeal" onClick={() => void doExportJson()}>
              Export
            </Button>
          </Row>
          <Row icon="upload" label={t('settings.importJson')}>
            <Button size="chip" variant="accentTeal" onClick={() => fileRef.current?.click()}>
              Import
            </Button>
          </Row>
          <Row icon="share" label={t('settings.exportCsv')}>
            <Button size="chip" variant="accentTeal" onClick={() => void doExportCsv()}>
              Export
            </Button>
          </Row>
          <Row icon="trash" label={t('settings.clearHistory')}>
            <Button size="chip" variant="red" onClick={() => setClearOpen(true)}>
              {t('common.delete')}
            </Button>
          </Row>
        </Section>

        <Section title={t('settings.about')}>
          <Row icon="leaf" label={t('settings.version')}>
            <span className="text-caption1 text-[var(--text-tertiary)]">{config.version}</span>
          </Row>
          <div className="p-3">
            <p className="text-caption1 text-[var(--text-tertiary)]">{t('settings.legalText')}</p>
          </div>
        </Section>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          void onPickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <ConfirmDialog
        open={clearOpen}
        title={t('settings.clearHistory')}
        body={t('settings.clearConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          void repos.plants.clearHistory().then(() => toast(t('common.done')));
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />

      <ConfirmDialog
        open={importCandidate !== null}
        title={t('settings.importJson')}
        body={t('settings.importConfirm')}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (importCandidate) {
            void importBackup(repos, importCandidate).then(() => toast(t('settings.imported')));
          }
          setImportCandidate(null);
        }}
        onCancel={() => setImportCandidate(null)}
      />
    </PageShell>
  );
}
