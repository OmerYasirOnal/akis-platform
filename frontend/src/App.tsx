import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './app/AppShell';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import NewJobPage from './pages/NewJobPage';
import BrandingPage from './pages/BrandingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/jobs"
              element={
                <RequireAuth>
                  <JobsListPage />
                </RequireAuth>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <RequireAuth>
                  <NewJobPage />
                </RequireAuth>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <RequireAuth>
                  <JobDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/branding"
              element={
                <RequireAuth>
                  <BrandingPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
