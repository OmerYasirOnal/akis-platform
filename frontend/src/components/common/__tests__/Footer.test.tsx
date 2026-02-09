import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from '../Footer';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('Footer (authenticated)', () => {
  vi.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'u1', name: 'Test', email: 'test@akis.com' }, loading: false }),
  }));

  it('renders the footer element', () => {
    const { container } = render(<Footer />, { wrapper: Wrapper });
    expect(container.querySelector('footer')).toBeInTheDocument();
  });

  it('renders Product links', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('renders Resources links', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders Company and Legal links', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('shows Dashboard link for authenticated users', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login')).toBeNull();
    expect(screen.queryByText('Sign up')).toBeNull();
  });

  it('renders current year in copyright', () => {
    render(<Footer />, { wrapper: Wrapper });
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });

  it('renders the tagline text', () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText(/Ship faster with confident/)).toBeInTheDocument();
  });
});
