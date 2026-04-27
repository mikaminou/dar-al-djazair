import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";
import webpush from "https://esm.sh/web-push@3.6.7";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_email, title, body, url, type } = await req.json();
    if (!user_email) {
      return new Response(JSON.stringify({ error: "user_email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("push_subscription, notification_preferences")
      .eq("email", user_email).maybeSingle();

    if (!profile?.push_subscription) {
      return new Response(JSON.stringify({ ok: false, reason: "no subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefs = profile.notification_preferences ?? {};
    if (prefs[type] === false) {
      return new Response(JSON.stringify({ ok: false, reason: "muted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(
      Deno.env.get("VAPID_MAILTO") ?? "mailto:contact@dar-el-djazair.app",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!,
    );

    await webpush.sendNotification(
      profile.push_subscription as any,
      JSON.stringify({ title, body, url, type }),
    );

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});