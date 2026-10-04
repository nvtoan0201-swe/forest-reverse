import type { Repositories } from './repositories';
import { dayKey } from '../core/lib/format';

export interface ForestBackup {
  version: 1;
  exportedAt: number;
  plants: unknown[];
  trees: unknown[];
  tags: unknown[];
  speciesFavorite: unknown[];
  reminders: unknown[];
  phrases: unknown[];
  prefs: Record<string, string>;
}

const PREF_PREFIX = 'forest:';

export async function buildBackup(repos: Repositories): Promise<ForestBackup> {
  const [plants, trees, tags, speciesFavorite, reminders, phrases] = await Promise.all([
    repos.db.plants.toArray(),
    repos.db.trees.toArray(),
    repos.db.tags.toArray(),
    repos.db.speciesFavorite.toArray(),
    repos.db.reminders.toArray(),
    repos.db.phrases.toArray(),
  ]);
  const prefs: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREF_PREFIX)) {
      prefs[key.slice(PREF_PREFIX.length)] = localStorage.getItem(key) ?? '';
    }
  }
  return {
    version: 1,
    exportedAt: Date.now(),
    plants,
    trees,
    tags,
    speciesFavorite,
    reminders,
    phrases,
    prefs,
  };
}

export async function importBackup(repos: Repositories, backup: ForestBackup): Promise<void> {
  if (backup.version !== 1 || !Array.isArray(backup.plants) || !Array.isArray(backup.trees)) {
    throw new Error('Unsupported backup');
  }
  await repos.db.transaction(
    'rw',
    [repos.db.plants, repos.db.trees, repos.db.tags, repos.db.speciesFavorite, repos.db.reminders, repos.db.phrases],
    async () => {
      await Promise.all([
        repos.db.plants.clear(),
        repos.db.trees.clear(),
        repos.db.tags.clear(),
        repos.db.speciesFavorite.clear(),
        repos.db.reminders.clear(),
      ]);
      await repos.db.plants.bulkAdd(backup.plants as never[]);
      await repos.db.trees.bulkAdd(backup.trees as never[]);
      await repos.db.tags.bulkAdd(backup.tags as never[]);
      await repos.db.speciesFavorite.bulkAdd(backup.speciesFavorite as never[]);
      await repos.db.reminders.bulkAdd(backup.reminders as never[]);
    },
  );
  for (const [key, value] of Object.entries(backup.prefs ?? {})) {
    try {
      localStorage.setItem(`${PREF_PREFIX}${key}`, value);
    } catch {
      // ignore quota errors
    }
  }
}

export function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportCsv(repos: Repositories): Promise<string> {
  const sessions = await repos.plants.all();
  const tags = await repos.db.tags.toArray();
  const header =
    'id,tree_type,start_time,end_time,duration_minutes,mode,is_success,die_reason,tag,note,coins';
  const rows = sessions.map(({ plant, trees }) => {
    const duration = Math.round((plant.endTime - plant.startTime) / 60000);
    const tag = tags.find((t) => t.id === plant.tagId)?.tag ?? '';
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return [
      plant.id ?? '',
      trees[0]?.treeType ?? '',
      new Date(plant.startTime).toISOString(),
      new Date(plant.endTime).toISOString(),
      duration,
      plant.mode,
      plant.isSuccess,
      plant.dieReason ?? '',
      escape(tag),
      escape(plant.note ?? ''),
      plant.coinsEarned,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function backupFilename(): string {
  return `focus-grove-backup-${dayKey(Date.now())}.json`;
}

export function csvFilename(): string {
  return `focus-grove-records-${dayKey(Date.now())}.csv`;
}
