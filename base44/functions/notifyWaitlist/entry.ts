/**
 * Notifies waitlist seekers when a listing status changes.
 * Called from the frontend after a status change on a reserved listing.
 * new_status: "active" | "sold" | "rented"
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const MESSAGES = {
  active: {
    en: { title: "Property available again!", body: (title, wilaya) => `Good news — "${title}" in ${wilaya} is available again. You were on the waitlist.` },
    fr: { title: "Bien à nouveau disponible !", body: (title, wilaya) => `Bonne nouvelle — "${title}" à ${wilaya} est à nouveau disponible. Vous étiez sur la liste d'attente.` },
    ar: { title: "العقار متاح مجدداً!", body: (title, wilaya) => `بشرى سارة — "${title}" في ${wilaya} أصبح متاحاً مجدداً. كنت على قائمة الانتظار.` },
  },
  sold: {
    en: { title: "Property sold", body: (title) => `The property "${title}" you were waitlisted for has been sold and is no longer available.` },
    fr: { title: "Bien vendu", body: (title) => `Le bien "${title}" sur lequel vous étiez en liste d'attente a été vendu et n'est plus disponible.` },
    ar: { title: "تم بيع العقار", body: (title) => `تم بيع العقار "${title}" الذي كنت على قائمة انتظاره ولم يعد متاحاً.` },
  },
  rented: {
    en: { title: "Property rented", body: (title) => `The property "${title}" you were waitlisted for has been rented and is no longer available.` },
    fr: { title: "Bien loué", body: (title) => `Le bien "${title}" sur lequel vous étiez en liste d'attente a été loué et n'est plus disponible.` },
    ar: { title: "تم تأجير العقار", body: (title) => `تم تأجير العقار "${title}" الذي كنت على قائمة انتظاره ولم يعد متاحاً.` },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { listing_id, new_status } = await req.json();
    if (!listing_id || !new_status) return Response.json({ error: "listing_id and new_status required" }, { status: 400 });

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const listing = listings[0];
    if (!listing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // Only notify "waiting" entries
    const entries = await base44.asServiceRole.entities.Waitlist.filter({ listing_id, status: "waiting" }, "position", 200);
    if (entries.length === 0) return Response.json({ notified: 0 });

    const baseUrl = Deno.env.get("BASE_URL") || "https://app.base44.com";
    const msgs = MESSAGES[new_status];
    if (!msgs) return Response.json({ notified: 0 });

    let notified = 0;
    await Promise.all(entries.map(async (entry) => {
      try {
        // Get seeker's preferred language
        const seekerUsers = await base44.asServiceRole.entities.User.filter({ email: entry.user_email }, null, 1).catch(() => []);
        const lang = seekerUsers[0]?.lang || "fr";
        const m = msgs[lang] || msgs.en;
        const title = m.title;
        const body = new_status === "active"
          ? m.body(listing.title, listing.wilaya)
          : m.body(listing.title);

        // In-app notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: entry.user_email,
          type: "listing_match",
          title: `🏠 ${title}`,
          body,
          url: `ListingDetail?id=${listing_id}`,
          is_read: false,
          ref_id: `waitlist_${new_status}_${listing_id}_${entry.user_email}`,
        }).catch(() => {});

        // Email
        const emailBody = `<p>${body}</p><p><a href="${baseUrl}/ListingDetail?id=${listing_id}">${lang === "ar" ? "عرض الإعلان" : lang === "fr" ? "Voir l'annonce" : "View listing"}</a></p>`;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: entry.user_email,
          subject: `Dar El Djazair — ${title}`,
          body: emailBody,
        }).catch(() => {});

        notified++;
      } catch (_) {}
    }));

    return Response.json({ notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});