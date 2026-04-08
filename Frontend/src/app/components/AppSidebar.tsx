import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  Bell,
  Building2,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { cn } from './ui/utils';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './ui/button';

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const userRole = user?.role ?? 'resident';

  const residentLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/chat', icon: MessageSquare, label: 'Communication' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin', icon: BarChart3, label: 'Analytics' },
    { to: '/users', icon: Users, label: 'User Management' },
    { to: '/chat', icon: MessageSquare, label: 'Communication' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const managerLinks = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/manager', icon: ClipboardList, label: 'My Tasks' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links =
    userRole === 'admin' ? adminLinks :
    userRole === 'manager' ? managerLinks :
    residentLinks;

  const displayName = user?.name || (userRole === 'admin' ? 'Admin User' : 'Resident User');
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 overflow-hidden relative"
      style={{ background: 'linear-gradient(160deg, #0f1f35 0%, #1D3557 45%, #1a3a5c 100%)' }}
    >
      {/* Subtle glow orb */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2DE2E6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />

      <div className="relative p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2DE2E6, #3A6EA5)' }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight">Society Hub</h1>
            <p className="text-xs text-white/50 capitalize">
              {userRole === 'committee_member' ? 'Committee Member' : userRole === 'manager' ? 'Property Manager' : userRole}
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(45,226,230,0.25) 0%, rgba(58,110,165,0.35) 100%)',
                boxShadow: '0 0 0 1px rgba(45,226,230,0.3), 0 4px 12px rgba(45,226,230,0.15)',
              } : {}}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-accent' : 'text-white/50 group-hover:text-white/80')} />
              <span className="font-medium text-sm">{link.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className="relative p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner"
            style={{ background: 'linear-gradient(135deg, #2DE2E6, #3A6EA5)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-xs text-white/40 capitalize">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Sign Out</span>
        </Button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        confirmVariant="destructive"
        onConfirm={() => { logout(); navigate('/'); }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </aside>
  );
}
