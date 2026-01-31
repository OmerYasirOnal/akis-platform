import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardLayout } from '../DashboardLayout';

// Mock child components to isolate layout testing
vi.mock('../DashboardSidebar', () => ({
  default: ({ onNavClick }: { onNavClick?: () => void }) => (
    <div data-testid="sidebar" onClick={onNavClick}>Sidebar</div>
  ),
}));

vi.mock('../ProfileMenu', () => ({
  ProfileMenu: () => <div data-testid="profile-menu">Profile</div>,
}));

vi.mock('../RunBar', () => ({
  RunBar: () => <div data-testid="runbar">RunBar</div>,
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test User' } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  };
});

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardLayout />
    </MemoryRouter>
  );
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('renders RunBar component', () => {
    renderLayout();
    expect(screen.getByTestId('runbar')).toBeInTheDocument();
  });

  it('has mobile overlay with backdrop-blur-sm and bg-black/60', () => {
    const { container } = renderLayout();
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).not.toBeNull();
    expect(overlay!.className).toContain('backdrop-blur-sm');
    expect(overlay!.className).toContain('bg-black/60');
    expect(overlay!.className).toContain('lg:hidden');
  });

  it('overlay starts hidden with pointer-events-none', () => {
    const { container } = renderLayout();
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay!.className).toContain('pointer-events-none');
    expect(overlay!.className).toContain('opacity-0');
  });

  it('opens mobile menu on hamburger click and shows overlay', async () => {
    renderLayout();

    const openButton = screen.getByLabelText('Open menu');
    fireEvent.click(openButton);

    await waitFor(() => {
      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay!.className).toContain('opacity-100');
      expect(overlay!.className).not.toContain('pointer-events-none');
    });
  });

  it('locks body scroll when mobile menu is open', () => {
    renderLayout();

    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('closes mobile menu on overlay click and restores scroll', async () => {
    renderLayout();

    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(document.body.style.overflow).toBe('hidden');

    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(overlay.className).toContain('opacity-0');
      expect(document.body.style.overflow).toBe('');
    });
  });

  it('closes mobile menu on close button click', async () => {
    renderLayout();

    fireEvent.click(screen.getByLabelText('Open menu'));
    fireEvent.click(screen.getByLabelText('Close menu'));

    await waitFor(() => {
      const overlay = document.querySelector('[aria-hidden="true"]');
      expect(overlay!.className).toContain('opacity-0');
    });
  });

  it('main content area has bottom padding for RunBar', () => {
    renderLayout();
    const main = document.querySelector('main');
    expect(main!.className).toContain('pb-16');
  });
});
