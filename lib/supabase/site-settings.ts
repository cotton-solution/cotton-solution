import { supabase } from "@/lib/supabase/client";

export const DEFAULT_SITE_NAME = "Bahar-e-Madina";
export const DEFAULT_TAGLINE = "Run your commission business with confidence.";

export type SiteSettings = {
  logoUrl: string | null;
  siteName: string;
  tagline: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: null,
  siteName: DEFAULT_SITE_NAME,
  tagline: DEFAULT_TAGLINE,
};

export type SiteSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

type SiteSettingsRow = {
  logo_url: string | null;
  site_name: string;
  tagline: string;
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
    .select("logo_url, site_name, tagline")
    .maybeSingle();

  if (error || !data) return DEFAULT_SITE_SETTINGS;

  const row = data as SiteSettingsRow;
  return {
    logoUrl: row.logo_url,
    siteName: row.site_name || DEFAULT_SITE_NAME,
    tagline: row.tagline || DEFAULT_TAGLINE,
  };
}

/** Admin-only: update the site-wide branding. */
export async function updateSiteSettings(updates: {
  logoUrl?: string | null;
  siteName?: string;
  tagline?: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { error } = await supabase
    .from("site_settings")
    .update({
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
      ...(updates.siteName !== undefined ? { site_name: updates.siteName } : {}),
      ...(updates.tagline !== undefined ? { tagline: updates.tagline } : {}),
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
