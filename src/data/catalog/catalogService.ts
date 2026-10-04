import type { ForestDB } from '../../core/db/database';
import type {
  AmbientSoundRow,
  CoinRewardRow,
  GemRewardRow,
  ProductRow,
  TagColorRow,
  TreeTypeRow,
} from '../types';

export interface CatalogService {
  treeTypes(): Promise<TreeTypeRow[]>;
  treeType(gid: number): Promise<TreeTypeRow | null>;
  ambientSounds(): Promise<AmbientSoundRow[]>;
  tagColors(): Promise<TagColorRow[]>;
  coinRewards(): Promise<CoinRewardRow[]>;
  gemRewards(): Promise<GemRewardRow[]>;
  products(): Promise<ProductRow[]>;
  productFor(type: string, gid: number): Promise<ProductRow | null>;
}

export class LocalCatalogService implements CatalogService {
  constructor(private db: ForestDB) {}

  treeTypes(): Promise<TreeTypeRow[]> {
    return this.db.treeTypes.orderBy('tier').toArray();
  }

  async treeType(gid: number): Promise<TreeTypeRow | null> {
    return (await this.db.treeTypes.get(gid)) ?? null;
  }

  ambientSounds(): Promise<AmbientSoundRow[]> {
    return this.db.ambientSounds.orderBy('gid').toArray();
  }

  tagColors(): Promise<TagColorRow[]> {
    return this.db.tagColors.orderBy('sortOrder').toArray();
  }

  coinRewards(): Promise<CoinRewardRow[]> {
    return this.db.coinRewards.orderBy('gid').toArray();
  }

  gemRewards(): Promise<GemRewardRow[]> {
    return this.db.gemRewards.orderBy('gid').toArray();
  }

  products(): Promise<ProductRow[]> {
    return this.db.products.orderBy('id').toArray();
  }

  async productFor(type: string, gid: number): Promise<ProductRow | null> {
    const product = await this.db.products
      .where('productableGid')
      .equals(gid)
      .filter((p) => p.productableType === type)
      .first();
    return product ?? null;
  }
}
