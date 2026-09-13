import { supabase } from "@/lib/supabase/client";

export type PageSlug = "about-us" | "privacy-policy" | "disclaimer" | "terms-conditions";

export type PageContent = {
  slug: PageSlug;
  title: string;
  content: string;
  updatedAt: string;
};

type PageContentRow = {
  slug: PageSlug;
  title: string;
  content: string;
  updated_at: string;
};

const DEFAULT_TITLES: Record<PageSlug, string> = {
  "about-us": "About Us",
  "privacy-policy": "Privacy Policy",
  disclaimer: "Disclaimer",
  "terms-conditions": "Terms & Conditions",
};

export const PAGE_SLUGS: PageSlug[] = [
  "about-us",
  "privacy-policy",
  "disclaimer",
  "terms-conditions",
];

function rowToPage(row: PageContentRow): PageContent {
  return { slug: row.slug, title: row.title, content: row.content, updatedAt: row.updated_at };
}

export async function fetchAllPagesContent(): Promise<PageContent[]> {
  if (!supabase) {
    return PAGE_SLUGS.map((slug) => ({
      slug,
      title: DEFAULT_TITLES[slug],
      content: "",
      updatedAt: new Date().toISOString(),
    }));
  }
  const { data, error } = await supabase
    .from("page_content")
    .select("slug, title, content, updated_at");
  if (error || !data) return [];
  const rows = (data as PageContentRow[]).map(rowToPage);
  // Ensure every slug is represented, even if a row hasn't been seeded yet.
  return PAGE_SLUGS.map(
    (slug) =>
      rows.find((r) => r.slug === slug) ?? {
        slug,
        title: DEFAULT_TITLES[slug],
        content: "",
        updatedAt: new Date().toISOString(),
      }
  );
}

export async function updatePageContent(
  slug: PageSlug,
  updates: { title?: string; content?: string }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("page_content")
    .update({
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.content !== undefined ? { content: updates.content } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  return { error: error?.message ?? null };
}
