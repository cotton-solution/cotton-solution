"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchMyBusiness, type Business } from "@/lib/supabase/businesses";
import { useAuth } from "@/components/auth-provider";

type BusinessContextValue = {
  business: Business | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setBusiness(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const b = await fetchMyBusiness();
    setBusiness(b);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BusinessContext.Provider value={{ business, loading, refresh }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within a BusinessProvider");
  return ctx;
}
