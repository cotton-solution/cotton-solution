import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const REMEMBER_ME_KEY = "bem_remember_me";

/** Call before signIn/signUp to control whether the session survives a
 *  browser restart (localStorage) or only the current tab (sessionStorage). */
export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "true" : "false");
}

function rememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMEMBER_ME_KEY) !== "false";
}

// Routes auth session storage to localStorage (persists across browser
// restarts) or sessionStorage (cleared when the tab/browser closes),
// based on the "Remember me" checkbox at sign-in time.
const authStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    if (rememberMeEnabled()) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

// `supabase` is null until NEXT_PUBLIC_SUPABASE_URL and
// NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local. Every data-access
// helper checks `isSupabaseConfigured` first and falls back to in-memory
// mock data, so the app keeps working as a demo before you connect a
// real project.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: { storage: authStorage },
    })
  : null;
