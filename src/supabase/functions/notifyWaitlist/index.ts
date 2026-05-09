/**
 * notifyWaitlist — notify waitlist seekers when a listing status changes.
 * Payload: { listing_id: string, new_status: "active"|"sold"|"rented" }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser } from "../_shared/supabaseAdmin.ts";

const MESSAGES: Record<string, Record<string, { title: string; body: (title: string, wilaya?: string) => string }>> = {
  active: {
    en: { title: "Property available again!", body: (t, w) => `"${t}" in ${w} is available again. You were on the waitlist.` },
    fr: { title: "Bien à nouveau disponible !", body: (t, w) => `"${t}" à ${w} est à nouveau disponible. Vous étiez sur la liste d'attente.` },
    ar: { title: "العقار متاح مجدداً!", body: (t, w) => `"${t}" في ${w} أصبح متاحاً مجدداً. كنت على قائمة الانتظار.` },
  },
  sold: {
    en: { title: "Property sold", body: (t) => `The property "${t}" you were waitlisted for has been sold.` },
    fr: { title: "Bien vendu", body: (t) => `Le bien "${t}" sur lequel vous étiez en liste d'attente a été vendu.` },
    ar: { title: "تم بيع العقار", body: (t) => `تم بيع العقار "${t}" الذي كنت على قائمة انتظاره.` },
  },
  rented: {
    en: { title: "Property rented", body: (t) => `The property "${t}" you were waitlisted for has been rented.` },
    fr: { title: "Bien loué", body: (t) => `Le bien "${t}" sur lequel vous étiez en liste d'attente a été loué.` },
    ar: { title: "تم تأجير العقار", body: (t) => `تم تأجير العقار "${t}" الذي كنت على قائمة انتظاره.` },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { listing_id, new_status } = await req.json();
    if (!listing_id || !new_status) {
      return Response.json({ error: "listing_id and new_status required" }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();

    const { data: listing } = await sb.from("listings").select("title, wilaya").eq("id", listing_id).maybeSingle();
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404, headers: corsHeaders });

    const msgs = MESSAGES[new_status];
    if (!msgs) return Response.json({ notified: 0 }, { headers: corsHeaders });

    const { data: entries } = await sb
      .from("waitlists")
      .select("user_email")
      .eq("listing_id", listing_id)
      .eq("status", "waiting")
      .limit(200);

    if (!entries?.length) return Response.json({ notified: 0 }, { headers: corsHeaders });

    const emails = [...new Set(entries.map((e: any) => e.user_email))];
    const { data: profs } = await sb.from("profiles").select("email, language_preference").in("email", emails);
    const langByEmail: Record<string, string> = Object.fromEntries(
      (profs ?? []).map((p: any) => [p.email, p.language_preference ?? "fr"])
    );

    const notifRows = entries.map((entry: any) => {
      const lang = langByEmail[entry.user_email] ?? "fr";
      const m = msgs[lang] ?? msgs.fr ?? msgs.en;
      return {
        user_email: entry.user_email,
        type: "listing_match",
        title: `🏠 ${m.title}`,
        body: new_status === "active" ? m.body(listing.title, listing.wilaya) : m.body(listing.title),
        url: `ListingDetail?id=${listing_id}`,
        is_read: false,
        ref_id: `waitlist_${new_status}_${listing_id}_${entry.user_email}`,
      };
    });

    await sb.from("notifications").insert(notifRows);
    return Response.json({ notified: notifRows.length }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
