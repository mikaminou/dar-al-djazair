import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function matchesSearch(listing, filters = {}) {
  if (filters.listing_type  && filters.listing_type  !== listing.listing_type)  return false;
  if (filters.property_type && filters.property_type !== listing.property_type) return false;
  if (filters.wilaya        && filters.wilaya         !== listing.wilaya)        return false;
  if (filters.min_price     != null && listing.price < filters.min_price)        return false;
  if (filters.max_price     != null && listing.price > filters.max_price)        return false;
  if (filters.min_area      != null && (listing.area     || 0) < filters.min_area)     return false;
  if (filters.max_area      != null && (listing.area     || 0) > filters.max_area)     return false;
  if (filters.min_rooms     != null && (listing.rooms    || 0) < filters.min_rooms)    return false;
  if (filters.min_bedrooms  != null && (listing.bedrooms || 0) < filters.min_bedrooms) return false;
  if (filters.min_bathrooms != null && (listing.bathrooms || 0) < filters.min_bathrooms) return false;
  if (filters.furnished     != null && filters.furnished !== ""
      && listing.furnished  !== filters.furnished) return false;
  return true;
}

// Cache lang lookups within a single run to avoid redundant DB calls
const langCache = {};
async function getRecipientLang(base44, email) {
  if (langCache[email]) return langCache[email];
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  langCache[email] = users[0]?.lang || "fr";
  return langCache[email];
}

const T = {
  newMatch: { fr: "Nouveau bien correspondant", en: "New matching property", ar: "عقار جديد مطابق للبحث" },
  search:   { fr: "Recherche", en: "Search", ar: "بحث" },
};
const t = (key, lang) => T[key][lang] || T[key].fr;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, old_data } = await req.json();

    // Fire on create (if active) OR on update when status just became active
    const listing = data;
    if (event?.type === "create" && listing.status !== "active") {
      return Response.json({ ok: true, skipped: "not_active_on_create" });
    }
    if (event?.type === "update") {
      // Only fire when transitioning TO active
      if (listing.status !== "active" || old_data?.status === "active") {
        return Response.json({ ok: true, skipped: "no_activation_transition" });
      }
    }
    if (event?.type !== "create" && event?.type !== "update") {
      return Response.json({ ok: true, skipped: "not_relevant_event" });
    }

    const savedSearches = await base44.asServiceRole.entities.SavedSearch.filter(
      { alert_enabled: true }, null, 500
    );

    let created = 0;
    for (const search of savedSearches) {
      const recipientEmail = search.user_email || search.created_by;
      if (!recipientEmail) continue;
      if (recipientEmail === listing.created_by) continue;

      const cleanFilters = Object.fromEntries(
        Object.entries(search.filters || {}).filter(([_, v]) =>
          v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
        )
      );
      if (!matchesSearch(listing, cleanFilters)) continue;

      const refId = `listing_match_${listing.id}_${search.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) continue;

      const lang = await getRecipientLang(base44, recipientEmail);
      const priceStr = listing.price
        ? listing.price.toLocaleString(lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-DZ" : "en-GB") + " DZD"
        : "";

      await base44.asServiceRole.entities.Notification.create({
        user_email: recipientEmail,
        type:       "listing_match",
        title:      `🏠 ${t("newMatch", lang)}${listing.wilaya ? ` — ${listing.wilaya}` : ""}`,
        body:       `${listing.title}${priceStr ? ` · ${priceStr}` : ""}${search.name ? ` · ${t("search", lang)} "${search.name}"` : ""}`,
        url:        `ListingDetail?id=${listing.id}`,
        is_read:    false,
        ref_id:     refId,
      });
      created++;
    }

    // ── CLIENT SEARCH PROFILES (agency CRM) ──────────────────────────────
    // Only profiles with alerts enabled fire notifications + emails to the agency.
    const clientProfiles = await base44.asServiceRole.entities.ClientSearchProfile
      .filter({ alert_enabled: true }, null, 1000).catch(() => []);
    for (const profile of clientProfiles) {
      if (!profile.agent_email || !profile.client_id) continue;
      if (profile.agent_email === listing.created_by) continue;

      const cleanFilters = Object.fromEntries(
        Object.entries(profile.filters || {}).filter(([_, v]) =>
          v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
        )
      );
      if (!matchesSearch(listing, cleanFilters)) continue;

      const refId = `client_match_${listing.id}_${profile.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) continue;

      const lang = await getRecipientLang(base44, profile.agent_email);
      const priceStr = listing.price
        ? listing.price.toLocaleString(lang === "fr" ? "fr-FR" : lang === "ar" ? "ar-DZ" : "en-GB") + " DZD"
        : "";

      const clientLabel = profile.client_name || profile.client_id;
      const title = lang === "ar"
        ? `🏠 عقار جديد يطابق بحث عميلك ${clientLabel}`
        : lang === "fr"
        ? `🏠 Nouveau bien pour votre client ${clientLabel}`
        : `🏠 New listing matches client ${clientLabel}`;
      const body = `${listing.title}${listing.wilaya ? ` · ${listing.wilaya}` : ""}${priceStr ? ` · ${priceStr}` : ""}`;

      await base44.asServiceRole.entities.Notification.create({
        user_email: profile.agent_email,
        type:       "listing_match",
        title,
        body,
        url:        `ListingDetail?id=${listing.id}`,
        is_read:    false,
        ref_id:     refId,
      });
      created++;

      // Send email to agency (per-match, no batching) mentioning the client.
      const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";
      const listingUrl = `${BASE_URL}/ListingDetail?id=${listing.id}`;
      const subjects = {
        fr: `Nouveau bien pour votre client ${clientLabel}`,
        en: `New listing for your client ${clientLabel}`,
        ar: `عقار جديد لعميلك ${clientLabel}`,
      };
      const intro = {
        fr: `Un nouveau bien correspond aux critères de recherche de votre client <strong>${clientLabel}</strong> :`,
        en: `A new listing matches the search criteria of your client <strong>${clientLabel}</strong>:`,
        ar: `عقار جديد يطابق معايير البحث لعميلك <strong>${clientLabel}</strong>:`,
      };
      const cta = { fr: "Voir l'annonce →", en: "View listing →", ar: "عرض الإعلان ←" };
      const emailBody = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;"><tr><td align="center">
          <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
            <tr><td style="background:#059669;border-radius:12px 12px 0 0;padding:24px 32px;color:#fff;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.7;">Dar El Djazair · ${lang === "ar" ? "تنبيه عميل" : lang === "fr" ? "Alerte client" : "Client alert"}</p>
              <h1 style="margin:0;font-size:22px;">${subjects[lang] || subjects.fr}</h1>
            </td></tr>
            <tr><td style="background:#fff;padding:32px;border:1px solid #e5e7eb;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;">${intro[lang] || intro.fr}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;">
                <tr><td style="padding:16px;">
                  <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">${listing.title || "—"}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${listing.wilaya || ""}${priceStr ? ` · ${priceStr}` : ""}</p>
                </td></tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td style="border-radius:8px;background:#059669;">
                <a href="${listingUrl}" style="display:inline-block;padding:12px 24px;color:#fff;font-weight:700;text-decoration:none;font-size:14px;">${cta[lang] || cta.fr}</a>
              </td></tr></table>
            </td></tr>
            <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">Dar El Djazair</p>
            </td></tr>
          </table>
        </td></tr></table></body></html>`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: profile.agent_email,
        from_name: "Dar El Djazair",
        subject: subjects[lang] || subjects.fr,
        body: emailBody,
      }).catch(() => {});
    }

    return Response.json({ ok: true, notifications_created: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});