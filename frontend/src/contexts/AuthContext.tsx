'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, orgApi, Organisation, AuthResponse } from '@/lib/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  organisationId: string;
}

interface AuthContextValue {
  user: User | null;
  org: Organisation | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organisation | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrg = useCallback(async () => {
    try {
      const res = await orgApi.getMe();
      setOrg(res.data);
    } catch {
      // org load failure is non-fatal
    }
  }, []);

  const applyAuthResponse = useCallback(
    (data: AuthResponse) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);

      // Use user from response; fall back to decoding JWT payload
      let userData = data.user;
      if (!userData) {
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          userData = { id: payload.sub, email: '', displayName: '', organisationId: payload.orgId };
        } catch {
          // If JWT decode fails, leave user null — dashboard guard will redirect
        }
      }
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      // Load org in background — don't block the auth flow
      loadOrg();
    },
    [loadOrg]
  );

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setAccessToken(token);
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === 'object') {
          setUser(parsed);
        } else {
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('user');
      }
      loadOrg().finally(() => setIsLoading(false));
    } else if (refreshToken) {
      authApi
        .refresh(refreshToken)
        .then(async (res) => {
          localStorage.setItem('accessToken', res.data.accessToken);
          if (res.data.refreshToken) localStorage.setItem('refreshToken', res.data.refreshToken);
          setAccessToken(res.data.accessToken);
          await loadOrg();
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadOrg]);

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      applyAuthResponse(res.data);
    },
    [applyAuthResponse]
  );

  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await authApi.signup({ email, password, displayName });
      applyAuthResponse(res.data);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // ignore logout errors
      }
    }
    localStorage.clear();
    setUser(null);
    setOrg(null);
    setAccessToken(null);
  }, []);

  const refreshOrg = useCallback(async () => {
    await loadOrg();
  }, [loadOrg]);

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        signup,
        logout,
        refreshOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
