"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck, Sprout, TrendingUp, Users } from "lucide-react";
import { useSiteSettings } from "@/components/site-settings-provider";

const FALLBACK_FEATURES = [
  {
    icon: TrendingUp,
    title: "Live financial reports",
    body: "Ledgers, trial balance and P&L on demand",
  },
  {
    icon: Users,
    title: "Party master & ledgers",
    body: "Track every customer and vendor in one place",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "Your data stays in your own database",
  },
];

function BrandMark({ logoUrl, siteName }: { logoUrl: string | null; siteName: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={siteName}
        className="h-9 w-9 rounded-lg object-cover bg-white/10"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
      <Sprout size={18} />
    </div>
  );
}

/** Rotating slide panel for the left side of the auth screen. Uses the
 *  admin-configured slides if any exist, otherwise falls back to the
 *  built-in feature highlights so the page never looks empty. */
function SlidePanel() {
  const { slides } = useSiteSettings();
  const [active, setActive] = useState(0);
  const hasCustomSlides = slides.length > 0;
  const count = hasCustomSlides ? slides.length : FALLBACK_FEATURES.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count]);

  useEffect(() => {
    setActive(0);
  }, [hasCustomSlides]);

  if (hasCustomSlides) {
    const slide = slides[active];
    return (
      <div className="relative flex-1 min-h-0">
        {slides.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.id}
            src={s.imageUrl}
            alt={s.title ?? ""}
            className={`absolute inset-0 h-full w-full rounded-2xl object-cover transition-opacity duration-700 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {(slide.title || slide.caption) && (
          <div className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pt-16">
            {slide.title && (
              <p className="text-lg font-semibold text-white">{slide.title}</p>
            )}
            {slide.caption && (
              <p className="mt-1 text-sm text-white/80">{slide.caption}</p>
            )}
          </div>
        )}
        {count > 1 && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      {FALLBACK_FEATURES.map((f) => {
        const Icon = f.icon;
        return (
          <div key={f.title} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-brand-50/70">{f.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { settings } = useSiteSettings();
  const { logoUrl, siteName, tagline } = settings;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white p-10 xl:p-12 flex-col overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-2.5">
          <BrandMark logoUrl={logoUrl} siteName={siteName} />
          <span className="font-semibold">{siteName}</span>
        </div>

        <div className="relative flex flex-1 min-h-0 flex-col mt-8">
          <h1 className="text-3xl font-semibold leading-tight max-w-md">
            {tagline}
          </h1>

          <div className="flex-1 min-h-0 mt-8 flex flex-col">
            <SlidePanel />
          </div>
        </div>

        <p className="relative text-xs text-brand-50/60 mt-6">
          &copy; {new Date().getFullYear()} {siteName} Commission Agent
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={siteName}
                className="h-9 w-9 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sprout size={18} />
              </div>
            )}
            <span className="font-semibold text-slate-900">{siteName}</span>
          </div>

          <h2 className="text-xl font-semibold text-slate-900 text-center">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-slate-500 text-center mt-1.5">
              {subtitle}
            </p>
          )}

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
