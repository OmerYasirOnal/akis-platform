import Header from '../components/Header';
import Hero from '../components/Hero';
import ModulesSection from '../components/ModulesSection';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header />
      <main>
        <Hero />
        <ModulesSection />
      </main>
      <Footer />
    </div>
  );
}
