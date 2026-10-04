import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Tabs } from '../../../core/designsystem/components/primitives';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTreeTypes, useProducts, useUnlockedTrees } from '../application/hooks';
import type { ProductRow } from '../../../data/types';

type PickerTab = 'settings' | 'favorite';

const NO_FAVORITES: never[] = [];

export function SpeciesPicker({
  open,
  onClose,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  selectedId: number;
  onSelect: (gid: number) => void;
}) {
  const repos = useRepos();
  const [tab, setTab] = useState<PickerTab>('settings');
  const treeTypes = useTreeTypes();
  const products = useProducts();
  const unlocked = useUnlockedTrees();
  const favorites = useLiveQuery(() => repos.db.speciesFavorite.toArray(), [], NO_FAVORITES) ?? NO_FAVORITES;
  const favoriteGids = useMemo(() => new Set(favorites.map((f) => f.gid)), [favorites]);

  const priceByGid = useMemo(() => {
    const map = new Map<number, ProductRow>();
    for (const product of products) {
      if (product.productableType === 'TreeType') map.set(product.productableGid, product);
    }
    return map;
  }, [products]);

  const list = useMemo(() => {
    if (tab === 'favorite') return treeTypes.filter((t) => favoriteGids.has(t.gid));
    return treeTypes;
  }, [tab, treeTypes, favoriteGids]);

  const toggleFavorite = async (gid: number) => {
    const existing = await repos.db.speciesFavorite.where('gid').equals(gid).first();
    if (existing?.id) {
      await repos.db.speciesFavorite.delete(existing.id);
    } else {
      await repos.db.speciesFavorite.add({
        gid,
        treeType: gid,
        countMode: 'DOWN',
        tagId: 0,
        plantTimeInMin: 25,
        createdAt: Date.now(),
        lastUsedAt: null,
        deleted: false,
        dirty: true,
      });
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Trees (${treeTypes.length})`}>
      <div className="mb-4 flex justify-center">
        <Tabs
          items={[
            { value: 'settings', label: 'Planting Settings' },
            { value: 'favorite', label: 'My Favorite' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {list.length === 0 && (
        <p className="py-8 text-center text-body2 text-[var(--text-tertiary)]">
          Tap the heart on a tree to save it here.
        </p>
      )}
      <ul className="grid grid-cols-4 gap-2">
        {list.map((tree) => {
          const product = priceByGid.get(tree.gid);
          const isUnlocked = unlocked.includes(tree.gid) || product?.isFree === true;
          const selected = selectedId === tree.gid;
          return (
            <li key={tree.gid}>
              <div className="relative">
                <button
                  onClick={() => {
                    if (!isUnlocked) return;
                    onSelect(tree.gid);
                    onClose();
                  }}
                  aria-label={tree.title}
                  className={`flex w-full flex-col items-center gap-1 rounded-[var(--radius-m)] p-1.5 ${
                    isUnlocked ? '' : 'opacity-70'
                  }`}
                  style={{
                    outline: selected ? '2px solid var(--brand)' : 'none',
                    background: selected ? 'var(--bg-secondary)' : 'transparent',
                  }}
                >
                  <img
                    src={repos.treeAssets.productUrl(tree.gid)}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className={isUnlocked ? '' : 'grayscale'}
                  />
                  <span className="line-clamp-1 text-caption1 text-[var(--text-secondary)]">{tree.title}</span>
                  {!isUnlocked && (
                    <span className="flex items-center gap-0.5 text-caption2 text-[var(--text-tertiary)]">
                      <Icon name="lock" size={10} />
                      {product?.purchaseType === 2 ? `♦ ${product.price}` : `¢ ${product?.price ?? 0}`}
                    </span>
                  )}
                </button>
                <button
                  aria-label={favoriteGids.has(tree.gid) ? 'Remove favorite' : 'Add favorite'}
                  onClick={() => void toggleFavorite(tree.gid)}
                  className="absolute right-0 top-0 p-1"
                  style={{ color: favoriteGids.has(tree.gid) ? 'var(--red-400)' : 'var(--gray-300)' }}
                >
                  <Icon name="heart" size={14} filled={favoriteGids.has(tree.gid)} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
