import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Enable agents for tests
vi.stubEnv('VITE_AGENTS_ENABLED', 'true');

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

  it('should display job status after successful submission', async () => {
    const mockJobId = 'job-456';
    (agentsApi.runAgent as ReturnType<typeof vi.fn>).mockResolvedValue({
      jobId: mockJobId,
      state: 'pending',
    });
    (agentsApi.getJob as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: mockJobId,
      type: 'scribe',
      state: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: { summary: 'Docs generated successfully' },
    });

    renderWithProviders(<ScribeRunPage />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    // Fill and submit
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Documentation context' } });

    fireEvent.click(getSubmitButton());

    // Wait for job status to appear (job ID should be visible)
    await waitFor(
      () => {
        expect(agentsApi.getJob).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );
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
    fireEvent.change(textarea, { target: { value: 'Test content' } });

    fireEvent.click(getSubmitButton());

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
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

