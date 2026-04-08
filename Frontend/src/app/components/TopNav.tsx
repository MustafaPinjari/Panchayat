import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { api } from '../../services/api';

interface TopNavProps {
  title: string;
  showSearch?: boolean;
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
}

interface Notification {
  id: string;
  read_status: boolean;
}

export function TopNav({ title, showSearch = false, onMenuClick, onSearch }: TopNavProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Notification[]>('/api/notifications/')
      .then((data) => {
        setUnreadCount(data.filter((n) => !n.read_status).length);
      })
      .catch(() => {
        // silently ignore — badge just won't show
      });
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60"
      style={{ background: 'rgba(240, 244, 248, 0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  className="pl-9 w-64"
                  onChange={(e) => onSearch?.(e.target.value)}
                />
              </div>
            </div>
          )}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileSearch((prev) => !prev)}
              aria-label="Toggle search"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {showSearch && showMobileSearch && (
        <div className="md:hidden px-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search complaints..."
              className="pl-9 w-full"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileSearch(false)}
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
    </header>
  );
}
