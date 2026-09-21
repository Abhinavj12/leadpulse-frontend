"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "@/lib/api/auth";
import {
  getAccessToken,
  setAccessToken,
  setUnauthorizedHandler
} from "@/lib/api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const initialize = useCallback(async () => {
    try {
      // The refresh token is HttpOnly, so JavaScript cannot read it.
      // Calling refresh is the correct way to restore an existing session.
      const data = await authApi.refresh();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        const currentUser = await authApi.me();
        setUser(currentUser);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    initialize();

    return () => setUnauthorizedHandler(null);
  }, [initialize, clearSession]);

  const login = useCallback(async (payload) => {
    const data = await authApi.login(payload);
    if (!data?.accessToken || !data?.user) {
      throw new Error("Invalid login response from the server.");
    }
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getAccessToken()) {
        await authApi.logout();
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshSession: initialize
    }),
    [user, loading, login, logout, initialize]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
