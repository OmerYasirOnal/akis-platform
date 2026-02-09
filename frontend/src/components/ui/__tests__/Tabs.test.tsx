import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from '../Tabs';

const baseTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'logs', label: 'Logs' },
  { id: 'config', label: 'Config' },
];

describe('Tabs', () => {
  it('renders all tab labels', () => {
    render(<Tabs tabs={baseTabs} activeTab="overview" onChange={() => {}} />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
    expect(screen.getByText('Config')).toBeInTheDocument();
  });

  it('applies role="tablist" to container', () => {
    render(<Tabs tabs={baseTabs} activeTab="overview" onChange={() => {}} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('applies role="tab" to each button', () => {
    render(<Tabs tabs={baseTabs} activeTab="overview" onChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('sets aria-selected on active tab', () => {
    render(<Tabs tabs={baseTabs} activeTab="logs" onChange={() => {}} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with tab id on click', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={baseTabs} activeTab="overview" onChange={onChange} />);
    fireEvent.click(screen.getByText('Config'));
    expect(onChange).toHaveBeenCalledWith('config');
  });

  it('renders tab count badge when provided', () => {
    const tabs = [
      { id: 'all', label: 'All', count: 42 },
      { id: 'active', label: 'Active', count: 0 },
    ];
    render(<Tabs tabs={tabs} activeTab="all" onChange={() => {}} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('does not render count badge when count is undefined', () => {
    const tabs = [{ id: 'test', label: 'Test' }];
    const { container } = render(<Tabs tabs={tabs} activeTab="test" onChange={() => {}} />);
    // No span with the badge styling
    const badges = container.querySelectorAll('.rounded-full');
    expect(badges).toHaveLength(0);
  });

  it('renders icon when provided', () => {
    const tabs = [
      { id: 'home', label: 'Home', icon: <span data-testid="icon">🏠</span> },
    ];
    render(<Tabs tabs={tabs} activeTab="home" onChange={() => {}} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <Tabs tabs={baseTabs} activeTab="overview" onChange={() => {}} className="my-custom" />
    );
    const tablist = container.querySelector('[role="tablist"]');
    expect(tablist?.classList.contains('my-custom')).toBe(true);
  });
});
