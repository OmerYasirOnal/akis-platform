import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScribeRunPage from '../ScribeRun';
import { agentsApi } from '../../../services/api/agents';
import { AuthProvider } from '../../../contexts/AuthContext';
import { I18nProvider } from '../../../i18n/I18nProvider';

// Mock agentsApi
vi.mock('../../../services/api/agents', () => ({
  agentsApi: {
    runAgent: vi.fn(),
    getJob: vi.fn(),
    listAgents: vi.fn(),
  },
}));

// Mock auth API to simulate authenticated user
vi.mock('../../../services/api/auth', () => ({
  AuthAPI: {
    me: vi.fn().mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com' }),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}));

// Note: VITE_AGENTS_ENABLED is set in vite.config.ts test.env for CI compatibility

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>{ui}</AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
};

// Helper to get submit button (type="submit")
const getSubmitButton = () => screen.getByRole('button', { name: /submit|run/i });

describe('ScribeRunPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the page with form elements', async () => {
    renderWithProviders(<ScribeRunPage />);

    // Wait for page to render with heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    // Check for textarea
    expect(screen.getByRole('textbox')).toBeInTheDocument();

    // Check for submit button by type attribute
    const submitBtn = screen.getByRole('button', { name: /submit|run/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveAttribute('type', 'submit');
  });

  it('should show validation error when submitting empty form', async () => {
    renderWithProviders(<ScribeRunPage />);

    await waitFor(() => {
      expect(getSubmitButton()).toBeInTheDocument();
    });

    // Click submit without entering text
    fireEvent.click(getSubmitButton());

    // Should show validation error (the exact text depends on i18n, could be key or translation)
    await waitFor(() => {
      // Look for error message - either translated or raw key
      const errorMessages = screen.queryAllByText(/provide|documentation|context|validation\.doc/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('should call runAgent API on valid form submission', async () => {
    const mockJobId = 'job-123';
    (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobId: mockJobId,
      state: 'pending',
    });
    // Return completed job immediately to stop polling
    (agentsApi.getJob as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: mockJobId,
      type: 'scribe',
      state: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: { summary: 'Documentation updated' },
    });

    renderWithProviders(<ScribeRunPage />);

    // Wait for auth to load
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Fill in the textarea
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test PR summary for documentation' } });

    // Submit the form
    fireEvent.click(getSubmitButton());

    // Wait for API call
    await waitFor(() => {
      expect(agentsApi.runAgent).toHaveBeenCalledWith('scribe', {
        doc: 'Test PR summary for documentation',
      });
    });
  });

  it('should poll job status after successful submission', async () => {
    // Use fake timers for this specific test to control polling
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const mockJobId = 'job-456';

    // Mock runAgent to return pending job
    (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
      jobId: mockJobId,
      state: 'pending',
      })
    );

    // Track getJob calls and return completed on second call
    let getJobCallCount = 0;
    (agentsApi.getJob as ReturnType<typeof vi.fn>).mockImplementation(() => {
      getJobCallCount++;
      return Promise.resolve({
      id: mockJobId,
      type: 'scribe',
        state: getJobCallCount >= 2 ? 'completed' : 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
        result: getJobCallCount >= 2 ? { summary: 'Docs generated successfully' } : undefined,
      });
    });

    renderWithProviders(<ScribeRunPage />);

    // Wait for auth context to initialize
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Fill and submit
    const textarea = screen.getByRole('textbox');
    await act(async () => {
    fireEvent.change(textarea, { target: { value: 'Documentation context' } });
    });

    await act(async () => {
    fireEvent.click(getSubmitButton());
    });

    // Let runAgent resolve and trigger initial pollJob call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // First getJob should have been called (immediate call after runAgent)
    await waitFor(() => {
        expect(agentsApi.getJob).toHaveBeenCalled();
    });

    // Advance time to trigger polling interval (2500ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // Should have polled again
    expect(agentsApi.getJob).toHaveBeenCalledTimes(2);
    expect(agentsApi.getJob).toHaveBeenCalledWith(mockJobId);

    // Restore real timers
    vi.useRealTimers();
  });

  it('should handle API error gracefully', async () => {
    (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    renderWithProviders(<ScribeRunPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Fill and submit
    const textarea = screen.getByRole('textbox');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Test content' } });
    });

    await act(async () => {
      fireEvent.click(getSubmitButton());
    });

    // Wait for error message with extended timeout
    await waitFor(
      () => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should reset form when reset button is clicked', async () => {
    renderWithProviders(<ScribeRunPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Fill the textarea
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Some content' } });
    expect(textarea.value).toBe('Some content');

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    // Textarea should be empty
    expect(textarea.value).toBe('');
  });
});
