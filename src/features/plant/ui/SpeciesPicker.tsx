import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Sheet } from '../../../core/designsystem/components/Sheet';
import { Tabs } from '../../../core/designsystem/components/primitives';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useTreeTypes, useProducts, useUnlockedTrees, useTags, useWallet } from '../application/hooks';
import { useSessionStore } from '../../../core/session/sessionStore';
import type { ProductRow } from '../../../data/types';

type PickerTab = 'settings' | 'favorite';
type SortKey = 'recent' | 'added' | 'timeShort' | 'timeLong';

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
  const { t } = useTranslation();
  const repos = useRepos();
  const [tab, setTab] = useState<PickerTab>('settings');
  const [sort, setSort] = useState<SortKey>('recent');
  const treeTypes = useTreeTypes();
  const products = useProducts();
  const unlocked = useUnlockedTrees();
  const tags = useTags();
  const wallet = useWallet();
  const plantTimeMinutes = useSessionStore((s) => s.plantTimeMinutes);
  const tagId = useSessionStore((s) => s.tagId);
  const favorites = useLiveQuery(() => repos.db.speciesFavorite.toArray(), [], NO_FAVORITES) ?? NO_FAVORITES;
  const favoriteGids = useMemo(() => new Set(favorites.map((f) => f.gid)), [favorites]);

  const priceByGid = useMemo(() => {
    const map = new Map<number, ProductRow>();
    for (const product of products) {
      if (product.productableType === 'TreeType') map.set(product.productableGid, product);
    }
    return map;
  }, [products]);

  const favoriteByGid = useMemo(() => {
    const map = new Map<number, (typeof favorites)[number]>();
    for (const favorite of favorites) map.set(favorite.gid, favorite);
    return map;
  }, [favorites]);

  const selectedTree = treeTypes.find((tree) => tree.gid === selectedId) ?? treeTypes[0];
  const activeTag = tags.find((tag) => tag.id === tagId) ?? null;

  const sortItems: { value: SortKey; label: string }[] = [
    { value: 'recent', label: t('speciesPicker.sortRecent', 'Recently selected') },
    { value: 'added', label: t('speciesPicker.sortAdded', 'Recently added') },
    { value: 'timeShort', label: t('speciesPicker.sortTimeShort', 'Time (short-long)') },
    { value: 'timeLong', label: t('speciesPicker.sortTimeLong', 'Time (long-short)') },
  ];

  const list = useMemo(() => {
    const base = tab === 'favorite' ? treeTypes.filter((tree) => favoriteGids.has(tree.gid)) : [...treeTypes];
    const compareTitle = (a: (typeof base)[number], b: (typeof base)[number]) => a.title.localeCompare(b.title);
    if (sort === 'recent') {
      base.sort((a, b) => (favoriteByGid.get(b.gid)?.lastUsedAt ?? 0) - (favoriteByGid.get(a.gid)?.lastUsedAt ?? 0) || compareTitle(a, b));
    } else if (sort === 'added') {
      base.sort((a, b) => (favoriteByGid.get(b.gid)?.createdAt ?? 0) - (favoriteByGid.get(a.gid)?.createdAt ?? 0) || compareTitle(a, b));
    } else if (sort === 'timeShort') {
      base.sort((a, b) => (favoriteByGid.get(a.gid)?.plantTimeInMin ?? 0) - (favoriteByGid.get(b.gid)?.plantTimeInMin ?? 0) || compareTitle(a, b));
    } else {
      base.sort((a, b) => (favoriteByGid.get(b.gid)?.plantTimeInMin ?? 0) - (favoriteByGid.get(a.gid)?.plantTimeInMin ?? 0) || compareTitle(a, b));
    }
    return base;
  }, [tab, treeTypes, favoriteGids, favoriteByGid, sort]);

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
        plantTimeInMin: plantTimeMinutes,
        createdAt: Date.now(),
        lastUsedAt: null,
        deleted: false,
        dirty: true,
      });
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('speciesPicker.title', { count: treeTypes.length, defaultValue: 'Trees ({{count}})' })}>
      {/* Preview card (include_select_species_preview_card) */}
      {selectedTree && (
        <div
          className="mb-3 flex items-center gap-3 rounded-[var(--radius-l)] p-2"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <img
            src={repos.treeAssets.productUrl(selectedTree.gid)}
            alt=""
            width={56}
            height={56}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-subtitle1">{selectedTree.title}</p>
            <p className="text-caption1 text-[var(--text-tertiary)]">
              {t('speciesPicker.focusedTime', 'Focused Time')}: {plantTimeMinutes} min ·{' '}
              {t('speciesPicker.tags', 'Tags')}: {activeTag?.tag ?? t('plant.tagUnset')}
            </p>
          </div>
          <span className="flex items-center gap-1 text-caption1 text-[var(--coin-deep)]">
            <Icon name="coin" size={16} /> {wallet.coin.toLocaleString()}
          </span>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-2">
        <Tabs
          items={[
            { value: 'settings', label: t('speciesPicker.tabSettings', 'Planting Settings') },
            { value: 'favorite', label: t('speciesPicker.tabFavorite', 'My Favorite') },
          ]}
          value={tab}
          onChange={setTab}
        />
        <label className="flex items-center gap-1 text-caption1 text-[var(--text-secondary)]">
          <span className="sr-only">{t('speciesPicker.sort', 'Sort')}</span>
          <select
            aria-label={t('speciesPicker.sort', 'Sort')}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-[var(--radius-s)] border-0 bg-transparent pr-1 text-caption1"
          >
            {sortItems.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {list.length === 0 && (
        <p className="py-8 text-center text-body2 text-[var(--text-tertiary)]">
          {t('speciesPicker.noFavorites', 'Tap the heart on a tree to save it here.')}
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
