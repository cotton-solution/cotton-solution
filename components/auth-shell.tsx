"use client";

import type { ReactNode } from "react";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LoginCard } from "@/components/auth/login-card";

/**
 * LoginLayout — the shared shell for /login, /signup and /forgot-password.
 * Composes the brand panel (left, desktop-only) and the login card (right).
 * Public API (title, subtitle, children) is unchanged so existing pages
 * that import { AuthShell } keep working without any edits.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-5 py-10 sm:px-10">
      <div className="grid w-full max-w-[1200px] items-center gap-16 lg:grid-cols-[52%_48%]">
        <BrandPanel />
        <LoginCard title={title} subtitle={subtitle}>
          {children}
        </LoginCard>
      </div>
    </div>
  );
}
