import type { ForestDB } from '../../core/db/database';
import type { NewPlant } from '../../features/plant/domain/plant';
import type { BuildTreesResult } from '../../features/plant/domain/plant';
import type { PlantRow, PlantWithTrees, TreeRow } from '../types';

export interface PlantRepository {
  create(plant: NewPlant, trees: BuildTreesResult[]): Promise<number>;
  update(id: number, patch: Partial<PlantRow>): Promise<void>;
  updateTree(id: number, patch: Partial<TreeRow>): Promise<void>;
  get(id: number): Promise<PlantWithTrees | null>;
  getOngoing(): Promise<PlantWithTrees | null>;
  listByRange(from: number, to: number, opts?: { includeDeleted?: boolean }): Promise<PlantWithTrees[]>;
  softDelete(id: number): Promise<void>;
  hardDelete(id: number): Promise<void>;
  clearHistory(): Promise<void>;
  all(): Promise<PlantWithTrees[]>;
}

export class DexiePlantRepository implements PlantRepository {
  constructor(private db: ForestDB) {}

  async create(plant: NewPlant, trees: BuildTreesResult[]): Promise<number> {
    return this.db.transaction('rw', this.db.plants, this.db.trees, async () => {
      const plantId = await this.db.plants.add(plant as PlantRow);
      await this.db.trees.bulkAdd(
        trees.map((t) => ({ ...t, plantId })) as TreeRow[],
      );
      return plantId as number;
    });
  }

  async update(id: number, patch: Partial<PlantRow>): Promise<void> {
    await this.db.plants.update(id, patch);
  }

  async updateTree(id: number, patch: Partial<TreeRow>): Promise<void> {
    await this.db.trees.update(id, patch);
  }

  async get(id: number): Promise<PlantWithTrees | null> {
    const plant = await this.db.plants.get(id);
    if (!plant) return null;
    const trees = await this.db.trees.where('plantId').equals(id).toArray();
    return { plant, trees: trees.sort((a, b) => a.index - b.index) };
  }

  async getOngoing(): Promise<PlantWithTrees | null> {
    const plant = await this.db.plants.filter((p) => p.ongoing === true).first();
    if (!plant?.id) return null;
    return this.get(plant.id);
  }

  async listByRange(
    from: number,
    to: number,
    opts: { includeDeleted?: boolean } = {},
  ): Promise<PlantWithTrees[]> {
    const plants = await this.db.plants
      .where('startTime')
      .between(from, to, true, true)
      .toArray();
    const visible = opts.includeDeleted ? plants : plants.filter((p) => !p.deleted);
    visible.sort((a, b) => b.startTime - a.startTime);
    const ids = visible.map((p) => p.id).filter((id): id is number => typeof id === 'number');
    const trees = ids.length ? await this.db.trees.where('plantId').anyOf(ids).toArray() : [];
    const grouped = new Map<number, TreeRow[]>();
    for (const tree of trees) {
      const list = grouped.get(tree.plantId) ?? [];
      list.push(tree);
      grouped.set(tree.plantId, list);
    }
    return visible.map((plant) => ({
      plant,
      trees: (grouped.get(plant.id as number) ?? []).sort((a, b) => a.index - b.index),
    }));
  }

  async softDelete(id: number): Promise<void> {
    await this.db.plants.update(id, { deleted: true });
  }

  async hardDelete(id: number): Promise<void> {
    await this.db.transaction('rw', this.db.plants, this.db.trees, async () => {
      await this.db.trees.where('plantId').equals(id).delete();
      await this.db.plants.delete(id);
    });
  }

  async clearHistory(): Promise<void> {
    await this.db.transaction('rw', this.db.plants, this.db.trees, async () => {
      await this.db.trees.clear();
      await this.db.plants.clear();
    });
  }

  async all(): Promise<PlantWithTrees[]> {
    const plants = await this.db.plants.toArray();
    const trees = await this.db.trees.toArray();
    const grouped = new Map<number, TreeRow[]>();
    for (const tree of trees) {
      const list = grouped.get(tree.plantId) ?? [];
      list.push(tree);
      grouped.set(tree.plantId, list);
    }
    return plants.map((plant) => ({
      plant,
      trees: (grouped.get(plant.id as number) ?? []).sort((a, b) => a.index - b.index),
    }));
  }
}
