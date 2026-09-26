import { supabase } from "@/lib/supabase/client";

export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";
export type BillingStatus = "billed" | "unbilled";
export type BusinessCategory =
  | "shopkeeper"
  | "wholesaler"
  | "distributor"
  | "trader"
  | "manufacturer";

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  shopkeeper: "Shopkeeper",
  wholesaler: "Wholesaler",
  distributor: "Distributor",
  trader: "Trader",
  manufacturer: "Manufacturer",
};

export type Business = {
  id: string;
  ownerId: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  category: BusinessCategory | null;
  plan: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
  billingStatus: BillingStatus;
  lastBilledAt: string | null;
  createdAt: string;
  currency: string;
  taxNumber: string | null;
  gstNumber: string | null;
  address: string | null;
  website: string | null;
  logoUrl: string | null;
  /**
   * False when the database is missing the company-profile columns
   * (added by migration_7) — the business is still loaded so its name
   * shows, but logo / address / tax details can't be saved until that
   * migration is run.
   */
  profileReady?: boolean;
};

type BusinessRow = {
  id: string;
  owner_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  business_category: BusinessCategory | null;
  plan: string;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  billing_status: BillingStatus;
  last_billed_at: string | null;
  created_at: string;
  currency?: string;
  tax_number?: string | null;
  gst_number?: string | null;
  address?: string | null;
  website?: string | null;
  logo_url?: string | null;
};

function rowToBusiness(row: BusinessRow, profileReady = true): Business {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    category: row.business_category,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    subscriptionExpiresAt: row.subscription_expires_at,
    billingStatus: row.billing_status,
    lastBilledAt: row.last_billed_at,
    createdAt: row.created_at,
    currency: row.currency ?? "PKR",
    taxNumber: row.tax_number ?? null,
    gstNumber: row.gst_number ?? null,
    address: row.address ?? null,
    website: row.website ?? null,
    logoUrl: row.logo_url ?? null,
    profileReady,
  };
}

const CORE_COLUMNS =
  "id, owner_id, name, contact_email, contact_phone, business_category, plan, subscription_status, subscription_expires_at, billing_status, last_billed_at, created_at";
const PROFILE_COLUMNS = "currency, tax_number, address, website, logo_url";
// gst_number arrives with migration_22, after the rest of the profile
// columns (migration_7) — kept separate so a business can still load
// (and the rest of the profile still work) before that migration runs.
const GST_COLUMN = "gst_number";
const BUSINESS_COLUMNS = `${CORE_COLUMNS}, ${PROFILE_COLUMNS}, ${GST_COLUMN}`;
const BUSINESS_COLUMNS_NO_GST = `${CORE_COLUMNS}, ${PROFILE_COLUMNS}`;

export type MyBusinessResult = {
  business: Business | null;
  /** Why no business could be loaded (null when it simply doesn't exist). */
  error: string | null;
};

/**
 * The signed-in customer's own business (tenant) record, plus the reason
 * if it couldn't be loaded — so the app can say *why* the company name /
 * profile is missing instead of silently showing "My Business".
 *
 *  - The user's own business is looked up first by `owner_id`. (A plain
 *    "give me the one row I can see" breaks for platform admins, who can
 *    see every business.)
 *  - A staff login has no business of their own; row-level security only
 *    lets them see their employer's, so a second, unfiltered query finds it.
 *  - If the company-profile columns from migration_7 don't exist yet, the
 *    business is loaded without them rather than not at all.
 */
export async function fetchMyBusinessWithStatus(): Promise<MyBusinessResult> {
  if (!supabase) return { business: null, error: null };
  const client = supabase;

  const {
    data: { user },
  } = await client.auth.getUser();
  const ownerId = user?.id ?? null;

  const query = (columns: string, owner: string | null) => {
    let q = client.from("businesses").select(columns);
    if (owner) q = q.eq("owner_id", owner);
    // Two rows so an ambiguous match (several visible, none ours) is
    // detected and rejected instead of picking one at random.
    return q.order("created_at", { ascending: true }).limit(2);
  };

  let lastError: string | null = null;

  for (const owner of ownerId ? [ownerId, null] : [null]) {
    let profileReady = true;
    let res = await query(BUSINESS_COLUMNS, owner);
    if (res.error) {
      const noGst = await query(BUSINESS_COLUMNS_NO_GST, owner);
      if (!noGst.error) {
        res = noGst;
      } else {
        const core = await query(CORE_COLUMNS, owner);
        if (core.error) {
          lastError = core.error.message;
          continue;
        }
        res = core;
        profileReady = false;
      }
    }
    const rows = (res.data ?? []) as unknown as BusinessRow[];
    // With an owner filter one row is the answer; without it, only trust an
    // unambiguous single row.
    if (rows.length === 1 || (owner && rows.length > 1)) {
      return { business: rowToBusiness(rows[0], profileReady), error: null };
    }
  }

  return { business: null, error: lastError };
}

/** The signed-in customer's own business (tenant) record, or null. */
export async function fetchMyBusiness(): Promise<Business | null> {
  return (await fetchMyBusinessWithStatus()).business;
}

/**
 * Creates the tenant ("business") row for a brand-new signup. Safe to
 * call more than once — if a business already exists for this user
 * (unique index on owner_id), the insert is a no-op conflict.
 */
