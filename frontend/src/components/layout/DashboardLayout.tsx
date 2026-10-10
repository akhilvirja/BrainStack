import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuthStore } from '../../store/useAuthStore';

export const DashboardLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen antialiased">
      <Sidebar />
      <div className="pl-64">
        <TopBar />
        <main className="w-full pt-16 bg-surface min-h-screen">
          <div className="px-8 py-6 w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
