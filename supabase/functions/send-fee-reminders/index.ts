// Sends membership fee reminders by email + in-app notification, and logs them.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { serviceClient, getCaller, json, audit, clientIp } from "../_shared/admin.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Hosla <noreply@hosla.in>";
const SITE_URL = "https://shraddha.hosla.in";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, reason: "no_key" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return { ok: res.ok, reason: res.ok ? "" : await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const H = { ...corsHeaders };

  try {
    const svc = serviceClient();
    const caller = await getCaller(req, svc);
    if (!caller || !caller.isAnyAdmin) return json({ error: "Not authorised" }, 403, H);

    const body = await req.json().catch(() => ({}));
    const userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids.map(String) : [];
    if (!userIds.length) return json({ error: "Pick at least one member" }, 400, H);

    const { data: members } = await svc.from("profiles")
      .select("user_id, full_name, membership_id, email, monthly_fee_amount, paid_up_until")
      .in("user_id", userIds);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await svc.from("fee_reminders")
      .select("member_user_id").in("member_user_id", userIds).gte("sent_at", since);
    const already = new Set((recent ?? []).map((r: { member_user_id: string }) => r.member_user_id));

    let sent = 0, skipped = 0;
    for (const m of members ?? []) {
      if (already.has(m.user_id)) { skipped++; continue; }

      const amount = m.monthly_fee_amount ?? 0;
      const until = m.paid_up_until ? new Date(m.paid_up_until).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
      const text = body.message
        ? String(body.message)
        : `Namaste ${m.full_name ?? "friend"}, your Hosla membership ${until ? `was paid up to ${until}` : "fee is due"}. `
          + `Monthly fee: \u20b9${amount}. You can pay online from your profile, or hand cash to any Hosla team member.`;

      if (m.email) {
        await sendEmail(m.email, "Your Hosla membership fee", `
          <div style="font-family:system-ui,sans-serif;font-size:17px;line-height:1.6;color:#111">
            <p>${text}</p>
            <p><a href="${SITE_URL}/profile" style="background:#0a7c53;color:#fff;padding:14px 22px;border-radius:8px;text-decoration:none;display:inline-block">Open my profile</a></p>
            <p style="color:#555;font-size:15px">Membership ID: <strong>${m.membership_id ?? "\u2014"}</strong><br/>\u2014 Team Hosla</p>
          </div>`);
      }

      await svc.from("author_notifications").insert({
        user_id: m.user_id,
        type: "fee_reminder",
        blog_title: "Membership fee reminder",
        comment_body: text,
      });

      await svc.from("fee_reminders").insert({
        member_user_id: m.user_id,
        membership_id: m.membership_id,
        channel: m.email ? "email+app" : "app",
        message: text,
        sent_by: caller.userId,
      });
      sent++;
    }

    await audit(svc, caller, "send_fee_reminders", "fee_reminders", null, { sent, skipped }, clientIp(req));
    return json({ sent, skipped }, 200, H);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, H);
  }
});
