import { Outlet } from 'react-router';
import { Snackbar } from '../../core/designsystem/components/Snackbar';

/**
 * Phone frame: full-bleed on mobile, 390x844 centered device on desktop.
 */
export function PhoneFrame() {
  return (
    <div className="flex min-h-dvh justify-center bg-[var(--gray-100)]">
      <div
        className="relative flex h-dvh w-full flex-col overflow-hidden bg-[var(--bg-dialog)] sm:h-[844px] sm:max-h-dvh sm:rounded-[24px] sm:shadow-2xl"
        style={{ maxWidth: 390, marginTop: 'auto', marginBottom: 'auto' }}
      >
        <Outlet />
        <Snackbar />
      </div>
    </div>
  );
}
