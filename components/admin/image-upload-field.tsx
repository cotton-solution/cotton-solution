"use client";

import { useRef, useState } from "react";
import { ImagePlus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadSiteImage } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

export function ImageUploadField({
  label,
  hint,
  value,
  folder,
  onChange,
  shape = "square",
}: {
  label: string;
  hint?: string;
  value: string | null;
  folder: string;
  onChange: (url: string) => void;
  shape?: "square" | "circle" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const { url, error } = await uploadSiteImage(file, folder);
    setUploading(false);
    if (error) {
      setError(error);
      return;
    }
    if (url) onChange(url);
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center bg-slate-50 border border-slate-200 overflow-hidden shrink-0",
            shape === "circle" && "h-16 w-16 rounded-full",
            shape === "square" && "h-16 w-16 rounded-lg",
            shape === "wide" && "h-16 w-24 rounded-lg"
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <User size={22} className="text-slate-300" />
          )}
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3 text-xs"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus size={14} className="mr-1.5" />
            {uploading ? "Uploading…" : value ? "Change Image" : "Upload Photo"}
          </Button>
          {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </div>
      </div>
    </div>
  );
}
