// Main-admin actions on the ledger: approve, reject, settle cash, adjust paid-until.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp, extendPaidUntil } from "../_shared/admin.ts";
import { sendPaymentReceiptSms } from "../_shared/sms.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isMainAdmin) return json({ error: "Only the main admin can do this." }, 403, H);
    const ip = clientIp(req);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "approve" || action === "reject") {
      const txId = String(body.transaction_id ?? "");
      const { data: tx } = await svc.from("membership_transactions").select("*").eq("id", txId).maybeSingle();
      if (!tx) return json({ error: "Entry not found" }, 404, H);

      if (action === "reject") {
        await svc.from("membership_transactions").update({
          state: "rejected",
          rejected_reason: body.reason ? String(body.reason) : "Not verified",
          approved_by: caller.userId,
          approved_at: new Date().toISOString(),
        }).eq("id", txId);
        await audit(svc, caller, "reject_payment", "membership_transactions", txId, { reason: body.reason }, ip);
        return json({ ok: true }, 200, H);
      }

      const { data: member } = await svc.from("profiles")
        .select("paid_up_until, monthly_fee_amount, full_name, phone_e164, membership_id")
        .eq("user_id", tx.member_user_id).maybeSingle();
      const fee = tx.monthly_fee_amount ?? member?.monthly_fee_amount ?? 0;
      const months = tx.months_covered ?? (fee > 0 ? Math.floor(tx.amount_inr / fee) : 0);
      const periodEnd = months > 0 ? extendPaidUntil(member?.paid_up_until ?? null, months) : null;

      await svc.from("membership_transactions").update({
        state: "success",
        months_covered: months || null,
        period_end: periodEnd,
        approved_by: caller.userId,
        approved_at: new Date().toISOString(),
      }).eq("id", txId);

      if (periodEnd) {
        await svc.from("profiles").update({
          paid_up_until: periodEnd,
          last_paid_month: `${periodEnd.slice(0, 7)}-01`,
          member_status: "active",
        }).eq("user_id", tx.member_user_id);

        await sendPaymentReceiptSms(svc, {
          memberUserId: tx.member_user_id,
          membershipId: member?.membership_id ?? tx.membership_id ?? null,
          name: member?.full_name ?? null,
          phone: member?.phone_e164 ?? null,
          amount: tx.amount_inr,
          paidUntil: periodEnd,
          transactionId: txId,
        });
      }
      await audit(svc, caller, "approve_payment", "membership_transactions", txId,
        { amount: tx.amount_inr, months, period_end: periodEnd }, ip);
      return json({ ok: true, period_end: periodEnd }, 200, H);
    }

    if (action === "settle") {
      const ids: string[] = Array.isArray(body.transaction_ids) ? body.transaction_ids.map(String) : [];
      if (!ids.length) return json({ error: "Nothing to settle" }, 400, H);
      await svc.from("membership_transactions").update({
        settled: true, settled_at: new Date().toISOString(), settled_by: caller.userId,
      }).in("id", ids);
      await audit(svc, caller, "settle_cash", "membership_transactions", null, { count: ids.length, ids }, ip);
      return json({ ok: true, count: ids.length }, 200, H);
    }

    if (action === "delete_cash") {
      const ids: string[] = Array.isArray(body.transaction_ids) ? body.transaction_ids.map(String) : [];
      if (!ids.length) return json({ error: "Nothing to remove" }, 400, H);
      const { data: rows } = await svc.from("membership_transactions")
        .select("id, amount_inr, membership_id, source, settled").in("id", ids);
      const cashIds = (rows ?? []).filter((r: any) => r.source === "cash" && !r.settled).map((r: any) => r.id);
      if (!cashIds.length) return json({ error: "Only unsettled cash entries can be removed." }, 400, H);
      const { error } = await svc.from("membership_transactions").delete().in("id", cashIds);
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "delete_cash", "membership_transactions", null,
        { count: cashIds.length, removed: rows }, ip);
      return json({ ok: true, count: cashIds.length }, 200, H);
    }

    if (action === "adjust_member") {
      const userId = String(body.user_id ?? "");
      const patch: Record<string, unknown> = {};
      if (body.paid_up_until !== undefined) patch.paid_up_until = body.paid_up_until || null;
      if (body.monthly_fee_amount !== undefined) patch.monthly_fee_amount = body.monthly_fee_amount || null;
      if (body.plan !== undefined) patch.plan = body.plan || null;
      if (body.chapter !== undefined) patch.chapter = body.chapter || null;
      if (body.member_status !== undefined) patch.member_status = body.member_status || "none";
      if (!userId || !Object.keys(patch).length) return json({ error: "Nothing to change" }, 400, H);
      const { error } = await svc.from("profiles").update(patch).eq("user_id", userId);
      if (error) return json({ error: error.message }, 400, H);
      await audit(svc, caller, "adjust_member", "profiles", userId, patch, ip);
      return json({ ok: true }, 200, H);
    }

    return json({ error: "Unknown action" }, 400, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
