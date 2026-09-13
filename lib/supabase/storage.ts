import { supabase } from "@/lib/supabase/client";

const BUCKET = "site-assets";

/** Uploads an image to the public `site-assets` bucket and returns its public URL. */
export async function uploadSiteImage(
  file: File,
  folder: string
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: "Supabase is not configured." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) return { url: null, error: error.message };

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
