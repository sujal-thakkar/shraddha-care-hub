import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = crypto.randomUUID().slice(0, 6);
  return (base || "story") + "-" + suffix;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { blogId, action, adminNotes } = await req.json().catch(() => ({}));
    if (!blogId || !action) {
      return new Response(JSON.stringify({ error: "blogId and action are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: blog, error: blogErr } = await service
      .from("blogs")
      .select("id, title, slug, status, author_id, published_at")
      .eq("id", blogId)
      .maybeSingle();
    if (blogErr || !blog) {
      return new Response(JSON.stringify({ error: "Blog not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updates: Record<string, unknown> = {};
    if (action === "publish") {
      updates = {
        status: "published",
        // Preserve original publish date on re-publish so re-publishing an edited post
        // does not bump it above genuinely newer stories.
        published_at: blog.published_at ?? new Date().toISOString(),
        slug: blog.slug ?? slugify(blog.title || "story"),
        admin_notes: null,
      };
    } else if (action === "approve") {
      updates = { status: "approved" };
    } else if (action === "request_changes") {
      updates = { status: "needs_changes", admin_notes: adminNotes ?? null };
    } else if (action === "archive") {
      updates = { status: "archived" };
    } else if (action === "unpublish") {
      updates = { status: "approved", published_at: null };
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await service.from("blogs").update(updates).eq("id", blogId);
    if (updErr) throw updErr;

    // Notify author via Resend (best-effort)
    try {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && (action === "publish" || action === "request_changes")) {
        const { data: authorProfile } = await service
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", blog.author_id)
          .maybeSingle();
        if (authorProfile?.email) {
          const subject = action === "publish"
            ? "Your story is live on Shraddha!"
            : "Small edits needed on your story";
          const html = action === "publish"
            ? `<p>Hello ${authorProfile.full_name ?? "there"},</p>
               <p>Your story <strong>${blog.title}</strong> has been published!</p>
               <p><a href="https://shraddha.hosla.in/blog/${updates.slug}">Read it here</a></p>`
            : `<p>Hello ${authorProfile.full_name ?? "there"},</p>
               <p>Thanks for submitting <strong>${blog.title}</strong>. We'd like a few small edits before publishing:</p>
               <blockquote>${(adminNotes ?? "").toString()}</blockquote>
               <p><a href="https://shraddha.hosla.in/blog/my-stories">Open your story to edit</a></p>`;
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: "Shraddha <notifications@hosla.in>",
              to: [authorProfile.email],
              subject,
              html,
            }),
          });
        }
      }
    } catch (e) {
      console.warn("Author notification failed:", e);
    }

    return new Response(JSON.stringify({ success: true, updates }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("publish-blog error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
