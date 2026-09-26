import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type AppMode = "direct" | "advanced";

const STORAGE = "artisan.mode";

type SettingsValue = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

const SettingsContext = createContext<SettingsValue | null>(null);

function loadMode(): AppMode {
  const saved = localStorage.getItem(STORAGE);
  return saved === "advanced" ? "advanced" : "direct";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(loadMode);
  const value = useMemo<SettingsValue>(
    () => ({
      mode,
      setMode: (next) => {
        localStorage.setItem(STORAGE, next);
        setModeState(next);
      },
    }),
    [mode],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
