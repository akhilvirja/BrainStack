import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-charcoal tracking-tight">Settings</h1>
        <p className="text-xs text-on-surface-variant mt-1">Manage your workspace account preferences.</p>
      </div>

      <div className="bg-white border border-stone-border rounded-2xl p-6 shadow-xs flex flex-col gap-5">
        <h2 className="font-headline font-semibold text-sm text-charcoal-text pb-3 border-b border-warm-stone">
          Account Profile
        </h2>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#edf3f0] border border-[#d6e5de] text-primary flex items-center justify-center font-bold text-lg uppercase">
            {user?.username?.substring(0, 2) || 'U'}
          </div>
          <div>
            <h3 className="font-headline font-bold text-base text-charcoal">{user?.username || 'User'}</h3>
            <p className="text-xs text-on-surface-variant">{user?.email || 'user@company.com'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
              <User size={14} className="text-primary" /> Username
            </span>
            <input
              readOnly
              value={user?.username || ''}
              className="bg-surface-container-low px-3 py-2 rounded-xl text-xs text-on-surface border border-stone-border focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-charcoal flex items-center gap-1.5">
              <Mail size={14} className="text-primary" /> Email Address
            </span>
            <input
              readOnly
              value={user?.email || ''}
              className="bg-surface-container-low px-3 py-2 rounded-xl text-xs text-on-surface border border-stone-border focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-border rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="font-headline font-semibold text-sm text-charcoal-text flex items-center gap-1.5">
            <Shield size={16} className="text-primary" /> Security & Session
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Sign out of your current session on this device.</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2 bg-error-container text-error hover:bg-error-container/70 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
