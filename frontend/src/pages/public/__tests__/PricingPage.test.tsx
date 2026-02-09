import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PricingPage from '../PricingPage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('PricingPage', () => {
  it('renders the page heading', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Pricing/i)).toBeInTheDocument();
  });

  it('renders all three pricing tiers', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows Free price for Developer tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows $49 price for Team tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('shows Custom price for Enterprise tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getAllByText('Get Started Free').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Start Free Trial').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Contact Sales').length).toBeGreaterThanOrEqual(1);
  });

  it('renders key features for Developer tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Scribe Agent/)).toBeInTheDocument();
    expect(screen.getByText(/100 AI API calls/)).toBeInTheDocument();
    expect(screen.getByText(/GitHub integration/)).toBeInTheDocument();
  });

  it('renders key features for Team tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Unlimited AI API calls/)).toBeInTheDocument();
    expect(screen.getByText(/Priority support/)).toBeInTheDocument();
  });

  it('renders key features for Enterprise tier', () => {
    render(<PricingPage />, { wrapper: Wrapper });
    expect(screen.getByText(/SSO & SAML/)).toBeInTheDocument();
    expect(screen.getByText(/SLA guarantees/)).toBeInTheDocument();
  });
});
