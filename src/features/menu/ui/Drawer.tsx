import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Icon, type IconName } from '../../../core/designsystem/icons/Icon';

interface DrawerItem {
  key: string;
  icon: IconName;
  route: string;
  enabled: boolean;
}

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
            style={{ width: 'var(--menu-drawer-width)', background: 'var(--brand-nav)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            aria-label="Menu"
          >
            <div className="safe-top" />
            <div className="px-4 py-5">
              <img src="icons/icon.svg" alt="" width={44} height={44} />
              <p className="mt-2 text-subtitle1 text-[var(--text-white-warm)]">Focus Grove</p>
            </div>
            <nav className="scroll-area flex-1 overflow-y-auto pb-6">
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.route);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  style={{ color: 'var(--text-white-warm)' }}
                >
                  <Icon name={item.icon} size={22} />
                  <span className="flex-1 text-headline5">{t(`nav.${item.key}`)}</span>
                  {!item.enabled && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-caption2">
                      {t('common.comingSoon')}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            <button
              onClick={() => {
                navigate('/about');
                onClose();
              }}
              className="px-4 pb-8 text-left text-caption1 text-white/60"
            >
              {t('nav.about')} · v0.1.0
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
