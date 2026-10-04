import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { toPng } from 'html-to-image';
import { PageShell } from '../../../app/layout/PageShell';
import { Button } from '../../../core/designsystem/components/Button';
import { Card, EmptyState, Tabs } from '../../../core/designsystem/components/primitives';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { toast } from '../../../core/designsystem/components/Snackbar';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTags, useTagColors, useTreeTypes } from '../../plant/application/hooks';
import { formatMinutes, formatTimeOfDay, dayKey, startOfDay } from '../../../core/lib/format';
import type { PlantWithTrees } from '../../../data/types';

type Period = 'day' | 'week' | 'month' | 'year';

function rangeFor(period: Period, now = Date.now()): { from: number; to: number } {
  const to = now;
  const d = new Date(now);
  switch (period) {
    case 'day':
      return { from: startOfDay(now), to };
    case 'week':
      return { from: to - 7 * 86_400_000, to };
    case 'month':
      return { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to };
    case 'year':
      return { from: new Date(d.getFullYear(), 0, 1).getTime(), to };
  }
}

function bucketsFor(period: Period, from: number, to: number): { label: string; from: number; to: number }[] {
  const buckets: { label: string; from: number; to: number }[] = [];
  if (period === 'day') {
    for (let h = 0; h < 24; h += 2) {
      const start = startOfDay(from) + h * 3_600_000;
      buckets.push({ label: String(h), from: start, to: start + 2 * 3_600_000 });
    }
    return buckets;
  }
  if (period === 'year') {
    for (let m = 0; m < 12; m++) {
      const start = new Date(new Date(from).getFullYear(), m, 1).getTime();
      const end = new Date(new Date(from).getFullYear(), m + 1, 1).getTime();
      buckets.push({ label: String(m + 1), from: start, to: Math.min(end, to) });
    }
    return buckets;
  }
  const days = Math.ceil((to - from) / 86_400_000);
  for (let i = 0; i < days; i++) {
    const start = startOfDay(from) + i * 86_400_000;
    buckets.push({ label: dayKey(start).slice(5), from: start, to: start + 86_400_000 });
  }
  return buckets;
}

