import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import { DashboardLayout } from './components/layout';
import { ProtectedRoute, RequireRole } from './app/RouteGuards';
import { AuthProvider } from './contexts/AuthContext';
import { useI18n } from './i18n/useI18n';
import LandingPage from './pages/LandingPage';
import AboutAKIS from './pages/about/AboutAKIS';
import LegalTermsPage from './pages/legal/LegalTermsPage';
import LegalPrivacyPage from './pages/legal/LegalPrivacyPage';
import LoginEmail from './pages/auth/LoginEmail';
import LoginPassword from './pages/auth/LoginPassword';
import SignupEmail from './pages/auth/SignupEmail';
import SignupPassword from './pages/auth/SignupPassword';
import SignupVerifyEmail from './pages/auth/SignupVerifyEmail';
import WelcomeBeta from './pages/auth/WelcomeBeta';
import PrivacyConsent from './pages/auth/PrivacyConsent';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import DashboardAgentScribePage from './pages/dashboard/agents/DashboardAgentScribePage';
import DashboardSettingsProfilePage from './pages/dashboard/settings/DashboardSettingsProfilePage';
import DashboardSettingsWorkspacePage from './pages/dashboard/settings/DashboardSettingsWorkspacePage';
import DashboardSettingsApiKeysPage from './pages/dashboard/settings/DashboardSettingsApiKeysPage';
import DashboardSettingsBillingPage from './pages/dashboard/settings/DashboardSettingsBillingPage';
import DashboardSettingsNotificationsPage from './pages/dashboard/settings/DashboardSettingsNotificationsPage';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loaded public pages
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const BlogIndexPage = lazy(() => import('./pages/public/BlogIndexPage'));
const DocsLandingPage = lazy(() => import('./pages/public/DocsLandingPage'));
const LearnLandingPage = lazy(() => import('./pages/public/LearnLandingPage'));

// Lazy loaded dashboard pages
const IntegrationsHubPage = lazy(() => import('./pages/dashboard/integrations/IntegrationsHubPage'));
const DashboardSettingsAiKeysPage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsAiKeysPage'));
const AgentsHubPage = lazy(() => import('./pages/dashboard/agents/AgentsHubPage'));

// Loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
  </div>
);

function App() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes with AppShell */}
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutAKIS />} />
            
            {/* New Public Pages */}
            <Route
              path="pricing"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PricingPage />
                </Suspense>
              }
            />
            <Route
              path="blog"
              element={
                <Suspense fallback={<PageLoader />}>
                  <BlogIndexPage />
                </Suspense>
              }
            />
            <Route
              path="docs"
              element={
                <Suspense fallback={<PageLoader />}>
                  <DocsLandingPage />
                </Suspense>
              }
            />
            <Route
              path="learn"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LearnLandingPage />
                </Suspense>
              }
            />
            
            <Route path="legal">
              <Route path="terms" element={<LegalTermsPage />} />
              <Route path="privacy" element={<LegalPrivacyPage />} />
            </Route>

            {/* Auth Routes - Multi-Step Flow (UNCHANGED) */}
            <Route path="login">
              <Route index element={<LoginEmail />} />
              <Route path="password" element={<LoginPassword />} />
            </Route>
            <Route path="signup">
              <Route index element={<SignupEmail />} />
              <Route path="password" element={<SignupPassword />} />
              <Route path="verify-email" element={<SignupVerifyEmail />} />
            </Route>
            <Route path="auth">
              <Route path="welcome-beta" element={<WelcomeBeta />} />
              <Route path="privacy-consent" element={<PrivacyConsent />} />
            </Route>
          </Route>

          {/* Dashboard Routes with DashboardLayout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="scribe" element={<DashboardAgentScribePage />} />
            <Route path="jobs">
              <Route index element={<JobsListPage />} />
              <Route path="new" element={<Navigate to="/dashboard/scribe" replace />} />
              <Route
                path=":id"
                element={
                  <ErrorBoundary fallbackPath="/dashboard/jobs" fallbackLabel="Jobs">
                    <JobDetailPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            <Route path="agents">
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AgentsHubPage />
                  </Suspense>
                }
              />
              <Route path="scribe" element={<Navigate to="/dashboard/scribe" replace />} />
            </Route>
            
            {/* Integrations Hub (New) */}
            <Route
              path="integrations"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IntegrationsHubPage />
                </Suspense>
              }
            />
            
            {/* Settings Routes */}
            <Route path="settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<DashboardSettingsProfilePage />} />
              <Route path="workspace" element={<DashboardSettingsWorkspacePage />} />
              <Route path="api-keys" element={<DashboardSettingsApiKeysPage />} />
              {/* New AI Keys Page */}
              <Route
                path="ai-keys"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardSettingsAiKeysPage />
                  </Suspense>
                }
              />
              <Route
                path="billing"
                element={
                  <RequireRole roles={['admin']}>
                    <DashboardSettingsBillingPage />
                  </RequireRole>
                }
              />
              <Route
                path="notifications"
                element={<DashboardSettingsNotificationsPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
