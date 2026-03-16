import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import { DashboardLayout } from './components/layout';
import { ProtectedRoute } from './app/RouteGuards';
import { AuthProvider } from './contexts/AuthContext';
import { useI18n } from './i18n/useI18n';
import { ToastContainer } from './components/ui/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

// Auth pages — lazy
const LoginEmail = lazy(() => import('./pages/auth/LoginEmail'));
const LoginPassword = lazy(() => import('./pages/auth/LoginPassword'));
const SignupEmail = lazy(() => import('./pages/auth/SignupEmail'));
const SignupPassword = lazy(() => import('./pages/auth/SignupPassword'));
const SignupVerifyEmail = lazy(() => import('./pages/auth/SignupVerifyEmail'));
const WelcomeBeta = lazy(() => import('./pages/auth/WelcomeBeta'));
const PrivacyConsent = lazy(() => import('./pages/auth/PrivacyConsent'));
const InviteAccept = lazy(() => import('./pages/auth/InviteAccept'));

// Legal pages
const LegalTermsPage = lazy(() => import('./pages/legal/LegalTermsPage'));
const LegalPrivacyPage = lazy(() => import('./pages/legal/LegalPrivacyPage'));

// Dashboard pages — lazy
const OverviewPage = lazy(() => import('./pages/dashboard/OverviewPage'));
const WorkflowsPage = lazy(() => import('./pages/dashboard/WorkflowsPage'));
const WorkflowDetailPage = lazy(() => import('./pages/dashboard/WorkflowDetailPage'));
const NewWorkflowPage = lazy(() => import('./pages/dashboard/NewWorkflowPage'));
const AgentsPage = lazy(() => import('./pages/dashboard/AgentsPage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));

const PageLoader = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2dd4a8] border-t-transparent" />
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
          {/* Root redirects to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Public Routes */}
          <Route element={<AppShell />}>
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

          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Suspense fallback={<PageLoader />}><OverviewPage /></Suspense>} />
            <Route path="workflows" element={<Suspense fallback={<PageLoader />}><WorkflowsPage /></Suspense>} />
            <Route path="workflows/new" element={<Suspense fallback={<PageLoader />}><NewWorkflowPage /></Suspense>} />
            <Route path="workflows/:id" element={<Suspense fallback={<PageLoader />}><WorkflowDetailPage /></Suspense>} />
            <Route path="agents" element={<Suspense fallback={<PageLoader />}><AgentsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>

          {/* Catch-all → dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <ToastContainer />
        <PWAInstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