export function StatsPage() {
  const { t, i18n } = useTranslation();
  const repos = useRepos();
  const treeTypes = useTreeTypes();
  const tags = useTags();
  const colors = useTagColors();
  const [period, setPeriod] = useState<Period>('week');
  const [recordOpen, setRecordOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sessions = useLiveQuery(() => repos.plants.listByRange(0, Date.now() + 86_400_000), [], [] as PlantWithTrees[]) ?? [];

  const { from, to } = rangeFor(period);
  const previous = rangeFor(period, from);
  const inRange = sessions.filter((s) => s.plant.startTime >= from && s.plant.startTime <= to);
  const inPrevious = sessions.filter(
    (s) => s.plant.startTime >= previous.from && s.plant.startTime < previous.to,
  );

  const durationOf = (list: PlantWithTrees[]) =>
    list.reduce((acc, s) => acc + Math.max(0, s.plant.endTime - s.plant.startTime), 0);
  const focusSeconds = durationOf(inRange);
  const previousSeconds = durationOf(inPrevious);
  const delta = previousSeconds > 0 ? Math.round(((focusSeconds - previousSeconds) / previousSeconds) * 100) : null;

  const buckets = useMemo(() => {
    const list = bucketsFor(period, from, to);
    return list.map((bucket) => ({
      ...bucket,
      seconds: durationOf(
        inRange.filter((s) => s.plant.startTime >= bucket.from && s.plant.startTime < bucket.to),
      ),
    }));
  }, [period, from, to, inRange]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b.seconds));

  const tagDistribution = useMemo(() => {
    const map = new Map<number, number>();
    for (const session of inRange) {
      map.set(session.plant.tagId, (map.get(session.plant.tagId) ?? 0) + Math.max(0, session.plant.endTime - session.plant.startTime));
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    return [...map.entries()]
      .map(([tagId, seconds]) => {
        const tag = tags.find((tag) => tag.id === tagId);
        return {
          tagId,
          name: tag?.tag ?? t('tags.noTag'),
          color: colors.find((c) => c.tcid === tag?.tagColorTcid)?.hexCode ?? '#A8A8A8',
          ratio: seconds / total,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);
  }, [inRange, tags, colors, t]);

  const favoriteSpecies = useMemo(() => {
    const map = new Map<number, number>();
    for (const session of inRange) {
      for (const tree of session.trees) {
        if (tree.isDead) continue;
        map.set(tree.treeType, (map.get(tree.treeType) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gid, count]) => ({
        gid,
        count,
        title: treeTypes.find((tree) => tree.gid === gid)?.title ?? `#${gid}`,
      }));
  }, [inRange, treeTypes]);

  const bestDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const session of inRange) {
      const key = dayKey(session.plant.startTime);
      map.set(key, (map.get(key) ?? 0) + Math.max(0, session.plant.endTime - session.plant.startTime));
    }
    const best = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    return best ? { key: best[0], seconds: best[1] } : null;
  }, [inRange]);

  const bestTime = useMemo(() => {
    const best = [...buckets].sort((a, b) => b.seconds - a.seconds)[0];
    return best && best.seconds > 0 ? best : null;
  }, [buckets]);

  const forestTrees = inRange.flatMap((s) => s.trees.map((tree) => ({ tree, plant: s.plant })));

  const share = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: '#ECECEC' });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `focus-grove-stats-${dayKey(Date.now())}.png`;
      link.click();
    } catch {
      toast(t('settings.importFailed'));
    }
  };

  const locale = i18n.language;
  const hasData = inRange.length > 0;

  return (
    <PageShell
      title={t('stats.title')}
      action={
        <Button variant="ghost" size="chip" onClick={() => void share()} className="text-white">
          <Icon name="share" size={16} />
        </Button>
      }
    >
      <div className="flex justify-center py-3">
        <Tabs
          items={[
            { value: 'day', label: t('stats.day') },
            { value: 'week', label: t('stats.week') },
            { value: 'month', label: t('stats.month') },
            { value: 'year', label: t('stats.year') },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      {!hasData ? (
        <EmptyState title={t('stats.noData')} icon={<Icon name="timeline" size={40} />} />
      ) : (
        <div ref={cardRef} className="space-y-3 px-4 pb-6">
          <Card>
            <p className="text-caption1 text-[var(--text-tertiary)]">{t('stats.focusTime')}</p>
            <p className="text-headline2">{formatMinutes(focusSeconds)}</p>
            {delta !== null && (
              <p
                className="text-caption1"
                style={{ color: delta >= 0 ? 'var(--success)' : 'var(--error)' }}
              >
                {delta >= 0 ? '+' : ''}
                {delta}% {t('stats.focusCompare', { value: '' })}
              </p>
            )}
          </Card>

          <Card>
            <p className="mb-2 text-subtitle2">{t('stats.trend')}</p>
            <svg viewBox={`0 0 ${buckets.length * 20} 90`} className="h-24 w-full">
              {buckets.map((bucket, i) => {
                const h = (bucket.seconds / maxBucket) * 70;
                return (
                  <rect
                    key={i}
                    x={i * 20 + 3}
                    y={80 - h}
                    width={12}
                    height={Math.max(1, h)}
                    rx={3}
                    fill="var(--brand)"
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-caption2 text-[var(--text-tertiary)]">
              <span>{buckets[0]?.label}</span>
              <span>{buckets[buckets.length - 1]?.label}</span>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-subtitle2">{t('stats.forestView')}</p>
            <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto">
              {forestTrees.slice(0, 60).map(({ tree }, i) => (
                <img
                  key={`${tree.id ?? i}`}
                  src={
                    tree.isDead
                      ? repos.treeAssets.deadUrl(tree.treeType)
                      : repos.treeAssets.phaseUrl(tree.treeType, tree.phase)
                  }
                  alt=""
                  loading="lazy"
                  className={`h-10 w-full object-contain ${tree.isDead ? 'grayscale' : ''}`}
                />
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-subtitle2">{t('stats.tagDistribution')}</p>
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 42 42" className="h-24 w-24 -rotate-90">
                {(() => {
                  let offset = 0;
                  return tagDistribution.map((slice) => {
                    const dash = slice.ratio * 100;
                    const el = (
                      <circle
                        key={slice.tagId}
                        cx="21"
                        cy="21"
                        r="15.9"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="6"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
              </svg>
              <ul className="flex-1 space-y-1">
                {tagDistribution.slice(0, 5).map((slice) => (
                  <li key={slice.tagId} className="flex items-center gap-2 text-caption1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: slice.color }} />
                    <span className="flex-1">{slice.name}</span>
                    <span className="text-[var(--text-tertiary)]">{Math.round(slice.ratio * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-subtitle2">{t('stats.favoriteSpecies')}</p>
            <ul className="space-y-2">
              {favoriteSpecies.map((item) => (
                <li key={item.gid} className="flex items-center gap-3">
                  <img src={repos.treeAssets.productUrl(item.gid)} alt="" className="h-8 w-8 object-contain" />
                  <span className="flex-1 text-body2">{item.title}</span>
                  <span className="text-caption1 text-[var(--text-tertiary)]">
                    {t('stats.totalTrees', { count: item.count })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-caption1 text-[var(--text-tertiary)]">{t('stats.bestDay')}</p>
              <p className="text-subtitle1">{bestDay ? bestDay.key : '—'}</p>
              {bestDay && <p className="text-caption2">{formatMinutes(bestDay.seconds)}</p>}
            </Card>
            <Card>
              <p className="text-caption1 text-[var(--text-tertiary)]">{t('stats.bestTime')}</p>
              <p className="text-subtitle1">{bestTime ? `${bestTime.label}:00` : '—'}</p>
            </Card>
          </div>

          <Button variant="accentTeal" full onClick={() => setRecordOpen(true)}>
            {t('stats.plantingRecord')}
          </Button>
        </div>
      )}

      <Sheet open={recordOpen} onClose={() => setRecordOpen(false)} title={t('stats.plantingRecord')}>
        <ul className="space-y-2">
          {inRange.map(({ plant, trees }) => (
            <li key={plant.id} className="flex items-center gap-3 py-1">
              <img
                src={
                  plant.isSuccess
                    ? repos.treeAssets.phaseUrl(trees[0]?.treeType ?? 0, trees[0]?.phase ?? 6)
                    : repos.treeAssets.deadUrl(trees[0]?.treeType ?? 0)
                }
                alt=""
                className="h-9 w-9 object-contain"
              />
              <span className="flex-1 text-body2">{dayKey(plant.startTime)}</span>
              <span className="text-caption1 text-[var(--text-tertiary)]">
                {formatTimeOfDay(plant.startTime, locale)} ·{' '}
                {formatMinutes(plant.endTime - plant.startTime)}
              </span>
            </li>
          ))}
        </ul>
      </Sheet>
    </PageShell>
  );
}
