import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MemoryRouterProps } from 'react-router-dom';

type RenderWithRouterOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: MemoryRouterProps['initialEntries'];
  basename?: MemoryRouterProps['basename'];
};

/**
 * Renders a React component wrapped with MemoryRouter for testing.
 * This helper provides React Router context to components that use
 * router hooks (useNavigate, useLocation, Link, NavLink, etc.).
 *
 * @param ui - The React component or element to render
 * @param options - Render options including router configuration
 * @returns Render result from @testing-library/react
 *
 * @example
 * ```tsx
 * import { renderWithRouter } from '@/test/utils/renderWithRouter';
 * import MyComponent from './MyComponent';
 *
 * it('renders with router', () => {
 *   const { getByText } = renderWithRouter(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 *
 * it('renders with custom route', () => {
 *   const { getByText } = renderWithRouter(<MyComponent />, {
 *     initialEntries: ['/dashboard/agents'],
 *   });
 *   expect(getByText('Agents')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithRouter(
  ui: ReactElement,
  options: RenderWithRouterOptions = {}
): ReturnType<typeof render> {
  const { initialEntries = ['/'], basename, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <MemoryRouter initialEntries={initialEntries} basename={basename}>
        {children}
      </MemoryRouter>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

