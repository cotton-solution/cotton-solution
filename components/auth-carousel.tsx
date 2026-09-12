"use client";

import { useEffect, useState } from "react";
import { Scale, Handshake, BarChart3 } from "lucide-react";

const slides = [
  {
    icon: Scale,
    title: "Every bale weighed, every deal recorded",
    body: "Purchase and sale weighments sync straight to the ledger, so nothing gets counted twice.",
  },
  {
    icon: Handshake,
    title: "Contracts to invoices, without the paperwork",
    body: "Draft a purchase or sale contract, then turn it into an invoice in a click.",
  },
  {
    icon: BarChart3,
    title: "Books that close themselves",
    body: "Ledgers, trial balance, and party statements are ready the moment you need them.",
  },
];

export function AuthCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const Slide = slides[active];
  const Icon = Slide.icon;

  return (
    <div className="flex h-full flex-col justify-between p-10 xl:p-14">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2c0 6-4 8-4 13a4 4 0 0 0 8 0c0-5-4-7-4-13Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Bahar-e-Madina</p>
          <p className="text-xs text-emerald-100/80">Commission Agent</p>
        </div>
      </div>

      <div className="max-w-md">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
          <Icon size={24} />
        </div>
        <h2 className="text-2xl font-semibold text-white xl:text-[28px] xl:leading-snug">
          {Slide.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-50/80">
          {Slide.body}
        </p>

        <div className="mt-8 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "w-6 bg-white" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-emerald-100/60">
        Trusted by commission agents across the cotton trade &mdash; FY 2026-27
      </p>
    </div>
  );
}
