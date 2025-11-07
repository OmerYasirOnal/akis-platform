import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

type AppShellProps = {
  children: React.ReactNode;
};

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col bg-ak-bg text-ak-text-primary">
      <Header />
      <main className="flex-1 pb-16 pt-20 sm:pt-24">{children}</main>
      <Footer />
    </div>
  );
};

export default AppShell;

