"use client";

import { Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function DataModeBanner({
  demoMessage = "Demo mode — this record is not saved permanently. Connect Supabase to persist it (see README).",
}: {
  demoMessage?: string;
}) {
  // When the database is connected there's nothing worth saying — and
  // naming the backend to customers leaks how the platform is built.
  // Only the developer-facing demo notice is ever shown.
  if (isSupabaseConfigured) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2",
        "bg-amber-50 text-amber-700"
      )}
    >
      <Database size={14} />
      {demoMessage}
    </div>
  );
}
