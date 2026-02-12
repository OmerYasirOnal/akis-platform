import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nContext } from '../../../../../i18n/i18n.context';
import DashboardAgentProtoPage from '../index';

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

const renderPage = () =>
  render(
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
        <DashboardAgentProtoPage />
      </MemoryRouter>
    </I18nContext.Provider>,
  );

describe('DashboardAgentProtoPage', () => {
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
      type: 'proto',
      state: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trace: [],
    });
  });

  it('renders the Proto Console page title', () => {
    renderPage();
    expect(screen.getByText('Proto Console')).toBeInTheDocument();
  });

  it('renders LiveAgentCanvas component', () => {
    renderPage();
    expect(screen.getByTestId('live-agent-canvas')).toBeInTheDocument();
  });

  it('renders the Run Proto button', () => {
    renderPage();
    expect(
      screen.getByRole('button', { name: /Run Proto/i }),
    ).toBeInTheDocument();
  });

  it('renders requirements textarea', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(
        /Describe your project requirements/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders tech stack input', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/React \+ TypeScript/i),
    ).toBeInTheDocument();
  });

  it('disables Run Proto button when requirements are empty', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /Run Proto/i });
    expect(button).toBeDisabled();
  });

  it('shows Logs and Artifacts tab buttons', () => {
    renderPage();
    expect(screen.getByText(/Logs/)).toBeInTheDocument();
    expect(screen.getByText(/Artifacts/)).toBeInTheDocument();
  });
});
