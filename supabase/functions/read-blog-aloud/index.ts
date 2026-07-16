import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Voice/locale mapping for Murf Falcon.
// If a voice id turns out to be invalid at runtime, Murf will 400 and the
// error is surfaced; we then update this map.
function pickVoice(language: string | null | undefined): { voiceId: string; locale: string } {
  const lang = (language || "en").toLowerCase();
  if (lang.startsWith("bn")) return { voiceId: "hi-IN-ayushi", locale: "bn-IN" };
  if (lang.startsWith("hi")) return { voiceId: "hi-IN-amit", locale: "hi-IN" };
  if (lang.startsWith("es")) return { voiceId: "es-ES-elvira", locale: "es-ES" };
  return { voiceId: "en-US-natalie", locale: "en-US" };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { blogId } = await req.json().catch(() => ({}));
    if (!blogId || typeof blogId !== "string") {
      return new Response(JSON.stringify({ error: "blogId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: blog, error } = await supabase
      .from("blogs")
      .select("id, title, body, language, status, content_hash")
      .eq("id", blogId)
      .maybeSingle();

    if (error || !blog) {
      return new Response(JSON.stringify({ error: "Blog not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (blog.status !== "published") {
      return new Response(JSON.stringify({ error: "Blog is not published" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare TTS text (strip markdown-lite tokens)
    const cleanText = `${blog.title}. ${blog.body}`
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^-\s+/gm, "")
      .trim();
    if (!cleanText) {
      return new Response(JSON.stringify({ error: "Blog is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Murf Falcon max ~3000 chars per request. For v1 we truncate anything beyond
    // 3000 chars — most stories won't hit this; chunking is future work.
    const ttsText = cleanText.length > 3000 ? cleanText.slice(0, 3000) : cleanText;
    const hash = await sha256Hex(ttsText + "|" + (blog.language ?? ""));
    const objectPath = `${blogId}/${hash}.mp3`;

    // Cache hit → return signed URL
    const { data: existing } = await supabase.storage
      .from("blog-audio")
      .list(blogId, { limit: 100 });
    const cached = existing?.find((f) => f.name === `${hash}.mp3`);
    if (cached) {
      const { data: signed } = await supabase.storage
        .from("blog-audio")
        .createSignedUrl(objectPath, 60 * 60 * 24);
      if (signed?.signedUrl) {
        return new Response(JSON.stringify({ url: signed.signedUrl, cached: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const murfKey = Deno.env.get("MURF_API_KEY");
    if (!murfKey) {
      return new Response(JSON.stringify({ error: "TTS service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voice = pickVoice(blog.language);
    const murfRes = await fetch("https://global.api.murf.ai/v1/speech/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": murfKey },
      body: JSON.stringify({
        voiceId: voice.voiceId,
        locale: voice.locale,
        text: ttsText,
        model: "FALCON",
        format: "MP3",
        sampleRate: 24000,
        channelType: "MONO",
      }),
    });

    if (!murfRes.ok) {
      const errText = await murfRes.text().catch(() => "");
      console.error("Murf error", murfRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Read-aloud unavailable right now. Please try again later." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audioBuf = new Uint8Array(await murfRes.arrayBuffer());

    // Cache in storage
    await supabase.storage
      .from("blog-audio")
      .upload(objectPath, audioBuf, { contentType: "audio/mpeg", upsert: true });

    // Update blog.content_hash if changed
    if (blog.content_hash !== hash) {
      await supabase.from("blogs").update({ content_hash: hash }).eq("id", blogId);
    }

    const { data: signed } = await supabase.storage
      .from("blog-audio")
      .createSignedUrl(objectPath, 60 * 60 * 24);

    return new Response(JSON.stringify({ url: signed?.signedUrl, cached: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("read-blog-aloud error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
