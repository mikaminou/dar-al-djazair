/**
 * Admin action to resolve an exclusivity conflict.
 * action: "approve_both" | "decline_conflict" | "contact_both"
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const LANG_MSG = {
  decline_subject: {
    en: "Your listing was declined — Exclusive property already listed",
    fr: "Votre annonce a été refusée — Un bien exclusif existe déjà",
    ar: "تم رفض إعلانك — يوجد عقار حصري مسجل بالفعل",
  },
  decline_body: {
    en: (title) => `<p>Your listing <strong>"${title}"</strong> has been declined because an exclusive listing for this property already exists on our platform. Only the exclusive listing agent is authorized to list this property.</p><p>If you believe this is an error, please contact us.</p>`,
    fr: (title) => `<p>Votre annonce <strong>"${title}"</strong> a été refusée car un bien exclusif identique est déjà enregistré sur notre plateforme. Seul l'agent exclusif est autorisé à publier ce bien.</p><p>Si vous pensez qu'il s'agit d'une erreur, veuillez nous contacter.</p>`,
    ar: (title) => `<p>تم رفض إعلانك <strong>"${title}"</strong> لأن إعلاناً حصرياً لهذا العقار مسجل بالفعل على منصتنا. المفوض الحصري فقط مخول بنشر هذا العقار.</p><p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل معنا.</p>`,
  },
  exclusivity_lifted_subject: {
    en: "Your exclusive listing — exclusivity has been lifted",
    fr: "Votre annonce exclusive — exclusivité levée",
    ar: "إعلانك الحصري — تمت إزالة الحصرية",
  },
  exclusivity_lifted_body: {
    en: (title, reason) => `<p>The exclusivity flag on your listing <strong>"${title}"</strong> has been lifted by an administrator. ${reason ? `Reason: ${reason}` : ""}</p><p>Your listing remains active and visible.</p>`,
    fr: (title, reason) => `<p>L'exclusivité de votre annonce <strong>"${title}"</strong> a été levée par un administrateur. ${reason ? `Raison : ${reason}` : ""}</p><p>Votre annonce reste active et visible.</p>`,
    ar: (title, reason) => `<p>تمت إزالة الحصرية عن إعلانك <strong>"${title}"</strong> من قِبَل المشرف. ${reason ? `السبب: ${reason}` : ""}</p><p>إعلانك لا يزال نشطاً ومرئياً.</p>`,
  },
};

function getLang(user) {
  return user?.lang || "fr";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const { listing_id, action, admin_note } = await req.json();
    if (!listing_id || !action) return Response.json({ error: "listing_id and action required" }, { status: 400 });

    const newListings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const newListing = newListings[0];
    if (!newListing) return Response.json({ error: "Listing not found" }, { status: 404 });

    const conflict_listing_id = newListing.conflict_listing_id;
    const ts = new Date().toISOString();
    const baseUrl = Deno.env.get("BASE_URL") || "";

    if (action === "approve_both") {
      // Approve new listing + remove exclusivity from original
      const logNew = `[ADMIN:${user.email}] Approved despite exclusivity conflict. Exclusivity removed from original listing #${conflict_listing_id}. Note: ${admin_note || "none"}. (${ts})`;
      await base44.asServiceRole.entities.Listing.update(listing_id, {
        status: "active",
        exclusivity_conflict: false,
        active_since: new Date().toISOString(),
        audit_log: [...(newListing.audit_log || []), logNew],
      });

      // Remove exclusivity from original
      if (conflict_listing_id) {
        const origListings = await base44.asServiceRole.entities.Listing.filter({ id: conflict_listing_id }, null, 1);
        const orig = origListings[0];
        if (orig) {
          const logOrig = `[ADMIN:${user.email}] Exclusivity removed — a competing listing was approved. Note: ${admin_note || "none"}. (${ts})`;
          await base44.asServiceRole.entities.Listing.update(conflict_listing_id, {
            is_exclusive: false,
            audit_log: [...(orig.audit_log || []), logOrig],
          });

          // Notify original owner
          const origOwnerUsers = await base44.asServiceRole.entities.User.filter({ email: orig.created_by }, null, 1).catch(() => []);
          const origLang = getLang(origOwnerUsers[0]);
          const subj = LANG_MSG.exclusivity_lifted_subject[origLang] || LANG_MSG.exclusivity_lifted_subject.fr;
          const body = (LANG_MSG.exclusivity_lifted_body[origLang] || LANG_MSG.exclusivity_lifted_body.fr)(orig.title, admin_note);

          await base44.asServiceRole.entities.Notification.create({
            user_email: orig.created_by,
            type: "listing_match",
            title: `ℹ️ ${subj}`,
            body: `${lang === "ar" ? "تمت إزالة الحصرية عن إعلانك" : lang === "fr" ? "Exclusivité levée sur votre annonce" : "Exclusivity lifted on your listing"} "${orig.title}"`,
            url: `ListingDetail?id=${conflict_listing_id}`,
            is_read: false,
            ref_id: `exclusivity_lifted_${conflict_listing_id}_${ts}`,
          }).catch(() => {});

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: orig.created_by,
            subject: subj,
            body,
          }).catch(() => {});
        }
      }

      // Notify new listing submitter
      const newOwnerUsers = await base44.asServiceRole.entities.User.filter({ email: newListing.created_by }, null, 1).catch(() => []);
      const newLang = getLang(newOwnerUsers[0]);
      await base44.asServiceRole.entities.Notification.create({
        user_email: newListing.created_by,
        type: "listing_match",
        title: newLang === "ar" ? "✅ تمت الموافقة على إعلانك" : newLang === "fr" ? "✅ Annonce approuvée" : "✅ Listing Approved",
        body: newLang === "ar" ? `تمت الموافقة على إعلانك "${newListing.title}" ونشره.` : newLang === "fr" ? `Votre annonce "${newListing.title}" a été approuvée et publiée.` : `Your listing "${newListing.title}" has been approved and published.`,
        url: `ListingDetail?id=${listing_id}`,
        is_read: false,
        ref_id: `approved_${listing_id}_${ts}`,
      }).catch(() => {});

      return Response.json({ success: true, action: "approve_both" });

    } else if (action === "decline_conflict") {
      // Decline new listing
      const logNew = `[ADMIN:${user.email}] Declined due to exclusivity conflict with listing #${conflict_listing_id}. Note: ${admin_note || "none"}. (${ts})`;
      await base44.asServiceRole.entities.Listing.update(listing_id, {
        status: "declined",
        admin_note: admin_note || (newListing.audit_log?.join?.(" | ") || "Exclusivity conflict"),
        exclusivity_conflict: false,
        audit_log: [...(newListing.audit_log || []), logNew],
      });

      // Notify submitter
      const ownerUsers = await base44.asServiceRole.entities.User.filter({ email: newListing.created_by }, null, 1).catch(() => []);
      const ownerLang = getLang(ownerUsers[0]);
      const subj = LANG_MSG.decline_subject[ownerLang] || LANG_MSG.decline_subject.fr;
      const body = (LANG_MSG.decline_body[ownerLang] || LANG_MSG.decline_body.fr)(newListing.title);
      const noteMsg = admin_note ? (ownerLang === "ar" ? ` ملاحظة: ${admin_note}` : ownerLang === "fr" ? ` Note : ${admin_note}` : ` Note: ${admin_note}`) : "";

      await base44.asServiceRole.entities.Notification.create({
        user_email: newListing.created_by,
        type: "listing_match",
        title: ownerLang === "ar" ? "❌ تم رفض إعلانك" : ownerLang === "fr" ? "❌ Annonce refusée" : "❌ Listing Declined",
        body: `${ownerLang === "ar" ? `تم رفض إعلانك "${newListing.title}" بسبب تعارض مع إعلان حصري.` : ownerLang === "fr" ? `Votre annonce "${newListing.title}" a été refusée en raison d'un conflit d'exclusivité.` : `Your listing "${newListing.title}" was declined due to an exclusivity conflict.`}${noteMsg}`,
        url: `ListingDetail?id=${listing_id}`,
        is_read: false,
        ref_id: `declined_exclusivity_${listing_id}_${ts}`,
      }).catch(() => {});

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: newListing.created_by,
        subject: subj,
        body: body + (admin_note ? `<p><em>${admin_note}</em></p>` : ""),
      }).catch(() => {});

      return Response.json({ success: true, action: "decline_conflict" });

    } else if (action === "contact_both") {
      // Send notification/message to both parties
      const { message_to_new, message_to_original } = await req.json().catch(() => ({}));
      const msgNew = message_to_new || admin_note || "";
      const msgOrig = message_to_original || admin_note || "";

      if (msgNew && newListing.created_by) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: newListing.created_by,
          type: "message",
          title: "📩 Message de l'administration / Admin Message",
          body: msgNew,
          url: `ListingDetail?id=${listing_id}`,
          is_read: false,
          ref_id: `admin_contact_new_${listing_id}_${ts}`,
        }).catch(() => {});
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: newListing.created_by,
          subject: "Message from Dar El Djazair Admin",
          body: `<p>${msgNew}</p>`,
        }).catch(() => {});
      }

      if (msgOrig && conflict_listing_id) {
        const origListings = await base44.asServiceRole.entities.Listing.filter({ id: conflict_listing_id }, null, 1);
        const orig = origListings[0];
        if (orig?.created_by) {
          await base44.asServiceRole.entities.Notification.create({
            user_email: orig.created_by,
            type: "message",
            title: "📩 Message de l'administration / Admin Message",
            body: msgOrig,
            url: `ListingDetail?id=${conflict_listing_id}`,
            is_read: false,
            ref_id: `admin_contact_orig_${conflict_listing_id}_${ts}`,
          }).catch(() => {});
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: orig.created_by,
            subject: "Message from Dar El Djazair Admin",
            body: `<p>${msgOrig}</p>`,
          }).catch(() => {});
        }
      }

      return Response.json({ success: true, action: "contact_both" });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});