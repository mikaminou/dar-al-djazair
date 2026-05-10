/**
 * listingDelete — delete a listing. Requires auth (owner or admin).
 * Payload: { id: string }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });

    const sb = getServiceClient();

    const { data: existing } = await sb.from("listings").select("owner_id").eq("id", id).maybeSingle();
    if (!existing) return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    if (user.role !== "admin") {
      const { data: prof } = await sb.from("profiles").select("id").eq("email", user.email).maybeSingle();
      if (!prof || prof.id !== existing.owner_id) {
        return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
      }
    }

    const { error } = await sb.from("listings").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
