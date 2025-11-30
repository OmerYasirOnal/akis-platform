import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import GlassBackdrop from './GlassBackdrop';
import PageTransition from './PageTransition';

/**
 * AppShell - Unified shell for all public routes
 * Uses liquid glass morphism theme
 */
export default function AppShell() {
  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Liquid Glass backdrop - global, beneath all content */}
      <GlassBackdrop className="fixed inset-0 z-0" />

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        <Footer />
      </div>
    </div>
  );
}
