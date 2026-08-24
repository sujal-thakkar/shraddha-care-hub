// Temporary diagnostic: fetch Fast2SMS delivery report for one request id.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") ?? "";
  const key = Deno.env.get("FAST2SMS_API_KEY") ?? "";
  const out: Record<string, unknown> = { has_key: Boolean(key) };
  for (const path of ["bulk_status", "report", "get_delivery_report"]) {
    try {
      const res = await fetch(`https://www.fast2sms.com/dev/${path}?authorization=${key}&request_id=${requestId}`);
      out[path] = { status: res.status, body: (await res.text()).slice(0, 1500) };
    } catch (e) {
      out[path] = { error: (e as Error).message };
    }
  }
  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
