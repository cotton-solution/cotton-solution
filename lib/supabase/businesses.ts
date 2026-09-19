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
  address: string | null;
  website: string | null;
  logoUrl: string | null;
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
  currency: string;
  tax_number: string | null;
  address: string | null;
  website: string | null;
  logo_url: string | null;
};

function rowToBusiness(row: BusinessRow): Business {
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
    taxNumber: row.tax_number,
    address: row.address,
    website: row.website,
    logoUrl: row.logo_url,
  };
}

const BUSINESS_COLUMNS =
  "id, owner_id, name, contact_email, contact_phone, business_category, plan, subscription_status, subscription_expires_at, billing_status, last_billed_at, created_at, currency, tax_number, address, website, logo_url";

/** The signed-in customer's own business (tenant) record, or null. */
export async function fetchMyBusiness(): Promise<Business | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBusiness(data as BusinessRow);
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
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_COLUMNS)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as BusinessRow[]).map(rowToBusiness);
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
    address?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  }
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
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
      ...(updates.address !== undefined ? { address: updates.address } : {}),
      ...(updates.website !== undefined ? { website: updates.website } : {}),
      ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
    })
    .eq("id", businessId);

  return { error: error?.message ?? null };
}

/**
 * Self-service version of the above for the Settings → Company Profile
 * page: the signed-in owner editing their own business. Same underlying
 * call — RLS ("Owner or admin can update business") is what actually
 * decides whether the update is allowed.
 */
export const updateMyCompanyProfile = updateBusinessProfile;

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
