import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import { DashboardLayout } from './components/layout';
import { AgentsLayout } from './components/layout/AgentsLayout';
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
import InviteAccept from './pages/auth/InviteAccept';
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
import FeedbackWidget from './components/feedback/FeedbackWidget';

const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const BlogIndexPage = lazy(() => import('./pages/public/BlogIndexPage'));
const LearnLandingPage = lazy(() => import('./pages/public/LearnLandingPage'));
const WaitlistPage = lazy(() => import('./pages/public/WaitlistPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));

const DocsLayout = lazy(() => import('./components/docs/DocsLayout'));
const DocsIndexPage = lazy(() => import('./pages/docs/DocsIndexPage'));
const GettingStartedPage = lazy(() => import('./pages/docs/GettingStartedPage'));
const ScribeDocsPage = lazy(() => import('./pages/docs/agents/ScribeDocsPage'));
const TraceDocsPage = lazy(() => import('./pages/docs/agents/TraceDocsPage'));
const ProtoDocsPage = lazy(() => import('./pages/docs/agents/ProtoDocsPage'));
const GitHubDocsPage = lazy(() => import('./pages/docs/integrations/GitHubDocsPage'));
const MCPDocsPage = lazy(() => import('./pages/docs/integrations/MCPDocsPage'));
const AtlassianDocsPage = lazy(() => import('./pages/docs/integrations/AtlassianDocsPage'));
const ApiKeysDocsPage = lazy(() => import('./pages/docs/security/ApiKeysDocsPage'));
const OAuthDocsPage = lazy(() => import('./pages/docs/security/OAuthDocsPage'));
const PrivacyDocsPage = lazy(() => import('./pages/docs/security/PrivacyDocsPage'));
const RestApiDocsPage = lazy(() => import('./pages/docs/api/RestApiDocsPage'));
const AuthDocsPage = lazy(() => import('./pages/docs/api/AuthDocsPage'));
const WebhooksDocsPage = lazy(() => import('./pages/docs/api/WebhooksDocsPage'));
const BestPracticesPage = lazy(() => import('./pages/docs/guides/BestPracticesPage'));
const TroubleshootingPage = lazy(() => import('./pages/docs/guides/TroubleshootingPage'));
const SelfHostingPage = lazy(() => import('./pages/docs/guides/SelfHostingPage'));

const IntegrationsHubPage = lazy(() => import('./pages/dashboard/integrations/IntegrationsHubPage'));
const DashboardSettingsAiKeysPage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsAiKeysPage'));
const AgentsHubPage = lazy(() => import('./pages/dashboard/agents/AgentsHubPage'));
const DashboardAgentTracePage = lazy(() => import('./pages/dashboard/agents/trace/index'));
const DashboardAgentProtoPage = lazy(() => import('./pages/dashboard/agents/proto/index'));
const SmartAutomationsPage = lazy(() => import('./pages/dashboard/agents/smart-automations/SmartAutomationsPage'));
const AutomationDetailPage = lazy(() => import('./pages/dashboard/agents/smart-automations/AutomationDetailPage'));

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
          {/* Public Routes */}
          <Route element={<AppShell />}>
            <Route index element={<LandingPage />} />
            <Route path="about" element={<AboutAKIS />} />
            <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogIndexPage /></Suspense>} />
            <Route path="learn" element={<Suspense fallback={<PageLoader />}><LearnLandingPage /></Suspense>} />
            <Route path="waitlist" element={<Suspense fallback={<PageLoader />}><WaitlistPage /></Suspense>} />
            <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="legal">
              <Route path="terms" element={<LegalTermsPage />} />
              <Route path="privacy" element={<LegalPrivacyPage />} />
            </Route>
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
              <Route path="invite/:token" element={<InviteAccept />} />
            </Route>
          </Route>

          {/* Agents — top-level route (canonical home for all agents) */}
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <AgentsLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <AgentsHubPage />
                </Suspense>
              }
            />
            <Route path="scribe" element={<DashboardAgentScribePage />} />
            <Route path="trace" element={<Suspense fallback={<PageLoader />}><DashboardAgentTracePage /></Suspense>} />
            <Route path="proto" element={<Suspense fallback={<PageLoader />}><DashboardAgentProtoPage /></Suspense>} />
          </Route>

          {/* Smart Automations - standalone route (no AgentsLayout) */}
          <Route
            path="/agents/smart-automations"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <SmartAutomationsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agents/smart-automations/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <AutomationDetailPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardOverviewPage />} />
            {/* Legacy agent routes — redirect to /agents/* (backwards compat) */}
            <Route path="scribe" element={<Navigate to="/agents/scribe" replace />} />
            <Route path="trace" element={<Navigate to="/agents/trace" replace />} />
            <Route path="proto" element={<Navigate to="/agents/proto" replace />} />
            <Route path="jobs">
              <Route index element={<JobsListPage />} />
              <Route path="new" element={<Navigate to="/agents/scribe" replace />} />
              <Route
                path=":id"
                element={
                  <ErrorBoundary fallbackPath="/dashboard/jobs" fallbackLabel="Jobs">
                    <JobDetailPage />
                  </ErrorBoundary>
                }
              />
            </Route>
            {/* Legacy redirect: /dashboard/agents -> /agents */}
            <Route path="agents" element={<Navigate to="/agents" replace />} />
            <Route path="agents/*" element={<Navigate to="/agents" replace />} />
            <Route
              path="integrations"
              element={
                <Suspense fallback={<PageLoader />}>
                  <IntegrationsHubPage />
                </Suspense>
              }
            />
            <Route path="settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<DashboardSettingsProfilePage />} />
              <Route path="workspace" element={<DashboardSettingsWorkspacePage />} />
              <Route path="api-keys" element={<DashboardSettingsApiKeysPage />} />
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
              <Route path="notifications" element={<DashboardSettingsNotificationsPage />} />
            </Route>
          </Route>

          {/* Docs */}
          <Route
            path="/docs"
            element={<Suspense fallback={<PageLoader />}><DocsLayout /></Suspense>}
          >
            <Route index element={<Suspense fallback={<PageLoader />}><DocsIndexPage /></Suspense>} />
            <Route path="getting-started" element={<Suspense fallback={<PageLoader />}><GettingStartedPage /></Suspense>} />
            <Route path="agents/scribe" element={<Suspense fallback={<PageLoader />}><ScribeDocsPage /></Suspense>} />
            <Route path="agents/trace" element={<Suspense fallback={<PageLoader />}><TraceDocsPage /></Suspense>} />
            <Route path="agents/proto" element={<Suspense fallback={<PageLoader />}><ProtoDocsPage /></Suspense>} />
            <Route path="integrations/github" element={<Suspense fallback={<PageLoader />}><GitHubDocsPage /></Suspense>} />
            <Route path="integrations/mcp" element={<Suspense fallback={<PageLoader />}><MCPDocsPage /></Suspense>} />
            <Route path="integrations/atlassian" element={<Suspense fallback={<PageLoader />}><AtlassianDocsPage /></Suspense>} />
            <Route path="security/api-keys" element={<Suspense fallback={<PageLoader />}><ApiKeysDocsPage /></Suspense>} />
            <Route path="security/oauth" element={<Suspense fallback={<PageLoader />}><OAuthDocsPage /></Suspense>} />
            <Route path="security/privacy" element={<Suspense fallback={<PageLoader />}><PrivacyDocsPage /></Suspense>} />
            <Route path="api/rest" element={<Suspense fallback={<PageLoader />}><RestApiDocsPage /></Suspense>} />
            <Route path="api/auth" element={<Suspense fallback={<PageLoader />}><AuthDocsPage /></Suspense>} />
            <Route path="api/webhooks" element={<Suspense fallback={<PageLoader />}><WebhooksDocsPage /></Suspense>} />
            <Route path="guides/best-practices" element={<Suspense fallback={<PageLoader />}><BestPracticesPage /></Suspense>} />
            <Route path="guides/troubleshooting" element={<Suspense fallback={<PageLoader />}><TroubleshootingPage /></Suspense>} />
            <Route path="guides/self-hosting" element={<Suspense fallback={<PageLoader />}><SelfHostingPage /></Suspense>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FeedbackWidget />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
