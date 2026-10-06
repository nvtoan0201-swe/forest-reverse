import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Button, IconButton } from './Button';

describe('Button', () => {
  it('renders a 4px solid shadow for the default size', () => {
    render(<Button>Plant</Button>);
    const button = screen.getByRole('button', { name: 'Plant' });
    expect(button.className).toContain('fg-button');
    expect(button.style.getPropertyValue('--fg-shadow')).toBe('4px');
    expect(button.style.getPropertyValue('--fg-bg')).toBe('var(--brand)');
  });

  it('uses 6px shadow for big and full radius for chip', () => {
    const { rerender } = render(<Button size="big">Big</Button>);
    expect(screen.getByRole('button').style.getPropertyValue('--fg-shadow')).toBe('6px');
    rerender(<Button size="chip">Chip</Button>);
    expect(screen.getByRole('button').style.getPropertyValue('--fg-shadow')).toBe('3px');
    expect(screen.getByRole('button').style.borderRadius).toBe('var(--radius-full)');
  });

  it('maps accent variants to palette tokens', () => {
    render(<Button variant="accentGreen">Go</Button>);
    const style = screen.getByRole('button').style;
    expect(style.getPropertyValue('--fg-bg')).toBe('var(--button-accent-green-bg)');
    expect(style.getPropertyValue('--fg-shadow-color')).toBe('var(--button-accent-green-shadow)');
  });

  it('does not animate when disabled', () => {
    render(<Button disabled>Stop</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('presses down by the shadow size (pressOrMoveAnimation)', async () => {
    vi.useRealTimers();
    render(<Button>Press</Button>);
    const button = screen.getByRole('button');
    fireEvent.pointerDown(button, { pointerId: 1, button: 0 });
    await waitFor(() => {
      expect(button.style.transform).toMatch(/translateY\((?:[3-4](?:\.\d+)?)px\)/);
    });
    fireEvent.pointerUp(button, { pointerId: 1, button: 0 });
  });

  it('IconButton exposes an accessible label', () => {
    render(
      <IconButton label="Back">
        <span />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });
});
