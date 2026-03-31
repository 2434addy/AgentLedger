'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi, orgApi, Organisation, AuthResponse, setAccessToken, getAccessToken } from '@/lib/api';

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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

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
      // Store token in memory only — never localStorage
      setAccessToken(data.accessToken);
      setAccessTokenState(data.accessToken);

      let userData = data.user;
      if (!userData) {
        try {
          const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
          userData = { id: payload.sub, email: '', displayName: '', organisationId: payload.orgId };
        } catch {
          // If JWT decode fails, leave user null
        }
      }
      if (userData) {
        setUser(userData);
      }
      loadOrg();
    },
    [loadOrg]
  );

  // On mount: attempt silent refresh via httpOnly cookie
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    authApi
      .refresh()
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setAccessTokenState(res.data.accessToken);
        if (res.data.user) {
          setUser(res.data.user);
        }
        return loadOrg();
      })
      .catch(() => {
        // No valid session — user needs to log in
        setAccessToken(null);
        setAccessTokenState(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, [loadOrg]);

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
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
    setOrg(null);
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
