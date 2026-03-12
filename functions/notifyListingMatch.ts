import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Triggered on: Listing CREATE
 * Checks all alert-enabled SavedSearches and notifies seekers when a new
 * listing matches their criteria.
 */

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event?.type !== "create") return Response.json({ ok: true, skipped: "not_create" });

    const listing = data;
    if (listing.status !== "active") return Response.json({ ok: true, skipped: "not_active" });

    // Only look at alert-enabled searches
    const savedSearches = await base44.asServiceRole.entities.SavedSearch.filter(
      { alert_enabled: true }, null, 500
    );

    let created = 0;
    for (const search of savedSearches) {
      if (!search.created_by) continue;
      // Don't notify the listing owner of their own listing
      if (search.created_by === listing.created_by) continue;
      if (!matchesSearch(listing, search.filters || {})) continue;

      const refId = `listing_match_${listing.id}_${search.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) continue;

      const priceStr = listing.price
        ? listing.price.toLocaleString("fr-FR") + " DZD"
        : "";

      await base44.asServiceRole.entities.Notification.create({
        user_email: search.created_by,
        type:       "listing_match",
        title:      `🏠 Nouveau bien correspondant — ${listing.wilaya || ""}`,
        body:       `${listing.title}${priceStr ? ` · ${priceStr}` : ""}${search.name ? ` · Recherche "${search.name}"` : ""}`,
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