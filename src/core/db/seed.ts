import type { ForestDB } from './database';
import { UDKeys } from '../prefs/UDKeys';
import { prefs } from '../prefs/prefs';
import treeTypesJson from '../../assets/catalog/tree-types.json';
import productsJson from '../../assets/catalog/products.json';
import ambientSoundsJson from '../../assets/catalog/ambient-sounds.json';
import tagColorsJson from '../../assets/catalog/tag-colors.json';
import coinRewardsJson from '../../assets/catalog/coin-rewards.json';
import gemRewardsJson from '../../assets/catalog/gem-rewards.json';
import gemPacksJson from '../../assets/catalog/gem-packs.json';
import phrasesJson from '../../assets/catalog/phrases.json';
import type { PurchaseType } from '../../data/types';

interface RawProduct {
  id: number;
  title: string;
  productableType: string;
  productableGid: number;
  purchaseType: number;
  price: number;
  consumable: boolean;
  purchaseable: boolean;
  isFree: boolean;
  isPinned: boolean;
}

export const FREE_TREE_GIDS = [0, 6, 47, 81, 106] as const;
export const DEFAULT_STARTING_COINS = 100;

export async function seedDatabase(db: ForestDB): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.treeTypes,
      db.products,
      db.ambientSounds,
      db.tagColors,
      db.coinRewards,
      db.gemRewards,
      db.gemPacks,
      db.phrases,
    ],
    async () => {
    await db.treeTypes.bulkPut(
      treeTypesJson.map((t) => ({
        gid: t.gid,
        title: t.title,
        tier: t.tier,
        atlasImageUrl: null,
        atlasJsonUrl: null,
      })),
    );
    await db.products.bulkPut(
      (productsJson as RawProduct[]).map((p) => ({
        ...p,
        productableType: p.productableType as never,
        purchaseType: p.purchaseType as PurchaseType,
      })),
    );
    await db.ambientSounds.bulkPut(
      ambientSoundsJson.map((s) => ({
        gid: s.gid,
        title: s.title,
        coverImageUrl: null,
        audioFileUrl: `assets/sounds/${s.file}`,
      })),
    );
    await db.tagColors.bulkPut(tagColorsJson);
    await db.coinRewards.bulkPut(coinRewardsJson);
    await db.gemRewards.bulkPut(gemRewardsJson);
    await db.gemPacks.bulkPut(gemPacksJson.map((g) => ({ ...g, isHot: g.isHot ?? 0 })));
    await db.phrases.bulkPut(
      phrasesJson.map((p, i) => ({
        id: i + 1,
        phraseId: p.phraseId,
        phraseType: p.phraseType as never,
        content: p.content,
        deleted: false,
        dirty: false,
        enabled: true,
      })),
    );
  });

  if (prefs.get<number | null>(UDKeys.COIN_BALANCE, null) === null) {
    prefs.set(UDKeys.COIN_BALANCE, DEFAULT_STARTING_COINS);
  }
  if (prefs.get<number | null>(UDKeys.GEM_BALANCE, null) === null) {
    prefs.set(UDKeys.GEM_BALANCE, 0);
  }
  if (prefs.get<number[] | null>(UDKeys.UNLOCKED_TREES, null) === null) {
    prefs.set(UDKeys.UNLOCKED_TREES, [...FREE_TREE_GIDS]);
  }
  if (prefs.get<number[] | null>(UDKeys.UNLOCKED_SOUNDS, null) === null) {
    prefs.set(UDKeys.UNLOCKED_SOUNDS, [0]);
  }
}
