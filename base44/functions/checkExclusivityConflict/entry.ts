/**
 * Called after a new listing is created (status=pending).
 * Checks if any existing active+exclusive listing is similar.
 * If yes: flags the new listing + notifies admins.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function withinRange(a, b, pct) {
  if (!a || !b) return false;
  return Math.abs(a - b) / Math.max(a, b) <= pct;
}

function addressOverlap(a, b) {
  if (!a || !b) return false;
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return false;
  // Check if either is substring of the other, or they share significant words
  if (na.includes(nb) || nb.includes(na)) return true;
  const wordsA = na.split(/[\s,]+/).filter(w => w.length > 3);
  const wordsB = nb.split(/[\s,]+/).filter(w => w.length > 3);
  const matches = wordsA.filter(w => wordsB.includes(w));
  return matches.length >= 2;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { listing_id } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400 });

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const newListing = listings[0];
    if (!newListing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // Find active exclusive listings in same wilaya + same types
    const candidates = await base44.asServiceRole.entities.Listing.filter({
      wilaya: newListing.wilaya,
      property_type: newListing.property_type,
      listing_type: newListing.listing_type,
      is_exclusive: true,
      status: "active",
    }, null, 100);

    let conflictListing = null;
    for (const c of candidates) {
      if (c.id === listing_id) continue;
      const priceMatch = withinRange(newListing.price, c.price, 0.10);
      const areaMatch  = !newListing.area || !c.area || withinRange(newListing.area, c.area, 0.10);
      // commune match
      const communeMatch = newListing.commune && c.commune &&
        newListing.commune.toLowerCase().trim() === c.commune.toLowerCase().trim();
      const addrMatch = addressOverlap(newListing.address, c.address);

      if (priceMatch && areaMatch && (communeMatch || addrMatch)) {
        conflictListing = c;
        break;
      }
    }

    if (!conflictListing) return Response.json({ conflict: false });

    // Flag the new listing
    const logEntry = `[SYSTEM] Exclusivity conflict detected with listing #${conflictListing.id} on ${new Date().toISOString()}`;
    await base44.asServiceRole.entities.Listing.update(listing_id, {
      exclusivity_conflict: true,
      conflict_listing_id: conflictListing.id,
      audit_log: [...(newListing.audit_log || []), logEntry],
    });

    // Notify all admins
    const allUsers = await base44.asServiceRole.entities.User.filter({ role: "admin" }, null, 50).catch(() => []);
    const baseUrl = Deno.env.get("BASE_URL") || "";

    await Promise.all(allUsers.map(async admin => {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type: "listing_match",
        title: "⚠️ Exclusivity Conflict Detected",
        body: `New listing "${newListing.title}" (${newListing.wilaya}) may duplicate an exclusive property. Review required.`,
        url: "AdminVerification",
        is_read: false,
        ref_id: `exclusivity_conflict_${listing_id}`,
      }).catch(() => {});
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: "⚠️ Exclusivity Conflict — Admin Review Required",
        body: `<p>A new listing <strong>"${newListing.title}"</strong> in <strong>${newListing.wilaya}</strong> may duplicate an exclusive listing.</p><p>Please review and resolve in the admin panel.</p><p><a href="${baseUrl}/AdminVerification">Open Admin Panel</a></p>`,
      }).catch(() => {});
    }));

    return Response.json({ conflict: true, conflict_listing_id: conflictListing.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});