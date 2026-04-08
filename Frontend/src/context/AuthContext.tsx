import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

export interface AuthUser {
  id: number;
  email: string;
  role: 'resident' | 'committee_member' | 'admin' | 'manager';
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

function userFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload.user_id) return null;
  return {
    id: payload.user_id as number,
    email: (payload.email as string) ?? '',
    role: (payload.role as AuthUser['role']) ?? 'resident',
    name: (payload.name as string) ?? '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('auth_access');
    return token ? userFromToken(token) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem('auth_access');
    localStorage.removeItem('auth_refresh');
    setUser(null);
  }, []);

  useEffect(() => {
    const handler = () => {
      toast.error('Session expired, please log in again.');
      logout();
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ access: string; refresh: string }>(
      '/api/users/login/',
      { email, password }
    );
    localStorage.setItem('auth_access', data.access);
    localStorage.setItem('auth_refresh', data.refresh);
    const decoded = userFromToken(data.access);
    setUser(decoded);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
