import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from './ui/sonner';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<'resident' | 'committee' | 'admin'>('resident');

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as 'resident' | 'committee' | 'admin';
    if (!storedRole && location.pathname !== '/') {
      navigate('/');
    } else if (storedRole) {
      setUserRole(storedRole);
    }
  }, [navigate, location.pathname]);

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
      <AppSidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
      <BottomNav userRole={userRole} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
