// Creates member accounts and sets/resets their passwords.
// Team admins may create accounts, but a password reset from a team admin only
// raises a request; main admins act directly.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  serviceClient, getCaller, json, audit, clientIp,
  makeMembershipId, memberSyntheticEmail,
} from "../_shared/admin.ts";

function randomPassword() {
  const words = ["Sun", "Moon", "River", "Lotus", "Tiger", "Mango", "Rain", "Star"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}${Math.floor(1000 + Math.random() * 9000)}`;
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

    // ---- Create a member account -------------------------------------------
    if (action === "create_member") {
      const name = String(body.name ?? "").trim();
      const phone = String(body.phone ?? "").replace(/\D/g, "");
      const plan = body.plan ? String(body.plan) : null;
      const fee = body.monthly_fee_amount ? Number(body.monthly_fee_amount) : null;
      const chapter = body.chapter ? String(body.chapter) : null;
      const paidUpUntil = body.paid_up_until ? String(body.paid_up_until) : null;
      if (name.length < 2 || phone.length < 10) {
        return json({ error: "Name and a 10-digit phone number are required." }, 400, H);
      }
      const membershipId = makeMembershipId(name, phone);

      const { data: clash } = await svc.from("profiles").select("user_id").eq("membership_id", membershipId).maybeSingle();
      if (clash) return json({ error: `Membership ID ${membershipId} already exists.` }, 400, H);

      const password = String(body.password ?? "") || randomPassword();
      const email = memberSyntheticEmail(membershipId);
      const e164 = `+91${phone.slice(-10)}`;

      const { data: created, error: createErr } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, phone_e164: e164, country_code: "+91" },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Could not create account" }, 400, H);

      // handle_new_user() already inserted the profile row; fill in member fields.
      await svc.from("profiles").update({
        membership_id: membershipId,
        full_name: name,
        phone_e164: e164,
        plan,
        monthly_fee_amount: fee,
        chapter,
        paid_up_until: paidUpUntil,
        member_since: new Date().toISOString().slice(0, 10),
        member_status: paidUpUntil ? "active" : "pending_payment",
        must_change_password: true,
        status: "approved",
        approved_at: new Date().toISOString(),
      }).eq("user_id", created.user.id);

      await svc.from("user_roles").insert({ user_id: created.user.id, role: "member" });
      await audit(svc, caller, "create_member", "profiles", created.user.id, { membership_id: membershipId }, ip);

      return json({ membership_id: membershipId, password, user_id: created.user.id }, 200, H);
    }

    // ---- Set / reset a password --------------------------------------------
    if (action === "set_password") {
      const targetUserId = String(body.user_id ?? "");
      if (!targetUserId) return json({ error: "Missing member" }, 400, H);
      const { data: target } = await svc.from("profiles")
        .select("membership_id, full_name").eq("user_id", targetUserId).maybeSingle();
      if (!target) return json({ error: "Member not found" }, 404, H);

      if (!caller.isMainAdmin) {
        // Team admin: raise a request instead of acting.
        const { error } = await svc.from("credential_requests").insert({
          target_user_id: targetUserId,
          target_membership_id: target.membership_id,
          requested_by: caller.userId,
          requested_by_name: caller.fullName,
          kind: "password_reset",
          reason: body.reason ? String(body.reason) : null,
        });
        if (error) return json({ error: error.message }, 400, H);
        await audit(svc, caller, "request_password_reset", "profiles", targetUserId, {}, ip);
        return json({ requested: true }, 200, H);
      }

      const password = String(body.password ?? "") || randomPassword();
      const { error: updErr } = await svc.auth.admin.updateUserById(targetUserId, { password });
      if (updErr) return json({ error: updErr.message }, 400, H);
      await svc.from("profiles").update({ must_change_password: true }).eq("user_id", targetUserId);
      await audit(svc, caller, "set_password", "profiles", targetUserId, {}, ip);
      return json({ password }, 200, H);
    }

    // ---- Approve / reject a pending credential request ----------------------
    if (action === "review_request") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can approve this." }, 403, H);
      const requestId = String(body.request_id ?? "");
      const approve = Boolean(body.approve);
      const { data: reqRow } = await svc.from("credential_requests").select("*").eq("id", requestId).maybeSingle();
      if (!reqRow || reqRow.status !== "pending") return json({ error: "Request not found" }, 404, H);

      let password: string | null = null;
      if (approve) {
        password = randomPassword();
        const { error } = await svc.auth.admin.updateUserById(reqRow.target_user_id, { password });
        if (error) return json({ error: error.message }, 400, H);
        await svc.from("profiles").update({ must_change_password: true }).eq("user_id", reqRow.target_user_id);
      }
      await svc.from("credential_requests").update({
        status: approve ? "approved" : "rejected",
        reviewed_by: caller.userId,
        reviewed_at: new Date().toISOString(),
      }).eq("id", requestId);
      await audit(svc, caller, approve ? "approve_password_reset" : "reject_password_reset",
        "credential_requests", requestId, {}, ip);
      return json({ password }, 200, H);
    }

    // ---- Assign / remove a role (main admin only) ---------------------------
    if (action === "set_role") {
      if (!caller.isMainAdmin) return json({ error: "Only the main admin can change roles." }, 403, H);
      const targetUserId = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      const grant = Boolean(body.grant);
      if (!["member", "team_admin", "main_admin", "admin"].includes(role)) {
        return json({ error: "Unknown role" }, 400, H);
      }
      if (grant) {
        await svc.from("user_roles").insert({ user_id: targetUserId, role }).select();
      } else {
        await svc.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role);
      }
      await audit(svc, caller, grant ? "grant_role" : "revoke_role", "user_roles", targetUserId, { role }, ip);
      return json({ ok: true }, 200, H);
    }

    return json({ error: "Unknown action" }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