export async function createBusinessForCurrentUser(
  name: string,
  contactEmail: string,
  category?: BusinessCategory
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("businesses").insert({
    owner_id: user.id,
    name,
    contact_email: contactEmail,
    business_category: category ?? null,
  });

  // Unique violation just means the business already exists — fine.
  if (error && error.code !== "23505") {
    return { error: error.message };
  }
  return { error: null };
}

/** Admin-only: every registered business, newest first. */
export async function fetchAllBusinesses(): Promise<Business[]> {
  if (!supabase) return [];
  let profileReady = true;
  let res = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .order("created_at", { ascending: false });
  if (res.error) {
    const noGst = await supabase
      .from("businesses")
      .select(BUSINESS_COLUMNS_NO_GST)
      .order("created_at", { ascending: false });
    if (!noGst.error) {
      res = noGst as unknown as typeof res;
    } else {
      const core = await supabase
        .from("businesses")
        .select(CORE_COLUMNS)
        .order("created_at", { ascending: false });
      if (core.error) return [];
      res = core as unknown as typeof res;
      profileReady = false;
    }
  }
  if (!res.data) return [];
  return (res.data as unknown as BusinessRow[]).map((r) =>
    rowToBusiness(r, profileReady)
  );
}

/** Admin-only: change a business's plan / subscription status / expiry. */
export async function updateBusinessSubscription(
  businessId: string,
  updates: {
    plan?: string;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionExpiresAt?: string | null;
  }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("businesses")
    .update({
      ...(updates.plan !== undefined ? { plan: updates.plan } : {}),
      ...(updates.subscriptionStatus !== undefined
        ? { subscription_status: updates.subscriptionStatus }
        : {}),
      ...(updates.subscriptionExpiresAt !== undefined
        ? { subscription_expires_at: updates.subscriptionExpiresAt }
        : {}),
    })
    .eq("id", businessId);

  return { error: error?.message ?? null };
}

/** Admin-only: edit a business's own profile info (name, contact, category). */
export async function updateBusinessProfile(
  businessId: string,
  updates: {
    name?: string;
    contactEmail?: string | null;
    contactPhone?: string | null;
    category?: BusinessCategory | null;
    currency?: string;
    taxNumber?: string | null;
    gstNumber?: string | null;
    address?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { data, error } = await supabase
    .from("businesses")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.contactEmail !== undefined
        ? { contact_email: updates.contactEmail }
        : {}),
      ...(updates.contactPhone !== undefined
        ? { contact_phone: updates.contactPhone }
        : {}),
      ...(updates.category !== undefined
        ? { business_category: updates.category }
        : {}),
      ...(updates.currency !== undefined ? { currency: updates.currency } : {}),
      ...(updates.taxNumber !== undefined ? { tax_number: updates.taxNumber } : {}),
      ...(updates.gstNumber !== undefined ? { gst_number: updates.gstNumber } : {}),
      ...(updates.address !== undefined ? { address: updates.address } : {}),
      ...(updates.website !== undefined ? { website: updates.website } : {}),
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
    })
    .eq("id", businessId)
    .select("id");

  if (error) {
    if (/gst_number/i.test(error.message)) {
      return {
        error:
          "GST number needs one database update. Run supabase/migration_22_business_logo_and_gst.sql once in the Supabase SQL Editor, then save again.",
      };
    }
    return { error: error.message };
  }
  // Row-level security doesn't raise an error when it blocks an update —
  // it just matches zero rows. Treat that as "not allowed".
  if (!data || data.length === 0) {
    return {
      error: "You don't have permission to change these company details.",
    };
  }
  return { error: null };
}

/**
 * Self-service logo upload for Settings → Company Profile: uploads to
 * the business's own folder in the public "business-logos" bucket
 * (migration_22) and returns its public URL. The caller still has to
 * save that URL onto the business record (updateMyCompanyProfile).
 */
export async function uploadBusinessLogo(
  businessId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: "Supabase is not configured." };

  const ext = file.name.split(".").pop() || "png";
  const path = `${businessId}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("business-logos")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    if (/bucket not found/i.test(uploadError.message)) {
      return {
        url: null,
        error:
          "Logo upload needs one database update. Run supabase/migration_22_business_logo_and_gst.sql once in the Supabase SQL Editor, then try again.",
      };
    }
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

/**
 * Self-service version for Settings → Company Profile. The company name
 * is deliberately NOT changeable here — only a platform admin can rename
 * a business (from the Service Admin dashboard). It's stripped here and
 * also enforced by a database trigger (migration_9), so it can't be
 * bypassed from the browser.
 * Who may save the remaining fields (owner, or staff with Settings
 * access) is decided by the row-level-security policy.
 */
export function updateMyCompanyProfile(
  businessId: string,
  updates: Parameters<typeof updateBusinessProfile>[1]
): Promise<{ error: string | null }> {
  const safe = { ...updates };
  delete safe.name;
  return updateBusinessProfile(businessId, safe);
}

/** Admin-only: mark a business billed / unbilled for the current cycle. */
export async function setBillingStatus(
  businessId: string,
  billingStatus: BillingStatus
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("businesses")
    .update({
      billing_status: billingStatus,
      last_billed_at: billingStatus === "billed" ? new Date().toISOString() : null,
    })
    .eq("id", businessId);

  return { error: error?.message ?? null };
}

/** Admin-only: permanently delete a business and all of its data. */
export async function deleteBusiness(
  businessId: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("businesses").delete().eq("id", businessId);
  return { error: error?.message ?? null };
}

/** Whether the signed-in user is a service-owner admin. */
export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return !error && !!data;
}
