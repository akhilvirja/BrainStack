import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Layers,
  Search,
  FileText,
  Hash,
  PlaySquare,
  FileCode,
  Link2,
  Tag,
  Settings,
  ChevronsUpDown,
  LogOut
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group
        ${isActive
          ? 'bg-primary text-white shadow-xs font-semibold'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}
      `}
    >
      {({ isActive }) => (
        <>
          <span className={`mr-2.5 flex items-center justify-center transition-colors ${isActive ? 'text-white' : 'text-on-surface-variant group-hover:text-on-surface'
            }`}>
            {icon}
          </span>
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-warm-stone z-40 flex flex-col pt-5 pb-5 select-none">
      {/* Brand Header */}
      <div className="px-5 mb-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-xs">
          <Layers size={18} strokeWidth={2.2} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-base tracking-tight text-spruce leading-tight">Brain Stack</span>
          <span className="font-label text-[10px] uppercase tracking-wider text-secondary font-semibold">WORKSPACE</span>
        </div>
      </div>

      {/* Global Search Box in Sidebar */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-xl border border-stone-border focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20 transition-all shadow-xs">
          <Search size={16} className="text-outline shrink-0" />
          <input
            className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
            placeholder="Search stack..."
            type="text"
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 flex flex-col gap-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={<FileText size={17} />} label="All Notes" />
        <NavItem to="/tweets" icon={<Hash size={17} />} label="Tweets" />
        <NavItem to="/videos" icon={<PlaySquare size={17} />} label="Videos" />
        <NavItem to="/documents" icon={<FileCode size={17} />} label="Documents" />
        <NavItem to="/links" icon={<Link2 size={17} />} label="Links" />
        <NavItem to="/tags" icon={<Tag size={17} />} label="Tags" />

        <div className="my-2 mx-2 h-px bg-warm-stone"></div>
        <NavItem to="/settings" icon={<Settings size={17} />} label="Settings" />
      </nav>

      {/* User Profile Footer Card */}
      <div className="px-3 pt-2 relative">
        {showMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-white border border-stone-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-2.5 py-1.5 text-xs text-on-surface-variant border-b border-warm-stone">
              Signed in as <span className="font-semibold text-charcoal">{user?.email || user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-error hover:bg-error-container/30 rounded-lg transition-colors font-medium cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <div
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-xl bg-surface-container-lowest border border-stone-border flex items-center justify-between shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#eaf2ee] border border-[#a8cfbd] text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.username?.substring(0, 2) || 'U'}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">{user?.username || 'Alex Rivera'}</p>
              <p className="text-[10px] text-on-surface-variant truncate">Personal Stack</p>
            </div>
          </div>
          <ChevronsUpDown size={15} className="text-outline shrink-0 ml-1" />
        </div>
      </div>
    </aside>
  );
};
