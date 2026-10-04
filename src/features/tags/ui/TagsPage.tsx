import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageShell } from '../../../app/layout/PageShell';
import { Button } from '../../../core/designsystem/components/Button';
import { EmptyState } from '../../../core/designsystem/components/primitives';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTagColors, useTags } from '../../plant/application/hooks';
import { TagEditDialog } from '../../plant/ui/TagPicker';
import { formatMinutes } from '../../../core/lib/format';
import type { PlantWithTrees } from '../../../data/types';

const NO_SESSIONS: PlantWithTrees[] = [];

export function TagsPage() {
  const { t } = useTranslation();
  const repos = useRepos();
  const tags = useTags();
  const colors = useTagColors();
  const [editing, setEditing] = useState<{ id: number; name: string; tcid: number } | null>(null);
  const [creating, setCreating] = useState(false);

  const sessions = useLiveQuery(() => repos.plants.listByRange(0, Date.now() + 86_400_000), [], NO_SESSIONS) ?? NO_SESSIONS;

  const stats = useMemo(() => {
    const map = new Map<number, { count: number; seconds: number }>();
    for (const session of sessions) {
      const current = map.get(session.plant.tagId) ?? { count: 0, seconds: 0 };
      current.count += 1;
      current.seconds += Math.max(0, session.plant.endTime - session.plant.startTime);
      map.set(session.plant.tagId, current);
    }
    return map;
  }, [sessions]);

  const colorMap = new Map(colors.map((c) => [c.tcid, c.hexCode]));

  return (
    <PageShell
      title={t('tags.title')}
      action={
        <Button
          variant="ghost"
          size="chip"
          aria-label={t('tags.add')}
          onClick={() => setCreating(true)}
          className="text-white"
        >
          <Icon name="plus" size={16} />
        </Button>
      }
    >
      {tags.filter((tag) => tag.usedAt > 0).length === 0 ? (
        <EmptyState title={t('tags.empty')} icon={<Icon name="tag" size={40} />} />
      ) : (
        <ul className="space-y-2 p-4">
          {tags
            .filter((tag) => tag.usedAt > 0)
            .map((tag) => {
              const stat = stats.get(tag.id as number) ?? { count: 0, seconds: 0 };
              return (
                <li key={tag.id}>
                  <button
                    onClick={() =>
                      setEditing({ id: tag.id as number, name: tag.tag, tcid: tag.tagColorTcid })
                    }
                    className="forest-card flex w-full items-center gap-3 p-3 text-left"
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ background: colorMap.get(tag.tagColorTcid) ?? 'var(--gray-400)' }}
                    />
                    <div className="flex-1">
                      <p className="text-subtitle2">{tag.tag}</p>
                      <p className="text-caption1 text-[var(--text-tertiary)]">
                        {t('tags.sessions', { count: stat.count })} · {formatMinutes(stat.seconds)}
                      </p>
                    </div>
                    <Icon name="edit" size={16} className="text-[var(--text-tertiary)]" />
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      <TagEditDialog open={creating} onClose={() => setCreating(false)} />
      <TagEditDialog
        key={editing?.id}
        open={editing !== null}
        onClose={() => setEditing(null)}
        editingId={editing?.id ?? null}
        initialName={editing?.name}
        initialColorTcid={editing?.tcid}
      />
    </PageShell>
  );
}
