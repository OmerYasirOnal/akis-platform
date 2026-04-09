import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileSetupWizard } from '../ProfileSetupWizard';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test User', email: 'test@example.com' } }),
}));

describe('ProfileSetupWizard', () => {
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    ));
  });

  it('renders step labels', () => {
    render(<ProfileSetupWizard onClose={onClose} />);
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Tercihler')).toBeInTheDocument();
  });

  it('renders the close button', () => {
    const { container } = render(<ProfileSetupWizard onClose={onClose} />);
    const closeBtn = container.querySelector('button.absolute');
    expect(closeBtn).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const { container } = render(<ProfileSetupWizard onClose={onClose} />);
    const closeBtn = container.querySelector('button.absolute') as HTMLElement;
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('starts on step 0 (Profile)', () => {
    const { container } = render(<ProfileSetupWizard onClose={onClose} />);
    // Step 0 indicator should be active (has primary bg)
    const stepIndicators = container.querySelectorAll('.rounded-full');
    const firstIndicator = stepIndicators[0];
    expect(firstIndicator?.className).toContain('bg-ak-primary/20');
  });

  it('shows 4 step indicators', () => {
    render(<ProfileSetupWizard onClose={onClose} />);
    // Step labels are Profil, GitHub, AI, Tercihler — check numbers rendered
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
