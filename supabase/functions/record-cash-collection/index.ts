// Records cash collected in person. The receiver records it, never the elder.
// Team admins create pending_approval entries; main admins are self-approved.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  serviceClient, getCaller, json, audit, clientIp, monthsCovered, extendPaidUntil,
} from "../_shared/admin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);
    const ip = clientIp(req);

    const body = await req.json().catch(() => ({}));
    const memberUserId = String(body.member_user_id ?? "");
    const amount = Number(body.amount_inr ?? 0);
    const receiverName = String(body.receiver_name ?? "").trim() || caller.fullName || "Office";
    if (!memberUserId) return json({ error: "Pick a member" }, 400, H);
    if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Enter a valid amount" }, 400, H);

    const { data: member } = await svc.from("profiles")
      .select("user_id, full_name, membership_id, plan, monthly_fee_amount, paid_up_until, email")
      .eq("user_id", memberUserId).maybeSingle();
    if (!member) return json({ error: "Member not found" }, 404, H);

    const fee = member.monthly_fee_amount ?? 0;
    const months = monthsCovered(amount, fee);
    const selfApproved = caller.isMainAdmin;

    const periodEnd = months > 0 ? extendPaidUntil(member.paid_up_until, months) : null;

    const { data: tx, error } = await svc.from("membership_transactions").insert({
      member_user_id: memberUserId,
      membership_id: member.membership_id,
      amount_inr: amount,
      monthly_fee_amount: fee || null,
      months_covered: months || null,
      period_end: periodEnd,
      source: "cash",
      state: selfApproved ? "success" : "pending_approval",
      receiver_name: receiverName,
      recorded_by: caller.userId,
      approved_by: selfApproved ? caller.userId : null,
      approved_at: selfApproved ? new Date().toISOString() : null,
      note: body.note ? String(body.note) : null,
    }).select().single();
    if (error) return json({ error: error.message }, 400, H);

    if (selfApproved && periodEnd) {
      await svc.from("profiles").update({
        paid_up_until: periodEnd,
        last_paid_month: `${periodEnd.slice(0, 7)}-01`,
        member_status: "active",
      }).eq("user_id", memberUserId);
    }

    await audit(svc, caller, "record_cash", "membership_transactions", tx.id,
      { amount, months, receiver: receiverName, membership_id: member.membership_id }, ip);

    return json({ transaction: tx, months, period_end: periodEnd }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
