import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async () => {
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("social_posts").update({ status: "archived" })
    .lte("scheduled_archive_at", now).neq("status", "archived")
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, archived: data?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});