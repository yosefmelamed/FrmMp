'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser } from '@/lib/auth/api';

interface AuthState {
  user:        AuthUser | null;
  token:       string | null;
  loading:     boolean;
  login:       (email: string, password: string) => Promise<void>;
  logout:      () => Promise<void>;
  isAdmin:     boolean;
}

const AuthContext = createContext<AuthState | null>(null);

// Store access token in a JS-readable cookie so middleware can read it
// (NOT httpOnly — middleware needs to read it. The refresh token stays httpOnly.)
function setAccessCookie(token: string) {
  const maxAge = 15 * 60; // 15 minutes — matches JWT expiry
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `access_token=${token}; Max-Age=${maxAge}; Path=/${secure}; SameSite=Lax`;
}

function clearAccessCookie() {
  document.cookie = 'access_token=; Max-Age=0; Path=/';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setAuth = useCallback((accessToken: string, authUser: AuthUser) => {
    setToken(accessToken);
    setUser(authUser);
    setAccessCookie(accessToken); // keep cookie in sync for middleware
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    clearAccessCookie();
  }, []);

  // Schedule silent refresh 1 min before expiry (14 min from now)
  const scheduleRefresh = useCallback((tokenStr: string) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const res = await authApi.refresh();
        setAuth(res.accessToken, res.user);
        scheduleRefresh(res.accessToken);
      } catch {
        clearAuth();
      }
    }, 14 * 60 * 1000);
  }, [setAuth, clearAuth]);

  // On mount — try to restore session via refresh token cookie
  useEffect(() => {
    authApi.refresh()
      .then(res => {
        setAuth(res.accessToken, res.user);
        scheduleRefresh(res.accessToken);
      })
      .catch(() => { /* no session */ })
      .finally(() => setLoading(false));
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, [scheduleRefresh, setAuth]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAuth(res.accessToken, res.user);
    scheduleRefresh(res.accessToken);
  }, [scheduleRefresh, setAuth]);

  const logout = useCallback(async () => {
    if (token) await authApi.logout(token).catch(() => {});
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    clearAuth();
  }, [token, clearAuth]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}