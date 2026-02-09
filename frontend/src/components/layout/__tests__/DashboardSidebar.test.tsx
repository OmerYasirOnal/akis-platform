import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardSidebar } from '../DashboardSidebar';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('DashboardSidebar', () => {
  it('renders workspace name with default value', () => {
    renderWithRouter(<DashboardSidebar />);
    expect(screen.getByText('AKIS Workspace')).toBeInTheDocument();
  });

  it('renders custom workspace name', () => {
    renderWithRouter(<DashboardSidebar workspaceName="My Team" />);
    expect(screen.getByText('My Team')).toBeInTheDocument();
  });

  it('renders all nav group titles', () => {
    renderWithRouter(<DashboardSidebar />);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders main navigation links', () => {
    renderWithRouter(<DashboardSidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Integrations')).toBeInTheDocument();
  });

  it('renders agents navigation link', () => {
    renderWithRouter(<DashboardSidebar />);
    expect(screen.getByText('Agents Hub')).toBeInTheDocument();
  });

  it('renders settings navigation links', () => {
    renderWithRouter(<DashboardSidebar />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('AI Keys')).toBeInTheDocument();
    // "Workspace" appears both as a nav link label and the workspace section label
    const workspaceElements = screen.getAllByText('Workspace');
    expect(workspaceElements.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onNavClick when a nav item is clicked', () => {
    const handleClick = vi.fn();
    renderWithRouter(<DashboardSidebar onNavClick={handleClick} />);
    fireEvent.click(screen.getByText('Overview'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('nav links have correct hrefs', () => {
    renderWithRouter(<DashboardSidebar />);
    const overviewLink = screen.getByText('Overview').closest('a');
    expect(overviewLink?.getAttribute('href')).toBe('/dashboard');

    const jobsLink = screen.getByText('Jobs').closest('a');
    expect(jobsLink?.getAttribute('href')).toBe('/dashboard/jobs');
  });
});
