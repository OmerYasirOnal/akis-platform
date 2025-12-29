import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import DashboardShell from './app/DashboardShell';
import { ProtectedRoute, RequireRole } from './app/RouteGuards';
import { AuthProvider } from './contexts/AuthContext';
import { useI18n } from './i18n/useI18n';
import LandingPage from './pages/LandingPage';
import PlatformPage from './pages/PlatformPage';
import AgentsIndexPage from './pages/AgentsIndexPage';
import AgentScribePage from './pages/agents/AgentScribePage';
import AgentTracePage from './pages/agents/AgentTracePage';
import AgentProtoPage from './pages/agents/AgentProtoPage';
import IntegrationsPage from './pages/IntegrationsPage';
import SolutionsPage from './pages/SolutionsPage';
import SolutionsByRolePage from './pages/SolutionsByRolePage';
import SolutionsByUseCasePage from './pages/SolutionsByUseCasePage';
import PricingPage from './pages/PricingPage';
import DocsIndexPage from './pages/docs/DocsIndexPage';
import DocsGettingStartedPage from './pages/docs/DocsGettingStartedPage';
import DocsAgentsPage from './pages/docs/DocsAgentsPage';
import DocsConfigurationPage from './pages/docs/DocsConfigurationPage';
import DocsIntegrationsPage from './pages/docs/DocsIntegrationsPage';
import DocsApiReferencePage from './pages/docs/DocsApiReferencePage';
import DocsArchitecturePage from './pages/docs/DocsArchitecturePage';
import DocsTroubleshootingPage from './pages/docs/DocsTroubleshootingPage';
import ChangelogPage from './pages/ChangelogPage';
import AboutAKIS from './pages/about/AboutAKIS';
import ContactPage from './pages/ContactPage';
import LegalTermsPage from './pages/legal/LegalTermsPage';
import LegalPrivacyPage from './pages/legal/LegalPrivacyPage';
import StatusPage from './pages/StatusPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import LoginEmail from './pages/auth/LoginEmail';
import LoginPassword from './pages/auth/LoginPassword';
import SignupEmail from './pages/auth/SignupEmail';
import SignupPassword from './pages/auth/SignupPassword';
import SignupVerifyEmail from './pages/auth/SignupVerifyEmail';
import WelcomeBeta from './pages/auth/WelcomeBeta';
import PrivacyConsent from './pages/auth/PrivacyConsent';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import DashboardAgentsIndexPage from './pages/dashboard/DashboardAgentsIndexPage';
import DashboardAgentScribePage from './pages/dashboard/agents/DashboardAgentScribePage';
import DashboardAgentScribeRunPage from './pages/dashboard/agents/DashboardAgentScribeRunPage';
import DashboardAgentTracePage from './pages/dashboard/agents/DashboardAgentTracePage';
import DashboardAgentProtoPage from './pages/dashboard/agents/DashboardAgentProtoPage';
import DashboardIntegrationsPage from './pages/dashboard/DashboardIntegrationsPage';
import DashboardSettingsProfilePage from './pages/dashboard/settings/DashboardSettingsProfilePage';
import DashboardSettingsWorkspacePage from './pages/dashboard/settings/DashboardSettingsWorkspacePage';
import DashboardSettingsApiKeysPage from './pages/dashboard/settings/DashboardSettingsApiKeysPage';
import DashboardSettingsBillingPage from './pages/dashboard/settings/DashboardSettingsBillingPage';
import DashboardSettingsNotificationsPage from './pages/dashboard/settings/DashboardSettingsNotificationsPage';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import NewJobPage from './pages/NewJobPage';
import DashboardTaskComposerPage from './pages/DashboardTaskComposerPage';
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
            <Route path="platform" element={<PlatformPage />} />
            <Route path="agents">
              <Route index element={<AgentsIndexPage />} />
              <Route path="scribe" element={<AgentScribePage />} />
              <Route path="trace" element={<AgentTracePage />} />
              <Route path="proto" element={<AgentProtoPage />} />
            </Route>
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="solutions">
              <Route index element={<SolutionsPage />} />
              <Route path="by-role" element={<SolutionsByRolePage />} />
              <Route path="by-use-case" element={<SolutionsByUseCasePage />} />
            </Route>
            <Route path="pricing" element={<PricingPage />} />
            <Route path="docs">
              <Route index element={<DocsIndexPage />} />
              <Route path="getting-started" element={<DocsGettingStartedPage />} />
              <Route path="agents" element={<DocsAgentsPage />} />
              <Route path="configuration" element={<DocsConfigurationPage />} />
              <Route path="integrations" element={<DocsIntegrationsPage />} />
              <Route path="api-reference" element={<DocsApiReferencePage />} />
              <Route path="architecture" element={<DocsArchitecturePage />} />
              <Route path="troubleshooting" element={<DocsTroubleshootingPage />} />
            </Route>
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="about" element={<AboutAKIS />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="legal">
              <Route path="terms" element={<LegalTermsPage />} />
              <Route path="privacy" element={<LegalPrivacyPage />} />
            </Route>
            <Route path="status" element={<StatusPage />} />

            {/* Auth Routes - Multi-Step Flow (New) */}
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

            {/* Legacy Auth Routes (Deprecated, kept for backwards compatibility) */}
            <Route path="auth/login-legacy" element={<Login />} />
            <Route path="auth/signup-legacy" element={<Signup />} />
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
            <Route path="jobs">
              <Route index element={<JobsListPage />} />
              <Route path="new" element={<NewJobPage />} />
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
              <Route index element={<DashboardAgentsIndexPage />} />
              <Route path="scribe" element={<DashboardAgentScribePage />} />
              <Route path="scribe/run" element={<DashboardAgentScribeRunPage />} />
              <Route path="trace" element={<DashboardAgentTracePage />} />
              <Route path="proto" element={<DashboardAgentProtoPage />} />
            </Route>
            <Route path="task-composer" element={<DashboardTaskComposerPage />} />
            <Route path="integrations" element={<DashboardIntegrationsPage />} />
            <Route path="settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<DashboardSettingsProfilePage />} />
              <Route path="workspace" element={<DashboardSettingsWorkspacePage />} />
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
