"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Lock,
  Building2,
  Phone,
  Landmark,
  MapPin,
  FileText,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DataModeBanner } from "@/components/data-mode-banner";
import { BusinessLogo } from "@/components/business-mark";
import { useBusiness } from "@/components/business-provider";
import {
  updateMyCompanyProfile,
  uploadBusinessLogo,
  BUSINESS_CATEGORY_LABELS,
  type BusinessCategory,
} from "@/lib/supabase/businesses";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const CURRENCIES = ["PKR", "USD", "AED", "SAR", "GBP", "EUR", "INR"];

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CompanyProfilePage() {
  const { business, loading, error: loadError, refresh } = useBusiness();

  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [currency, setCurrency] = useState("PKR");
  const [taxNumber, setTaxNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!business) return;
    setLogoUrl(business.logoUrl ?? "");
    setContactEmail(business.contactEmail ?? "");
    setContactPhone(business.contactPhone ?? "");
    setCategory(business.category ?? "");
    setCurrency(business.currency);
    setTaxNumber(business.taxNumber ?? "");
    setGstNumber(business.gstNumber ?? "");
    setAddress(business.address ?? "");
    setWebsite(business.website ?? "");
  }, [business]);

  const dirty = useMemo(() => {
    if (!business) return false;
    return (
      logoUrl !== (business.logoUrl ?? "") ||
      contactEmail !== (business.contactEmail ?? "") ||
      contactPhone !== (business.contactPhone ?? "") ||
      category !== (business.category ?? "") ||
      currency !== business.currency ||
      taxNumber !== (business.taxNumber ?? "") ||
      gstNumber !== (business.gstNumber ?? "") ||
      address !== (business.address ?? "") ||
      website !== (business.website ?? "")
    );
  }, [business, logoUrl, contactEmail, contactPhone, category, currency, taxNumber, gstNumber, address, website]);

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !business) return;
    setLogoUploadError(null);
    setUploadingLogo(true);
    const { url, error: err } = await uploadBusinessLogo(business.id, file);
    setUploadingLogo(false);
    if (err || !url) {
      setLogoUploadError(err ?? "Upload failed.");
      return;
    }
    setLogoUrl(url);
    // Save immediately so a logo change to the admin's view doesn't wait
    // on the rest of the form's unrelated pending edits.
    const { error: saveErr } = await updateMyCompanyProfile(business.id, { logoUrl: url });
    if (saveErr) {
      setLogoUploadError(saveErr);
      return;
    }
    await refresh();
  }

  async function handleSave() {
    if (!business) return;
    setSaving(true);
    setError(null);
    // The company name is not sent — only a platform admin can change it.
    const { error: err } = await updateMyCompanyProfile(business.id, {
      logoUrl: logoUrl.trim() || null,
      contactEmail: contactEmail.trim() || null,
      contactPhone: contactPhone.trim() || null,
      category: category || null,
      currency,
      taxNumber: taxNumber.trim() || null,
      gstNumber: gstNumber.trim() || null,
      address: address.trim() || null,
      website: website.trim() || null,
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

  function handleReset() {
    if (!business) return;
    setLogoUrl(business.logoUrl ?? "");
    setContactEmail(business.contactEmail ?? "");
    setContactPhone(business.contactPhone ?? "");
    setCategory(business.category ?? "");
    setCurrency(business.currency);
    setTaxNumber(business.taxNumber ?? "");
    setGstNumber(business.gstNumber ?? "");
    setAddress(business.address ?? "");
    setWebsite(business.website ?? "");
    setError(null);
  }

  const letterheadBits = [
    address.trim(),
    [contactPhone.trim() && `Tel: ${contactPhone.trim()}`, contactEmail.trim()]
      .filter(Boolean)
      .join("   "),
    [taxNumber.trim() && `NTN: ${taxNumber.trim()}`, gstNumber.trim() && `GST: ${gstNumber.trim()}`]
      .filter(Boolean)
      .join("   "),
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Company Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your business details — these appear in the sidebar and on every
          printed voucher.
        </p>
      </div>

      <DataModeBanner demoMessage="Demo mode — this site isn't connected to a database, so there's no company to show. In Vercel → Settings → Environment Variables add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy (see README)." />

      {isSupabaseConfigured && business && business.profileReady === false && (
        <div className="flex items-start gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-amber-50 text-amber-800">
          <CircleAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            Your database is missing the company-profile columns, so logo,
            address, tax number and currency can&apos;t be saved yet. Run{" "}
            <code>supabase/migration_7_generic_accounting.sql</code> once in
            the Supabase SQL Editor, then reload this page.
          </span>
        </div>
      )}

      {!isSupabaseConfigured || !business ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 space-y-2">
          {loading ? (
            <p>Loading…</p>
          ) : isSupabaseConfigured ? (
            <>
              <p className="font-medium text-slate-700">
                Couldn&apos;t load your company.
              </p>
              <p>
                {loadError
                  ? `Database message: ${loadError}`
                  : "No company record was found for this login."}
              </p>
            </>
          ) : (
            <p>Connect the database to see and edit your company profile.</p>
          )}
        </div>
      ) : (
        <>
          {/* Identity */}
          <Section
            icon={Building2}
            title="Company identity"
            description="Your name and logo, shown to your team across the app."
          >
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex sm:flex-col items-center gap-3 sm:w-28 shrink-0">
                <BusinessLogo
                  name={business.name}
                  logoUrl={logoUrl.trim() || null}
                  className="h-20 w-20 rounded-xl border border-slate-200"
                />
                <p className="text-[11px] text-slate-400 sm:text-center">
                  Logo preview
                </p>
              </div>

              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <Label>Company Name</Label>
                  <div className="flex items-center gap-2 h-10 sm:h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                    <span className="truncate font-medium">{business.name}</span>
                    <Lock size={13} className="ml-auto shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">
                    The company name can only be changed by the service
                    administrator. Contact support if it needs correcting.
                  </p>
                </div>

                <div>
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 h-10 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                      {uploadingLogo ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ImagePlus size={14} />
                      )}
                      {uploadingLogo ? "Uploading…" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFile}
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                  {logoUploadError && (
                    <p className="mt-1.5 text-xs text-red-600">{logoUploadError}</p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-400">
                    PNG or JPG, square works best. Uploading saves it right
                    away — your admin and team see it update immediately.
                    Or paste a link to an image hosted elsewhere:
                  </p>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://…/logo.png"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section
            icon={Phone}
            title="Contact details"
            description="How customers and suppliers reach you."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="accounts@yourbusiness.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                />
              </div>
            </div>
          </Section>

          {/* Business & tax */}
          <Section
            icon={Landmark}
            title="Business & tax"
            description="Type of business, registration and default currency."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Business Category</Label>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BusinessCategory | "")}
                >
                  <option value="">— Not set —</option>
                  {Object.entries(BUSINESS_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>NTN (National Tax Number)</Label>
                <Input
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  placeholder="e.g. 1234567-8"
                />
              </div>
              <div>
                <Label>GST / Sales Tax Registration No.</Label>
                <Input
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="STRN"
                />
              </div>
            </div>
          </Section>

          {/* Address */}
          <Section
            icon={MapPin}
            title="Address"
            description="Printed under your name on vouchers and documents."
          >
            <Label>Business Address</Label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop / office, market, city"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 resize-y"
            />
          </Section>

          {/* Letterhead preview */}
          <Section
            icon={FileText}
            title="Voucher letterhead preview"
            description="This is how your details will appear at the top of printed vouchers."
          >
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <BusinessLogo
                  name={business.name}
                  logoUrl={logoUrl.trim() || null}
                  className="h-12 w-12 rounded-md"
                />
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-900 leading-tight">
                    {business.name}
                  </p>
                  {letterheadBits.length ? (
                    letterheadBits.map((b, i) => (
                      <p key={i} className="text-[11.5px] text-slate-500 leading-snug mt-0.5">
                        {b}
                      </p>
                    ))
                  ) : (
                    <p className="text-[11.5px] text-slate-400 mt-0.5">
                      Add an address, phone or tax number above to see it here.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t-2 border-slate-800" />
              <p className="mt-2 text-center text-[11px] font-semibold tracking-wide text-slate-700 bg-slate-50 py-1.5 rounded">
                CASH RECEIVING VOUCHER
              </p>
            </div>
          </Section>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
              <CircleAlert size={14} /> {error}
            </div>
          )}

          <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-card backdrop-blur">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 mr-auto">
                <CircleCheck size={14} /> Saved
              </span>
            )}
            {!saved && dirty && (
              <span className="text-xs text-slate-400 mr-auto">Unsaved changes</span>
            )}
            <Button variant="secondary" onClick={handleReset} disabled={!dirty || saving}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
