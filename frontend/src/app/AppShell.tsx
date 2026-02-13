import { useLocation, useOutlet } from 'react-router-dom';
import AppHeader from '../layouts/AppHeader';
import Footer from '../components/common/Footer';
import { MotionProvider } from '../motion/MotionProvider';
import { RouteTransitionContainer } from '../motion/routeTransitions';
import { useI18n } from '../i18n/useI18n';

const AppShell = () => {
  const location = useLocation();
  const outlet = useOutlet();
  const isHomePage = location.pathname === '/';
  const { t } = useI18n();

  return (
    <MotionProvider>
      <div className="flex min-h-screen flex-col bg-ak-bg text-ak-text-primary">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ak-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--ak-on-primary)]"
        >
          {t('a11y.skipToContent')}
        </a>
        {!isHomePage && <AppHeader />}
        <main id="main-content" className={isHomePage ? 'flex-1' : 'flex-1 pb-20 pt-24 sm:pb-24'}>
          <RouteTransitionContainer locationKey={location.key}>{outlet}</RouteTransitionContainer>
        </main>
        {!isHomePage && <Footer />}
      </div>
    </MotionProvider>
  );
};

export default AppShell;
