/**
 * Unit Tests for UI Gating Logic
 * 
 * Tests that DocumentationAgentUI properly gates access based on:
 * - OAuth connection status
 * - GitHub App installation status
 * - Correct banner/warning messages
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentationAgentUI } from '@/components/DocumentationAgentUI';

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock child components
jest.mock('@/components/RepoPicker', () => ({
  RepoPicker: () => <div data-testid="repo-picker">RepoPicker Component</div>,
}));

jest.mock('@/components/BranchCreator', () => ({
  BranchCreator: () => <div>BranchCreator Component</div>,
}));

jest.mock('@/components/AgentRunPanel', () => ({
  AgentRunPanel: () => <div>AgentRunPanel Component</div>,
}));

// Mock fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe('DocumentationAgentUI - Gating Logic', () => {
  const { useAuth } = require('@/contexts/AuthContext');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows warning when neither OAuth nor App installed', async () => {
    // Mock: No OAuth, No App
    useAuth.mockReturnValue({
      integrations: [],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        configured: false,
        isInstalled: false,
      }),
    });

    render(<DocumentationAgentUI />);

    await waitFor(() => {
      expect(screen.getByText(/GitHub erişimi gerekli/i)).toBeInTheDocument();
    });

    // Should NOT show RepoPicker
    expect(screen.queryByTestId('repo-picker')).not.toBeInTheDocument();
  });

  test('shows RepoPicker when OAuth connected (no App)', async () => {
    // Mock: OAuth connected, No App
    useAuth.mockReturnValue({
      integrations: [
        {
          provider: 'github',
          connected: true,
          accessToken: 'ghp_test123',
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        configured: false,
        isInstalled: false,
      }),
    });

    render(<DocumentationAgentUI />);

    await waitFor(() => {
      expect(screen.getByTestId('repo-picker')).toBeInTheDocument();
    });

    // Should NOT show warning
    expect(screen.queryByText(/GitHub erişimi gerekli/i)).not.toBeInTheDocument();
  });

  test('shows RepoPicker and App Mode banner when App installed (no OAuth)', async () => {
    // Mock: No OAuth, App installed
    useAuth.mockReturnValue({
      integrations: [],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        configured: true,
        isInstalled: true,
        app: {
          slug: 'akis-scribe',
        },
      }),
    });

    render(<DocumentationAgentUI />);

    await waitFor(() => {
      expect(screen.getByText(/GitHub App Mode/i)).toBeInTheDocument();
      expect(screen.getByTestId('repo-picker')).toBeInTheDocument();
    });

    // Should NOT show warning
    expect(screen.queryByText(/GitHub erişimi gerekli/i)).not.toBeInTheDocument();
  });

  test('shows RepoPicker when both OAuth and App available', async () => {
    // Mock: OAuth + App both available
    useAuth.mockReturnValue({
      integrations: [
        {
          provider: 'github',
          connected: true,
          accessToken: 'ghp_test123',
        },
      ],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        configured: true,
        isInstalled: true,
        app: {
          slug: 'akis-scribe',
        },
      }),
    });

    render(<DocumentationAgentUI />);

    await waitFor(() => {
      expect(screen.getByTestId('repo-picker')).toBeInTheDocument();
    });

    // Should NOT show App Mode banner (OAuth takes precedence in UI)
    expect(screen.queryByText(/GitHub App Mode/i)).not.toBeInTheDocument();

    // Should NOT show warning
    expect(screen.queryByText(/GitHub erişimi gerekli/i)).not.toBeInTheDocument();
  });

  test('shows loading state while checking App mode', async () => {
    useAuth.mockReturnValue({
      integrations: [],
    });

    // Delay the fetch to simulate loading
    mockFetch.mockImplementationOnce(() => 
      new Promise((resolve) => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: async () => ({ configured: false, isInstalled: false }),
          }),
          100
        )
      )
    );

    render(<DocumentationAgentUI />);

    // Should show loading initially
    expect(screen.getByText(/GitHub App durumu kontrol ediliyor/i)).toBeInTheDocument();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/GitHub App durumu kontrol ediliyor/i)).not.toBeInTheDocument();
    });
  });

  test('shows CTA to install App when not installed', async () => {
    useAuth.mockReturnValue({
      integrations: [],
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        configured: true,
        isInstalled: false,
        app: {
          slug: 'akis-scribe',
        },
      }),
    });

    render(<DocumentationAgentUI />);

    await waitFor(() => {
      expect(screen.getByText(/AKIS GitHub App/i)).toBeInTheDocument();
    });

    const appLink = screen.getByRole('link', { name: /AKIS GitHub App/i });
    expect(appLink).toHaveAttribute('href', expect.stringContaining('akis-scribe'));
  });
});

