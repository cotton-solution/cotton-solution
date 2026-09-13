"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountsTable } from "@/components/admin/accounts-table";
import { fetchAllBusinesses, type Business } from "@/lib/supabase/businesses";

export default function BilledAccountsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await fetchAllBusinesses();
    setBusinesses(all.filter((b) => b.billingStatus === "billed"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AccountsTable
      businesses={businesses}
      loading={loading}
      onRefresh={load}
      emptyLabel="No accounts have been billed yet."
      showBillingColumn
    />
  );
}
