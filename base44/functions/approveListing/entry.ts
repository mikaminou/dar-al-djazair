/**
 * approveListing
 *
 * Admin approval hook for listings (Supabase-backed).
 * On "approve":
 *   1. Sets listing status to "watermarking" (hidden from public).
 *   2. Triggers watermarkListingPhotos — sets status to "active" when done.
 *   3. If watermarking fails entirely, falls back to setting status "active" directly.
 *
 * On "decline" / "propose_changes": updates status and notifies owner.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const T = {
  approved_title: {
    en: "Your listing is now live!",
    fr: "Votre annonce est maintenant en ligne !",
    ar: "إعلانك أصبح نشطاً الآن!"
  },
  approved_body: {
    en: "Your listing has been approved and is visible to thousands of buyers.",
    fr: "Votre annonce a été approuvée et est visible par des milliers d'acheteurs.",
    ar: "تم قبول إعلانك وهو متاح الآن لآلاف المشترين."
  },
  declined_title: {
    en: "Your listing was not approved",
    fr: "Votre annonce n'a pas été approuvée",
    ar: "لم يتم قبول إعلانك"
  },
  declined_body: {
    en: "Your listing was reviewed and could not be approved.",
    fr: "Votre annonce a été examinée et n'a pas pu être approuvée.",
    ar: "تمت مراجعة إعلانك ولم يتم قبوله."
  },
  changes_title: {
    en: "Changes requested for your listing",
    fr: "Des modifications sont demandées pour votre annonce",
    ar: "تم طلب تعديلات على إعلانك"
  },
  changes_body: {
    en: "Please update your listing based on the admin's feedback and resubmit.",
    fr: "Veuillez mettre à jour votre annonce selon les commentaires de l'admin et la resoumettre.",
    ar: "يرجى تعديل إعلانك بناءً على ملاحظات المشرف وإعادة إرساله."
  },
  reason: { en: "Reason", fr: "Motif", ar: "السبب" },
  view_listing: { en: "View listing", fr: "Voir l'annonce", ar: "عرض الإعلان" },
  edit_listing: { en: "Edit listing", fr: "Modifier l'annonce", ar: "تعديل الإعلان" },
};
const t = (key, lang) => T[key]?.[lang] || T[key]?.en || "";

function getSupabase() {
  const url = (Deno.env.get('supabase_base_url') || '').replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return createClient(url, Deno.env.get('supabase_secret_key'), { auth: { persistSession: false } });
}

// Update listing status + admin_note (admin_note lives in attributes JSONB).
async function updateListingStatus(sb, listingId, { status, admin_note, active_since }) {
  const { data: existing } = await sb.from('listings').select('attributes').eq('id', listingId).maybeSingle();
  const attributes = { ...(existing?.attributes || {}) };
  if (admin_note !== undefined) attributes.admin_note = admin_note;
  const row = { status, attributes, updated_at: new Date().toISOString() };
  if (active_since) row.active_since = active_since;
  const { error } = await sb.from('listings').update(row).eq('id', listingId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { listing_id, action, admin_note } = await req.json();
    if (!listing_id || !action) {
      return Response.json({ error: "listing_id and action are required" }, { status: 400 });
    }

    const sb = getSupabase();

    // Fetch listing from Supabase
    const { data: listing, error: fetchErr } = await sb
      .from('listings')
      .select('id, owner_id')
      .eq('id', listing_id)
      .maybeSingle();
    if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 });
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // Resolve owner email via profiles
    const { data: ownerProfile } = await sb
      .from('profiles')
      .select('email, lang')
      .eq('id', listing.owner_id)
      .maybeSingle();
    const ownerEmail = ownerProfile?.email || null;
    const ownerLang = ownerProfile?.lang || "fr";
    const baseUrl = Deno.env.get("BASE_URL") || "https://app.base44.com";

    let notifType, notifTitle, notifBody, emailSubject, emailBody, notifUrl;

    if (action === "approve") {
      // Step 1: Mark as "watermarking" — hides from public browse while watermark runs
      await updateListingStatus(sb, listing_id, {
        status: "watermarking",
        admin_note: admin_note || null,
        active_since: new Date().toISOString(),
      });

      // Step 2: Trigger watermarking
      let watermarkNote = null;
      try {
        const wmRes = await base44.asServiceRole.functions.invoke("watermarkListingPhotos", { listing_id });
        if (wmRes?.data?.adminNote) watermarkNote = wmRes.data.adminNote;
      } catch (wmErr) {
        watermarkNote = `Watermarking failed to run: ${wmErr.message}`;
        // Fallback: set listing active so it's not stuck in "watermarking" forever
        await updateListingStatus(sb, listing_id, {
          status: "active",
          admin_note: watermarkNote,
        }).catch(() => {});
      }

      // Step 3: Notify owner
      notifType = "listing_match";
      notifTitle = `✅ ${t("approved_title", ownerLang)}`;
      notifBody = t("approved_body", ownerLang);
      notifUrl = `ListingDetail?id=${listing_id}`;
      emailSubject = t("approved_title", ownerLang);
      emailBody = `<p>${t("approved_body", ownerLang)}</p><p><a href="${baseUrl}/ListingDetail?id=${listing_id}">${t("view_listing", ownerLang)}</a></p>`;

      if (ownerEmail) {
        const refId = `listing_approve_${listing_id}_${Date.now()}`;
        await sb.from('notifications').insert({
          user_email: ownerEmail,
          type: notifType,
          title: notifTitle,
          body: notifBody,
          url: notifUrl,
          is_read: false,
          ref_id: refId,
        }).then(() => {}, () => {});

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: emailSubject,
          body: emailBody,
        }).catch(() => {});
      }

      return Response.json({ ok: true, new_status: "active", watermark_note: watermarkNote });

    } else if (action === "decline") {
      notifType = "listing_match";
      notifTitle = `❌ ${t("declined_title", ownerLang)}`;
      notifBody = admin_note ? `${t("declined_body", ownerLang)} ${t("reason", ownerLang)}: ${admin_note}` : t("declined_body", ownerLang);
      notifUrl = `MyListings`;
      emailSubject = t("declined_title", ownerLang);
      emailBody = `<p>${t("declined_body", ownerLang)}</p>${admin_note ? `<p><strong>${t("reason", ownerLang)}:</strong> ${admin_note}</p>` : ""}`;

      await updateListingStatus(sb, listing_id, { status: "declined", admin_note: admin_note || null });

    } else if (action === "propose_changes") {
      notifType = "listing_match";
      notifTitle = `✏️ ${t("changes_title", ownerLang)}`;
      notifBody = admin_note ? `${t("changes_body", ownerLang)} "${admin_note}"` : t("changes_body", ownerLang);
      notifUrl = `PostListing?edit=${listing_id}`;
      emailSubject = t("changes_title", ownerLang);
      emailBody = `<p>${t("changes_body", ownerLang)}</p>${admin_note ? `<p><strong>📝 ${admin_note}</strong></p>` : ""}<p><a href="${baseUrl}/PostListing?edit=${listing_id}">${t("edit_listing", ownerLang)}</a></p>`;

      await updateListingStatus(sb, listing_id, { status: "changes_requested", admin_note: admin_note || null });

    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    if (ownerEmail) {
      const refId = `listing_${action}_${listing_id}_${Date.now()}`;
      await sb.from('notifications').insert({
        user_email: ownerEmail,
        type: notifType,
        title: notifTitle,
        body: notifBody,
        url: notifUrl,
        is_read: false,
        ref_id: refId,
      }).then(() => {}, () => {});

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ownerEmail,
        subject: emailSubject,
        body: emailBody,
      }).catch(() => {});
    }

    const finalStatus = action === "decline" ? "declined" : "changes_requested";
    return Response.json({ ok: true, new_status: finalStatus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});