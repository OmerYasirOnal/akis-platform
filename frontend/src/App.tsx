import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import { DashboardLayout } from './components/layout';
import { AgentsLayout } from './components/layout/AgentsLayout';
import { ProtectedRoute, RequireRole } from './app/RouteGuards';
import { AuthProvider } from './contexts/AuthContext';
import { useI18n } from './i18n/useI18n';
import LandingPage from './pages/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import FeedbackWidget from './components/feedback/FeedbackWidget';
import { ToastContainer } from './components/ui/Toast';

// Auth pages — lazy (only needed on login/signup flows)
const LoginEmail = lazy(() => import('./pages/auth/LoginEmail'));
const LoginPassword = lazy(() => import('./pages/auth/LoginPassword'));
const SignupEmail = lazy(() => import('./pages/auth/SignupEmail'));
const SignupPassword = lazy(() => import('./pages/auth/SignupPassword'));
const SignupVerifyEmail = lazy(() => import('./pages/auth/SignupVerifyEmail'));
const WelcomeBeta = lazy(() => import('./pages/auth/WelcomeBeta'));
const PrivacyConsent = lazy(() => import('./pages/auth/PrivacyConsent'));
const InviteAccept = lazy(() => import('./pages/auth/InviteAccept'));

// Public pages — lazy (rarely visited on first load)
const AboutAKIS = lazy(() => import('./pages/about/AboutAKIS'));
const LegalTermsPage = lazy(() => import('./pages/legal/LegalTermsPage'));
const LegalPrivacyPage = lazy(() => import('./pages/legal/LegalPrivacyPage'));

// Dashboard pages — lazy (behind auth, not needed on initial load)
const DashboardOverviewPage = lazy(() => import('./pages/dashboard/DashboardOverviewPage'));
const DashboardAgentScribePage = lazy(() => import('./pages/dashboard/agents/DashboardAgentScribePage'));
const DashboardSettingsProfilePage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsProfilePage'));
const DashboardSettingsWorkspacePage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsWorkspacePage'));
const DashboardSettingsApiKeysPage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsApiKeysPage'));
const DashboardSettingsBillingPage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsBillingPage'));
const DashboardSettingsNotificationsPage = lazy(() => import('./pages/dashboard/settings/DashboardSettingsNotificationsPage'));
const JobsListPage = lazy(() => import('./pages/JobsListPage'));
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'));

