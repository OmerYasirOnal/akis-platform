import { useLocation, useOutlet } from 'react-router-dom';
import AppHeader from '../layouts/AppHeader';
import Footer from '../components/common/Footer';
import { MotionProvider } from '../motion/MotionProvider';
import { RouteTransitionContainer } from '../motion/routeTransitions';

const AppShell = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <MotionProvider>
      <div className="flex min-h-screen flex-col bg-ak-bg text-ak-text-primary">
        <AppHeader />
        <main className="flex-1 pb-20 pt-24 sm:pb-24">
          <RouteTransitionContainer locationKey={location.key}>{outlet}</RouteTransitionContainer>
        </main>
        <Footer />
      </div>
    </MotionProvider>
  );
};

export default AppShell;

