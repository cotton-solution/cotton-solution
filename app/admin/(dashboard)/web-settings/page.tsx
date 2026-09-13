"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  fetchSiteSettings,
  updateSiteSettings,
  fetchHeroSlides,
  addHeroSlide,
  deleteHeroSlide,
  type SiteSettings,
  type HeroSlide,
} from "@/lib/supabase/site-settings";

export default function WebSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, hs] = await Promise.all([fetchSiteSettings(), fetchHeroSlides()]);
    setSettings(s);
    setSlides(hs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(patch: Partial<SiteSettings>) {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    await updateSiteSettings(patch);
    setSaving(false);
    setSavedAt(Date.now());
  }

  async function handleAddSlide() {
    await addHeroSlide("", "", slides.length);
    load();
  }

  async function handleDeleteSlide(id: string) {
    await deleteHeroSlide(id);
    load();
  }

  if (loading || !settings) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Website Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Controls the header, hero banner, and branding on the public site.
            {saving ? " Saving…" : savedAt ? " Saved." : ""}
          </p>
        </div>

        <div>
          <Label htmlFor="site-name">Website Name</Label>
          <Input
            id="site-name"
            value={settings.websiteName}
            onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
            onBlur={() => save({ websiteName: settings.websiteName })}
          />
        </div>

        <ImageUploadField
          label="Logo"
          hint="JPG or PNG, uploaded directly — saved automatically."
          value={settings.logoUrl}
          folder="logo"
          shape="circle"
          onChange={(url) => save({ logoUrl: url })}
        />

        <ImageUploadField
          label="Hero Illustration (Home Page)"
          hint='Recommended: a square (1:1) image, at least 800×800px, PNG with a transparent background if possible.'
          value={settings.heroImageUrl}
          folder="hero"
          shape="wide"
          onChange={(url) => save({ heroImageUrl: url })}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="main-heading">Main Heading</Label>
            <Input
              id="main-heading"
              value={settings.mainHeading ?? ""}
              onChange={(e) => setSettings({ ...settings, mainHeading: e.target.value })}
              onBlur={() => save({ mainHeading: settings.mainHeading })}
            />
          </div>
          <div>
            <Label htmlFor="sub-heading">Sub Heading</Label>
            <Input
              id="sub-heading"
              value={settings.subHeading ?? ""}
              onChange={(e) => setSettings({ ...settings, subHeading: e.target.value })}
              onBlur={() => save({ subHeading: settings.subHeading })}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hero Slides</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The rotating banner shown on the home page.
            </p>
          </div>
          <Button className="h-9 px-3 text-xs" onClick={handleAddSlide}>
            <Plus size={14} className="mr-1.5" />
            Add Slide
          </Button>
        </div>
        <div className="divide-y divide-slate-100">
          {slides.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-slate-400">
              No slides yet — add one to get started.
            </p>
          )}
          {slides.map((slide) => (
            <div key={slide.id} className="flex items-center gap-3 px-5 py-3">
              <div className="h-12 w-20 shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                {slide.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt={slide.caption ?? "Slide"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="flex-1 text-sm text-slate-600">
                {slide.caption || "Untitled slide"}
              </p>
              <Button
                variant="danger"
                className="h-8 px-2.5 text-xs"
                onClick={() => handleDeleteSlide(slide.id)}
              >
                <Trash2 size={13} className="mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
