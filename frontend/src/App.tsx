import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthPage } from './pages/auth/AuthPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'font-body text-sm',
          style: {
            background: '#f9f9f6',
            color: '#1a1c1b',
            border: '1px solid #deded6',
          },
          success: {
            iconTheme: {
              primary: '#52796f',
              secondary: '#fff',
            },
          },
        }} 
      />
      <Routes>
        {/* Public / Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<AuthPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="tweets" element={<div>Tweets Page</div>} />
          <Route path="videos" element={<div>Videos Page</div>} />
          <Route path="documents" element={<div>Documents Page</div>} />
          <Route path="links" element={<div>Links Page</div>} />
          <Route path="tags" element={<div>Tags Page</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
