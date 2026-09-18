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
import { fetchMyMembership, type Membership } from "@/lib/supabase/team";
import { useAuth } from "@/components/auth-provider";

type BusinessContextValue = {
  business: Business | null;
  /** True for the business owner. False for a staff login (business_members). */
  isOwner: boolean;
  /** The signed-in staff login's role/module assignment, or null for the owner. */
  membership: Membership | null;
  loading: boolean;
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

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      // Demo mode (or signed out): behave like a full-access owner, same
      // as before this module existed.
      setBusiness(null);
      setIsOwner(true);
      setMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const b = await fetchMyBusiness();
    setBusiness(b);

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
      value={{ business, isOwner, membership, loading, refresh }}
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
