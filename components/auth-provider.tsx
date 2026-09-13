"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthUser = { email: string; name?: string } | null;

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    businessName: string
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_SESSION_KEY = "bem_demo_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        setUser(
          sessionUser
            ? {
                email: sessionUser.email ?? "",
                name: sessionUser.user_metadata?.full_name,
              }
            : null
        );
        setLoading(false);

        const { data: sub } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            const u = session?.user;
            setUser(
              u
                ? { email: u.email ?? "", name: u.user_metadata?.full_name }
                : null
            );
          }
        );
        unsubscribe = () => sub.subscription.unsubscribe();
      } else {
        try {
          const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
          setUser(raw ? JSON.parse(raw) : null);
        } catch {
          setUser(null);
        }
        setLoading(false);
      }
    }

    init();
    return () => unsubscribe?.();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error?.message ?? null };
    }
    // Demo mode: any email/password combination signs you in locally.
    const demoUser = { email };
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    return { error: null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      businessName: string
    ) => {
      if (isSupabaseConfigured && supabase) {
        // business_name flows into a Postgres trigger (see schema.sql)
        // that creates this signup's isolated "business" (tenant) row.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name, business_name: businessName } },
        });
        const needsEmailConfirmation = !data.session && !error;
        return { error: error?.message ?? null, needsEmailConfirmation };
      }
      const demoUser = { email, name };
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
    }
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error: error?.message ?? null };
    }
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