const ProductsPage = lazy(() => import('./pages/public/ProductsPage'));
const PricingPage = lazy(() => import('./pages/public/PricingPage'));
const BlogIndexPage = lazy(() => import('./pages/public/BlogIndexPage'));
const LearnLandingPage = lazy(() => import('./pages/public/LearnLandingPage'));
const WaitlistPage = lazy(() => import('./pages/public/WaitlistPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TechnologyPage = lazy(() => import('./pages/public/TechnologyPage'));
const MarketplaceOverviewPage = lazy(() => import('./pages/marketplace/MarketplaceOverviewPage'));
const MarketplaceAppShell = lazy(() => import('./pages/marketplace/app/MarketplaceAppShell'));
const OnboardingPage = lazy(() => import('./pages/marketplace/app/OnboardingPage'));
const MarketplaceJobsPage = lazy(() => import('./pages/marketplace/app/JobsPage'));
const MatchesPage = lazy(() => import('./pages/marketplace/app/MatchesPage'));
const ProposalsPage = lazy(() => import('./pages/marketplace/app/ProposalsPage'));

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
const DashboardAgentStudioPage = lazy(() => import('./pages/dashboard/agents/studio/index'));
const CrewRunPage = lazy(() => import('./pages/dashboard/agents/CrewRunPage'));
const DashboardRAGPage = lazy(() => import('./pages/dashboard/DashboardRAGPage'));
const LogsPage = lazy(() => import('./pages/dashboard/LogsPage'));

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
            <Route path="products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
            <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutAKIS /></Suspense>} />
            <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
            <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogIndexPage /></Suspense>} />
            <Route path="learn" element={<Suspense fallback={<PageLoader />}><LearnLandingPage /></Suspense>} />
            <Route path="waitlist" element={<Suspense fallback={<PageLoader />}><WaitlistPage /></Suspense>} />
            <Route path="marketplace" element={<Suspense fallback={<PageLoader />}><MarketplaceOverviewPage /></Suspense>} />
            <Route path="technology" element={<Suspense fallback={<PageLoader />}><TechnologyPage /></Suspense>} />
            <Route path="teknoloji" element={<Suspense fallback={<PageLoader />}><TechnologyPage /></Suspense>} />
            <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="iletisim" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
            <Route path="legal">
              <Route path="terms" element={<Suspense fallback={<PageLoader />}><LegalTermsPage /></Suspense>} />
              <Route path="privacy" element={<Suspense fallback={<PageLoader />}><LegalPrivacyPage /></Suspense>} />
            </Route>
            <Route path="login">
              <Route index element={<Suspense fallback={<PageLoader />}><LoginEmail /></Suspense>} />
              <Route path="password" element={<Suspense fallback={<PageLoader />}><LoginPassword /></Suspense>} />
            </Route>
            <Route path="signup">
              <Route index element={<Suspense fallback={<PageLoader />}><SignupEmail /></Suspense>} />
              <Route path="password" element={<Suspense fallback={<PageLoader />}><SignupPassword /></Suspense>} />
              <Route path="verify-email" element={<Suspense fallback={<PageLoader />}><SignupVerifyEmail /></Suspense>} />
            </Route>
            <Route path="auth">
              <Route path="welcome-beta" element={<Suspense fallback={<PageLoader />}><WelcomeBeta /></Suspense>} />
              <Route path="privacy-consent" element={<Suspense fallback={<PageLoader />}><PrivacyConsent /></Suspense>} />
              <Route path="invite/:token" element={<Suspense fallback={<PageLoader />}><InviteAccept /></Suspense>} />
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
            <Route path="scribe" element={<Suspense fallback={<PageLoader />}><DashboardAgentScribePage /></Suspense>} />
            <Route path="trace" element={<Suspense fallback={<PageLoader />}><DashboardAgentTracePage /></Suspense>} />
            <Route path="proto" element={<Suspense fallback={<PageLoader />}><DashboardAgentProtoPage /></Suspense>} />
            <Route path="studio" element={<Suspense fallback={<PageLoader />}><DashboardAgentStudioPage /></Suspense>} />
          </Route>

          {/* Crew Run - standalone route (no AgentsLayout, full-page view) */}
          <Route
            path="/agents/crew/:id"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <CrewRunPage />
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
            <Route index element={<Suspense fallback={<PageLoader />}><DashboardOverviewPage /></Suspense>} />
            {/* Legacy agent routes — redirect to /agents/* (backwards compat) */}
            <Route path="scribe" element={<Navigate to="/agents/scribe" replace />} />
            <Route path="trace" element={<Navigate to="/agents/trace" replace />} />
            <Route path="proto" element={<Navigate to="/agents/proto" replace />} />
            <Route path="jobs">
              <Route index element={<Suspense fallback={<PageLoader />}><JobsListPage /></Suspense>} />
              <Route path="new" element={<Navigate to="/agents/scribe" replace />} />
              <Route
                path=":id"
                element={
                  <ErrorBoundary fallbackPath="/dashboard/jobs" fallbackLabel="Jobs">
                    <Suspense fallback={<PageLoader />}><JobDetailPage /></Suspense>
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
            <Route path="knowledge" element={<Suspense fallback={<PageLoader />}><DashboardRAGPage /></Suspense>} />
            <Route path="logs" element={<Suspense fallback={<PageLoader />}><LogsPage /></Suspense>} />
            <Route path="settings">
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Suspense fallback={<PageLoader />}><DashboardSettingsProfilePage /></Suspense>} />
              <Route path="workspace" element={<Suspense fallback={<PageLoader />}><DashboardSettingsWorkspacePage /></Suspense>} />
              <Route path="api-keys" element={<Suspense fallback={<PageLoader />}><DashboardSettingsApiKeysPage /></Suspense>} />
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
                    <Suspense fallback={<PageLoader />}><DashboardSettingsBillingPage /></Suspense>
                  </RequireRole>
                }
              />
              <Route path="notifications" element={<Suspense fallback={<PageLoader />}><DashboardSettingsNotificationsPage /></Suspense>} />
            </Route>
          </Route>

          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <MarketplaceAppShell />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="onboarding" replace />} />
            <Route path="onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>} />
            <Route path="jobs" element={<Suspense fallback={<PageLoader />}><MarketplaceJobsPage /></Suspense>} />
            <Route path="matches" element={<Suspense fallback={<PageLoader />}><MatchesPage /></Suspense>} />
            <Route path="proposals" element={<Suspense fallback={<PageLoader />}><ProposalsPage /></Suspense>} />
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
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
