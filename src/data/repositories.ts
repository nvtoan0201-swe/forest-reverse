import { getDB, type ForestDB } from '../core/db/database';
import { DexiePlantRepository, type PlantRepository } from './repositories/DexiePlantRepository';
import { DexieTagRepository, type TagRepository } from './repositories/DexieTagRepository';
import { LocalWalletRepository, type WalletRepository } from './repositories/LocalWalletRepository';
import { LocalUnlockRepository, type UnlockRepository } from './repositories/LocalUnlockRepository';
import { LocalCatalogService, type CatalogService } from './catalog/catalogService';
import { LocalTreeAssetResolver, type TreeAssetResolver } from './catalog/treeAssets';

export interface Repositories {
  plants: PlantRepository;
  tags: TagRepository;
  wallet: WalletRepository;
  unlocks: UnlockRepository;
  catalog: CatalogService;
  treeAssets: TreeAssetResolver;
  db: ForestDB;
}

export function createRepositories(db: ForestDB = getDB()): Repositories {
  return {
    db,
    plants: new DexiePlantRepository(db),
    tags: new DexieTagRepository(db),
    wallet: new LocalWalletRepository(),
    unlocks: new LocalUnlockRepository(),
    catalog: new LocalCatalogService(db),
    treeAssets: new LocalTreeAssetResolver(),
  };
}
