"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SITE_SETTINGS,
  fetchSiteSettings,
  fetchSiteSlides,
  type SiteSettings,
  type SiteSlide,
} from "@/lib/supabase/site-settings";

type SiteSettingsContextValue = {
  settings: SiteSettings;
  slides: SiteSlide[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | undefined>(
  undefined
);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [slides, setSlides] = useState<SiteSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [nextSettings, nextSlides] = await Promise.all([
      fetchSiteSettings(),
      fetchSiteSlides(),
    ]);
    setSettings(nextSettings);
    setSlides(nextSlides);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SiteSettingsContext.Provider value={{ settings, slides, loading, refresh }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return ctx;
}
