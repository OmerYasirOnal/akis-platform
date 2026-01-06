import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import DashboardShell from './app/DashboardShell';
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
import DashboardIntegrationsPage from './pages/dashboard/DashboardIntegrationsPage';
import DashboardSettingsProfilePage from './pages/dashboard/settings/DashboardSettingsProfilePage';
import DashboardSettingsWorkspacePage from './pages/dashboard/settings/DashboardSettingsWorkspacePage';
import DashboardSettingsAiProvidersPage from './pages/dashboard/settings/DashboardSettingsAiProvidersPage';
import DashboardSettingsApiKeysPage from './pages/dashboard/settings/DashboardSettingsApiKeysPage';
import DashboardSettingsBillingPage from './pages/dashboard/settings/DashboardSettingsBillingPage';
import DashboardSettingsNotificationsPage from './pages/dashboard/settings/DashboardSettingsNotificationsPage';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutAKIS />} />
            <Route path="legal">
              <Route path="terms" element={<LegalTermsPage />} />
              <Route path="privacy" element={<LegalPrivacyPage />} />
            </Route>

            {/* Auth Routes - Multi-Step Flow */}
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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardShell />
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
              <Route index element={<Navigate to="/dashboard/scribe" replace />} />
              <Route path="scribe" element={<Navigate to="/dashboard/scribe" replace />} />
              <Route path="scribe/run" element={<Navigate to="/dashboard/scribe" replace />} />
            </Route>
            <Route path="integrations" element={<DashboardIntegrationsPage />} />
            <Route path="settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<DashboardSettingsProfilePage />} />
              <Route path="workspace" element={<DashboardSettingsWorkspacePage />} />
              <Route path="ai-providers" element={<DashboardSettingsAiProvidersPage />} />
              <Route path="api-keys" element={<DashboardSettingsApiKeysPage />} />
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
