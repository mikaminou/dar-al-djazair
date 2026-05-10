/**
 * approveListing — admin-only: approve, decline, or request changes on a listing.
 * Payload: { listing_id: string, action: "approve"|"decline"|"propose_changes", admin_note?: string }
 *
 * On "approve": marks as "watermarking", triggers watermarkListingPhotos, notifies owner.
 * On "decline"/"propose_changes": updates status, notifies owner.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

const T: Record<string, Record<string, string>> = {
  approved_title:  { en:"Your listing is now live!", fr:"Votre annonce est maintenant en ligne !", ar:"إعلانك أصبح نشطاً الآن!" },
  approved_body:   { en:"Your listing has been approved.", fr:"Votre annonce a été approuvée.", ar:"تم قبول إعلانك." },
  declined_title:  { en:"Your listing was not approved", fr:"Votre annonce n'a pas été approuvée", ar:"لم يتم قبول إعلانك" },
  declined_body:   { en:"Your listing was reviewed and could not be approved.", fr:"Votre annonce a été examinée et n'a pas pu être approuvée.", ar:"تمت مراجعة إعلانك ولم يتم قبوله." },
  changes_title:   { en:"Changes requested for your listing", fr:"Des modifications sont demandées pour votre annonce", ar:"تم طلب تعديلات على إعلانك" },
  changes_body:    { en:"Please update your listing based on admin feedback and resubmit.", fr:"Veuillez mettre à jour votre annonce et la resoumettre.", ar:"يرجى تعديل إعلانك وإعادة إرساله." },
};
const t = (key: string, lang: string) => T[key]?.[lang] ?? T[key]?.en ?? "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403, headers: corsHeaders });
    }

    const { listing_id, action, admin_note } = await req.json();
    if (!listing_id || !action) {
      return Response.json({ error: "listing_id and action are required" }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();

    const { data: listing, error: fetchErr } = await sb
      .from("listings").select("id, owner_id").eq("id", listing_id).maybeSingle();
    if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500, headers: corsHeaders });
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404, headers: corsHeaders });

    const { data: ownerProfile } = await sb
      .from("profiles").select("email, language_preference").eq("id", listing.owner_id).maybeSingle();
    const ownerEmail = ownerProfile?.email ?? null;
    const ownerLang = ownerProfile?.language_preference ?? "fr";

    async function updateStatus(status: string, note?: string, activeSince?: string) {
      const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (note !== undefined) row.admin_note = note;
      if (activeSince) row.active_since = activeSince;
      await sb.from("listings").update(row).eq("id", listing_id);
    }

    async function notify(type: string, title: string, body: string, url: string) {
      if (!ownerEmail) return;
      const refId = `listing_${action}_${listing_id}_${Date.now()}`;
      await sb.from("notifications").insert({ user_email: ownerEmail, type, title, body, url, is_read: false, ref_id: refId });
    }

    if (action === "approve") {
      await updateStatus("watermarking", admin_note ?? null, new Date().toISOString());

      // Trigger watermarking (best-effort)
      let watermarkNote: string | null = null;
      try {
        const { data: wmRes, error: wmErr } = await sb.functions.invoke("watermarkListingPhotos", {
          body: { listing_id },
        });
        if (wmErr) throw wmErr;
        watermarkNote = (wmRes as any)?.adminNote ?? null;
      } catch (wmErr: unknown) {
        watermarkNote = `Watermarking failed: ${(wmErr as Error).message}`;
        await updateStatus("active", watermarkNote).catch(() => {});
      }

      await notify("listing_match", `✅ ${t("approved_title", ownerLang)}`, t("approved_body", ownerLang), `ListingDetail?id=${listing_id}`);
      return Response.json({ ok: true, new_status: "active", watermark_note: watermarkNote }, { headers: corsHeaders });

    } else if (action === "decline") {
      const body = admin_note ? `${t("declined_body", ownerLang)} Motif: ${admin_note}` : t("declined_body", ownerLang);
      await updateStatus("declined", admin_note ?? null);
      await notify("listing_match", `❌ ${t("declined_title", ownerLang)}`, body, "MyListings");
      return Response.json({ ok: true, new_status: "declined" }, { headers: corsHeaders });

    } else if (action === "propose_changes") {
      const body = admin_note ? `${t("changes_body", ownerLang)} "${admin_note}"` : t("changes_body", ownerLang);
      await updateStatus("changes_requested", admin_note ?? null);
      await notify("listing_match", `✏️ ${t("changes_title", ownerLang)}`, body, `PostListing?edit=${listing_id}`);
      return Response.json({ ok: true, new_status: "changes_requested" }, { headers: corsHeaders });

    } else {
      return Response.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });
    }
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
