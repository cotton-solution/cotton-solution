import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a staff login for the caller's business.
 *
 * Runs only on the server (Route Handlers never ship to the browser),
 * because it needs the Supabase *service role* key to create another
 * person's auth account — the anon key the rest of the app uses can't
 * do that, on purpose. Set SUPABASE_SERVICE_ROLE_KEY in your Vercel /
 * .env.local environment (never as NEXT_PUBLIC_*, or it would be sent
 * to the browser).
 *
 * Only the business owner may call this: we resolve the caller's
 * identity from the bearer token they send (their own logged-in
 * session), then look up a business they own with the same anon-key
 * client so Postgres RLS itself proves ownership — the service-role
 * client is only touched afterwards, once that check passes.
 */

const ROLES = ["admin", "accountant", "trader", "viewer", "custom"] as const;

function randomPassword(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2).toUpperCase() +
    "!9"
  );
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Supabase is not fully configured on the server (missing SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    role?: string;
    moduleKeys?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const role = body.role as (typeof ROLES)[number];
  const moduleKeys = Array.isArray(body.moduleKeys) ? body.moduleKeys : [];

  if (!name || !email || !ROLES.includes(role)) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  // 1. Confirm the caller is signed in and owns a business — using the
  //    anon key + their token, so RLS ("owner_id = auth.uid()") decides.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await callerClient.auth.getUser(token);
  if (callerErr || !caller) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: ownedBusiness, error: businessErr } = await callerClient
    .from("businesses")
    .select("id")
    .eq("owner_id", caller.id)
    .maybeSingle();

  if (businessErr || !ownedBusiness) {
    return NextResponse.json(
      { error: "Only the business owner can add team members." },
      { status: 403 }
    );
  }

  // 2. Now use the service-role client (server-only) to create the
  //    staff member's login and their membership row.
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tempPassword = randomPassword();
  const { data: created, error: createErr } =
    await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        // Tells the handle_new_auth_user trigger not to spin up a
        // second "business" row for this login — see migration_5.
        skip_business_creation: true,
      },
    });

  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "Could not create the login." },
      { status: 400 }
    );
  }

  const { error: memberErr } = await adminClient.from("business_members").insert({
    business_id: ownedBusiness.id,
    user_id: created.user.id,
    email,
    name,
    role,
    module_keys: role === "custom" ? moduleKeys : [],
  });

  if (memberErr) {
    // Roll back the just-created login so a failed invite doesn't leave
    // an orphaned account with no business access.
    await adminClient.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: memberErr.message }, { status: 400 });
  }

  return NextResponse.json({ tempPassword });
}
