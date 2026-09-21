"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Database, ArrowRight, Truck } from "lucide-react";
import { mockParties, isVendorParty, type Party } from "@/lib/party-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPartiesFromSupabase } from "@/lib/supabase/parties";
import { RecordsTable, type Column } from "@/components/records-table";

type VendorRow = Party & { id: string };

export default function SuppliersPage() {
  const [parties, setParties] = useState<Party[]>(
    isSupabaseConfigured ? [] : mockParties
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    setLoading(true);
    fetchPartiesFromSupabase()
      .then((rows) => !cancelled && setParties(rows))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const vendors: VendorRow[] = useMemo(
    () => parties.filter(isVendorParty).map((p) => ({ ...p, id: p.id })),
    [parties]
  );

  const columns: Column<VendorRow>[] = [
    {
      key: "name",
      header: "Vendor",
      searchValue: (r) => `${r.name} ${r.id} ${r.town}`,
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500">{r.id}</p>
        </div>
      ),
    },
    { key: "town", header: "Town", render: (r) => r.town || "—" },
    { key: "sector", header: "Sector", render: (r) => r.sector || "—" },
    { key: "mobile", header: "Contact", render: (r) => r.mobile || r.phone || "—" },
    {
      key: "ntn",
      header: "NTN / CNIC",
      render: (r) => r.ntnCnic || "—",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Suppliers / Vendors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every party flagged as a vendor — contact info and quick access
            to their ledger.
          </p>
        </div>
        <Link
          href="/sales/customers"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
        >
          Add / edit a vendor
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Demo notice only — nothing about the backend is shown to real customers. */}
      {!isSupabaseConfigured && (
        <div className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 bg-amber-50 text-amber-700">
          <Database size={14} />
          Demo mode — sample data shown. Connect Supabase to see your own vendors (see README).
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-card">
        <RecordsTable
          rows={vendors}
          columns={columns}
          loading={loading}
          searchPlaceholder="Search vendors…"
          emptyLabel="No vendors yet. Mark a party as a vendor from Sales & Receivables → Customers."
        />
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
          <Truck size={18} />
        </div>
        <p className="text-sm text-slate-500">
          Customers and vendors share the same party directory — open a
          party from <span className="font-medium text-slate-700">Customers</span>{" "}
          and turn on &quot;Can also be a vendor&quot; to have them appear here.
        </p>
      </div>
    </div>
  );
}
