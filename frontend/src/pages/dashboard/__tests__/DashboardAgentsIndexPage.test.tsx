import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../../test/utils/renderWithRouter';
import DashboardAgentsIndexPage from '../DashboardAgentsIndexPage';

describe('DashboardAgentsIndexPage', () => {
  it('should render page header with title and description', () => {
    renderWithRouter(<DashboardAgentsIndexPage />);

    expect(screen.getByRole('heading', { name: /agents/i })).toBeInTheDocument();
    expect(
      screen.getByText(/configure behaviors, triggers, and outputs for each akis agent/i)
    ).toBeInTheDocument();
  });

  it('should render all three agent cards', () => {
    renderWithRouter(<DashboardAgentsIndexPage />);

    expect(screen.getByText('Scribe')).toBeInTheDocument();
    expect(screen.getByText('Trace')).toBeInTheDocument();
    expect(screen.getByText('Proto')).toBeInTheDocument();
  });

  it('should render agent descriptions', () => {
    renderWithRouter(<DashboardAgentsIndexPage />);

    expect(
      screen.getByText(/keeps documentation in sync with your repos/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/transforms jira work into actionable test suites/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/bootstraps mvp scaffolds from product specs/i)
    ).toBeInTheDocument();
  });

  it('should render manage buttons with correct links', () => {
    renderWithRouter(<DashboardAgentsIndexPage />);

    const scribeButton = screen.getByRole('link', { name: /manage scribe/i });
    expect(scribeButton).toBeInTheDocument();
    expect(scribeButton).toHaveAttribute('href', '/dashboard/agents/scribe');

    const traceButton = screen.getByRole('link', { name: /manage trace/i });
    expect(traceButton).toBeInTheDocument();
    expect(traceButton).toHaveAttribute('href', '/dashboard/agents/trace');

    const protoButton = screen.getByRole('link', { name: /manage proto/i });
    expect(protoButton).toBeInTheDocument();
    expect(protoButton).toHaveAttribute('href', '/dashboard/agents/proto');
  });

  it('should render with custom route context', () => {
    renderWithRouter(<DashboardAgentsIndexPage />, {
      initialEntries: ['/dashboard/agents'],
    });

    expect(screen.getByRole('heading', { name: /agents/i })).toBeInTheDocument();
  });
});

