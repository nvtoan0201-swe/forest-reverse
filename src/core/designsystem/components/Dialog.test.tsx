import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('renders a 300dp dialog and closes from the backdrop when dismissible', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Give up?">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Give up?' });
    expect(dialog.style.width).toBe('300px');
    expect(dialog.style.borderRadius).toBe('var(--radius-dialog)');
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cant-touch-outside dialogs ignore backdrop clicks', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose} title="Important" dismissible={false}>
        body
      </Dialog>,
    );
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not render content when closed', () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Hidden">
        body
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
