/**
 * updateMyRole — update the authenticated user's account_type.
 * Payload: { role: "user" | "professional" }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { role } = await req.json();
    const allowedRoles = ["user", "professional"];
    if (!allowedRoles.includes(role)) {
      return Response.json({ error: "Invalid role" }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();
    const { error } = await sb
      .from("profiles")
      .update({ account_type: role })
      .eq("email", user.email);

    if (error) throw error;
    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
