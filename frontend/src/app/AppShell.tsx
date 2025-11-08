import { Outlet } from 'react-router-dom';
import AppHeader from '../layouts/AppHeader';
import Footer from '../components/common/Footer';

const AppShell = () => {
  return (
    <div className="flex min-h-screen flex-col bg-ak-bg text-ak-text-primary">
      <AppHeader />
      <main className="flex-1 pb-20 pt-24 sm:pb-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppShell;

