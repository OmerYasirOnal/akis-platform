import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionHeader, PageHeader } from '../SectionHeader';

describe('SectionHeader', () => {
  it('renders title', () => {
    render(<SectionHeader title="My Section" />);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders title as h2', () => {
    render(<SectionHeader title="My Section" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('My Section');
  });

  it('renders description when provided', () => {
    render(<SectionHeader title="Title" description="A description" />);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    const { container } = render(<SectionHeader title="Title" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('renders action slot when provided', () => {
    render(<SectionHeader title="Title" action={<button>Click</button>} />);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SectionHeader title="Title" className="extra-class" />);
    expect((container.firstChild as HTMLElement).className).toContain('extra-class');
  });
});

describe('PageHeader', () => {
  it('renders title as h1', () => {
    render(<PageHeader title="Page Title" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page Title');
  });

  it('renders description when provided', () => {
    render(<PageHeader title="Title" description="Page desc" />);
    expect(screen.getByText('Page desc')).toBeInTheDocument();
  });

  it('renders action slot', () => {
    render(<PageHeader title="Title" action={<span>Action</span>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
