/**
 * storePushSubscription — store a push notification subscription for the authenticated user.
 * Payload: { user_email: string, subscription: { endpoint, keys: { p256dh, auth } } }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { user_email, subscription } = await req.json();
    if (user_email !== user.email && user.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });
    }

    const sb = getServiceClient();
    const { data: existing } = await sb
      .from("push_subscriptions")
      .select("id")
      .eq("user_email", user_email)
      .eq("endpoint", subscription.endpoint)
      .maybeSingle();

    if (existing?.id) {
      await sb.from("push_subscriptions").update({
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        is_active: true,
      }).eq("id", existing.id);
    } else {
      await sb.from("push_subscriptions").insert({
        user_email,
        endpoint: subscription.endpoint,
        keys_p256dh: subscription.keys.p256dh,
        keys_auth: subscription.keys.auth,
        is_active: true,
      });
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
