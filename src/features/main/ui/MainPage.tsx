import { useEffect, useState } from 'react';
import { Drawer } from '../../menu/ui/Drawer';
import { PlantView } from '../../plant/ui/PlantView';
import { GrowingView } from '../../growing/ui/GrowingView';
import { ResultView } from '../../result/ui/ResultView';
import { useSessionStore } from '../../../core/session/sessionStore';
import { prefs } from '../../../core/prefs/prefs';
import { UDKeys } from '../../../core/prefs/UDKeys';

export function MainPage() {
  const mainState = useSessionStore((s) => s.mainState);
  const countMode = useSessionStore((s) => s.countMode);
  const focusMode = useSessionStore((s) => s.focusMode);
  const selectedSpeciesId = useSessionStore((s) => s.selectedSpeciesId);
  const plantTimeMinutes = useSessionStore((s) => s.plantTimeMinutes);
  const tagId = useSessionStore((s) => s.tagId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    prefs.set(UDKeys.PREVIOUS_COUNT_MODE, countMode);
  }, [countMode]);

  useEffect(() => {
    prefs.set(UDKeys.PREVIOUS_FOCUS_MODE, focusMode);
  }, [focusMode]);

  useEffect(() => {
    prefs.set(UDKeys.SELECTED_SPECIES_ID, selectedSpeciesId);
  }, [selectedSpeciesId]);

  useEffect(() => {
    prefs.set(UDKeys.PREVIOUS_PLANT_TIME_MIN, plantTimeMinutes);
  }, [plantTimeMinutes]);

  useEffect(() => {
    prefs.set(UDKeys.SELECTED_TAG_ID, tagId ?? 0);
  }, [tagId]);

  return (
    <div className="relative flex h-full flex-col">
      {mainState === 'plant' && <PlantView onMenu={() => setDrawerOpen(true)} />}
      {mainState === 'growing' && <GrowingView onMenu={() => setDrawerOpen(true)} />}
      {mainState === 'result' && <ResultView />}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
