/**
 * Row types (IndexedDB tables) + shared domain types.
 * Table/column names intentionally mirror the documented behaviour model so
 * data can be diffed against the original data layer.
 */

export type PlantMode = 'countdown' | 'countup';
export type DieReason = 'GIVE_UP' | 'KILL_APP' | 'OTHERS_GIVE_UP_IN_TOGETHER_MODE';
export type CountMode = 'DOWN' | 'UP';
export type FocusMode = 'NORMAL' | 'DEEP';
export type PlantModeKind = 'SINGLE' | 'TOGETHER';

export interface PlantRow {
  id?: number;
  serverId: number;
  plantTime: number; // seconds
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  mode: PlantMode;
  isSuccess: boolean;
  dieReason: DieReason | null;
  tagId: number;
  note: string | null;
  roomId: number;
  isDirty: boolean;
  isSaved: boolean;
  hasLeft: boolean;
  ongoing: boolean;
  isDeepFocus: boolean | null;
  endTimeBackup: number | null;
  deleted: boolean;
  coinsEarned: number;
  distractionCount: number;
}

export interface TreeRow {
  id?: number;
  plantId: number;
  treeType: number;
  isDead: boolean;
  theme: number;
  phase: number; // 0..6 alive, 7 = dead
  index: number;
}

export interface PlantWithTrees {
  plant: PlantRow;
  trees: TreeRow[];
}

export interface TagRow {
  id?: number;
  tagId: number;
  tag: string;
  tagColorTcid: number;
  isDirty: boolean;
  deleted: boolean;
  createdAt: number;
  usedAt: number;
}

export interface TagColorRow {
  tcid: number;
  hexCode: string;
  sortOrder: number;
}

export interface SpeciesFavoriteRow {
  id?: number;
  countMode: CountMode;
  treeType: number;
  tagId: number;
  plantTimeInMin: number;
  gid: number;
  createdAt: number;
  lastUsedAt: number | null;
  deleted: boolean;
  dirty: boolean;
}

export interface ReminderRow {
  id?: number;
  minuteOfDay: number;
  repeating: number;
  enabled: boolean;
  deleted: boolean;
}

export type PhraseType = 'growing' | 'success' | 'failure';

export interface PhraseRow {
  id?: number;
  phraseId: number;
  phraseType: PhraseType;
  content: string;
  deleted: boolean;
  dirty: boolean;
  enabled: boolean;
}

export interface TreeTypeRow {
  gid: number;
  title: string;
  tier: number;
  atlasImageUrl: string | null;
  atlasJsonUrl: string | null;
}

export interface AmbientSoundRow {
  gid: number;
  title: string;
  coverImageUrl: string | null;
  audioFileUrl: string | null;
}

export interface CoinRewardRow {
  gid: number;
  title: string;
  amount: number;
}

export interface GemRewardRow {
  gid: number;
  title: string;
  amount: number;
}

export interface GemPackRow {
  gid: number;
  skuId: string;
  amount: number;
  isHot: number;
}

export type ProductType =
  | 'TreeType'
  | 'AmbientSound'
  | 'Package'
  | 'GemPack'
  | 'CoinReward'
  | 'GemReward'
  | 'Shovel'
  | 'RealTreeProject';

export type PurchaseType = 0 | 1 | 2 | 3 | 4 | 5;

export interface ProductRow {
  id: number;
  title: string;
  productableType: ProductType;
  productableGid: number;
  purchaseType: PurchaseType;
  price: number;
  consumable: boolean;
  purchaseable: boolean;
  isFree: boolean;
  isPinned: boolean;
  iconUrl?: string | null;
}

export interface PrefRow {
  key: string;
  value: string;
}

export interface AnnouncementRow {
  id: number;
  title: string;
  description: string;
  cover: string;
  startDate: number;
  endDate: number;
  isAnnounced: boolean;
}

export interface RoomRow {
  id?: number;
  roomId: number;
  startTime: number;
  json: string;
}

export interface EventLogRow {
  id?: number;
  name: string;
  at: number;
  data?: string;
}

export type UnlockScenario =
  | 'UnlockTree'
  | 'UnlockSound'
  | 'PlantRealTree'
  | 'RemovePlant';
