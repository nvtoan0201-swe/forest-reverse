import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageShell } from '../../../app/layout/PageShell';
import { EmptyState } from '../../../core/designsystem/components/primitives';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Button } from '../../../core/designsystem/components/Button';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTags, useTreeTypes } from '../../plant/application/hooks';
import { useTagColors } from '../../plant/application/hooks';
import { formatDayHeader, formatMinutes, formatTimeOfDay, dayKey } from '../../../core/lib/format';
import type { PlantWithTrees } from '../../../data/types';

export function TimelinePage() {
  const { t, i18n } = useTranslation();
  const repos = useRepos();
  const treeTypes = useTreeTypes();
  const tags = useTags();
  const colors = useTagColors();
  const [selected, setSelected] = useState<PlantWithTrees | null>(null);

  const sessions = useLiveQuery(
    () => repos.plants.listByRange(0, Date.now() + 86_400_000),
    [],
    [] as PlantWithTrees[],
  );

  const treeName = (gid: number) => treeTypes.find((tree) => tree.gid === gid)?.title ?? `#${gid}`;
  const tagFor = (tagId: number) => tags.find((tag) => tag.id === tagId);
  const colorFor = (tcid: number) => colors.find((c) => c.tcid === tcid)?.hexCode;

  const groups = useMemo(() => {
    const map = new Map<string, PlantWithTrees[]>();
    for (const session of sessions ?? []) {
      const key = dayKey(session.plant.startTime);
      const list = map.get(key) ?? [];
      list.push(session);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [sessions]);

  const locale = i18n.language;

  return (
    <PageShell title={t('timeline.title')}>
      {(sessions ?? []).length === 0 ? (
        <EmptyState title={t('timeline.empty')} icon={<Icon name="timeline" size={40} />} />
      ) : (
        <div className="space-y-4 p-4">
          {groups.map(([key, list]) => {
            const totalSeconds = list.reduce(
              (acc, s) => acc + (s.plant.endTime - s.plant.startTime),
              0,
            );
            return (
              <section key={key}>
                <header className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-subtitle1">{formatDayHeader(list[0]!.plant.startTime, locale)}</h2>
                  <span className="text-caption1 text-[var(--text-tertiary)]">
                    {t('timeline.total', { count: list.length, duration: formatMinutes(totalSeconds) })}
                  </span>
                </header>
                <ul className="space-y-2">
                  {list.map(({ plant, trees }) => {
                    const tag = tagFor(plant.tagId);
                    const tree = trees[0];
                    return (
                      <li key={plant.id}>
                        <button
                          onClick={() => setSelected({ plant, trees })}
                          className="forest-card flex w-full items-center gap-3 p-3 text-left"
                        >
                          <img
                            src={
                              plant.isSuccess
                                ? repos.treeAssets.phaseUrl(tree?.treeType ?? 0, tree?.phase ?? 6)
                                : repos.treeAssets.deadUrl(tree?.treeType ?? 0)
                            }
                            alt=""
                            className={`h-12 w-12 object-contain ${plant.isSuccess ? '' : 'grayscale'}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-subtitle2">{treeName(tree?.treeType ?? 0)}</p>
                            <p className="text-caption1 text-[var(--text-tertiary)]">
                              {formatTimeOfDay(plant.startTime, locale)} - {formatTimeOfDay(plant.endTime, locale)}
                              {' · '}
                              {formatMinutes(plant.endTime - plant.startTime)}
                            </p>
                            {plant.note && (
                              <p className="truncate text-caption1 text-[var(--text-secondary)]">{plant.note}</p>
                            )}
                          </div>
                          {tag && (
                            <span
                              className="rounded-full px-2 py-0.5 text-caption2 text-white"
                              style={{ background: colorFor(tag.tagColorTcid) ?? 'var(--gray-400)' }}
                            >
                              {tag.tag}
                            </span>
                          )}
                          {!plant.isSuccess && (
                            <span className="text-caption2 text-[var(--red-400)]">{t('timeline.dead')}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? treeName(selected.trees[0]?.treeType ?? 0) : ''}
      >
        {selected && (
          <div className="space-y-3 text-body2">
            <p>
              {formatDayHeader(selected.plant.startTime, locale)} ·{' '}
              {formatTimeOfDay(selected.plant.startTime, locale)} -{' '}
              {formatTimeOfDay(selected.plant.endTime, locale)}
            </p>
            <p className="text-[var(--text-secondary)]">
              {formatMinutes(selected.plant.endTime - selected.plant.startTime)} ·{' '}
              {selected.plant.mode === 'countup' ? t('mode.stopwatch') : t('mode.timer')} ·{' '}
              {selected.plant.isSuccess ? `+${selected.plant.coinsEarned} ¢` : t('timeline.dead')}
            </p>
            {selected.plant.note && (
              <p className="rounded-[var(--radius-s)] p-3" style={{ background: 'var(--bg-secondary)' }}>
                {selected.plant.note}
              </p>
            )}
            <Button
              variant="red"
              full
              onClick={async () => {
                if (selected.plant.id) await repos.plants.softDelete(selected.plant.id);
                setSelected(null);
              }}
            >
              {t('timeline.deletePlant')}
            </Button>
          </div>
        )}
      </Sheet>
    </PageShell>
  );
}
