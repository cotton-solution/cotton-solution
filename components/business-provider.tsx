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
import {
  fetchMyBusinessWithStatus,
  type Business,
} from "@/lib/supabase/businesses";
import { fetchMyMembership, type Membership } from "@/lib/supabase/team";
import { useAuth } from "@/components/auth-provider";

type BusinessContextValue = {
  business: Business | null;
  /** True for the business owner. False for a staff login (business_members). */
  isOwner: boolean;
  /** The signed-in staff login's role/module assignment, or null for the owner. */
  membership: Membership | null;
  loading: boolean;
  /** Why the business couldn't be loaded (connected mode only), else null. */
  error: string | null;
  refresh: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isOwner, setIsOwner] = useState(true);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      // Demo mode (or signed out): behave like a full-access owner, same
      // as before this module existed.
      setBusiness(null);
      setIsOwner(true);
      setMembership(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { business: b, error: loadError } = await fetchMyBusinessWithStatus();
    setBusiness(b);
    setError(loadError);

    const owner = !b || !user.id || b.ownerId === user.id;
    setIsOwner(owner);
    setMembership(owner ? null : await fetchMyMembership());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BusinessContext.Provider
      value={{ business, isOwner, membership, loading, error, refresh }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within a BusinessProvider");
  return ctx;
}
