"use client";

import { useBusiness } from "@/components/business-provider";

/**
 * The signed-in business's own identity (name + logo from
 * Settings → Company Profile). The platform's branding is never used
 * here — while the business record is still loading we simply show
 * nothing, and if no logo has been uploaded we show the business's
 * initials.
 */
export function useBusinessIdentity() {
  const { business, loading } = useBusiness();
  return {
    name: business?.name?.trim() || (loading ? "" : "My Business"),
    logoUrl: business?.logoUrl || null,
    loading,
  };
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function BusinessLogo({
  name,
  logoUrl,
  loading,
  className = "h-9 w-9 shrink-0 rounded-lg",
}: {
  name: string;
  logoUrl: string | null;
  loading?: boolean;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={name} className={`${className} object-cover`} />
    );
  }
  if (loading || !name) {
    return <div className={`${className} bg-slate-100 animate-pulse`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-brand-600 text-white text-[13px] font-semibold`}
    >
      {initialsOf(name)}
    </div>
  );
}
