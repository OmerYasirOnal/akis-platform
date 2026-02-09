import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorToast } from '../ErrorToast';

describe('ErrorToast', () => {
  const baseError = { message: 'Something went wrong' };

  it('renders error message', () => {
    render(<ErrorToast error={baseError} onClose={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders "Error" heading', () => {
    render(<ErrorToast error={baseError} onClose={vi.fn()} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders error code when provided', () => {
    const error = { message: 'Fail', code: 'AUTH_ERROR' };
    render(<ErrorToast error={error} onClose={vi.fn()} />);
    expect(screen.getByText('Code: AUTH_ERROR')).toBeInTheDocument();
  });

  it('does not render code section when code is absent', () => {
    render(<ErrorToast error={baseError} onClose={vi.fn()} />);
    expect(screen.queryByText(/Code:/)).not.toBeInTheDocument();
  });

  it('renders requestId when provided', () => {
    const error = { message: 'Fail', requestId: 'req-123' };
    render(<ErrorToast error={error} onClose={vi.fn()} />);
    expect(screen.getByText('Request ID: req-123')).toBeInTheDocument();
  });

  it('does not render requestId section when absent', () => {
    render(<ErrorToast error={baseError} onClose={vi.fn()} />);
    expect(screen.queryByText(/Request ID:/)).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<ErrorToast error={baseError} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('has a close button with aria-label', () => {
    render(<ErrorToast error={baseError} onClose={vi.fn()} />);
    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });
});
