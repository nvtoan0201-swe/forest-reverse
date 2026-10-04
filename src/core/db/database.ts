import Dexie, { type EntityTable } from 'dexie';
import type {
  AmbientSoundRow,
  AnnouncementRow,
  CoinRewardRow,
  EventLogRow,
  GemPackRow,
  GemRewardRow,
  PhraseRow,
  PlantRow,
  PrefRow,
  ProductRow,
  ReminderRow,
  RoomRow,
  SpeciesFavoriteRow,
  TagColorRow,
  TagRow,
  TreeRow,
  TreeTypeRow,
} from '../../data/types';
import { seedDatabase } from './seed';

export class ForestDB extends Dexie {
  plants!: EntityTable<PlantRow, 'id'>;
  trees!: EntityTable<TreeRow, 'id'>;
  tags!: EntityTable<TagRow, 'id'>;
  tagColors!: EntityTable<TagColorRow, 'tcid'>;
  speciesFavorite!: EntityTable<SpeciesFavoriteRow, 'id'>;
  reminders!: EntityTable<ReminderRow, 'id'>;
  phrases!: EntityTable<PhraseRow, 'id'>;
  treeTypes!: EntityTable<TreeTypeRow, 'gid'>;
  ambientSounds!: EntityTable<AmbientSoundRow, 'gid'>;
  coinRewards!: EntityTable<CoinRewardRow, 'gid'>;
  gemRewards!: EntityTable<GemRewardRow, 'gid'>;
  gemPacks!: EntityTable<GemPackRow, 'gid'>;
  products!: EntityTable<ProductRow, 'id'>;
  userPrefs!: EntityTable<PrefRow, 'key'>;
  announcements!: EntityTable<AnnouncementRow, 'id'>;
  rooms!: EntityTable<RoomRow, 'id'>;
  eventLog!: EntityTable<EventLogRow, 'id'>;

  constructor(name = 'forest_web') {
    super(name);
    this.version(1).stores({
      plants: '++id, startTime, endTime, mode, tagId, roomId',
      trees: '++id, plantId, treeType',
      tags: '++id, tagId, tag, usedAt',
      tagColors: 'tcid, sortOrder',
      speciesFavorite: '++id, gid, treeType, lastUsedAt',
      reminders: '++id, minuteOfDay, enabled',
      phrases: '++id, phraseType',
      treeTypes: 'gid, tier',
      ambientSounds: 'gid',
      coinRewards: 'gid',
      gemRewards: 'gid',
      gemPacks: 'gid, skuId',
      products: 'id, productableType, productableGid, purchaseType',
      userPrefs: 'key',
      announcements: 'id, startDate, endDate',
      rooms: '++id, roomId',
      eventLog: '++id, name, at',
    });
    this.on('populate', () => seedDatabase(this));
  }
}

let singleton: ForestDB | null = null;

export function getDB(): ForestDB {
  singleton ??= new ForestDB();
  return singleton;
}

export function createDB(name: string): ForestDB {
  return new ForestDB(name);
}
