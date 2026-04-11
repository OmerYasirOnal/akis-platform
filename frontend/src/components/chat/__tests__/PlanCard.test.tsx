import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCard } from '../PlanCard';
import type { UserFriendlyPlan, ChangePlan } from '../../../types/plan';

const mockPlan: UserFriendlyPlan = {
  projectName: 'Test Project',
  summary: 'A test project summary',
  features: [{ name: 'Auth', description: 'User authentication' }],
  techChoices: ['React', 'Node.js'],
  estimatedFiles: 10,
  requiresTests: true,
};

const mockChangePlan: ChangePlan = {
  changeName: 'Add dark mode',
  summary: 'Adds dark mode support',
  modifiedFiles: [{ path: 'src/theme.ts', description: 'Add dark theme tokens' }],
  newFiles: ['src/dark.css'],
  requiresTests: false,
};

describe('PlanCard', () => {
  it('renders project plan with name and summary', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
      />,
    );
    expect(screen.getByText(/Test Project/)).toBeInTheDocument();
    expect(screen.getByText('A test project summary')).toBeInTheDocument();
  });

  it('shows features list for UserFriendlyPlan', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
      />,
    );
    expect(screen.getByText('Auth')).toBeInTheDocument();
    expect(screen.getByText(/User authentication/)).toBeInTheDocument();
  });

  it('shows approve and reject buttons when status is active', () => {
    const { container } = render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    // Active plan renders two action buttons (approve + reject) — no expand/collapse toggle
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    // Button text contains the emoji + label
    expect(buttons[0].textContent).toMatch(/Onayla/);
    expect(buttons[1].textContent).toMatch(/İptal/);
  });

  it('hides approve and reject buttons when status is approved', () => {
    const { container } = render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="approved"
        isChangeRequest={false}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />,
    );
    // Action buttons only render when isActive — look for button elements in the action footer
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(1); // only the expand/collapse toggle button
  });

  it('calls onApprove when approve button is clicked', () => {
    const onApprove = vi.fn();
    const { container } = render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
        onApprove={onApprove}
        onReject={vi.fn()}
      />,
    );
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[0]); // approve is first
    expect(onApprove).toHaveBeenCalledOnce();
  });

  it('calls onReject when reject button is clicked', () => {
    const onReject = vi.fn();
    const { container } = render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
        onApprove={vi.fn()}
        onReject={onReject}
      />,
    );
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[1]); // reject is second
    expect(onReject).toHaveBeenCalledOnce();
  });

  it('shows version badge for v2 and above', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={2}
        status="active"
        isChangeRequest={false}
      />,
    );
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('does not show version badge for v1', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="active"
        isChangeRequest={false}
      />,
    );
    expect(screen.queryByText('v1')).not.toBeInTheDocument();
  });

  it('expand and collapse works for non-active plans', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="approved"
        isChangeRequest={false}
      />,
    );
    // Non-active plans start collapsed — body not visible
    expect(screen.queryByText('A test project summary')).not.toBeInTheDocument();

    // Click "Detayları göster" to expand
    fireEvent.click(screen.getByText('Detayları göster'));
    expect(screen.getByText('A test project summary')).toBeInTheDocument();

    // Click "Gizle" to collapse again
    fireEvent.click(screen.getByText('Gizle'));
    expect(screen.queryByText('A test project summary')).not.toBeInTheDocument();
  });

  it('renders change request label when isChangeRequest is true', () => {
    render(
      <PlanCard
        plan={mockChangePlan}
        version={1}
        status="active"
        isChangeRequest={true}
      />,
    );
    expect(screen.getByText(/Değişiklik Planı/)).toBeInTheDocument();
    expect(screen.getByText(/Add dark mode/)).toBeInTheDocument();
  });

  it('shows status label for non-active plans', () => {
    render(
      <PlanCard
        plan={mockPlan}
        version={1}
        status="rejected"
        isChangeRequest={false}
      />,
    );
    expect(screen.getByText('Reddedildi')).toBeInTheDocument();
  });
});
