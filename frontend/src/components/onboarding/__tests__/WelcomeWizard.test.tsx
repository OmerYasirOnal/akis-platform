import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WelcomeWizard } from '../WelcomeWizard';

// Mock reduced motion to skip animation delays
vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// Mock brand asset
vi.mock('../../../theme/brand', () => ({
  LOGO_MARK_SVG: 'data:image/svg+xml,<svg/>',
}));

describe('WelcomeWizard', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('renders step 0 with welcome heading', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    expect(screen.getByText(/Hoş Geldiniz/)).toBeInTheDocument();
  });

  it('renders 3 progress dots', () => {
    const { container } = render(<WelcomeWizard onComplete={vi.fn()} />);
    const dots = container.querySelectorAll('button.rounded-full');
    expect(dots.length).toBe(3);
  });

  it('shows "Devam" button on step 0', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    expect(screen.getByText('Devam')).toBeInTheDocument();
  });

  it('advances to step 1 on "Devam" click', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Devam'));
    expect(screen.getByText('Nasıl Çalışır?')).toBeInTheDocument();
  });

  it('shows agent cards on step 1', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Devam'));
    expect(screen.getByText('Scribe')).toBeInTheDocument();
    expect(screen.getByText('Proto')).toBeInTheDocument();
    expect(screen.getByText('Trace')).toBeInTheDocument();
  });

  it('advances to step 2 from step 1', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Devam')); // step 0 → 1
    fireEvent.click(screen.getByText('Devam')); // step 1 → 2
    expect(screen.getByText('Hemen Başlayın')).toBeInTheDocument();
  });

  it('hides "Devam" button on step 2', () => {
    render(<WelcomeWizard onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('Devam'));
    fireEvent.click(screen.getByText('Devam'));
    expect(screen.queryByText('Devam')).not.toBeInTheDocument();
  });

  it('calls onComplete when "İlk Pipeline" button clicked', () => {
    const onComplete = vi.fn();
    render(<WelcomeWizard onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Devam'));
    fireEvent.click(screen.getByText('Devam'));
    fireEvent.click(screen.getByText(/İlk Pipeline/));
    act(() => { vi.runAllTimers(); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('calls onComplete when "Daha sonra" link clicked', () => {
    const onComplete = vi.fn();
    render(<WelcomeWizard onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Devam'));
    fireEvent.click(screen.getByText('Devam'));
    fireEvent.click(screen.getByText(/Daha sonra/));
    act(() => { vi.runAllTimers(); });
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('navigates to step via progress dot click', () => {
    const { container } = render(<WelcomeWizard onComplete={vi.fn()} />);
    const dots = container.querySelectorAll('button.rounded-full');
    fireEvent.click(dots[2]); // Jump to step 2
    expect(screen.getByText('Hemen Başlayın')).toBeInTheDocument();
  });
});
