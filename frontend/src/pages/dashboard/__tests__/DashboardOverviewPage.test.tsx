import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardOverviewPage from '../DashboardOverviewPage';

// Mock child components that make API calls
vi.mock('../../../components/dashboard/UsageWidget', () => ({
  UsageWidget: () => <div data-testid="usage-widget">UsageWidget</div>,
}));

vi.mock('../../../components/dashboard/QualityReliabilityCard', () => ({
  QualityReliabilityCard: () => (
    <div data-testid="quality-reliability-card">QualityReliabilityCard</div>
  ),
}));

vi.mock('../../../components/dashboard/GettingStartedCard', () => ({
  GettingStartedCard: () => (
    <div data-testid="getting-started-card">GettingStartedCard</div>
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardOverviewPage />
    </MemoryRouter>,
  );

describe('DashboardOverviewPage', () => {
  it('renders the Dashboard heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: /Dashboard/i }),
    ).toBeInTheDocument();
  });

  it('renders the overview subtitle', () => {
    renderPage();
    expect(
      screen.getByText(/Overview of your workspace activity/i),
    ).toBeInTheDocument();
  });

  it('renders the Open Agents Hub button', () => {
    renderPage();
    expect(screen.getByText('Open Agents Hub')).toBeInTheDocument();
  });

  it('renders GettingStartedCard', () => {
    renderPage();
    expect(screen.getByTestId('getting-started-card')).toBeInTheDocument();
  });

  it('renders quick action links', () => {
    renderPage();
    expect(screen.getByText('Agents Hub')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    // "Integrations" appears in both quick actions and tabs
    expect(screen.getAllByText('Integrations').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders Usage, Spending, and Integrations tabs', () => {
    renderPage();
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Spending')).toBeInTheDocument();
    // "Integrations" also appears in quick actions — check tabs nav
    const tabs = screen.getByRole('navigation', { name: /Dashboard tabs/i });
    expect(tabs).toBeInTheDocument();
  });

  it('renders UsageWidget by default (usage tab active)', () => {
    renderPage();
    expect(screen.getByTestId('usage-widget')).toBeInTheDocument();
  });

  it('renders QualityReliabilityCard by default', () => {
    renderPage();
    expect(screen.getByTestId('quality-reliability-card')).toBeInTheDocument();
  });

  it('renders Recent Activity section', () => {
    renderPage();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
