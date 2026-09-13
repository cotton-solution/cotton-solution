import { supabase } from "@/lib/supabase/client";

export type ContactPerson = {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

type ContactPersonRow = {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  sort_order: number;
};

function rowToPerson(row: ContactPersonRow): ContactPerson {
  return {
    id: row.id,
    name: row.name,
    designation: row.designation,
    phone: row.phone,
    email: row.email,
    photoUrl: row.photo_url,
    sortOrder: row.sort_order,
  };
}

export async function fetchContactPersons(): Promise<ContactPerson[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contact_persons")
    .select("id, name, designation, phone, email, photo_url, sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as ContactPersonRow[]).map(rowToPerson);
}

export async function addContactPerson(
  person: Omit<ContactPerson, "id">
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("contact_persons").insert({
    name: person.name,
    designation: person.designation,
    phone: person.phone,
    email: person.email,
    photo_url: person.photoUrl,
    sort_order: person.sortOrder,
  });
  return { error: error?.message ?? null };
}

export async function updateContactPerson(
  id: string,
  updates: Partial<Omit<ContactPerson, "id">>
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("contact_persons")
    .update({
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      ...(updates.designation !== undefined ? { designation: updates.designation } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.photoUrl !== undefined ? { photo_url: updates.photoUrl } : {}),
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteContactPerson(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("contact_persons").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export type ContactMessage = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type ContactMessageRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

function rowToMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function fetchContactMessages(): Promise<ContactMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ContactMessageRow[]).map(rowToMessage);
}

export async function markMessageRead(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: true })
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteContactMessage(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  return { error: error?.message ?? null };
}
