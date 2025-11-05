import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import JobsListPage from './pages/JobsListPage';
import JobDetailPage from './pages/JobDetailPage';
import NewJobPage from './pages/NewJobPage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/jobs" element={<JobsListPage />} />
          <Route path="/jobs/new" element={<NewJobPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
