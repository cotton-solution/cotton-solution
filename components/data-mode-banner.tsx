"use client";

import { Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export function DataModeBanner({
  demoMessage = "Demo mode — this record is not saved permanently. Connect Supabase to persist it (see README).",
  connectedMessage = "Connected to Supabase — this record will be saved to your database.",
}: {
  demoMessage?: string;
  connectedMessage?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2",
        isSupabaseConfigured
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      )}
    >
      <Database size={14} />
      {isSupabaseConfigured ? connectedMessage : demoMessage}
    </div>
  );
}
