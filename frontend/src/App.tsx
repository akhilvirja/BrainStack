import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthPage } from './pages/auth/AuthPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { TagsPage } from './pages/tags/TagsPage';
import { LandingPage } from './pages/landing/LandingPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { useAuthStore } from './store/useAuthStore';

const RootRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'font-body text-xs font-medium',
          style: {
            background: '#ffffff',
            color: '#1a1c1b',
            border: '1px solid #deded6',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: '0.75rem',
            padding: '10px 14px',
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
        {/* Public Root Route */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/welcome" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<AuthPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route path="register" element={<AuthPage />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardHome pageTitle="All Notes" />} />
          <Route path="/tweets" element={<DashboardHome filterType="tweet" pageTitle="Tweets & Threads" />} />
          <Route path="/videos" element={<DashboardHome filterType="video" pageTitle="Videos & Lectures" />} />
          <Route path="/documents" element={<DashboardHome filterType="document" pageTitle="Documents & Code" />} />
          <Route path="/links" element={<DashboardHome filterType="link" pageTitle="Links & Bookmarks" />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
