import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonCard } from '../Skeleton';

describe('Skeleton', () => {
  it('renders a div with animate-pulse', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el?.tagName).toBe('DIV');
    expect(el?.className).toContain('animate-pulse');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-5 w-1/3" />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('h-5');
    expect(el?.className).toContain('w-1/3');
  });

  it('has rounded and bg classes by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el?.className).toContain('rounded-lg');
    expect(el?.className).toContain('bg-ak-surface-2');
  });
});

describe('SkeletonCard', () => {
  it('renders a card container with child skeletons', () => {
    const { container } = render(<SkeletonCard />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('rounded-2xl');
    expect(wrapper?.className).toContain('bg-ak-surface-2');
  });

  it('renders 3 skeleton lines', () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });
});
