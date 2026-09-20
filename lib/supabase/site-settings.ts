import { supabase } from "@/lib/supabase/client";

export const DEFAULT_SITE_NAME = "HisaabDesk";
export const DEFAULT_TAGLINE =
  "Manage parties, ledgers, commissions and financial reports — all in one place.";

export const DEFAULT_BRAND_SUBTITLE = "Online Accounts Management Software";
export const DEFAULT_LOGIN_TITLE = "Welcome back !";
export const DEFAULT_LOGIN_SUBTITLE = "Sign in to your {siteName} account.";
export const DEFAULT_COPYRIGHT_TEXT = "© {year} {siteName} - All Rights Reserve";

export type SiteSettings = {
  logoUrl: string | null;
  siteName: string;
  tagline: string;
  /** Small line shown under the website name. Empty = hidden. */
  brandSubtitle: string;
  /** Heading on the login card. */
  loginTitle: string;
  /** Line under the login heading. Empty = hidden. */
  loginSubtitle: string;
  /** Footer line on the login page. Empty = hidden. */
  copyrightText: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: null,
  siteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
  brandSubtitle: DEFAULT_BRAND_SUBTITLE,
  loginTitle: DEFAULT_LOGIN_TITLE,
  loginSubtitle: DEFAULT_LOGIN_SUBTITLE,
  copyrightText: DEFAULT_COPYRIGHT_TEXT,
};

/** Replaces {siteName} and {year} inside admin-written text. */
export function fillSiteText(text: string, siteName: string): string {
  return text
    .replace(/\{siteName\}/g, siteName)
    .replace(/\{year\}/g, String(new Date().getFullYear()));
}

export type SiteSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

// The four text columns come from migration_10; they are optional here so
// the site keeps working (with defaults) until that migration is run.
type SiteSettingsRow = {
  logo_url: string | null;
  site_name: string;
  tagline: string;
  brand_subtitle?: string | null;
  login_title?: string | null;
  login_subtitle?: string | null;
  copyright_text?: string | null;
};

type SiteSlideRow = {
  id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

function rowToSlide(row: SiteSlideRow): SiteSlide {
  return {
    id: row.id,
    imageUrl: row.image_url,
    title: row.title,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

/** Public: the site-wide branding (logo, name, tagline). Falls back to
 *  the built-in defaults if Supabase isn't connected yet. */
export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULT_SITE_SETTINGS;

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_SETTINGS;

  const row = data as SiteSettingsRow;
  return {
    logoUrl: row.logo_url,
    siteName: row.site_name || DEFAULT_SITE_NAME,
    tagline: row.tagline || DEFAULT_TAGLINE,
    brandSubtitle: row.brand_subtitle ?? DEFAULT_BRAND_SUBTITLE,
    loginTitle: row.login_title || DEFAULT_LOGIN_TITLE,
    loginSubtitle: row.login_subtitle ?? DEFAULT_LOGIN_SUBTITLE,
    copyrightText: row.copyright_text ?? DEFAULT_COPYRIGHT_TEXT,
  };
}

/** Admin-only: update the site-wide branding. */
export async function updateSiteSettings(updates: {
  logoUrl?: string | null;
  siteName?: string;
  tagline?: string;
  brandSubtitle?: string;
  loginTitle?: string;
  loginSubtitle?: string;
  copyrightText?: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("site_settings")
    .update({
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
      ...(updates.siteName !== undefined ? { site_name: updates.siteName } : {}),
      ...(updates.tagline !== undefined ? { tagline: updates.tagline } : {}),
      ...(updates.brandSubtitle !== undefined
        ? { brand_subtitle: updates.brandSubtitle }
        : {}),
      ...(updates.loginTitle !== undefined
        ? { login_title: updates.loginTitle }
        : {}),
      ...(updates.loginSubtitle !== undefined
        ? { login_subtitle: updates.loginSubtitle }
        : {}),
      ...(updates.copyrightText !== undefined
        ? { copyright_text: updates.copyrightText }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  return { error: error?.message ?? null };
}

/** Public: the login-page slides, in display order. */
export async function fetchSiteSlides(): Promise<SiteSlide[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("site_slides")
    .select("id, image_url, title, caption, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as SiteSlideRow[]).map(rowToSlide);
}

/** Admin-only: add a new slide. */
export async function addSiteSlide(
  imageUrl: string,
  title?: string | null,
  caption?: string | null
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { data, error } = await supabase
    .from("site_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = error || !data ? 0 : (data as { sort_order: number }).sort_order + 1;

  const { error: insertError } = await supabase.from("site_slides").insert({
    image_url: imageUrl,
    title: title || null,
    caption: caption || null,
    sort_order: nextOrder,
  });

  return { error: insertError?.message ?? null };
}

/** Admin-only: edit a slide's image, title and/or caption. */
export async function updateSiteSlide(
  id: string,
  updates: { imageUrl?: string; title?: string | null; caption?: string | null }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("site_slides")
    .update({
      ...(updates.imageUrl !== undefined ? { image_url: updates.imageUrl } : {}),
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.caption !== undefined ? { caption: updates.caption } : {}),
    })
    .eq("id", id);

  return { error: error?.message ?? null };
}

/** Admin-only: remove a slide. */
export async function deleteSiteSlide(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("site_slides").delete().eq("id", id);
  return { error: error?.message ?? null };
}

/**
 * Admin-only: upload an image (logo or slide) to the public
 * "site-assets" storage bucket and return its public URL.
 */
export async function uploadSiteImage(
  file: File,
  folder: "logo" | "slides"
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: "Supabase is not configured." };

  const ext = file.name.split(".").pop() || "png";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
