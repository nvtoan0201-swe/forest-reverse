import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { RepositoryProvider } from './providers/RepositoryProvider';
import { createRepositories, type Repositories } from '../data/repositories';
import { initSessionEngine } from '../core/session/SessionEngine';
import { useSessionStore } from '../core/session/sessionStore';
import { prefs } from '../core/prefs/prefs';
import { UDKeys } from '../core/prefs/UDKeys';
import type { CountMode, FocusMode } from '../data/types';
import { DEFAULT_PLANT_MINUTES } from '../features/plant/domain/constants';

function useBootstrap(repos: Repositories): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      await repos.db.open();
      await repos.tags.ensureSeedTag();

      const countMode = prefs.get<CountMode>(UDKeys.PREVIOUS_COUNT_MODE, 'DOWN');
      const focusMode = prefs.get<FocusMode>(UDKeys.PREVIOUS_FOCUS_MODE, 'NORMAL');
      const speciesId = prefs.get<number>(UDKeys.SELECTED_SPECIES_ID, 0);
      const minutes = prefs.get<number>(UDKeys.PREVIOUS_PLANT_TIME_MIN, DEFAULT_PLANT_MINUTES);
      const tagId = prefs.get<number>(UDKeys.SELECTED_TAG_ID, 0);

      useSessionStore.setState({
        countMode,
        focusMode,
        selectedSpeciesId: speciesId,
        plantTimeMinutes: minutes,
        tagId: tagId > 0 ? tagId : null,
      });

      const engine = initSessionEngine(repos);
      await engine.restoreOnLaunch();

      try {
        await navigator.storage?.persist?.();
      } catch {
        // optional
      }

      if (!cancelled) setReady(true);
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [repos]);

  return ready;
}

export function App() {
  const repos = useMemo(() => createRepositories(), []);
  const ready = useBootstrap(repos);

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center" style={{ background: 'var(--brand)' }}>
        <div className="flex flex-col items-center gap-3">
          <img src="icons/icon.svg" alt="" width={64} height={64} />
          <span className="text-caption1 text-white/80">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <RepositoryProvider repositories={repos}>
      <RouterProvider router={router} />
    </RepositoryProvider>
  );
}
