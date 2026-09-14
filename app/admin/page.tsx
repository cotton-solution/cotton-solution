"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  Ban,
  CircleX,
  Sparkles,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  UserCheck,
  Receipt,
  CircleDollarSign,
  X,
  Globe,
  ImagePlus,
  ImageOff,
  Loader2,
} from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { useSiteSettings } from "@/components/site-settings-provider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllBusinesses,
  updateBusinessSubscription,
  updateBusinessProfile,
  setBillingStatus,
  deleteBusiness,
  BUSINESS_CATEGORY_LABELS,
  type Business,
  type BusinessCategory,
  type SubscriptionStatus,
} from "@/lib/supabase/businesses";
import {
  updateSiteSettings,
  uploadSiteImage,
  addSiteSlide,
  updateSiteSlide,
  deleteSiteSlide,
  type SiteSlide,
} from "@/lib/supabase/site-settings";

type View =
  | "dashboard"
  | "accounts-new"
  | "accounts-active"
  | "accounts-expired"
  | "billing-billed"
  | "billing-unbilled"
  | "website-settings";

const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trial: "bg-amber-50 text-amber-700",
  active: "bg-emerald-50 text-emerald-700",
  expired: "bg-red-50 text-red-700",
  suspended: "bg-slate-200 text-slate-600",
};

