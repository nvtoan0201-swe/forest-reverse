import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import type { ProductRow, TagColorRow, TagRow, TreeTypeRow } from '../../../data/types';

export function useTreeTypes(): TreeTypeRow[] {
  const repos = useRepos();
  return useLiveQuery(() => repos.catalog.treeTypes(), [], []) ?? [];
}

export function useProducts(): ProductRow[] {
  const repos = useRepos();
  return useLiveQuery(() => repos.catalog.products(), [], []) ?? [];
}

export function useTagColors(): TagColorRow[] {
  const repos = useRepos();
  return useLiveQuery(() => repos.catalog.tagColors(), [], []) ?? [];
}

export function useTags(): TagRow[] {
  const repos = useRepos();
  return useLiveQuery(() => repos.tags.list(), [], []) ?? [];
}

export function useWallet() {
  const repos = useRepos();
  const balance = useLiveQuery(() => repos.wallet.getBalance(), [], { coin: 0, gem: 0 });
  return balance ?? { coin: 0, gem: 0 };
}

export function useUnlockedTrees(): readonly number[] {
  const repos = useRepos();
  const raw = useLiveQuery(
    async () => JSON.stringify([...repos.unlocks.unlockedTrees()]),
    [],
    '[]',
  );
  return useMemo(() => JSON.parse(raw ?? '[]') as number[], [raw]);
}

export function useUnlockedSounds(): readonly number[] {
  const repos = useRepos();
  const raw = useLiveQuery(
    async () => JSON.stringify([...repos.unlocks.unlockedSounds()]),
    [],
    '[]',
  );
  return useMemo(() => JSON.parse(raw ?? '[]') as number[], [raw]);
}

export function useTodayFocusMinutes(): number {
  const repos = useRepos();
  const value = useLiveQuery(async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const sessions = await repos.plants.listByRange(start.getTime(), Date.now());
    const seconds = sessions
      .filter((s) => s.plant.isSuccess)
      .reduce((acc, s) => acc + (s.plant.endTime - s.plant.startTime), 0);
    return Math.floor(seconds / 60000);
  }, []);
  return value ?? 0;
}
