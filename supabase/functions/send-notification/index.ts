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
    const { type, reportId, email, name } = await req.json();
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email notification");
      return new Response(JSON.stringify({ message: "Email notifications not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get notification emails
    const { data: emails } = await supabase
      .from("notification_emails")
      .select("email")
      .eq("notification_type", type === "abuse_report" ? "abuse_reports" : "volunteer_applications")
      .eq("is_active", true);

    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ message: "No notification emails configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientEmails = emails.map(e => e.email);
    
    let subject = "";
    let html = "";

    if (type === "abuse_report") {
      subject = "🚨 New Abuse Report Submitted - Shraddha";
      html = `
        <h1>New Abuse Report</h1>
        <p>A new abuse report has been submitted through the Shraddha website.</p>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p>Please log in to the admin dashboard to review the full details.</p>
        <p><a href="${supabaseUrl.replace('.supabase.co', '')}/admin/dashboard/reports">View Report</a></p>
      `;
    } else if (type === "volunteer_application") {
      subject = "🙋 New Volunteer Application - Shraddha";
      html = `
        <h1>New Volunteer Application</h1>
        <p>A new volunteer application has been received!</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Please log in to the admin dashboard to review the full application.</p>
        <p><a href="${supabaseUrl.replace('.supabase.co', '')}/admin/dashboard/volunteers">View Application</a></p>
      `;
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Shraddha <notifications@hosla.in>",
        to: recipientEmails,
        subject,
        html,
      }),
    });

    const data = await res.json();
    console.log("Email sent:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
