"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountsTable } from "@/components/admin/accounts-table";
import { fetchAllBusinesses, type Business } from "@/lib/supabase/businesses";

export default function NewAccountRequestsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await fetchAllBusinesses();
    setBusinesses(all.filter((b) => b.subscriptionStatus === "trial"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <p className="text-sm text-slate-500">
        Newly signed-up businesses waiting on your review before their account is
        activated.
      </p>
      <AccountsTable
        businesses={businesses}
        loading={loading}
        onRefresh={load}
        emptyLabel="No new account requests right now."
      />
    </>
  );
}
