import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  it('renders JSON data formatted with 2-space indent', () => {
    const data = { key: 'value', nested: { a: 1 } };
    render(<CodeBlock data={data} />);
    const code = screen.getByText(/"key": "value"/, { exact: false });
    expect(code).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<CodeBlock data={{ x: 1 }} title="Payload" />);
    expect(screen.getByText('Payload')).toBeInTheDocument();
  });

  it('omits title element when not provided', () => {
    const { container } = render(<CodeBlock data={{ x: 1 }} />);
    const titleDiv = container.querySelector('.text-sm.text-ak-text-secondary.mb-2');
    expect(titleDiv).toBeNull();
  });

  it('renders arrays correctly', () => {
    render(<CodeBlock data={[1, 2, 3]} />);
    expect(screen.getByText(/\[/)).toBeInTheDocument();
  });

  it('renders null data', () => {
    render(<CodeBlock data={null} />);
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('renders string data with quotes', () => {
    render(<CodeBlock data="hello" />);
    expect(screen.getByText('"hello"')).toBeInTheDocument();
  });

  it('wraps content in pre > code elements', () => {
    const { container } = render(<CodeBlock data={{ a: 1 }} />);
    expect(container.querySelector('pre code')).toBeInTheDocument();
  });
});
