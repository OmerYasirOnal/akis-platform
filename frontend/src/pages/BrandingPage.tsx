import { Link } from 'react-router-dom';
import Logo from '../components/branding/Logo';
import { brandTokens } from '../theme/tokens';

export default function BrandingPage() {
  const tokens = [
    { name: 'ak-primary', value: brandTokens.primary, description: 'Logo/accents/focus' },
    { name: 'ak-bg', value: brandTokens.bg, description: 'App/page background' },
    { name: 'ak-surface', value: brandTokens.surface, description: 'Low elevation surface' },
    { name: 'ak-surface-2', value: brandTokens.surface2, description: 'Cards/modals surface' },
    { name: 'ak-text-primary', value: brandTokens.textPrimary, description: 'High-contrast body text' },
    { name: 'ak-text-secondary', value: brandTokens.textSecondary, description: 'Muted text' },
    { name: 'ak-border', value: brandTokens.border, description: 'Subtle separators' },
  ];

  return (
    <div className="min-h-screen bg-ak-bg p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-ak-text-primary">AKIS Brand Foundation</h1>
          <Link
            to="/jobs"
            className="px-4 py-2 text-sm font-medium text-ak-text-primary hover:text-ak-primary transition-colors"
          >
            ← Back to Jobs
          </Link>
        </div>

        {/* Logo Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Logo (PNG)</h2>
          <div className="bg-ak-bg p-8 rounded-lg border border-ak-border flex items-center justify-center">
            <Logo size="lg" linkToHome={false} />
          </div>
          <div className="flex gap-4">
            <div className="bg-ak-surface p-4 rounded-lg border border-ak-border flex items-center justify-center">
              <Logo size="sm" linkToHome={false} />
            </div>
            <div className="bg-ak-surface p-4 rounded-lg border border-ak-border flex items-center justify-center">
              <Logo size="default" linkToHome={false} />
            </div>
            <div className="bg-ak-surface p-4 rounded-lg border border-ak-border flex items-center justify-center">
              <Logo size="lg" linkToHome={false} />
            </div>
          </div>
          <p className="text-sm text-ak-text-secondary">
            Logo sizes: sm (~20px), default (~24-28px), lg (~36px). Transparent PNG format.
          </p>
        </section>

        {/* Header Sample */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Header Sample</h2>
          <div className="bg-ak-surface border-b border-ak-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-6">
                  <Logo size="default" />
                  <div className="text-sm font-medium text-ak-text-primary">Navigation Item</div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-ak-text-secondary">
            Header uses <code className="text-ak-primary">ak-surface</code> background with logo at default size (~24-28px).
          </p>
        </section>

        {/* Color Tokens Table */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Color Tokens</h2>
          <div className="bg-ak-surface rounded-lg border border-ak-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-ak-surface-2 border-b border-ak-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-ak-text-primary">Token Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-ak-text-primary">Hex Value</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-ak-text-primary">Description</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-ak-text-primary">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ak-border">
                {tokens.map((token) => (
                  <tr key={token.name} className="hover:bg-ak-surface-2 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-ak-text-primary">{token.name}</td>
                    <td className="px-6 py-4 text-sm font-mono text-ak-text-secondary">{token.value}</td>
                    <td className="px-6 py-4 text-sm text-ak-text-secondary">{token.description}</td>
                    <td className="px-6 py-4">
                      <div
                        className="w-16 h-16 rounded border border-ak-border"
                        style={{ backgroundColor: token.value }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Surfaces */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Surfaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ak-surface p-6 rounded-lg border border-ak-border">
              <h3 className="text-lg font-semibold text-ak-text-primary mb-2">ak-surface</h3>
              <p className="text-ak-text-secondary">
                Low elevation surface for subtle differentiation from background.
              </p>
            </div>
            <div className="bg-ak-surface-2 p-6 rounded-lg border border-ak-border">
              <h3 className="text-lg font-semibold text-ak-text-primary mb-2">ak-surface-2</h3>
              <p className="text-ak-text-secondary">
                Slightly lighter surface for cards, modals, and elevated components.
              </p>
            </div>
          </div>
        </section>

        {/* Button States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Button States</h2>
          <div className="bg-ak-surface p-6 rounded-lg border border-ak-border space-y-4">
            <div className="flex flex-wrap gap-4">
              <button className="px-4 py-2 bg-ak-primary text-ak-bg font-medium rounded hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg">
                Default
              </button>
              <button className="px-4 py-2 bg-ak-primary text-ak-bg font-medium rounded opacity-90 cursor-not-allowed" disabled>
                Disabled
              </button>
              <button className="px-4 py-2 border border-ak-primary text-ak-primary font-medium rounded hover:bg-ak-primary hover:text-ak-bg transition-colors focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg">
                Outline
              </button>
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 text-ak-primary font-medium hover:text-ak-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg rounded"
              >
                Link Button
              </Link>
            </div>
          </div>
        </section>

        {/* Focus Ring */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Focus Ring (ak-primary)</h2>
          <div className="bg-ak-surface p-6 rounded-lg border border-ak-border">
            <p className="text-ak-text-secondary mb-4">
              Interactive elements use <code className="text-ak-primary">ak-primary</code> for focus indication.
            </p>
            <div className="flex gap-4">
              <button className="px-4 py-2 bg-ak-surface-2 text-ak-text-primary font-medium rounded focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg">
                Focus me (Tab)
              </button>
              <input
                type="text"
                placeholder="Focus me (Tab)"
                className="px-4 py-2 bg-ak-surface-2 text-ak-text-primary border border-ak-border rounded focus:outline-none focus:ring-2 focus:ring-ak-primary focus:ring-offset-2 focus:ring-offset-ak-bg focus:border-ak-primary"
              />
            </div>
          </div>
        </section>

        {/* Contrast Notes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-ak-text-primary">Accessibility (WCAG AA)</h2>
          <div className="bg-ak-surface p-6 rounded-lg border border-ak-border space-y-2">
            <div className="text-ak-text-secondary">
              <p className="font-semibold text-ak-text-primary mb-2">Contrast Ratios:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ak-text-primary on ak-bg: <strong>15.2:1</strong> ✓</li>
                <li>ak-text-primary on ak-surface: <strong>14.1:1</strong> ✓</li>
                <li>ak-text-primary on ak-surface-2: <strong>13.2:1</strong> ✓</li>
                <li>ak-text-secondary on ak-bg: <strong>7.1:1</strong> ✓</li>
                <li>ak-primary on ak-bg: <strong>4.8:1</strong> ✓</li>
              </ul>
              <p className="mt-4 text-sm">
                All text combinations meet WCAG AA requirements (≥ 4.5:1 for normal text, ≥ 3:1 for large text).
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

