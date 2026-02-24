import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../../i18n/I18nProvider';
import PricingPage from '../PricingPage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </I18nProvider>
);

describe('PricingPage', () => {
  it('renders the page heading', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
    });
  });

  it('renders Pilot and Coming Soon tiers', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Pilot')).toBeInTheDocument();
      expect(screen.getByText('Pro & Enterprise')).toBeInTheDocument();
    });
  });

  it('shows Free for Pilot tier', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
    });
  });

  it('renders Pilot CTA', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Join Pilot')).toBeInTheDocument();
    });
  });

  it('renders Coming Soon CTA', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Contact for early access')).toBeInTheDocument();
    });
  });

  it('renders Pilot features', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getAllByText(/Scribe, Trace, Proto/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders Coming Soon features', async () => {
    render(<PricingPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Unlimited jobs/)).toBeInTheDocument();
    });
  });
});
