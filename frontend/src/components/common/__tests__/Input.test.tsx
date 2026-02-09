import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('renders with label connected via htmlFor', () => {
    render(<Input label="Email" />);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders description text', () => {
    render(<Input label="Name" description="Your full name" />);
    expect(screen.getByText('Your full name')).toBeInTheDocument();
  });

  it('renders error text and hides description', () => {
    render(<Input label="Name" description="Info" error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.queryByText('Info')).toBeNull();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Bad value" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-invalid to false when no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('links aria-describedby to error element', () => {
    render(<Input id="test-input" error="Invalid" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    expect(screen.getByText('Invalid')).toHaveAttribute('id', 'test-input-error');
  });

  it('links aria-describedby to description element', () => {
    render(<Input id="test-input" description="Help text" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-description');
    expect(screen.getByText('Help text')).toHaveAttribute('id', 'test-input-description');
  });

  it('renders rightElement', () => {
    render(<Input rightElement={<span data-testid="icon">@</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('passes through native input props', () => {
    render(<Input type="password" placeholder="Secret" disabled />);
    const input = screen.getByPlaceholderText('Secret');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toBeDisabled();
  });

  it('fires onChange on input', () => {
    let value = '';
    render(<Input onChange={(e) => { value = e.target.value; }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(value).toBe('hello');
  });

  it('applies custom className to input', () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input?.classList.contains('custom-class')).toBe(true);
  });
});
