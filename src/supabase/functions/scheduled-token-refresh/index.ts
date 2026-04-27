// Stub: implement Facebook page token refresh once you have the
// Graph API app credentials.
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async () => {
  return new Response(JSON.stringify({ ok: true, note: "stub" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});