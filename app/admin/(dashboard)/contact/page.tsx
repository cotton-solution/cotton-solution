"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  fetchContactPersons,
  addContactPerson,
  updateContactPerson,
  deleteContactPerson,
  fetchContactMessages,
  markMessageRead,
  deleteContactMessage,
  type ContactPerson,
  type ContactMessage,
} from "@/lib/supabase/contact";

export default function ContactPage() {
  const [tab, setTab] = useState<"info" | "messages">("info");
  const [persons, setPersons] = useState<ContactPerson[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ContactPerson | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, m] = await Promise.all([fetchContactPersons(), fetchContactMessages()]);
    setPersons(p);
    setMessages(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    await deleteContactPerson(id);
    load();
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <>
      <div className="flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "info"} onClick={() => setTab("info")}>
          Contact Info
        </TabButton>
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
          Messages{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </TabButton>
      </div>

      {tab === "info" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button className="h-9 px-3 text-xs" onClick={() => setEditing("new")}>
              <Plus size={14} className="mr-1.5" />
              Add Contact
            </Button>
          </div>

          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {!loading && persons.length === 0 && (
            <p className="text-sm text-slate-400">No contacts added yet.</p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {persons.map((p) => (
              <div
                key={p.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-100 overflow-hidden shrink-0">
                    {p.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photoUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.designation}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  {p.phone && <p>{p.phone}</p>}
                  {p.email && <p>{p.email}</p>}
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="secondary"
                    className="h-8 px-2.5 text-xs flex-1"
                    onClick={() => setEditing(p)}
                  >
                    <Pencil size={13} className="mr-1" /> Edit
                  </Button>
                  <Button
                    variant="danger"
                    className="h-8 px-2.5 text-xs flex-1"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={13} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {messages.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-slate-400">
              No messages received yet.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className="px-5 py-4 flex gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Mail size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{m.name}</p>
                  {!m.isRead && (
                    <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5">
                      New
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {[m.email, m.phone].filter(Boolean).join(" · ")}
                </p>
                <p className="text-sm text-slate-700 mt-1">{m.message}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {!m.isRead && (
                  <Button
                    variant="secondary"
                    className="h-7 px-2 text-[11px]"
                    onClick={async () => {
                      await markMessageRead(m.id);
                      load();
                    }}
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="h-7 px-2 text-[11px]"
                  onClick={async () => {
                    await deleteContactMessage(m.id);
                    load();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ContactPersonModal
          person={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-emerald-600 text-emerald-700"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function ContactPersonModal({
  person,
  onClose,
  onSaved,
}: {
  person: ContactPerson | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(person?.name ?? "");
  const [designation, setDesignation] = useState(person?.designation ?? "");
  const [phone, setPhone] = useState(person?.phone ?? "");
  const [email, setEmail] = useState(person?.email ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(person?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = { name, designation, phone, email, photoUrl };
    const { error } = person
      ? await updateContactPerson(person.id, payload)
      : await addContactPerson({ ...payload, sortOrder: 0 });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    onSaved();
  }

  return (
    <Modal title={person ? "Edit Contact" : "Add Contact"} onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <p className="text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            {error}
          </p>
        )}
        <ImageUploadField
          label="Photo"
          hint="JPG or PNG, uploaded directly."
          value={photoUrl}
          folder="contacts"
          shape="circle"
          onChange={setPhotoUrl}
        />
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            placeholder="e.g. Ali Raza"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c-designation">Designation</Label>
          <Input
            id="c-designation"
            placeholder="e.g. Admissions Officer"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c-phone">Contact No</Label>
          <Input
            id="c-phone"
            placeholder="03xx-xxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !name}>
          {saving ? "Saving…" : person ? "Save Changes" : "Add Contact"}
        </Button>
      </div>
    </Modal>
  );
}
