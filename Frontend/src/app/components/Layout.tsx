import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from './ui/sonner';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isPublicPage = location.pathname === '/' || location.pathname === '/login';

  useEffect(() => {
    if (!isAuthenticated && !isPublicPage) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, isPublicPage]);

  // Don't show sidebar/bottom nav on public pages
  if (isPublicPage) {
    return (
      <>
        <Outlet />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
