import type { ForestDB } from '../../core/db/database';
import type { TagRow } from '../types';

export interface CreateTagInput {
  tag: string;
  tagColorTcid: number;
}

export interface TagRepository {
  list(): Promise<TagRow[]>;
  get(id: number): Promise<TagRow | null>;
  create(input: CreateTagInput): Promise<number>;
  update(id: number, patch: Partial<TagRow>): Promise<void>;
  softDelete(id: number): Promise<void>;
  ensureSeedTag(): Promise<void>;
}

export class DexieTagRepository implements TagRepository {
  constructor(private db: ForestDB) {}

  async list(): Promise<TagRow[]> {
    const tags = await this.db.tags.filter((t) => !t.deleted).toArray();
    return tags.sort((a, b) => b.usedAt - a.usedAt);
  }

  async get(id: number): Promise<TagRow | null> {
    return (await this.db.tags.get(id)) ?? null;
  }

  async create(input: CreateTagInput): Promise<number> {
    const now = Date.now();
    const row: TagRow = {
      tagId: 0,
      tag: input.tag.slice(0, 20),
      tagColorTcid: input.tagColorTcid,
      isDirty: true,
      deleted: false,
      createdAt: now,
      usedAt: now,
    };
    const id = (await this.db.tags.add(row)) as number;
    await this.db.tags.update(id, { tagId: id });
    return id;
  }

  async update(id: number, patch: Partial<TagRow>): Promise<void> {
    await this.db.tags.update(id, patch);
  }

  async softDelete(id: number): Promise<void> {
    await this.db.tags.update(id, { deleted: true, isDirty: true });
  }

  /** The original app auto-creates an "Unset" tag on first open; same here (hidden in UI). */
  async ensureSeedTag(): Promise<void> {
    const count = await this.db.tags.count();
    if (count > 0) return;
    await this.db.tags.add({
      tagId: 0,
      tag: 'Unset',
      tagColorTcid: 9,
      isDirty: false,
      deleted: false,
      createdAt: Date.now(),
      usedAt: 0,
    });
  }
}