function oneYearFromToday(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function categoryLabel(c: BusinessCategory | null): string {
  return c ? BUSINESS_CATEGORY_LABELS[c] : "—";
}

// ============================================================
// Dashboard (overview stats)
// ============================================================
function DashboardView({ businesses }: { businesses: Business[] }) {
  const { settings } = useSiteSettings();
  const counts = businesses.reduce(
    (acc, b) => {
      acc[b.subscriptionStatus] = (acc[b.subscriptionStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<SubscriptionStatus, number>
  );
  const newThisMonth = businesses.filter((b) => isThisMonth(b.createdAt)).length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-6">
        <p className="text-lg font-semibold">Welcome, Admin!</p>
        <p className="text-emerald-50/90 text-sm mt-1">
          {settings.siteName} Commission Agent
        </p>
        <p className="text-emerald-100/60 text-xs mt-0.5">
          Service Owner Panel · Subscriptions &amp; Billing
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Building2 size={18} />}
          value={businesses.length}
          label="Total Businesses"
          color="text-slate-700 bg-slate-100"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          value={counts.active ?? 0}
          label="Active"
          color="text-emerald-700 bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={18} />}
          value={counts.trial ?? 0}
          label="New Requests"
          color="text-amber-700 bg-amber-50"
        />
        <StatCard
          icon={<CircleX size={18} />}
          value={counts.expired ?? 0}
          label="Expired"
          color="text-red-700 bg-red-50"
        />
        <StatCard
          icon={<Ban size={18} />}
          value={counts.suspended ?? 0}
          label="Suspended"
          color="text-slate-600 bg-slate-200"
        />
        <StatCard
          icon={<Sparkles size={18} />}
          value={newThisMonth}
          label="New This Month"
          color="text-indigo-700 bg-indigo-50"
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-slate-900 leading-none">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ============================================================
// Shared accounts table
// ============================================================
function AccountsTable({
  title,
  businesses,
  emptyText,
  busyId,
  onApprove,
  onSuspend,
  onReinstate,
  onRenew,
  onMarkBilled,
  onMarkUnbilled,
  onView,
  onEdit,
  onDelete,
  showBillingColumn,
}: {
  title: string;
  businesses: Business[];
  emptyText: string;
  busyId: string | null;
  onApprove?: (b: Business) => void;
  onSuspend?: (b: Business) => void;
  onReinstate?: (b: Business) => void;
  onRenew?: (b: Business) => void;
  onMarkBilled?: (b: Business) => void;
  onMarkUnbilled?: (b: Business) => void;
  onView: (b: Business) => void;
  onEdit: (b: Business) => void;
  onDelete: (b: Business) => void;
  showBillingColumn?: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">
          {businesses.length} {businesses.length === 1 ? "account" : "accounts"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="px-4 py-2.5 font-medium">Business</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Contact Email</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              {showBillingColumn ? (
                <th className="px-4 py-2.5 font-medium">Last Billed</th>
              ) : (
                <th className="px-4 py-2.5 font-medium">Expires On</th>
              )}
              <th className="px-4 py-2.5 font-medium">Signed Up</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {businesses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  {emptyText}
                </td>
              </tr>
            )}
            {businesses.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {categoryLabel(b.category)}
                </td>
                <td className="px-4 py-2.5 text-slate-600">
                  {b.contactEmail ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.subscriptionStatus]}`}
                  >
                    {b.subscriptionStatus}
                  </span>
                </td>
                {showBillingColumn ? (
                  <td className="px-4 py-2.5 text-slate-600">
                    {b.lastBilledAt
                      ? new Date(b.lastBilledAt).toLocaleDateString()
                      : "—"}
                  </td>
                ) : (
                  <td className="px-4 py-2.5 text-slate-600">
                    {b.subscriptionExpiresAt ?? "—"}
                  </td>
                )}
                <td className="px-4 py-2.5 text-slate-600">
                  {new Date(b.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1.5 flex-wrap">
                    {onApprove && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs gap-1"
                        disabled={busyId === b.id}
                        onClick={() => onApprove(b)}
                      >
                        <UserCheck size={13} />
                        Approve
                      </Button>
                    )}
                    {onRenew && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs"
                        disabled={busyId === b.id}
                        onClick={() => onRenew(b)}
                      >
                        Renew +1yr
                      </Button>
                    )}
                    {onSuspend && b.subscriptionStatus !== "suspended" && (
                      <Button
                        variant="danger"
                        className="h-8 px-2.5 text-xs"
                        disabled={busyId === b.id}
                        onClick={() => onSuspend(b)}
                      >
                        Suspend
                      </Button>
                    )}
                    {onReinstate && b.subscriptionStatus === "suspended" && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs"
                        disabled={busyId === b.id}
                        onClick={() => onReinstate(b)}
                      >
                        Reinstate
                      </Button>
                    )}
                    {onMarkBilled && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs gap-1"
                        disabled={busyId === b.id}
                        onClick={() => onMarkBilled(b)}
                      >
                        <Receipt size={13} />
                        Mark Billed
                      </Button>
                    )}
                    {onMarkUnbilled && (
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs gap-1"
                        disabled={busyId === b.id}
                        onClick={() => onMarkUnbilled(b)}
                      >
                        <CircleDollarSign size={13} />
                        Mark Unbilled
                      </Button>
                    )}
                    <button
                      title="View"
                      onClick={() => onView(b)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      title="Edit"
                      onClick={() => onEdit(b)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => onDelete(b)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// View / Edit modals
// ============================================================
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ViewBusinessModal({
  business,
  onClose,
}: {
  business: Business;
  onClose: () => void;
}) {
  const rows: [string, string][] = [
    ["Business", business.name],
    ["Category", categoryLabel(business.category)],
    ["Contact Email", business.contactEmail ?? "—"],
    ["Contact Phone", business.contactPhone ?? "—"],
    ["Plan", business.plan],
    ["Subscription Status", business.subscriptionStatus],
    ["Expires On", business.subscriptionExpiresAt ?? "—"],
    ["Billing Status", business.billingStatus],
    [
      "Last Billed",
      business.lastBilledAt
        ? new Date(business.lastBilledAt).toLocaleString()
        : "—",
    ],
    ["Signed Up", new Date(business.createdAt).toLocaleString()],
  ];
  return (
    <Modal title="Business details" onClose={onClose}>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-900 font-medium text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <Button
        type="button"
        variant="secondary"
        className="w-full mt-5"
        onClick={onClose}
      >
        Close
      </Button>
    </Modal>
  );
}

function EditBusinessModal({
  business,
  onClose,
  onSaved,
}: {
  business: Business;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState<BusinessCategory | "">(
    business.category ?? ""
  );
  const [contactEmail, setContactEmail] = useState(business.contactEmail ?? "");
  const [contactPhone, setContactPhone] = useState(business.contactPhone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await updateBusinessProfile(business.id, {
      name,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      category: category || null,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Modal title="Edit business" onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <Label htmlFor="edit-name">Business name</Label>
          <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="edit-category">Category</Label>
          <select
            id="edit-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as BusinessCategory)}
            className="w-full h-10 sm:h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
          >
            <option value="">—</option>
            {Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="edit-email">Contact email</Label>
          <Input
            id="edit-email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="edit-phone">Contact phone</Label>
          <Input
            id="edit-phone"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// Main dashboard shell
// ============================================================
function AdminDashboard() {
  const { signOut } = useAuth();
  const { settings } = useSiteSettings();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [billingOpen, setBillingOpen] = useState(false);
  const [viewing, setViewing] = useState<Business | null>(null);
  const [editing, setEditing] = useState<Business | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setBusinesses(await fetchAllBusinesses());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleLogOut() {
    await signOut();
    router.push("/admin/login");
  }

  async function withBusy(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    await fn();
    await load();
    setBusyId(null);
  }

  const approve = (b: Business) =>
    withBusy(b.id, () =>
      updateBusinessSubscription(b.id, {
        subscriptionStatus: "active",
        subscriptionExpiresAt: oneYearFromToday(),
      }).then(() => {})
    );
  const renew = (b: Business) =>
    withBusy(b.id, () =>
      updateBusinessSubscription(b.id, {
        subscriptionStatus: "active",
        subscriptionExpiresAt: oneYearFromToday(),
      }).then(() => {})
    );
  const suspend = (b: Business) =>
    withBusy(b.id, () =>
      updateBusinessSubscription(b.id, { subscriptionStatus: "suspended" }).then(
        () => {}
      )
    );
  const reinstate = (b: Business) =>
    withBusy(b.id, () =>
      updateBusinessSubscription(b.id, { subscriptionStatus: "active" }).then(
        () => {}
      )
    );
  const markBilled = (b: Business) =>
    withBusy(b.id, () => setBillingStatus(b.id, "billed").then(() => {}));
  const markUnbilled = (b: Business) =>
    withBusy(b.id, () => setBillingStatus(b.id, "unbilled").then(() => {}));

  async function handleDelete(b: Business) {
    if (
      !window.confirm(
        `Permanently delete "${b.name}"? This removes all of their accounts data (parties, vouchers, invoices, everything) and cannot be undone.`
      )
    ) {
      return;
    }
    await withBusy(b.id, () => deleteBusiness(b.id).then(() => {}));
  }

  const newRequests = useMemo(
    () => businesses.filter((b) => b.subscriptionStatus === "trial"),
    [businesses]
  );
  const activeAccounts = useMemo(
    () =>
      businesses.filter(
        (b) =>
          b.subscriptionStatus === "active" || b.subscriptionStatus === "suspended"
      ),
    [businesses]
  );
  const expiredAccounts = useMemo(
    () => businesses.filter((b) => b.subscriptionStatus === "expired"),
    [businesses]
  );
  const billedAccounts = useMemo(
    () => businesses.filter((b) => b.billingStatus === "billed"),
    [businesses]
  );
  const unbilledAccounts = useMemo(
    () => businesses.filter((b) => b.billingStatus === "unbilled"),
    [businesses]
  );

  const viewTitles: Record<View, string> = {
    dashboard: "Dashboard",
    "accounts-new": "New Account Requests",
    "accounts-active": "Active Accounts",
    "accounts-expired": "Expired Accounts",
    "billing-billed": "Billed Accounts",
    "billing-unbilled": "Unbilled Accounts",
    "website-settings": "Website Setting",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-50">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <ShieldCheck size={16} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{settings.siteName}</p>
            <p className="text-[11px] text-emerald-200/70">Service Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <SidebarLink
            icon={<LayoutDashboard size={16} />}
            label="Dashboard"
            active={view === "dashboard"}
            onClick={() => setView("dashboard")}
          />

          <SidebarGroup
            icon={<Building2 size={16} />}
            label="Accounts"
            open={accountsOpen}
            onToggle={() => setAccountsOpen((v) => !v)}
          >
            <SidebarSubLink
              label="New Account Requests"
              badge={newRequests.length}
              active={view === "accounts-new"}
              onClick={() => setView("accounts-new")}
            />
            <SidebarSubLink
              label="Active Accounts"
              badge={activeAccounts.length}
              active={view === "accounts-active"}
              onClick={() => setView("accounts-active")}
            />
            <SidebarSubLink
              label="Expired Accounts"
              badge={expiredAccounts.length}
              active={view === "accounts-expired"}
              onClick={() => setView("accounts-expired")}
            />
          </SidebarGroup>

          <SidebarGroup
            icon={<Receipt size={16} />}
            label="Billing"
            open={billingOpen}
            onToggle={() => setBillingOpen((v) => !v)}
          >
            <SidebarSubLink
              label="Billed Accounts"
              badge={billedAccounts.length}
              active={view === "billing-billed"}
              onClick={() => setView("billing-billed")}
            />
            <SidebarSubLink
              label="Unbilled Accounts"
              badge={unbilledAccounts.length}
              active={view === "billing-unbilled"}
              onClick={() => setView("billing-unbilled")}
            />
          </SidebarGroup>

          <SidebarLink
            icon={<Globe size={16} />}
            label="Website Setting"
            active={view === "website-settings"}
            onClick={() => setView("website-settings")}
          />
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">
            {viewTitles[view]}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              <RefreshCcw size={13} />
              Refresh
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck size={13} />
              Admin
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-10">Loading…</p>
          ) : (
            <>
              {view === "dashboard" && <DashboardView businesses={businesses} />}

              {view === "accounts-new" && (
                <AccountsTable
                  title="New Account Requests"
                  businesses={newRequests}
                  emptyText="No pending signups right now."
                  busyId={busyId}
                  onApprove={approve}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              )}

              {view === "accounts-active" && (
                <AccountsTable
                  title="Active Accounts"
                  businesses={activeAccounts}
                  emptyText="No active accounts yet."
                  busyId={busyId}
                  onSuspend={suspend}
                  onReinstate={reinstate}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              )}

              {view === "accounts-expired" && (
                <AccountsTable
                  title="Expired Accounts"
                  businesses={expiredAccounts}
                  emptyText="No expired accounts."
                  busyId={busyId}
                  onRenew={renew}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                />
              )}

              {view === "billing-billed" && (
                <AccountsTable
                  title="Billed Accounts"
                  businesses={billedAccounts}
                  emptyText="No billed accounts yet."
                  busyId={busyId}
                  onMarkUnbilled={markUnbilled}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  showBillingColumn
                />
              )}

              {view === "billing-unbilled" && (
                <AccountsTable
                  title="Unbilled Accounts"
                  businesses={unbilledAccounts}
                  emptyText="Everyone is billed. 🎉"
                  busyId={busyId}
                  onMarkBilled={markBilled}
                  onView={setViewing}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  showBillingColumn
                />
              )}

              {view === "website-settings" && <WebsiteSettingsView />}
            </>
          )}
        </main>
      </div>

      {viewing && (
        <ViewBusinessModal business={viewing} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <EditBusinessModal
          business={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SidebarLink({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
        active ? "bg-white/10 text-white" : "text-emerald-100/70 hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SidebarGroup({
  icon,
  label,
  open,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/70 hover:bg-white/5"
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && <div className="mt-0.5 ml-3 space-y-0.5">{children}</div>}
    </div>
  );
}

function SidebarSubLink({
  label,
  badge,
  active,
  onClick,
}: {
  label: string;
  badge?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg pl-3 pr-2 py-1.5 text-[13px] font-medium ${
        active ? "bg-white/10 text-white" : "text-emerald-100/60 hover:bg-white/5"
      }`}
    >
      <span>{label}</span>
      {typeof badge === "number" && badge > 0 && (
        <span className="text-[10px] rounded-full bg-white/15 px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </button>
  );
}

// ============================================================
// Website Setting (branding + login page)
// ============================================================
function WebsiteSettingsView() {
  const [tab, setTab] = useState<"login-page">("login-page");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("login-page")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "login-page"
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Login Page
        </button>
      </div>

      {tab === "login-page" && <LoginPageSettingsTab />}
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LoginPageSettingsTab() {
  const { settings, slides, refresh } = useSiteSettings();

  const [siteName, setSiteName] = useState(settings.siteName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [savingBrand, setSavingBrand] = useState(false);
  const [brandSaved, setBrandSaved] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [slideError, setSlideError] = useState<string | null>(null);
  const [viewingSlide, setViewingSlide] = useState<SiteSlide | null>(null);
  const [editingSlide, setEditingSlide] = useState<SiteSlide | null>(null);
  const [deletingSlideId, setDeletingSlideId] = useState<string | null>(null);

  // Keep the text fields in sync whenever fresh settings load in.
  useEffect(() => {
    setSiteName(settings.siteName);
    setTagline(settings.tagline);
  }, [settings.siteName, settings.tagline]);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
        Connect Supabase first (see README) — website settings need a real
        database to store the logo, name, tagline and slides.
      </div>
    );
  }

  async function handleSaveBrand() {
    setSavingBrand(true);
    setBrandSaved(false);
    await updateSiteSettings({ siteName: siteName.trim(), tagline: tagline.trim() });
    await refresh();
    setSavingBrand(false);
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2000);
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoError(null);
    setUploadingLogo(true);
    const { url, error } = await uploadSiteImage(file, "logo");
    if (error || !url) {
      setLogoError(error ?? "Upload failed.");
      setUploadingLogo(false);
      return;
    }
    await updateSiteSettings({ logoUrl: url });
    await refresh();
    setUploadingLogo(false);
  }

  async function handleRemoveLogo() {
    setRemovingLogo(true);
    await updateSiteSettings({ logoUrl: null });
    await refresh();
    setRemovingLogo(false);
  }

  async function handleAddSlide(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSlideError(null);
    setUploadingSlide(true);
    const { url, error } = await uploadSiteImage(file, "slides");
    if (error || !url) {
      setSlideError(error ?? "Upload failed.");
      setUploadingSlide(false);
      return;
    }
    await addSiteSlide(url);
    await refresh();
    setUploadingSlide(false);
  }

  async function handleDeleteSlide(slide: SiteSlide) {
    if (!window.confirm("Delete this slide? This can't be undone.")) return;
    setDeletingSlideId(slide.id);
    await deleteSiteSlide(slide.id);
    await refresh();
    setDeletingSlideId(null);
  }

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Logo"
        description="Shown on the login, sign-up and admin screens."
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={settings.siteName}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageOff size={20} className="text-slate-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
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
                  onChange={handleLogoChange}
                  disabled={uploadingLogo}
                />
              </label>
              {settings.logoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3"
                  onClick={handleRemoveLogo}
                  disabled={removingLogo}
                >
                  {removingLogo ? "Removing…" : "Remove"}
                </Button>
              )}
            </div>
            {logoError && <p className="text-xs text-red-600">{logoError}</p>}
            <p className="text-[11px] text-slate-400">PNG or SVG, square works best.</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Website name & tagline"
        description="The name replaces every hardcoded mention across the site; the tagline appears on the login screen."
      >
        <div className="space-y-3.5 max-w-md">
          <div>
            <Label htmlFor="site-name">Website name</Label>
            <Input
              id="site-name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Bahar-e-Madina"
            />
          </div>
          <div>
            <Label htmlFor="site-tagline">Tagline</Label>
            <Input
              id="site-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Run your commission business with confidence."
            />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Button
              type="button"
              onClick={handleSaveBrand}
              disabled={savingBrand || !siteName.trim()}
            >
              {savingBrand ? "Saving…" : "Save changes"}
            </Button>
            {brandSaved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 size={14} />
                Saved
              </span>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Login page slides"
        description="Rotating images shown on the left panel of the login screen."
      >
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          {uploadingSlide ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImagePlus size={14} />
          )}
          {uploadingSlide ? "Uploading…" : "Add slide"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAddSlide}
            disabled={uploadingSlide}
          />
        </label>
        {slideError && <p className="text-xs text-red-600 mt-2">{slideError}</p>}

        {slides.length === 0 ? (
          <p className="text-sm text-slate-400 mt-4">
            No slides added yet — the login page will show the default feature
            highlights until you add one.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {slides.map((slide) => (
              <div
                key={slide.id}
                className="rounded-xl border border-slate-200 overflow-hidden bg-white"
              >
                <div className="h-28 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={slide.title ?? ""}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {slide.title || "Untitled slide"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {slide.caption || "No caption"}
                  </p>
                  <div className="flex items-center gap-1 mt-2.5">
                    <button
                      onClick={() => setViewingSlide(slide)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => setEditingSlide(slide)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide)}
                      disabled={deletingSlideId === slide.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsCard>

      {viewingSlide && (
        <Modal title={viewingSlide.title || "Slide preview"} onClose={() => setViewingSlide(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingSlide.imageUrl}
            alt={viewingSlide.title ?? ""}
            className="w-full rounded-lg object-cover"
          />
          {viewingSlide.caption && (
            <p className="text-sm text-slate-600 mt-3">{viewingSlide.caption}</p>
          )}
        </Modal>
      )}

      {editingSlide && (
        <EditSlideModal
          slide={editingSlide}
          onClose={() => setEditingSlide(null)}
          onSaved={() => {
            setEditingSlide(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function EditSlideModal({
  slide,
  onClose,
  onSaved,
}: {
  slide: SiteSlide;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(slide.title ?? "");
  const [caption, setCaption] = useState(slide.caption ?? "");
  const [imageUrl, setImageUrl] = useState(slide.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReplaceImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    const { url, error: uploadError } = await uploadSiteImage(file, "slides");
    if (uploadError || !url) {
      setError(uploadError ?? "Upload failed.");
      setUploading(false);
      return;
    }
    setImageUrl(url);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await updateSiteSlide(slide.id, {
      title: title.trim() || null,
      caption: caption.trim() || null,
      imageUrl,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <Modal title="Edit slide" onClose={onClose}>
      <div className="space-y-3.5">
        <div className="h-32 rounded-lg overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 h-9 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ImagePlus size={14} />
          )}
          {uploading ? "Uploading…" : "Replace image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReplaceImage}
            disabled={uploading}
          />
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div>
          <Label htmlFor="slide-title">Title (optional)</Label>
          <Input
            id="slide-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="slide-caption">Caption (optional)</Label>
          <Input
            id="slide-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminDashboard />
    </AdminAuthGate>
  );
}
