import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Logo from '../Logo';

describe('Logo', () => {
  it('renders density-aware srcset and preserves loading behavior', () => {
    render(<Logo size="hero" linkToHome={false} />);

    const img = screen.getByRole('img', { name: 'AKIS' });
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'async');

    expect(img.getAttribute('src')).toContain('akis-official-logo.png');

    const srcSet = img.getAttribute('srcset');
    expect(srcSet).toContain('akis-official-logo.png 1x');
    expect(srcSet).toContain('akis-official-logo@2x.png 2x');
    expect(srcSet).toContain('akis-official-logo@3x.png 3x');
  });

  it('lazy-loads non-hero surfaces', () => {
    render(<Logo size="nav" linkToHome={false} />);

    const img = screen.getByRole('img', { name: 'AKIS' });
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('wraps with a home link by default', () => {
    render(
      <MemoryRouter>
        <Logo />
      </MemoryRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });
});


