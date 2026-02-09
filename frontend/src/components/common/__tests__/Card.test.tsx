import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });

  it('renders as a div by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as a custom element via "as" prop', () => {
    const { container } = render(<Card as="section">Content</Card>);
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });

  it('applies base theme classes', () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('bg-ak-surface-2');
    expect(el.className).toContain('border-ak-border');
    expect(el.className).toContain('rounded-2xl');
  });

  it('applies hover lift by default', () => {
    const { container } = render(<Card>Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('hover:-translate-y-0.5');
  });

  it('disables hover lift when noHoverLift is true', () => {
    const { container } = render(<Card noHoverLift>Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain('hover:-translate-y-0.5');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="my-custom">Content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('my-custom');
  });

  it('passes through HTML attributes', () => {
    render(<Card data-testid="test-card" role="article">Content</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('has displayName set to Card', () => {
    expect(Card.displayName).toBe('Card');
  });
});
