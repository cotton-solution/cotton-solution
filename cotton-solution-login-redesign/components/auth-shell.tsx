"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  ShieldCheck,
  Sprout,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useSiteSettings } from "@/components/site-settings-provider";

const FALLBACK_FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: BarChart3,
    title: "Live financial reports",
    body: "Ledgers, trial balance and P&L on demand.",
  },
  {
    icon: UsersRound,
    title: "Party master & ledgers",
    body: "Track every customer and vendor in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    body: "Your business data stays protected in your own database.",
  },
];

function BrandMark({
  logoUrl,
  siteName,
  tone = "dark",
}: {
  logoUrl: string | null;
  siteName: string;
  tone?: "dark" | "light";
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={siteName}
        className="h-9 w-9 rounded-[10px] object-cover"
      />
    );
  }
  return (
    <div
      className={
        tone === "dark"
          ? "flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--auth-primary-800)] text-white"
          : "flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--auth-primary-100)] text-[var(--auth-primary-800)]"
      }
    >
      <Sprout size={18} />
    </div>
  );
}

/** Faint cotton-boll / botanical geometry used purely as background texture.
 *  Kept low-contrast and decorative — never competes with the content. */
function CottonMotif() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 520 520"
      className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] opacity-[0.06]"
    >
      <g fill="none" stroke="#166534" strokeWidth="1.5">
        <circle cx="260" cy="120" r="46" />
        <circle cx="190" cy="180" r="46" />
        <circle cx="330" cy="180" r="46" />
        <circle cx="260" cy="230" r="46" />
        <path d="M260 260 L260 420" />
        <path d="M260 320 C 220 320 190 350 180 390" />
        <path d="M260 350 C 300 350 330 380 340 420" />
      </g>
      <g fill="#D97706" opacity="0.5">
        <circle cx="150" cy="360" r="4" />
        <circle cx="120" cy="400" r="3" />
        <circle cx="380" cy="380" r="4" />
      </g>
    </svg>
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
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--auth-border)] shadow-auth-card">
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 pt-16">
            {slide.title && (
              <p className="text-lg font-semibold text-white">{slide.title}</p>
            )}
            {slide.caption && (
              <p className="mt-1 text-sm text-white/80">{slide.caption}</p>
            )}
          </div>
        )}
        {count > 1 && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      {FALLBACK_FEATURES.map((f) => {
        const Icon = f.icon;
        return (
          <div
            key={f.title}
            className="flex items-start gap-3 rounded-xl border border-[var(--auth-border)] bg-[var(--auth-surface)] p-4 shadow-auth-card transition-shadow duration-200 hover:shadow-auth-card-hover"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--auth-primary-50)] text-[var(--auth-primary-800)]">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--auth-text-primary)]">
                {f.title}
              </p>
              <p className="mt-0.5 text-sm text-[var(--auth-text-secondary)]">
                {f.body}
              </p>
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--auth-background)] px-4 py-10 sm:px-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Left brand / feature panel */}
        <div className="relative hidden flex-col lg:flex lg:w-[52%]">
          <CottonMotif />

          <div className="relative flex items-center gap-2.5">
            <BrandMark logoUrl={logoUrl} siteName={siteName} />
            <span className="text-lg font-semibold text-[var(--auth-text-primary)]">
              {siteName}
            </span>
          </div>

          <h1 className="relative mt-8 max-w-md text-[40px] font-bold leading-[48px] text-[var(--auth-text-primary)]">
            {tagline}
          </h1>

          <div className="relative mt-8 flex min-h-0 flex-1 flex-col">
            <SlidePanel />
          </div>

          <p className="relative mt-6 text-xs text-[var(--auth-text-muted)]">
            &copy; {new Date().getFullYear()} {siteName} Commission Agent
          </p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[440px] rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] p-6 shadow-auth-card sm:p-8 lg:p-10">
            <div className="mb-7 flex items-center justify-center gap-2 lg:hidden">
              <BrandMark logoUrl={logoUrl} siteName={siteName} tone="light" />
              <span className="font-semibold text-[var(--auth-text-primary)]">
                {siteName}
              </span>
            </div>

            <h2 className="text-center text-[28px] font-bold leading-9 text-[var(--auth-text-primary)]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1.5 text-center text-sm text-[var(--auth-text-secondary)]">
                {subtitle}
              </p>
            )}

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
