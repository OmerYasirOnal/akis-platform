import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedbackWidget from '../FeedbackWidget';
import { api } from '../../../services/api/client';

// Mock auth context — authenticated user
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'test@example.com', name: 'Test User' },
    loading: false,
  }),
}));

// Mock i18n — passthrough
vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'feedback.trigger': 'Send Feedback',
        'feedback.title': 'Send Feedback',
        'feedback.subtitle': 'Help us improve AKIS.',
        'feedback.placeholder': 'What can we do better?',
        'feedback.send': 'Send',
        'feedback.sending': 'Sending...',
        'feedback.cancel': 'Cancel',
        'feedback.thanks': 'Thank you!',
        'feedback.thanksDetail': 'Your feedback helps us improve.',
        'feedback.error': 'Could not send feedback.',
      };
      return map[key] ?? key;
    },
    locale: 'en',
  }),
}));

// Mock API client
vi.mock('../../../services/api/client', () => ({
  api: {
    submitFeedback: vi.fn(),
  },
}));

describe('FeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button', () => {
    render(<FeedbackWidget />);
    expect(screen.getByTestId('feedback-trigger')).toBeInTheDocument();
  });

  it('opens panel when trigger is clicked', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTestId('feedback-trigger'));
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument();
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('disables submit when no rating or message', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTestId('feedback-trigger'));
    const submit = screen.getByTestId('feedback-submit');
    expect(submit).toBeDisabled();
  });

  it('enables submit after rating and message', () => {
    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTestId('feedback-trigger'));
    fireEvent.click(screen.getByTestId('feedback-star-4'));
    fireEvent.change(screen.getByTestId('feedback-message'), {
      target: { value: 'Great platform!' },
    });
    const submit = screen.getByTestId('feedback-submit');
    expect(submit).not.toBeDisabled();
  });

  it('submits feedback and shows thanks', async () => {
    vi.mocked(api.submitFeedback).mockResolvedValueOnce({
      id: 'fb1',
      createdAt: new Date().toISOString(),
    });

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTestId('feedback-trigger'));
    fireEvent.click(screen.getByTestId('feedback-star-5'));
    fireEvent.change(screen.getByTestId('feedback-message'), {
      target: { value: 'Excellent!' },
    });
    fireEvent.click(screen.getByTestId('feedback-submit'));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });

    expect(api.submitFeedback).toHaveBeenCalledWith({
      rating: 5,
      message: 'Excellent!',
      page: '/',
    });
  });

  it('shows error on submit failure', async () => {
    vi.mocked(api.submitFeedback).mockRejectedValueOnce(new Error('Network error'));

    render(<FeedbackWidget />);
    fireEvent.click(screen.getByTestId('feedback-trigger'));
    fireEvent.click(screen.getByTestId('feedback-star-3'));
    fireEvent.change(screen.getByTestId('feedback-message'), {
      target: { value: 'Some feedback' },
    });
    fireEvent.click(screen.getByTestId('feedback-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('feedback-error')).toBeInTheDocument();
    });
  });
});
