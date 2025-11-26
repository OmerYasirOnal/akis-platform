import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HealthPanel from '../HealthPanel';
import { api } from '../../../services/api';

// Mock the API
vi.mock('../../../services/api', () => ({
  api: {
    getHealth: vi.fn(),
    getReady: vi.fn(),
    getVersion: vi.fn(),
  },
}));

describe('HealthPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading state initially', () => {
    // Mock never-resolving promises
    (api.getHealth as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    (api.getReady as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    (api.getVersion as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    render(<HealthPanel />);

    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  it('should display OK status when all endpoints are healthy', async () => {
    (api.getHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'ok',
    });
    (api.getReady as ReturnType<typeof vi.fn>).mockResolvedValue({
      ready: true,
    });
    (api.getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '1.0.0',
    });

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('should display FAIL status when health check fails', async () => {
    (api.getHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'error',
    });
    (api.getReady as ReturnType<typeof vi.fn>).mockResolvedValue({
      ready: false,
    });
    (api.getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '1.0.0',
    });

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('FAIL')).toBeInTheDocument();
    });

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should show FAIL status when all API calls fail', async () => {
    (api.getHealth as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );
    (api.getReady as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );
    (api.getVersion as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    render(<HealthPanel />);

    // When all endpoints fail, status should show FAIL
    await waitFor(() => {
      expect(screen.getByText('FAIL')).toBeInTheDocument();
    });

    // Ready should show Unknown
    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
  });

  it('should refresh status when refresh button is clicked', async () => {
    (api.getHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'ok',
    });
    (api.getReady as ReturnType<typeof vi.fn>).mockResolvedValue({
      ready: true,
    });
    (api.getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '1.0.0',
    });

    render(<HealthPanel />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    // Clear mocks to track refresh call
    vi.clearAllMocks();

    // Setup new mocks for refresh
    (api.getHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'ok',
    });
    (api.getReady as ReturnType<typeof vi.fn>).mockResolvedValue({
      ready: true,
    });
    (api.getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '1.0.1',
    });

    // Click refresh
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Verify API was called again
    await waitFor(() => {
      expect(api.getHealth).toHaveBeenCalled();
    });

    // Verify updated version
    await waitFor(() => {
      expect(screen.getByText('1.0.1')).toBeInTheDocument();
    });
  });

  it('should handle partial API failures gracefully', async () => {
    (api.getHealth as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'ok',
    });
    (api.getReady as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('DB unavailable')
    );
    (api.getVersion as ReturnType<typeof vi.fn>).mockResolvedValue({
      version: '1.0.0',
    });

    render(<HealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    // Ready should show Unknown due to failure (text contains "Unknown")
    expect(screen.getByText(/unknown/i)).toBeInTheDocument();
    // Version should still work
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
});

