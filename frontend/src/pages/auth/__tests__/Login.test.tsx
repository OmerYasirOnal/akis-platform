import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

// Mock useAuth
const loginMock = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: loginMock,
    signup: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  }),
}));

// Mock Logo component to avoid potential asset issues in test
vi.mock('../../../components/branding/Logo', () => ({
  default: () => <div data-testid="logo">Logo</div>,
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe('Login', () => {
  it('renders the Sign in heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /Sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders the email input', () => {
    renderPage();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('renders the password input', () => {
    renderPage();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /Sign in/i }),
    ).toBeInTheDocument();
  });

  it('renders the signup link', () => {
    renderPage();
    expect(screen.getByText(/Create one/i)).toBeInTheDocument();
  });

  it('renders the Logo component', () => {
    renderPage();
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  it('email input has correct type attribute', () => {
    renderPage();
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password input has correct type attribute', () => {
    renderPage();
    const passwordInput = screen.getByLabelText(/Password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
