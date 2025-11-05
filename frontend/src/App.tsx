import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/jobs" element={<div>Jobs List Page</div>} />
          <Route path="/jobs/new" element={<div>New Job Page</div>} />
          <Route path="/jobs/:id" element={<div>Job Detail Page</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
