"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShieldCheck, Sprout, UsersRound } from "lucide-react";
import { useSiteSettings } from "@/components/site-settings-provider";
import { CottonMotif } from "@/components/auth/cotton-motif";
import { FeatureCard } from "@/components/auth/feature-card";

const FALLBACK_FEATURES = [
  {
    icon: BarChart3,
    title: "Live financial reports",
    description: "Ledgers, trial balance and P&L on demand.",
  },
  {
    icon: UsersRound,
    title: "Party master & ledgers",
    description: "Track every customer and vendor in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Your business data stays protected in your own database.",
  },
];

function BrandMark({
  logoUrl,
  siteName,
}: {
  logoUrl: string | null;
  siteName: string;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={siteName}
        className="h-10 w-10 rounded-[10px] object-cover border border-slate-200"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-green-800">
      <Sprout size={18} className="text-white" />
    </div>
  );
}

/**
 * Rotating image slides for admin-configured promo content. Kept fully
 * functional (same data source, same behavior) — only restyled to match
 * the new light, card-based brand panel instead of a dark overlay block.
 */
function SlidePanel({ slides }: { slides: ReturnType<typeof useSiteSettings>["slides"] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const slide = slides[active];

  return (
    <div className="relative mt-10 h-64 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]">
      {slides.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.id}
          src={s.imageUrl}
          alt={s.title ?? ""}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {(slide.title || slide.caption) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5 pt-14">
          {slide.title && (
            <p className="text-base font-semibold text-white">{slide.title}</p>
          )}
          {slide.caption && (
            <p className="mt-1 text-sm text-white/80">{slide.caption}</p>
          )}
        </div>
      )}
      {slides.length > 1 && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all duration-150 ease-out ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function BrandPanel() {
  const { settings, slides } = useSiteSettings();
  const { logoUrl, siteName, tagline } = settings;
  const hasCustomSlides = slides.length > 0;

  return (
    <div className="relative hidden h-full flex-col lg:flex">
      {/* subtle decorative cotton/botanical mark, low-contrast corner accent */}
      <CottonMotif className="pointer-events-none absolute -right-4 top-0 h-40 w-40 opacity-70" />

      <div className="relative flex items-center gap-2.5 auth-fade-up">
        <BrandMark logoUrl={logoUrl} siteName={siteName} />
        <div>
          <p className="font-semibold leading-5 text-slate-900">{siteName}</p>
          <p className="text-xs font-medium leading-4 text-slate-500">
            Commission Management
          </p>
        </div>
      </div>

      <h1 className="relative mt-10 max-w-md text-[40px] font-bold leading-[48px] tracking-tight text-slate-900 auth-fade-up">
        {tagline}
      </h1>

      {hasCustomSlides ? (
        <SlidePanel slides={slides} />
      ) : (
        <div className="relative mt-10 space-y-4 auth-fade-up-delayed">
          {FALLBACK_FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      )}

      <p className="relative mt-auto pt-10 text-xs text-slate-400">
        &copy; {new Date().getFullYear()} {siteName} Commission Agent
      </p>
    </div>
  );
}
