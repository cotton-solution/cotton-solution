"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountsTable } from "@/components/admin/accounts-table";
import { fetchAllBusinesses, type Business } from "@/lib/supabase/businesses";

export default function ExpiredAccountsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await fetchAllBusinesses();
    setBusinesses(
      all.filter(
        (b) => b.subscriptionStatus === "expired" || b.subscriptionStatus === "suspended"
      )
    );
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
      emptyLabel="No expired or suspended accounts."
    />
  );
}
