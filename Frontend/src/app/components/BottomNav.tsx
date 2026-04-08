import React from 'react';
import { Link, useLocation } from 'react-router';
import { Home, MessageSquare, Bell, Settings, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/utils';
import { useAuth } from '../../context/AuthContext';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role ?? 'resident';

  const residentLinks = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/notifications', icon: Bell, label: 'Alerts' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/admin', icon: BarChart3, label: 'Analytics' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links = userRole === 'admin' ? adminLinks : residentLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <div key={link.to} className="relative min-w-0 flex-1">
              {isActive && (
                <motion.div
                  layoutId="bottomNavPill"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Link
                to={link.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'fill-current')} />
                <span className="text-[10px] font-medium truncate">{link.label}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
