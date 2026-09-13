"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAllPagesContent,
  updatePageContent,
  type PageContent,
  type PageSlug,
} from "@/lib/supabase/pages-content";
import { renderSimpleMarkdown } from "@/lib/simple-markdown";

export default function PagesLegalPage() {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [activeSlug, setActiveSlug] = useState<PageSlug>("about-us");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setPages(await fetchAllPagesContent());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = pages.find((p) => p.slug === activeSlug);

  function updateActive(patch: Partial<PageContent>) {
    setPages((prev) => prev.map((p) => (p.slug === activeSlug ? { ...p, ...patch } : p)));
  }

  function insertAtCursor(snippet: string) {
    const el = textareaRef.current;
    if (!el || !active) return;
    const start = el.selectionStart ?? active.content.length;
    const end = el.selectionEnd ?? active.content.length;
    const next = active.content.slice(0, start) + snippet + active.content.slice(end);
    updateActive({ content: next });
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + snippet.length;
    });
  }

  async function handleSave() {
    if (!active) return;
    setSaving(true);
    await updatePageContent(active.slug, { title: active.title, content: active.content });
    setSaving(false);
  }

  if (loading || !active) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-6">
      <nav className="space-y-1">
        {pages.map((p) => (
          <button
            key={p.slug}
            onClick={() => {
              setActiveSlug(p.slug);
              setView("write");
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${
              p.slug === activeSlug
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileText size={15} />
            {p.title}
          </button>
        ))}
      </nav>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{active.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">/{active.slug}</p>
        </div>

        <div>
          <Label htmlFor="page-title">Page Title</Label>
          <Input
            id="page-title"
            value={active.title}
            onChange={(e) => updateActive({ title: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="page-content">Content</Label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setView("write")}
                className={`px-3 py-1 text-xs font-medium ${
                  view === "write" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                Write
              </button>
              <button
                onClick={() => setView("preview")}
                className={`px-3 py-1 text-xs font-medium ${
                  view === "preview" ? "bg-slate-900 text-white" : "text-slate-600"
                }`}
              >
                Preview
              </button>
            </div>
          </div>

          {view === "write" && (
            <>
              <div className="flex gap-1.5 mb-2">
                <ToolbarButton onClick={() => insertAtCursor("## ")}>H2</ToolbarButton>
                <ToolbarButton onClick={() => insertAtCursor("### ")}>H3</ToolbarButton>
                <ToolbarButton onClick={() => insertAtCursor("- ")}>List</ToolbarButton>
                <ToolbarButton onClick={() => insertAtCursor("**bold**")}>B</ToolbarButton>
              </div>
              <textarea
                id="page-content"
                ref={textareaRef}
                rows={16}
                value={active.content}
                onChange={(e) => updateActive({ content: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 font-mono focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </>
          )}

          {view === "preview" && (
            <div
              className="prose prose-sm max-w-none rounded-lg border border-slate-200 p-4"
              dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(active.content) }}
            />
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
