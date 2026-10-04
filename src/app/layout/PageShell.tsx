import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '../../core/designsystem/icons/Icon';
import { IconButton } from '../../core/designsystem/components/Button';

export function PageShell({
  title,
  children,
  action,
  background = 'var(--bg-primary)',
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  background?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col" style={{ background }}>
      <header className="safe-top" style={{ background: 'var(--brand-topbar)' }}>
        <div className="flex h-[48px] items-center gap-1 px-2">
          <IconButton label="Back" onClick={() => navigate(-1)} className="text-white">
            <Icon name="back" size={22} />
          </IconButton>
          <h1 className="flex-1 truncate text-headline5 text-white">{title}</h1>
          {action}
        </div>
      </header>
      <div className="scroll-area flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
