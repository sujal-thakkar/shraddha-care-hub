import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, registrationId, name, email } = await req.json();

    const validTypes = [
      "registration_confirmation",
      "event_reminder",
      "thank_you_attended",
      "missed_event_followup",
    ];
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ message: "Email not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let subject = "";
    let html = "";

    if (type === "registration_confirmation") {
      // Send to participant
      subject = "🌿 Registration Confirmed — Mumbai Health Camp";
      html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0d9668; margin: 0;">Thank you for registering, ${name}! 🌿</h1>
          </div>
          <p>We are excited to have you at the <strong>Mumbai Senior Citizens' Meet & Health Wellness Camp</strong>.</p>
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>📅 Date:</strong> March 15, 2026</p>
            <p style="margin: 4px 0;"><strong>🕘 Time:</strong> 9:00 AM – 10:00 AM</p>
            <p style="margin: 4px 0;"><strong>📍 Venue:</strong> J.B. Sadan, Hall above New Angel Medical, Ludrick Stop, Mardes – Wagholi, Nala Sopara West, Mumbai</p>
          </div>
          <p>Your health and happiness are our priority. We will send a reminder a day before the event.</p>
          <p style="margin-top: 24px; color: #666;">Need help? Call us at <a href="tel:+917811009309" style="color: #0d9668;">78110 09309</a></p>
          <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla & Shraddha NGO — Caring for our Elders</p>
        </div>
      `;

      // Send confirmation to participant
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: "Hosla & Shraddha <notifications@hosla.in>",
          to: [email],
          subject,
          html,
        }),
      });

      // Notify admins
      const { data: adminEmails } = await supabase
        .from("notification_emails")
        .select("email")
        .eq("notification_type", "event_registrations")
        .eq("is_active", true);

      if (adminEmails?.length) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
          body: JSON.stringify({
            from: "Hosla & Shraddha <notifications@hosla.in>",
            to: adminEmails.map((e) => e.email),
            subject: `📋 New Event Registration: ${name}`,
            html: `
              <h2>New Registration for Mumbai Health Camp</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Registration ID:</strong> ${registrationId}</p>
              <p><a href="https://shraddha.hosla.in/admin/dashboard/registrations">View in Dashboard</a></p>
            `,
          }),
        });
      }
    } else if (type === "event_reminder") {
      // Bulk send - fetch all non-checked-in registrations
      const { data: regs } = await supabase
        .from("event_registrations")
        .select("email, full_name");

      if (regs?.length) {
        for (const reg of regs) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: "Hosla & Shraddha <notifications@hosla.in>",
              to: [reg.email],
              subject: "🔔 Reminder: Mumbai Health Camp is Tomorrow!",
              html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h1 style="color: #0d9668;">Hi ${reg.full_name}, see you tomorrow! 🌿</h1>
                  <p>Just a friendly reminder — the <strong>Mumbai Senior Citizens' Meet & Health Wellness Camp</strong> is happening <strong>tomorrow, March 15th</strong>!</p>
                  <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0;"><strong>🕘 Time:</strong> 9:00 AM – 10:00 AM</p>
                    <p style="margin: 4px 0;"><strong>📍 Venue:</strong> J.B. Sadan, Nala Sopara West, Mumbai</p>
                  </div>
                  <p>We look forward to seeing you there. Bring your smile and your stories!</p>
                  <p style="color: #666;">Need help? <a href="tel:+917811009309" style="color: #0d9668;">78110 09309</a></p>
                  <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla & Shraddha NGO — Caring for our Elders</p>
                </div>
              `,
            }),
          });
        }
      }
    } else if (type === "thank_you_attended") {
      // Send to all checked-in participants
      const { data: attended } = await supabase
        .from("event_registrations")
        .select("email, full_name")
        .eq("checked_in", true);

      if (attended?.length) {
        for (const reg of attended) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: "Hosla & Shraddha <notifications@hosla.in>",
              to: [reg.email],
              subject: "🙏 Thank You for Attending the Mumbai Health Camp!",
              html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h1 style="color: #0d9668;">Thank you, ${reg.full_name}! 🌿</h1>
                  <p>It was wonderful having you at the <strong>Mumbai Senior Citizens' Meet & Health Wellness Camp</strong>. We hope you had a great time!</p>
                  <p>Your presence made the event truly special. Stay connected with us for more such events.</p>
                  <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0;">🌐 Visit us: <a href="https://shraddha.hosla.in" style="color: #0d9668;">shraddha.hosla.in</a></p>
                    <p style="margin: 4px 0;">📱 Follow us on social media for updates</p>
                  </div>
                  <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla & Shraddha NGO — Caring for our Elders</p>
                </div>
              `,
            }),
          });
        }
      }
    } else if (type === "missed_event_followup") {
      // Send to registered but not checked-in
      const { data: missed } = await supabase
        .from("event_registrations")
        .select("email, full_name")
        .eq("checked_in", false);

      if (missed?.length) {
        for (const reg of missed) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: "Hosla & Shraddha <notifications@hosla.in>",
              to: [reg.email],
              subject: "💚 We Missed You at the Mumbai Health Camp!",
              html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h1 style="color: #0d9668;">We missed you, ${reg.full_name}! 💚</h1>
                  <p>We noticed you couldn't make it to the <strong>Mumbai Health Camp</strong>, and we truly missed your presence.</p>
                  <p>Don't worry — we have exciting events coming up! Stay tuned and connected so you don't miss the next one.</p>
                  <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 4px 0;">🌐 Check upcoming events: <a href="https://shraddha.hosla.in/events" style="color: #0d9668;">shraddha.hosla.in/events</a></p>
                    <p style="margin: 4px 0;">📱 Follow us on social media for updates</p>
                    <p style="margin: 4px 0;">📞 Questions? Call <a href="tel:+917811009309" style="color: #0d9668;">78110 09309</a></p>
                  </div>
                  <p>We'd love to see you at our next gathering! 🌿</p>
                  <p style="color: #999; font-size: 13px; margin-top: 32px; text-align: center;">Hosla & Shraddha NGO — Caring for our Elders</p>
                </div>
              `,
            }),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
