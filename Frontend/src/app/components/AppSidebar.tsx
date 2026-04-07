import React from 'react';
import { Link, useLocation } from 'react-router';
import {
  Home,
  MessageSquare,
  BarChart3,
  Users,
  Settings,
  Bell,
  Building2,
} from 'lucide-react';
import { cn } from './ui/utils';

interface SidebarProps {
  userRole: 'resident' | 'committee' | 'admin';
}

export function AppSidebar({ userRole }: SidebarProps) {
  const location = useLocation();

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

  const links = userRole === 'admin' ? adminLinks : residentLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">Society Hub</h1>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {userRole === 'admin' ? 'AD' : 'RS'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userRole === 'admin' ? 'Admin User' : 'Resident User'}
            </p>
            <p className="text-xs text-muted-foreground">View Profile</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
