"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { useBusiness } from "@/components/business-provider";
import { updateMyCompanyProfile, BUSINESS_CATEGORY_LABELS, type BusinessCategory } from "@/lib/supabase/businesses";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const CURRENCIES = ["PKR", "USD", "AED", "SAR", "GBP", "EUR", "INR"];

export default function CompanyProfilePage() {
  const { business, loading, refresh } = useBusiness();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [currency, setCurrency] = useState("PKR");
  const [taxNumber, setTaxNumber] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setLogoUrl(business.logoUrl ?? "");
    setContactEmail(business.contactEmail ?? "");
    setContactPhone(business.contactPhone ?? "");
    setCategory(business.category ?? "");
    setCurrency(business.currency);
    setTaxNumber(business.taxNumber ?? "");
    setAddress(business.address ?? "");
    setWebsite(business.website ?? "");
  }, [business]);

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateMyCompanyProfile(business.id, {
      name,
      logoUrl: logoUrl || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      category: category || null,
      currency,
      taxNumber: taxNumber || null,
      address: address || null,
      website: website || null,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    setSaved(true);
    await refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Company Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Business details, tax registration, address and default currency.
        </p>
      </div>

      <DataModeBanner demoMessage="Demo mode — there's no signed-in business to edit here yet. Connect Supabase and sign in to manage your company profile (see README)." />

      {!isSupabaseConfigured || !business ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          {loading ? "Loading…" : "Sign in to a connected business to edit its profile."}
        </div>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white shadow-card p-5 space-y-5">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={name || "Company logo"}
                className="h-14 w-14 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs">
                No logo
              </div>
            )}
            <div className="flex-1">
              <Label>Logo URL</Label>
              <Input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
              />
              <p className="mt-1 text-xs text-slate-400">
                This appears in your sidebar, mobile menu and header —
                only your own team sees it. Paste a link to an image
                you&apos;ve hosted elsewhere (file upload isn&apos;t wired up yet).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Business Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
            <div>
              <Label>Business Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value as BusinessCategory)}>
                <option value="">— Not set —</option>
                {Object.entries(BUSINESS_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <Label>Tax Registration Number</Label>
              <Input value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} placeholder="e.g. NTN / VAT number" />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 rule-t pt-4">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 mr-auto">
                <CircleCheck size={14} /> Saved
              </span>
            )}
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
          </div>
        </section>
      )}
    </div>
  );
}
