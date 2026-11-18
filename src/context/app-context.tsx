"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getDataProvider } from "@/services";
import type { DataProvider } from "@/services/data-provider";
import type { SessionUser } from "@/types/domain";

interface AppContextValue {
  provider: DataProvider;
  session: SessionUser | null;
  loadingSession: boolean;
  revision: number;
  refreshSession: () => Promise<SessionUser | null>;
  login: (email: string, senha: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  resetDemo: () => Promise<void>;
  notifyMutation: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const provider = useMemo(() => getDataProvider(), []);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [revision, setRevision] = useState(0);

  const refreshSession = useCallback(async () => {
    const current = await provider.getCurrentSession();
    setSession(current);
    setLoadingSession(false);
    return current;
  }, [provider]);

  useEffect(() => {
    let active = true;
    provider.getCurrentSession().then((current) => {
      if (!active) return;
      setSession(current);
      setLoadingSession(false);
    });
    return () => {
      active = false;
    };
  }, [provider]);

  const login = useCallback(
    async (email: string, senha: string) => {
      const nextSession = await provider.login(email, senha);
      setSession(nextSession);
      setRevision((r) => r + 1);
      return nextSession;
    },
    [provider]
  );

  const logout = useCallback(async () => {
    await provider.logout();
    setSession(null);
    setRevision((r) => r + 1);
  }, [provider]);

  const resetDemo = useCallback(async () => {
    await provider.resetDemoState();
    setSession(null);
    setRevision((r) => r + 1);
  }, [provider]);

  const notifyMutation = useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      provider,
      session,
      loadingSession,
      revision,
      refreshSession,
      login,
      logout,
      resetDemo,
      notifyMutation,
    }),
    [
      provider,
      session,
      loadingSession,
      revision,
      refreshSession,
      login,
      logout,
      resetDemo,
      notifyMutation,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp deve ser utilizado dentro de AppProvider.");
  }
  return ctx;
}
