"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { destinationFromPath, modulesForUser } from "@/lib/modules";
import { effectiveModuleKeys } from "@/lib/team-data";
import { useBusiness } from "@/components/business-provider";

/**
 * Where am I, and how do I get back up. Resolved against the module
 * registry rather than by splitting the URL, so labels read the way
 * they do in the sidebar ("Cash Receiving Voucher", not
 * "cash-receiving-voucher").
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? "";
  const { business, isOwner, membership } = useBusiness();

  const modules = modulesForUser(business?.category, {
    isOwner,
    moduleKeys: membership ? effectiveModuleKeys(membership) : [],
  });

  if (pathname === "/") return null;
  const found = destinationFromPath(modules, pathname);
  if (!found) return null;

  const { module: mod, child } = found;
  // A dynamic report page (/accounts-reports/[slug]) isn't in the
  // registry — fall back to a readable version of the last segment.
  const tail =
    child?.label ??
    (pathname === mod.href
      ? null
      : titleise(pathname.split("/").filter(Boolean).pop() ?? ""));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[12.5px] text-slate-500"
    >
      <Link href="/" className="inline-flex items-center hover:text-slate-800">
        <Home size={13} />
        <span className="sr-only">Dashboard</span>
      </Link>
      <ChevronRight size={13} className="text-slate-300" />
      {tail ? (
        <>
          <Link href={mod.href} className="hover:text-slate-800">
            {mod.label}
          </Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="font-medium text-slate-700">{tail}</span>
        </>
      ) : (
        <span className="font-medium text-slate-700">{mod.label}</span>
      )}
    </nav>
  );
}

function titleise(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
