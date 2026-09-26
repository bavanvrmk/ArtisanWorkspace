import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/client";

const STORAGE_KEY = "artisan.auth";

export type AuthUser = {
  token: string;
  userId: number;
  username: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (username: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (username: string) => {
        const res = await authApi.login(username.trim());
        const next: AuthUser = {
          token: res.access_token,
          userId: res.user_id,
          username: username.trim(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
