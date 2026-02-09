import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pill } from '../Pill';

describe('Pill', () => {
  it('renders "Scribe" for type scribe', () => {
    render(<Pill type="scribe" />);
    expect(screen.getByText('Scribe')).toBeInTheDocument();
  });

  it('renders "Trace" for type trace', () => {
    render(<Pill type="trace" />);
    expect(screen.getByText('Trace')).toBeInTheDocument();
  });

  it('renders "Proto" for type proto', () => {
    render(<Pill type="proto" />);
    expect(screen.getByText('Proto')).toBeInTheDocument();
  });

  it('renders "Unknown" for unrecognized type', () => {
    render(<Pill type="nonexistent" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('renders a colored dot indicator', () => {
    const { container } = render(<Pill type="scribe" />);
    const dot = container.querySelector('[aria-hidden]');
    expect(dot).toBeInTheDocument();
  });

  it('applies scribe-specific background', () => {
    const { container } = render(<Pill type="scribe" />);
    const outer = container.querySelector('span');
    expect(outer?.className).toContain('bg-ak-primary/10');
  });

  it('applies trace-specific background', () => {
    const { container } = render(<Pill type="trace" />);
    const outer = container.querySelector('span');
    expect(outer?.className).toContain('bg-blue-500/10');
  });
});
