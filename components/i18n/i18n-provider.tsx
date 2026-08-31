"use client";

import { createContext, useContext, useMemo } from "react";
import { en, type MessageKey } from "@/lib/i18n/en";
import { interpolate } from "@/lib/i18n/core";

type I18nContextValue = {
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({
      t: (key, vars) => interpolate(en[key], vars),
    }),
    [],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
