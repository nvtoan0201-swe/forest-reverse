import { Howl, Howler } from 'howler';
import { UDKeys } from '../prefs/UDKeys';
import { prefs } from '../prefs/prefs';

export type SfxName = 'click' | 'slide' | 'tree0' | 'tree1' | 'tree2' | 'ring';

export interface AmbientDef {
  gid: number;
  title: string;
}

const SFX_FILES: Record<SfxName, string> = {
  click: 'assets/sounds/sfx/click.wav',
  slide: 'assets/sounds/sfx/slide.wav',
  tree0: 'assets/sounds/sfx/tree0.wav',
  tree1: 'assets/sounds/sfx/tree1.wav',
  tree2: 'assets/sounds/sfx/tree2.wav',
  ring: 'assets/sounds/sfx/ring.wav',
};

/** Howler-based audio: one looping BGM + pooled SFX with crossfade. */
export class AudioManager {
  private bgm: Howl | null = null;
  private bgmGid: number | null = null;
  private sfx = new Map<SfxName, Howl>();
  private sfxEnabled = true;
  private volume = 1;

  constructor() {
    this.sfxEnabled = prefs.get<boolean>(UDKeys.IS_SOUND_EFFECT_ENABLED, true);
    this.volume = prefs.get<number>(UDKeys.SOUND_VOLUME, 1);
    Howler.volume(this.volume);
  }

  get currentGid(): number | null {
    return this.bgmGid;
  }

  playBgm(gid: number, { fadeMs = 300 }: { fadeMs?: number } = {}): void {
    if (this.bgmGid === gid && this.bgm?.playing()) return;
    const next = new Howl({
      src: [`assets/sounds/ambient/${gid}.wav`, `assets/sounds/ambient/${gid}.ogg`],
      loop: true,
      volume: 0,
      html5: false,
    });
    const previous = this.bgm;
    this.bgm = next;
    this.bgmGid = gid;
    next.play();
    next.fade(0, 1, fadeMs);
    if (previous) {
      previous.fade(previous.volume(), 0, fadeMs);
      setTimeout(() => previous.unload(), fadeMs + 60);
    }
    prefs.set(UDKeys.SELECTED_BG_MUSIC, String(gid));
  }

  stopBgm({ fadeMs = 300 }: { fadeMs?: number } = {}): void {
    const current = this.bgm;
    this.bgm = null;
    this.bgmGid = null;
    if (!current) return;
    current.fade(current.volume(), 0, fadeMs);
    setTimeout(() => current.unload(), fadeMs + 60);
  }

  duckBgm(on: boolean): void {
    if (this.bgm) this.bgm.fade(this.bgm.volume(), on ? 0.3 : 1, 200);
  }

  playSfx(name: SfxName): void {
    if (!this.sfxEnabled) return;
    let sound = this.sfx.get(name);
    if (!sound) {
      sound = new Howl({ src: [SFX_FILES[name]], volume: 1, preload: true });
      this.sfx.set(name, sound);
    }
    sound.play();
  }

  setSfxEnabled(enabled: boolean): void {
    this.sfxEnabled = enabled;
    prefs.set(UDKeys.IS_SOUND_EFFECT_ENABLED, enabled);
  }

  get sfxEnabledValue(): boolean {
    return this.sfxEnabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.volume);
    prefs.set(UDKeys.SOUND_VOLUME, this.volume);
  }

  get volumeValue(): number {
    return this.volume;
  }

  muteAll(muted: boolean): void {
    Howler.mute(muted);
  }
}

let manager: AudioManager | null = null;

export function getAudio(): AudioManager {
  manager ??= new AudioManager();
  return manager;
}
