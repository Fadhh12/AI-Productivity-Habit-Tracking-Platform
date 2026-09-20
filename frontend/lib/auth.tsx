'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, clearTokens, setTokens } from './api';

export interface CurrentUser {
  id: string;
  email: string;
  timezone: string;
  proactiveInsights?: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, timezone: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiFetch<CurrentUser>('/api/users/me');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && localStorage.getItem('continuum_access_token');
    if (!hasToken) {
      setLoading(false);
      return;
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<{ accessToken: string; refreshToken: string; user: CurrentUser }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }), skipAuth: true },
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      router.push('/today');
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, timezone: string) => {
      const data = await apiFetch<{ accessToken: string; refreshToken: string; user: CurrentUser }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password, timezone }), skipAuth: true },
      );
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      router.push('/onboarding');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
