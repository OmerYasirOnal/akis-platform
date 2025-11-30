import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import PageTransition from './PageTransition';

/**
 * AppShell - Unified shell for all public routes
 * Design system: bg-ak-bg, text-ak-text-primary
 */
export default function AppShell() {
  return (
    <div className="relative min-h-screen bg-ak-bg text-ak-text-primary">
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
