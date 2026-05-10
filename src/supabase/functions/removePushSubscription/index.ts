/**
 * removePushSubscription — remove a push notification subscription.
 * Payload: { user_email: string, endpoint: string }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { user_email, endpoint } = await req.json();
    if (user_email !== user.email && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
    }

    const sb = getServiceClient();
    await sb
      .from("push_subscriptions")
      .delete()
      .eq("user_email", user_email)
      .eq("endpoint", endpoint);

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
