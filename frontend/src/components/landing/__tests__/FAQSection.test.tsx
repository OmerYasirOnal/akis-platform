import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FAQSection from '../FAQSection';

// Mock i18n — passthrough keys
vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('FAQSection', () => {
  it('renders section title and subtitle', () => {
    render(<FAQSection />);
    expect(screen.getByText('landing.faq.title')).toBeInTheDocument();
    expect(screen.getByText('landing.faq.subtitle')).toBeInTheDocument();
  });

  it('renders 6 FAQ items', () => {
    render(<FAQSection />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(6);
  });

  it('first FAQ item is open by default', () => {
    render(<FAQSection />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking a closed item opens it and closes the other', () => {
    render(<FAQSection />);
    const buttons = screen.getAllByRole('button');

    // Click 2nd item
    fireEvent.click(buttons[1]);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
  });

  it('clicking an open item closes it (none open)', () => {
    render(<FAQSection />);
    const buttons = screen.getAllByRole('button');

    // Click the already-open first item
    fireEvent.click(buttons[0]);
    // All should be closed
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders contact CTA link', () => {
    render(<FAQSection />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/contact');
    expect(link).toHaveTextContent('landing.faq.contactUs');
  });

  it('renders FAQ label badge', () => {
    render(<FAQSection />);
    expect(screen.getByText('landing.faq.label')).toBeInTheDocument();
  });
});
