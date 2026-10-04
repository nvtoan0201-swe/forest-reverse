import { UDKeys } from '../../core/prefs/UDKeys';
import { prefs } from '../../core/prefs/prefs';

export interface UnlockRepository {
  unlockedTrees(): readonly number[];
  unlockedSounds(): readonly number[];
  isTreeUnlocked(gid: number): boolean;
  isSoundUnlocked(gid: number): boolean;
  unlockTree(gid: number): void;
  unlockSound(gid: number): void;
}

export class LocalUnlockRepository implements UnlockRepository {
  unlockedTrees(): readonly number[] {
    return prefs.get<number[]>(UDKeys.UNLOCKED_TREES, []);
  }

  unlockedSounds(): readonly number[] {
    return prefs.get<number[]>(UDKeys.UNLOCKED_SOUNDS, []);
  }

  isTreeUnlocked(gid: number): boolean {
    return this.unlockedTrees().includes(gid);
  }

  isSoundUnlocked(gid: number): boolean {
    return this.unlockedSounds().includes(gid);
  }

  unlockTree(gid: number): void {
    const list = new Set(this.unlockedTrees());
    list.add(gid);
    prefs.set(UDKeys.UNLOCKED_TREES, [...list].sort((a, b) => a - b));
  }

  unlockSound(gid: number): void {
    const list = new Set(this.unlockedSounds());
    list.add(gid);
    prefs.set(UDKeys.UNLOCKED_SOUNDS, [...list].sort((a, b) => a - b));
  }
}
