import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test', hasSeenBetaWelcome: true }, loading: false }),
}));

vi.mock('../../../hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('../../onboarding/WelcomeWizard', () => ({
  WelcomeWizard: () => <div data-testid="welcome-wizard" />,
}));

vi.mock('../../onboarding/AgentFeatureCard', () => ({
  AgentFeatureCard: ({ title }: { title: string }) => <div data-testid={`agent-${title}`}>{title}</div>,
}));

describe('EmptyState', () => {
  describe('new-conversation variant', () => {
    it('shows greeting text', () => {
      render(<EmptyState variant="new-conversation" />);
      expect(screen.getByText(/Merhaba/)).toBeInTheDocument();
      expect(screen.getByText('AKIS')).toBeInTheDocument();
    });

    it('shows agent badges Scribe, Proto, and Trace', () => {
      render(<EmptyState variant="new-conversation" />);
      expect(screen.getByText('Scribe')).toBeInTheDocument();
      expect(screen.getByText('Proto')).toBeInTheDocument();
      expect(screen.getByText('Trace')).toBeInTheDocument();
    });

    it('does not show the CTA button', () => {
      render(<EmptyState variant="new-conversation" />);
      expect(screen.queryByRole('button', { name: /Yeni Sohbet/i })).not.toBeInTheDocument();
    });
  });

  describe('no-conversation variant', () => {
    it('shows the CTA button', () => {
      render(<EmptyState variant="no-conversation" onNewConversation={vi.fn()} />);
      expect(screen.getByRole('button', { name: /Yeni Sohbet Başlat/i })).toBeInTheDocument();
    });

    it('calls onNewConversation when CTA button is clicked', () => {
      const onNewConversation = vi.fn();
      render(<EmptyState variant="no-conversation" onNewConversation={onNewConversation} />);
      fireEvent.click(screen.getByRole('button', { name: /Yeni Sohbet Başlat/i }));
      expect(onNewConversation).toHaveBeenCalledOnce();
    });

    it('shows agent feature cards for Scribe, Proto, and Trace', () => {
      render(<EmptyState variant="no-conversation" onNewConversation={vi.fn()} />);
      expect(screen.getByTestId('agent-Scribe')).toBeInTheDocument();
      expect(screen.getByTestId('agent-Proto')).toBeInTheDocument();
      expect(screen.getByTestId('agent-Trace')).toBeInTheDocument();
    });

    it('does not show WelcomeWizard when user has already seen beta welcome', () => {
      render(<EmptyState variant="no-conversation" onNewConversation={vi.fn()} />);
      expect(screen.queryByTestId('welcome-wizard')).not.toBeInTheDocument();
    });
  });
});
