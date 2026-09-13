import { supabase } from "@/lib/supabase/client";

export type SiteSettings = {
  websiteName: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  mainHeading: string | null;
  subHeading: string | null;
};

type SiteSettingsRow = {
  website_name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  main_heading: string | null;
  sub_heading: string | null;
};

const DEFAULT_SETTINGS: SiteSettings = {
  websiteName: "My Company",
  logoUrl: null,
  heroImageUrl: null,
  mainHeading: null,
  subHeading: null,
};

function rowToSettings(row: SiteSettingsRow): SiteSettings {
  return {
    websiteName: row.website_name,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    mainHeading: row.main_heading,
    subHeading: row.sub_heading,
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return DEFAULT_SETTINGS;
  const { data, error } = await supabase
    .from("site_settings")
    .select("website_name, logo_url, hero_image_url, main_heading, sub_heading")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return rowToSettings(data as SiteSettingsRow);
}

export async function updateSiteSettings(
  updates: Partial<SiteSettings>
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("site_settings")
    .update({
      ...(updates.websiteName !== undefined ? { website_name: updates.websiteName } : {}),
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
      ...(updates.heroImageUrl !== undefined ? { hero_image_url: updates.heroImageUrl } : {}),
      ...(updates.mainHeading !== undefined ? { main_heading: updates.mainHeading } : {}),
      ...(updates.subHeading !== undefined ? { sub_heading: updates.subHeading } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  return { error: error?.message ?? null };
}

export type HeroSlide = {
  id: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

type HeroSlideRow = {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
};

function rowToSlide(row: HeroSlideRow): HeroSlide {
  return { id: row.id, imageUrl: row.image_url, caption: row.caption, sortOrder: row.sort_order };
}

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("hero_slides")
    .select("id, image_url, caption, sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as HeroSlideRow[]).map(rowToSlide);
}

export async function addHeroSlide(
  imageUrl: string,
  caption: string,
  sortOrder: number
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("hero_slides")
    .insert({ image_url: imageUrl, caption, sort_order: sortOrder });
  return { error: error?.message ?? null };
}

export async function deleteHeroSlide(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  return { error: error?.message ?? null };
}
