"use client";

import { useState } from "react";
import { Eye, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPE_STYLES,
} from "@/lib/business-types";
import {
  deleteBusiness,
  updateBusinessSubscription,
  type Business,
  type SubscriptionStatus,
  type BillingStatus,
} from "@/lib/supabase/businesses";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-red-50 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

const BILLING_STYLES: Record<BillingStatus, string> = {
  billed: "bg-emerald-50 text-emerald-700",
  unbilled: "bg-amber-50 text-amber-700",
};

export function AccountsTable({
  businesses,
  loading,
  onRefresh,
  emptyLabel = "No accounts here yet.",
  showBillingColumn = false,
}: {
  businesses: Business[];
  loading: boolean;
  onRefresh: () => void;
  emptyLabel?: string;
  showBillingColumn?: boolean;
}) {
  const [viewing, setViewing] = useState<Business | null>(null);
  const [editing, setEditing] = useState<Business | null>(null);
  const [deleting, setDeleting] = useState<Business | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    await deleteBusiness(deleting.id);
    setBusy(false);
    setDeleting(null);
    onRefresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">
          Accounts <span className="text-slate-400 font-normal">({businesses.length})</span>
        </h2>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <RefreshCcw size={13} />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Contact</th>
              <th className="px-4 py-2.5 font-medium">Plan</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              {showBillingColumn && (
                <th className="px-4 py-2.5 font-medium">Billing</th>
              )}
              <th className="px-4 py-2.5 font-medium">Expires On</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && businesses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {businesses.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BUSINESS_TYPE_STYLES[b.businessType]}`}
                  >
                    {BUSINESS_TYPE_LABELS[b.businessType]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {b.contactEmail ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-slate-600">{b.plan}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.subscriptionStatus]}`}
                  >
                    {b.subscriptionStatus}
                  </span>
                </td>
                {showBillingColumn && (
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${BILLING_STYLES[b.billingStatus]}`}
                    >
                      {b.billingStatus}
                    </span>
                  </td>
                )}
                <td className="px-4 py-2.5 text-slate-600">
                  {b.subscriptionExpiresAt ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setViewing(b)}
                    >
                      <Eye size={13} className="mr-1" /> View
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setEditing(b)}
                    >
                      <Pencil size={13} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="danger"
                      className="h-8 px-2.5 text-xs"
                      onClick={() => setDeleting(b)}
                    >
                      <Trash2 size={13} className="mr-1" /> Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <Row label="Category" value={BUSINESS_TYPE_LABELS[viewing.businessType]} />
            <Row label="Contact Email" value={viewing.contactEmail ?? "—"} />
            <Row label="Contact Phone" value={viewing.contactPhone ?? "—"} />
            <Row label="Plan" value={viewing.plan} />
            <Row label="Subscription Status" value={viewing.subscriptionStatus} />
            <Row label="Billing Status" value={viewing.billingStatus} />
            <Row label="Expires On" value={viewing.subscriptionExpiresAt ?? "—"} />
            <Row
              label="Signed Up"
              value={new Date(viewing.createdAt).toLocaleDateString()}
            />
          </dl>
        </Modal>
      )}

      {editing && (
        <EditAccountModal
          business={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onRefresh();
          }}
        />
      )}

      {deleting && (
        <Modal title="Delete account?" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600">
            This permanently deletes <strong>{deleting.name}</strong> and all of its
            data. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 font-medium text-right">{value}</dd>
    </div>
  );
}

function EditAccountModal({
  business,
  onClose,
  onSaved,
}: {
  business: Business;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(business.name);
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [businessType, setBusinessType] = useState(business.businessType);
  const [plan, setPlan] = useState(business.plan);
  const [subscriptionStatus, setSubscriptionStatus] = useState(business.subscriptionStatus);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState(
    business.subscriptionExpiresAt ?? ""
  );
  const [billingStatus, setBillingStatus] = useState(business.billingStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await updateBusinessSubscription(business.id, {
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      businessType,
      plan,
      subscriptionStatus,
      subscriptionExpiresAt: subscriptionExpiresAt || null,
      billingStatus,
    });
    setSaving(false);
    if (error) {
      setError(error);
      return;
    }
    onSaved();
  }

  return (
    <Modal title={`Edit ${business.name}`} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-4">
        {error && (
          <p className="sm:col-span-2 text-xs font-medium rounded-lg px-3 py-2 bg-red-50 text-red-700">
            {error}
          </p>
        )}
        <div>
          <Label htmlFor="edit-name">Business Name</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="edit-type">Category</Label>
          <Select
            id="edit-type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value as Business["businessType"])}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-email">Contact Email</Label>
          <Input
            id="edit-email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-phone">Contact Phone</Label>
          <Input
            id="edit-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-plan">Plan</Label>
          <Input id="edit-plan" value={plan} onChange={(e) => setPlan(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="edit-status">Subscription Status</Label>
          <Select
            id="edit-status"
            value={subscriptionStatus}
            onChange={(e) =>
              setSubscriptionStatus(e.target.value as Business["subscriptionStatus"])
            }
          >
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-expiry">Expires On</Label>
          <Input
            id="edit-expiry"
            type="date"
            value={subscriptionExpiresAt}
            onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-billing">Billing Status</Label>
          <Select
            id="edit-billing"
            value={billingStatus}
            onChange={(e) => setBillingStatus(e.target.value as Business["billingStatus"])}
          >
            <option value="unbilled">Unbilled</option>
            <option value="billed">Billed</option>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </Modal>
  );
}
