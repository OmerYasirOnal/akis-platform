import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import DashboardShell from './app/DashboardShell';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import RequireRole from './auth/RequireRole';
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
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LegalTermsPage from './pages/legal/LegalTermsPage';
import LegalPrivacyPage from './pages/legal/LegalPrivacyPage';
import StatusPage from './pages/StatusPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import DashboardAgentsIndexPage from './pages/dashboard/DashboardAgentsIndexPage';
import DashboardAgentScribePage from './pages/dashboard/agents/DashboardAgentScribePage';
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

function App() {
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
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="legal">
              <Route path="terms" element={<LegalTermsPage />} />
              <Route path="privacy" element={<LegalPrivacyPage />} />
            </Route>
            <Route path="status" element={<StatusPage />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardShell />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            <Route path="jobs">
              <Route index element={<JobsListPage />} />
              <Route path="new" element={<NewJobPage />} />
              <Route path=":id" element={<JobDetailPage />} />
            </Route>
            <Route path="agents">
              <Route index element={<DashboardAgentsIndexPage />} />
              <Route path="scribe" element={<DashboardAgentScribePage />} />
              <Route path="trace" element={<DashboardAgentTracePage />} />
              <Route path="proto" element={<DashboardAgentProtoPage />} />
            </Route>
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
