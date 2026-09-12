import { supabase } from "@/lib/supabase/client";
import type { Party } from "@/lib/party-data";

type PartyRow = {
  party_id: string;
  name: string;
  name_urdu: string | null;
  english_business_name: string | null;
  party_group: string | null;
  town: string | null;
  sector: string | null;
  address: string | null;
  city: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  stn: string | null;
  ntn_cnic: string | null;
  bank_account: string | null;
  contact_person: string | null;
  can_also_be_vendor: boolean;
};

function rowToParty(row: PartyRow): Party {
  return {
    id: row.party_id,
    name: row.name,
    nameUrdu: row.name_urdu ?? "",
    englishBusinessName: row.english_business_name ?? "",
    group: row.party_group ?? "",
    town: row.town ?? "",
    sector: row.sector ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    mobile: row.mobile ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    fax: row.fax ?? "",
    stn: row.stn ?? "",
    ntnCnic: row.ntn_cnic ?? "",
    bankAccount: row.bank_account ?? "",
    contactPerson: row.contact_person ?? "",
    canAlsoBeVendor: row.can_also_be_vendor,
  };
}

function partyToRow(party: Party): PartyRow {
  return {
    party_id: party.id,
    name: party.name,
    name_urdu: party.nameUrdu || null,
    english_business_name: party.englishBusinessName || null,
    party_group: party.group || null,
    town: party.town || null,
    sector: party.sector || null,
    address: party.address || null,
    city: party.city || null,
    mobile: party.mobile || null,
    phone: party.phone || null,
    email: party.email || null,
    fax: party.fax || null,
    stn: party.stn || null,
    ntn_cnic: party.ntnCnic || null,
    bank_account: party.bankAccount || null,
    contact_person: party.contactPerson || null,
    can_also_be_vendor: party.canAlsoBeVendor,
  };
}

export async function fetchPartiesFromSupabase(): Promise<Party[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("parties_customers")
    .select(
      "party_id, name, name_urdu, english_business_name, party_group, town, sector, address, city, mobile, phone, email, fax, stn, ntn_cnic, bank_account, contact_person, can_also_be_vendor"
    )
    .order("party_id", { ascending: true });

  if (error) {
    console.error("fetchPartiesFromSupabase error:", error.message);
    return [];
  }
  return (data as PartyRow[]).map(rowToParty);
}

export async function saveParty(party: Party): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("parties_customers")
    .upsert(partyToRow(party), { onConflict: "party_id" });

  return { error: error?.message ?? null };
}

export async function deletePartyById(
  partyId: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("parties_customers")
    .delete()
    .eq("party_id", partyId);

  return { error: error?.message ?? null };
}
