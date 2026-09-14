import { Sprout, ShieldCheck, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";

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
    <div className="min-h-screen flex bg-slate-50">
      {/* Left visual panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 to-emerald-800 text-white p-12 flex-col justify-between overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-0 -left-16 h-64 w-64 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Sprout size={18} />
          </div>
          <span className="font-semibold">Bahar-e-Madina</span>
        </div>

        <div className="relative space-y-8 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Run your commission business with confidence.
          </h1>
          <p className="text-emerald-50/90 text-sm">
            Accounts, brokerage and crop trading — all in one place, built
            for cotton &amp; wheat commission agents.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Live financial reports</p>
                <p className="text-xs text-emerald-50/70">
                  Ledgers, trial balance and P&amp;L on demand
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <Users size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Party master &amp; ledgers</p>
                <p className="text-xs text-emerald-50/70">
                  Track every customer and vendor in one place
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Secure by design</p>
                <p className="text-xs text-emerald-50/70">
                  Your data stays in your own database
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-emerald-50/60">
          &copy; {new Date().getFullYear()} Bahar-e-Madina Commission Agent
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sprout size={18} />
            </div>
            <span className="font-semibold text-slate-900">
              Bahar-e-Madina
            </span>
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
