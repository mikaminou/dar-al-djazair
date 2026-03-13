import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function matchesSearch(listing, filters = {}) {
  if (filters.listing_type  && filters.listing_type  !== listing.listing_type)  return false;
  if (filters.property_type && filters.property_type !== listing.property_type) return false;
  if (filters.wilaya        && filters.wilaya         !== listing.wilaya)        return false;
  if (filters.min_price  != null && listing.price < filters.min_price)          return false;
  if (filters.max_price  != null && listing.price > filters.max_price)          return false;
  if (filters.min_area   != null && (listing.area  || 0) < filters.min_area)    return false;
  if (filters.max_area   != null && (listing.area  || 0) > filters.max_area)    return false;
  if (filters.min_rooms  != null && (listing.rooms || 0) < filters.min_rooms)   return false;
  if (filters.min_bedrooms != null && (listing.bedrooms || 0) < filters.min_bedrooms) return false;
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
    const { event, data } = await req.json();

    if (event?.type !== "create") return Response.json({ ok: true, skipped: "not_create" });

    const listing = data;
    if (listing.status !== "active") return Response.json({ ok: true, skipped: "not_active" });

    const savedSearches = await base44.asServiceRole.entities.SavedSearch.filter(
      { alert_enabled: true }, null, 500
    );

    let created = 0;
    for (const search of savedSearches) {
      const recipientEmail = search.user_email || search.created_by;
      if (!recipientEmail) continue;
      if (recipientEmail === listing.created_by) continue;
      if (!matchesSearch(listing, search.filters || {})) continue;

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

    return Response.json({ ok: true, notifications_created: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});