import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { Toaster } from './ui/sonner';
import { useAuth } from '../../context/AuthContext';

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
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(160deg, #eef2f7 0%, #f0f4f8 40%, #e8f0f8 100%)' }}>
      <AppSidebar />
      <div className="flex-1 min-w-0 flex flex-col pb-20 md:pb-0 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="w-full min-w-0 flex flex-col flex-1"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav />
      <Toaster position="top-center" richColors />
    </div>
  );
}
