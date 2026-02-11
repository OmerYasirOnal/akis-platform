import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nContext } from '../../../../../i18n/i18n.context';
import DashboardAgentTracePage from '../index';

vi.mock('../../../../../hooks/useAgentStatus', () => ({
  useAgentStatus: () => ({ status: 'active' }),
}));

const runAgentMock = vi.fn();
const getJobMock = vi.fn();

vi.mock('../../../../../services/api/agents', () => ({
  agentsApi: {
    runAgent: (...args: unknown[]) => runAgentMock(...args),
    getJob: (...args: unknown[]) => getJobMock(...args),
  },
}));

vi.mock('../../../../../services/api/ai-keys', () => ({
  getMultiProviderStatus: vi.fn(async () => ({
    activeProvider: 'openai',
    providers: {
      openai: { configured: true },
      openrouter: { configured: false },
    },
  })),
}));

const renderPage = () => render(
  <I18nContext.Provider
    value={{
      locale: 'en',
      availableLocales: ['en', 'tr'],
      status: 'ready',
      t: (key) => key,
      setLocale: async () => {},
    }}
  >
    <MemoryRouter>
      <DashboardAgentTracePage />
    </MemoryRouter>
  </I18nContext.Provider>
);

describe('DashboardAgentTracePage', () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      value: vi.fn(),
      writable: true,
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    runAgentMock.mockResolvedValue({ jobId: 'job-1', state: 'running' });
    getJobMock.mockResolvedValue({
      id: 'job-1',
      type: 'trace',
      state: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trace: [],
    });
  });

  it('sends selected tracePreferences in run payload', async () => {
    renderPage();

    const specInput = screen.getByPlaceholderText(/Paste your test specification/i);
    fireEvent.change(specInput, { target: { value: 'Given user logs in Then dashboard loads' } });

    const [depthSelect, authSelect, browserSelect, strictnessSelect] = screen.getAllByRole('combobox');
    fireEvent.change(depthSelect, { target: { value: 'deep' } });
    fireEvent.change(authSelect, { target: { value: 'authenticated' } });
    fireEvent.change(browserSelect, { target: { value: 'cross_browser' } });
    fireEvent.change(strictnessSelect, { target: { value: 'strict' } });

    fireEvent.click(screen.getByRole('button', { name: /Run Trace/i }));

    await waitFor(() => expect(runAgentMock).toHaveBeenCalledTimes(1));

    expect(runAgentMock).toHaveBeenCalledWith({
      type: 'trace',
      payload: {
        spec: 'Given user logs in Then dashboard loads',
        aiProvider: 'openai',
        tracePreferences: {
          testDepth: 'deep',
          authScope: 'authenticated',
          browserTarget: 'cross_browser',
          strictness: 'strict',
        },
      },
    });
  });

  it('shows automation execution summary when result metadata includes execution stats', async () => {
    runAgentMock.mockResolvedValueOnce({ jobId: 'job-2', state: 'completed' });
    getJobMock.mockResolvedValueOnce({
      id: 'job-2',
      type: 'trace',
      state: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      result: {
        metadata: {
          automationExecution: {
            mode: 'syntactic',
            executedScenarios: 4,
            passedScenarios: 3,
            failedScenarios: 1,
            passRate: 75,
            featuresCovered: 6,
            featuresTotal: 8,
            featureCoverageRate: 75,
          },
        },
      },
      trace: [],
    });

    renderPage();
    const specInput = screen.getByPlaceholderText(/Paste your test specification/i);
    fireEvent.change(specInput, { target: { value: 'Scenario: checkout path' } });
    fireEvent.click(screen.getByRole('button', { name: /Run Trace/i }));

    await waitFor(() => expect(screen.getByText('traceConsole.summary.title')).toBeInTheDocument());
    expect(screen.getByText('traceConsole.summary.featurePassRateLabel')).toBeInTheDocument();
    expect(screen.getByText('%75')).toBeInTheDocument();
    expect(screen.getByText('6/8')).toBeInTheDocument();
  });
});
