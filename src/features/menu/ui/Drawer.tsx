import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from '../../../core/designsystem/icons/Icon';
import { drawerLogoUrl } from '../../../core/designsystem/assets';

interface DrawerItem {
  key: string;
  icon: IconName;
  route: string;
  enabled: boolean;
}

/**
 * Side menu — 190dp, background colorLightGreen #51A387 (plans/05.03 §11).
 * Item height 30dp: spacer 25 / icon 24 / gap 20 / text 11sp bold white.
 */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const items: DrawerItem[] = [
    { key: 'main', icon: 'tree', route: '/main', enabled: true },
    { key: 'challenges', icon: 'challenge', route: '/coming-soon/challenges', enabled: false },
    { key: 'timeline', icon: 'timeline', route: '/timeline', enabled: true },
    { key: 'shield', icon: 'shield', route: '/coming-soon/shield', enabled: false },
    { key: 'relax', icon: 'relax', route: '/relax', enabled: true },
    { key: 'tags', icon: 'tag', route: '/tags', enabled: true },
    { key: 'friends', icon: 'friends', route: '/coming-soon/friends', enabled: false },
    { key: 'achievements', icon: 'achievement', route: '/coming-soon/achievements', enabled: false },
    { key: 'store', icon: 'store', route: '/store', enabled: true },
    { key: 'realTree', icon: 'realTree', route: '/coming-soon/real-tree', enabled: false },
    { key: 'news', icon: 'news', route: '/coming-soon/news', enabled: false },
    { key: 'settings', icon: 'settings', route: '/settings', enabled: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'var(--dim)' }}
            onClick={onClose}
          />
          <motion.aside
            className="absolute inset-y-0 left-0 z-30 flex flex-col"
            style={{ width: 'var(--menu-drawer-width)', background: 'var(--color-light-green)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            aria-label="Menu"
          >
            <div className="safe-top" />
            <nav className="scroll-area flex-1 overflow-y-auto pt-5">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.route);
                    onClose();
                  }}
                  className="flex w-full items-center text-left"
                  style={{ height: 30, paddingLeft: 25, gap: 20, color: 'var(--color-white)' }}
                >
                  <span className="flex w-6 shrink-0 items-center justify-center">
                    <Icon name={item.icon} size={24} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold leading-none">
                    {t(`nav.${item.key}`)}
                  </span>
                  {!item.enabled && (
                    <span
                      className="mr-2 h-1 w-1 shrink-0 rounded-full"
                      style={{ background: 'var(--red-500)' }}
                      aria-label={t('common.comingSoon')}
                    />
                  )}
                </button>
              ))}
            </nav>
            <button
              onClick={() => {
                navigate('/about');
                onClose();
              }}
              className="flex flex-col items-start gap-2 px-5 pb-8 pt-4 text-left"
            >
              <img src={drawerLogoUrl()} alt="Focus Grove" className="h-auto w-[120px]" draggable={false} />
              <span className="text-caption2 text-white/60">{t('nav.about')} · v0.1.0</span>
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
