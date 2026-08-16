// Builds the import review list from the Active Members sheet and approved
// membership applications, and activates reviewed rows into real accounts.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  serviceClient, getCaller, json, audit, clientIp, makeMembershipId, memberSyntheticEmail,
} from "../_shared/admin.ts";

function randomPassword() {
  const words = ["Sun", "Moon", "River", "Lotus", "Tiger", "Mango", "Rain", "Star"];
  return `${words[Math.floor(Math.random() * words.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

/** "2026-07" or "2026-07-01" -> first day of that month. */
function monthStart(raw: unknown): string | null {
  const m = String(raw ?? "").trim().match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-01` : null;
}

/** Last day of the month a member has paid for. */
function monthEnd(monthStartISO: string) {
  const [y, mo] = monthStartISO.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);
    const ip = clientIp(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    // ---- Build / refresh the staging list -----------------------------------
    if (action === "prepare") {
      const [{ data: sheet }, { data: apps }, { data: existing }] = await Promise.all([
        svc.from("active_members").select("name, phone_digits"),
        svc.from("membership_applications").select("name, email, child_contact, plan").eq("status", "approved"),
        svc.from("member_imports").select("name, phone_digits"),
      ]);

      const seen = new Set((existing ?? []).map((r: { name: string; phone_digits: string | null }) =>
        `${r.name.toLowerCase()}|${r.phone_digits ?? ""}`));

      const rows: Record<string, unknown>[] = [];
      for (const m of sheet ?? []) {
        const k = `${m.name.toLowerCase()}|${m.phone_digits}`;
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push({
          source: "active_members_sheet",
          name: m.name,
          phone_digits: m.phone_digits,
          membership_id: makeMembershipId(m.name, m.phone_digits),
        });
      }
      for (const a of apps ?? []) {
        const digits = (a.child_contact ?? "").replace(/\D/g, "").slice(-10);
        const k = `${a.name.toLowerCase()}|${digits}`;
        if (seen.has(k)) continue;
        seen.add(k);
        rows.push({
          source: "membership_application",
          name: a.name,
          phone_digits: digits || null,
          email: a.email,
          plan: a.plan,
          membership_id: digits ? makeMembershipId(a.name, digits) : null,
        });
      }

      if (rows.length) await svc.from("member_imports").insert(rows);
      await audit(svc, caller, "prepare_imports", "member_imports", null, { added: rows.length }, ip);
      return json({ added: rows.length }, 200, H);
    }

    // ---- Activate a reviewed row into a real member account ------------------
    if (action === "activate") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can activate memberships." }, 403, H);
      const id = String(body.import_id ?? "");
      const { data: row } = await svc.from("member_imports").select("*").eq("id", id).maybeSingle();
      if (!row || row.status === "activated") return json({ error: "Row not found" }, 404, H);
      if (!row.phone_digits) return json({ error: "This row has no phone number yet." }, 400, H);

      const membershipId = row.membership_id || makeMembershipId(row.name, row.phone_digits);
      const { data: clash } = await svc.from("profiles").select("user_id").eq("membership_id", membershipId).maybeSingle();

      let userId = clash?.user_id as string | undefined;
      let password: string | null = null;

      if (!userId) {
        password = randomPassword();
        const { data: created, error } = await svc.auth.admin.createUser({
          email: memberSyntheticEmail(membershipId),
          password,
          email_confirm: true,
          user_metadata: { full_name: row.name, phone_e164: `+91${row.phone_digits}`, country_code: "+91" },
        });
        if (error || !created.user) return json({ error: error?.message ?? "Could not create account" }, 400, H);
        userId = created.user.id;
        await svc.from("user_roles").insert({ user_id: userId, role: "member" });
      }

      await svc.from("profiles").update({
        membership_id: membershipId,
        full_name: row.name,
        email: row.email ?? null,
        plan: row.plan ?? null,
        monthly_fee_amount: row.monthly_fee_amount ?? null,
        paid_up_until: row.paid_up_until ?? null,
        chapter: row.chapter ?? null,
        member_status: row.paid_up_until ? "active" : "pending_payment",
        must_change_password: Boolean(password),
        status: "approved",
      }).eq("user_id", userId);

      await svc.from("member_imports").update({
        status: "activated", linked_user_id: userId, membership_id: membershipId,
      }).eq("id", id);

      await audit(svc, caller, "activate_member", "member_imports", id, { membership_id: membershipId }, ip);
      return json({ membership_id: membershipId, password, user_id: userId }, 200, H);
    }

    return json({ error: "Unknown action" }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
