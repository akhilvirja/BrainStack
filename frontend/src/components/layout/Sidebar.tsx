import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  Layers, 
  Search, 
  FileText, 
  Hash, 
  PlaySquare, 
  FileBox, 
  Link2, 
  Tag, 
  Settings, 
  ChevronDown 
} from 'lucide-react';

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
        flex items-center px-3.5 py-2 rounded-xl text-sm transition-all
        ${isActive 
          ? 'bg-sage-light text-sage-dark border border-sage/30 font-semibold' 
          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-transparent'}
      `}
    >
      {({ isActive }) => (
        <>
          <span className={`mr-2.5 flex items-center justify-center ${isActive ? 'text-sage-dark' : 'text-on-surface-variant/80'}`}>
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-warm-stone z-40 flex flex-col pt-6 pb-6">
      {/* Brand */}
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sage-dark to-sage flex items-center justify-center shadow-sm text-white">
          <Layers size={18} strokeWidth={2.5} />
        </div>
        <span className="font-headline text-lg font-bold text-on-surface tracking-tight">Brain Stack</span>
      </div>

      {/* Global Search Quick Access */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest rounded-xl border border-stone-border focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20 transition-all">
          <Search size={18} className="text-outline" />
          <input 
            className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none" 
            placeholder="Search stack..." 
            type="text" 
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
        <NavItem to="/dashboard" icon={<FileText size={20} />} label="All Notes" />
        <NavItem to="/tweets" icon={<Hash size={20} />} label="Tweets" />
        <NavItem to="/videos" icon={<PlaySquare size={20} />} label="Videos" />
        <NavItem to="/documents" icon={<FileBox size={20} />} label="Documents" />
        <NavItem to="/links" icon={<Link2 size={20} />} label="Links" />
        <NavItem to="/tags" icon={<Tag size={20} />} label="Tags" />
        
        <div className="my-2 mx-2 h-px bg-warm-stone"></div>
        <NavItem to="/settings" icon={<Settings size={20} />} label="Settings" />
      </nav>

      {/* User Profile Mini */}
      <div className="px-4 pt-2">
        <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-stone-border flex items-center justify-between shadow-xs hover:bg-surface-container transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sage-light border border-sage text-sage flex items-center justify-center font-bold text-xs uppercase">
              {user?.username?.substring(0, 2) || 'U'}
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-on-surface truncate w-24">{user?.username || 'User'}</p>
              <p className="text-[11px] text-on-surface-variant truncate w-24">Personal Stack</p>
            </div>
          </div>
          <ChevronDown size={18} className="text-outline" />
        </div>
      </div>
    </aside>
  );
};
