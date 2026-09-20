"use client";

import type { ReactNode } from "react";
import { Sprout } from "lucide-react";
import { useSiteSettings } from "@/components/site-settings-provider";

export function LoginCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { settings } = useSiteSettings();
  const { logoUrl, siteName } = settings;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      {/* Mobile-only compact brand row — the full brand panel is hidden below lg */}
      <div className="mb-8 flex items-center gap-4 lg:hidden">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={siteName}
            className="h-20 w-20 rounded-[16px] object-cover border border-slate-200"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[16px] bg-green-800">
            <Sprout size={36} className="text-white" />
          </div>
        )}
        <span className="font-semibold text-slate-900">{siteName}</span>
      </div>

      <div className="auth-fade-up w-full max-w-[440px] rounded-[16px] border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] sm:p-10">
        <h2 className="text-center text-[28px] font-bold leading-9 text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm leading-5 text-slate-500">
            {subtitle}
          </p>
        )}

        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
