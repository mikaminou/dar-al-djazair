import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const listing = listings[0];
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    const ownerEmail = listing.created_by;
    const ownerUsers = await base44.asServiceRole.entities.User.filter({ email: ownerEmail }, null, 1).catch(() => []);
    const ownerLang = ownerUsers[0]?.lang || "fr";
    const baseUrl = Deno.env.get("BASE_URL") || "https://app.base44.com";

    let newStatus, notifType, notifTitle, notifBody, emailSubject, emailBody, notifUrl;

    if (action === "approve") {
      newStatus = "active";
      notifType = "listing_match"; // reuse existing type
      notifTitle = `✅ ${t("approved_title", ownerLang)}`;
      notifBody = t("approved_body", ownerLang);
      notifUrl = `ListingDetail?id=${listing_id}`;
      emailSubject = t("approved_title", ownerLang);
      emailBody = `<p>${t("approved_body", ownerLang)}</p><p><a href="${baseUrl}/ListingDetail?id=${listing_id}">${t("view_listing", ownerLang)}</a></p>`;
    } else if (action === "decline") {
      newStatus = "declined";
      notifType = "listing_match";
      notifTitle = `❌ ${t("declined_title", ownerLang)}`;
      notifBody = admin_note ? `${t("declined_body", ownerLang)} ${t("reason", ownerLang)}: ${admin_note}` : t("declined_body", ownerLang);
      notifUrl = `MyListings`;
      emailSubject = t("declined_title", ownerLang);
      emailBody = `<p>${t("declined_body", ownerLang)}</p>${admin_note ? `<p><strong>${t("reason", ownerLang)}:</strong> ${admin_note}</p>` : ""}`;
    } else if (action === "propose_changes") {
      newStatus = "changes_requested";
      notifType = "listing_match";
      notifTitle = `✏️ ${t("changes_title", ownerLang)}`;
      notifBody = admin_note ? `${t("changes_body", ownerLang)} "${admin_note}"` : t("changes_body", ownerLang);
      notifUrl = `PostListing?edit=${listing_id}`;
      emailSubject = t("changes_title", ownerLang);
      emailBody = `<p>${t("changes_body", ownerLang)}</p>${admin_note ? `<p><strong>📝 ${admin_note}</strong></p>` : ""}<p><a href="${baseUrl}/PostListing?edit=${listing_id}">${t("edit_listing", ownerLang)}</a></p>`;
    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    // Update listing status
    const updatePayload = { status: newStatus };
    if (admin_note) updatePayload.admin_note = admin_note;
    if (action === "approve") {
      updatePayload.active_since = new Date().toISOString();
      updatePayload.admin_note = null;
    }
    await base44.asServiceRole.entities.Listing.update(listing_id, updatePayload);

    // Watermark photos on approval (non-blocking — failures don't stop approval)
    let watermarkAdminNote = null;
    if (action === "approve" && (listing.images || []).length > 0) {
      try {
        const wmRes = await base44.asServiceRole.functions.invoke('watermarkListingPhotos', { listing_id });
        if (wmRes?.data?.adminNote) watermarkAdminNote = wmRes.data.adminNote;
      } catch (wmErr) {
        watermarkAdminNote = `Watermarking could not run: ${wmErr.message}`;
      }
    }

    // Create in-app notification
    const refId = `listing_${action}_${listing_id}_${Date.now()}`;
    await base44.asServiceRole.entities.Notification.create({
      user_email: ownerEmail,
      type: notifType,
      title: notifTitle,
      body: notifBody,
      url: notifUrl,
      is_read: false,
      ref_id: refId,
    }).catch(() => {});

    // Send email
    if (ownerEmail) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: ownerEmail,
        subject: emailSubject,
        body: emailBody,
      }).catch(() => {});
    }

    return Response.json({ ok: true, new_status: newStatus, watermark_note: watermarkAdminNote });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});