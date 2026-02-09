import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from '../ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('shows "Initializing..." for init stage', () => {
    render(<ThinkingIndicator stage="init" />);
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
  });

  it('shows "Planning..." for planning stage', () => {
    render(<ThinkingIndicator stage="planning" />);
    expect(screen.getByText('Planning...')).toBeInTheDocument();
  });

  it('shows "Executing..." for executing stage', () => {
    render(<ThinkingIndicator stage="executing" />);
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  it('shows "Reflecting on results..." for reflecting stage', () => {
    render(<ThinkingIndicator stage="reflecting" />);
    expect(screen.getByText('Reflecting on results...')).toBeInTheDocument();
  });

  it('shows "Validating output..." for validating stage', () => {
    render(<ThinkingIndicator stage="validating" />);
    expect(screen.getByText('Validating output...')).toBeInTheDocument();
  });

  it('shows "Publishing changes..." for publishing stage', () => {
    render(<ThinkingIndicator stage="publishing" />);
    expect(screen.getByText('Publishing changes...')).toBeInTheDocument();
  });

  it('shows "Completed" for completed stage', () => {
    render(<ThinkingIndicator stage="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows "Failed" for failed stage', () => {
    render(<ThinkingIndicator stage="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows "Processing..." for null stage', () => {
    render(<ThinkingIndicator stage={null} />);
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('shows custom message when provided', () => {
    render(<ThinkingIndicator stage="executing" message="Custom status" />);
    expect(screen.getByText('Custom status')).toBeInTheDocument();
  });

  it('shows Live indicator when connected and non-terminal', () => {
    render(<ThinkingIndicator stage="executing" isConnected />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('hides Live indicator when disconnected', () => {
    render(<ThinkingIndicator stage="executing" isConnected={false} />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('shows Reconnecting when disconnected and non-terminal', () => {
    render(<ThinkingIndicator stage="executing" isConnected={false} />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('hides Live indicator when terminal (completed)', () => {
    render(<ThinkingIndicator stage="completed" isConnected />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('hides Live indicator when terminal (failed)', () => {
    render(<ThinkingIndicator stage="failed" isConnected />);
    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(<ThinkingIndicator stage="init" className="my-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('my-class');
  });
});
