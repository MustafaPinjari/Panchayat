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

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/') {
      navigate('/');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Don't show sidebar/bottom nav on login page
  if (location.pathname === '/') {
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
