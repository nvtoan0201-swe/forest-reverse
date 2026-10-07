import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageShell } from '../../../app/layout/PageShell';
import { Button } from '../../../core/designsystem/components/Button';
import { Card, EmptyState, Tabs } from '../../../core/designsystem/components/primitives';
import { ConfirmDialog } from '../../../core/designsystem/components/Dialog';
import { Icon } from '../../../core/designsystem/icons/Icon';
import { toast } from '../../../core/designsystem/components/Snackbar';
import { useRepos } from '../../../app/providers/RepositoryProvider';
import { useSessionStore } from '../../../core/session/sessionStore';
import { usePref } from '../../../core/prefs/usePref';
import { UDKeys } from '../../../core/prefs/UDKeys';
import { getAudio } from '../../../core/audio/AudioManager';
import { soundCoverFor } from '../../../core/designsystem/assets';
import { useUnlockedSounds, useUnlockedTrees, useWallet } from '../../plant/application/hooks';
import type { ProductRow } from '../../../data/types';

type StoreTab = 'classic' | 'exclusive' | 'sound';

const NO_PRODUCTS: never[] = [];

export function StorePage() {
  const { t } = useTranslation();
  const repos = useRepos();
  const navigate = useNavigate();
  const selectSpecies = useSessionStore((s) => s.selectSpecies);
  const [, setSelectedSound] = usePref<number>(UDKeys.SELECTED_BG_MUSIC, 0);
  const wallet = useWallet();
  const unlockedTrees = useUnlockedTrees();
  const unlockedSounds = useUnlockedSounds();
  const [tab, setTab] = useState<StoreTab>('classic');
  const [pending, setPending] = useState<ProductRow | null>(null);
  const [previewGid, setPreviewGid] = useState<number | null>(null);

  const products = useLiveQuery(() => repos.catalog.products(), [], NO_PRODUCTS) ?? NO_PRODUCTS;
  const sounds = useLiveQuery(() => repos.catalog.ambientSounds(), [], []) ?? [];

  const treeProducts = useMemo(
    () => products.filter((p) => p.productableType === 'TreeType'),
    [products],
  );
  const soundProducts = useMemo(
    () => products.filter((p) => p.productableType === 'AmbientSound'),
    [products],
  );

  const classic = treeProducts.filter((p) => p.purchaseType === 1 || p.purchaseType === 3);
  const exclusive = treeProducts.filter((p) => p.purchaseType === 2);

  const confirmPurchase = () => {
    if (!pending) return;
    const currency = pending.purchaseType === 2 ? 'gem' : 'coin';
    const price = pending.isFree ? 0 : pending.price;
    const result = price > 0 ? repos.wallet.spend('UnlockTree', price, currency) : { ok: true as const };
    if (!result.ok) {
      toast(t('store.insufficient'));
      setPending(null);
      return;
    }
    if (pending.productableType === 'TreeType') repos.unlocks.unlockTree(pending.productableGid);
    if (pending.productableType === 'AmbientSound') repos.unlocks.unlockSound(pending.productableGid);
    toast(t('store.purchased'));
    setPending(null);
  };

  const preview = (gid: number) => {
    if (previewGid === gid) {
      getAudio().stopBgm();
      setPreviewGid(null);
      return;
    }
    setPreviewGid(gid);
    getAudio().playBgm(gid, { fadeMs: 150 });
    window.setTimeout(() => {
      getAudio().stopBgm({ fadeMs: 200 });
      setPreviewGid((current) => (current === gid ? null : current));
    }, 10_000);
  };

  const TreeGrid = ({ items }: { items: ProductRow[] }) => (
    <ul className="grid grid-cols-3 gap-3">
      {items.map((product) => {
        const unlocked = unlockedTrees.includes(product.productableGid);
        return (
          <li key={product.id} className="forest-card relative flex flex-col items-center gap-1 p-2">
            {product.isPinned && !unlocked && (
              <span
                className="absolute left-1 top-1 rounded-[3px] px-1 text-[9px] font-bold"
                style={{ background: 'var(--yellow-100)', color: 'var(--text-brown)' }}
              >
                {t('store.new')}
              </span>
            )}
            <img
              src={repos.treeAssets.productUrl(product.productableGid)}
              alt=""
              loading="lazy"
              className={`h-16 w-16 object-contain ${unlocked ? '' : 'grayscale-[35%]'}`}
            />
            <p className="line-clamp-1 text-caption1">{product.title}</p>
            {unlocked ? (
              <button
                onClick={() => {
                  selectSpecies(product.productableGid);
                  navigate('/main');
                }}
                className="text-caption2 font-bold text-[var(--brand-variant)]"
              >
                {t('store.use')}
              </button>
            ) : (
              <Button
                size="chip"
                variant={product.purchaseType === 2 ? 'accentTeal' : 'accentYellow'}
                onClick={() => setPending(product)}
              >
                {product.purchaseType === 2 ? `♦ ${product.price}` : `¢ ${product.price}`}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <PageShell title={t('store.title')}>
      <div className="flex justify-center py-3">
        <Tabs
          items={[
            { value: 'classic', label: t('store.classic') },
            { value: 'exclusive', label: t('store.exclusive') },
            { value: 'sound', label: t('store.sound') },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div className="px-4 pb-6">
        {tab === 'classic' && <TreeGrid items={classic} />}
        {tab === 'exclusive' &&
          (exclusive.length ? (
            <TreeGrid items={exclusive} />
          ) : (
            <EmptyState title={t('common.empty')} icon={<Icon name="gem" size={36} />} />
          ))}
        {tab === 'sound' && (
          <ul className="space-y-2">
            {soundProducts.map((product) => {
              const sound = sounds.find((s) => s.gid === product.productableGid);
              const unlocked = unlockedSounds.includes(product.productableGid);
              const playing = previewGid === product.productableGid;
              const cover = soundCoverFor(product.productableGid);
              return (
                <li key={product.id} className="forest-card flex items-center gap-3 p-3">
                  {cover ? (
                    <img src={cover} alt="" className="h-12 w-12 rounded-[var(--radius-m)] object-cover" />
                  ) : (
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-m)]"
                      style={{ background: 'var(--forest-teal-100)' }}
                    >
                      <Icon name="sound" size={18} className="text-[var(--brand-variant)]" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-subtitle2">{sound?.title ?? product.title}</p>
                    <button
                      onClick={() => preview(product.productableGid)}
                      className="text-caption1 text-[var(--brand-variant)]"
                    >
                      {playing ? t('common.close') : t('store.preview')}
                    </button>
                  </div>
                  {unlocked ? (
                    <button
                      onClick={() => {
                        setSelectedSound(product.productableGid);
                        getAudio().playBgm(product.productableGid);
                        navigate('/main');
                      }}
                      className="text-caption1 font-bold text-[var(--brand-variant)]"
                    >
                      {t('store.use')}
                    </button>
                  ) : (
                    <Button
                      size="chip"
                      variant={product.purchaseType === 2 ? 'accentTeal' : 'accentYellow'}
                      onClick={() => setPending(product)}
                    >
                      {product.purchaseType === 2 ? `♦ ${product.price}` : `¢ ${product.price}`}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Card className="mt-4 flex items-center justify-between">
          <span className="text-caption1 text-[var(--text-tertiary)]">Wallet</span>
          <span className="text-subtitle2">
            ¢ {wallet.coin} · ♦ {wallet.gem}
          </span>
        </Card>
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={t('store.confirmTitle')}
        body={
          pending
            ? t('store.confirmBody', {
                name: pending.title,
                price: pending.price,
                currency: pending.purchaseType === 2 ? t('store.gems') : t('store.coins'),
              })
            : ''
        }
        confirmLabel={t('store.buy')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmPurchase}
        onCancel={() => setPending(null)}
      />
    </PageShell>
  );
}
