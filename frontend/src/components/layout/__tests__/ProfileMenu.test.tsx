import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileMenu } from '../ProfileMenu';

const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockSetTheme = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Ömer Yasir', email: 'omer@akis.com' },
    logout: mockLogout,
    loading: false,
  }),
}));

vi.mock('../../../theme/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: mockSetTheme,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('ProfileMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initials from user name', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    expect(screen.getByText('ÖY')).toBeInTheDocument();
  });

  it('has accessible profile menu button', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Profile menu')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    expect(screen.getByText('Ömer Yasir')).toBeInTheDocument();
    expect(screen.getByText('omer@akis.com')).toBeInTheDocument();
  });

  it('shows theme options when open', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
  });

  it('shows logout button when open', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls setTheme when Dark is clicked', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    fireEvent.click(screen.getByText('Dark'));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme when Light is clicked', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    fireEvent.click(screen.getByText('Light'));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls logout and navigates on Logout click', async () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    fireEvent.click(screen.getByLabelText('Profile menu'));
    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });
    // Wait for async logout
    await vi.waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('closes dropdown on second toggle click', () => {
    render(<ProfileMenu />, { wrapper: Wrapper });
    const btn = screen.getByLabelText('Profile menu');
    fireEvent.click(btn); // open
    expect(screen.getByText('Ömer Yasir')).toBeInTheDocument();
    fireEvent.click(btn); // close
    expect(screen.queryByText('Ömer Yasir')).toBeNull();
  });
});
