/**
 * Called after a new listing is created (status=pending).
 * Checks if any existing active+exclusive listing is a potential duplicate.
 *
 * Duplicate detection rules are defined per property type via config.
 * Generic fallback applies for types without explicit rules.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Duplicate detection config (mirrors utils/listingAttributes.js) ──────────
// Defined inline here since backend functions cannot import from src/

const DUPLICATE_DETECTION_CONFIG = {
  apartment: [
    { field: "wilaya",    tolerance: null, source: "listing" },
    { field: "commune",   tolerance: null, source: "listing" },
    { field: "bedrooms",  tolerance: null, source: "attr" },
    { field: "bathrooms", tolerance: null, source: "attr" },
    { field: "price",     tolerance: 0.10, source: "listing" },
    { field: "area",      tolerance: 0.10, source: "attr" },
  ],
  house: [
    { field: "wilaya",   tolerance: null, source: "listing" },
    { field: "commune",  tolerance: null, source: "listing" },
    { field: "bedrooms", tolerance: null, source: "attr" },
    { field: "price",    tolerance: 0.10, source: "listing" },
    { field: "area",     tolerance: 0.10, source: "attr" },
  ],
  villa: [
    { field: "wilaya",   tolerance: null, source: "listing" },
    { field: "commune",  tolerance: null, source: "listing" },
    { field: "bedrooms", tolerance: null, source: "attr" },
    { field: "price",    tolerance: 0.10, source: "listing" },
    { field: "area",     tolerance: 0.10, source: "attr" },
  ],
  land: [
    { field: "wilaya",          tolerance: null, source: "listing" },
    { field: "commune",         tolerance: null, source: "listing" },
    { field: "area",            tolerance: 0.10, source: "attr", normalize: "m2" },
    { field: "frontage_meters", tolerance: 0.10, source: "attr" },
  ],
  building: [
    { field: "wilaya",      tolerance: null, source: "listing" },
    { field: "commune",     tolerance: null, source: "listing" },
    { field: "total_units", tolerance: 0.10, source: "attr" },
    { field: "total_area",  tolerance: 0.10, source: "attr" },
  ],
  farm: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "total_area", tolerance: 0.10, source: "attr" },
  ],
  commercial: [
    { field: "wilaya",  tolerance: null, source: "listing" },
    { field: "commune", tolerance: null, source: "listing" },
    { field: "price",   tolerance: 0.10, source: "listing" },
    { field: "area",    tolerance: 0.10, source: "attr" },
  ],
  office: [
    { field: "wilaya",  tolerance: null, source: "listing" },
    { field: "commune", tolerance: null, source: "listing" },
    { field: "price",   tolerance: 0.10, source: "listing" },
    { field: "area",    tolerance: 0.10, source: "attr" },
  ],
};

const GENERIC_FALLBACK = [
  { field: "wilaya",  tolerance: null, source: "listing" },
  { field: "commune", tolerance: null, source: "listing" },
  { field: "price",   tolerance: 0.10, source: "listing" },
  { field: "area",    tolerance: 0.10, source: "attr" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function withinTolerance(a, b, pct) {
  if (a == null || b == null) return false;
  const na = Number(a), nb = Number(b);
  if (isNaN(na) || isNaN(nb) || na === 0 || nb === 0) return false;
  return Math.abs(na - nb) / Math.max(na, nb) <= pct;
}

function normalizeAreaToM2(val) {
  if (!val) return null;
  if (typeof val === "object") {
    return val.unit === "hectares" ? Number(val.value) * 10000 : Number(val.value);
  }
  return Number(val);
}

/** Resolve attribute value: check attributes JSONB first, then legacy column */
function getAttr(listing, key) {
  if (listing.attributes && listing.attributes[key] !== undefined) return listing.attributes[key];
  return listing[key];
}

/**
 * Returns true if candidate is a potential duplicate of reference,
 * based on the per-type detection config.
 */
function isPotentialDuplicate(reference, candidate) {
  const rules = DUPLICATE_DETECTION_CONFIG[reference.property_type] || GENERIC_FALLBACK;

  for (const rule of rules) {
    const refVal  = rule.source === "listing" ? reference[rule.field]  : getAttr(reference, rule.field);
    const candVal = rule.source === "listing" ? candidate[rule.field]  : getAttr(candidate, rule.field);

    if (rule.tolerance === null) {
      // Exact string match required
      if (!refVal || !candVal) return false;
      if (String(refVal).toLowerCase().trim() !== String(candVal).toLowerCase().trim()) return false;
    } else {
      // Numeric range comparison
      const a = rule.normalize === "m2" ? normalizeAreaToM2(refVal)  : Number(refVal);
      const b = rule.normalize === "m2" ? normalizeAreaToM2(candVal) : Number(candVal);
      if (!withinTolerance(a, b, rule.tolerance)) return false;
    }
  }

  return true;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { listing_id } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400 });

    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1);
    const newListing = listings[0];
    if (!newListing) return Response.json({ error: "Listing not found" }, { status: 404 });

    // Find active exclusive listings in same wilaya + same property type + listing type
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
      if (isPotentialDuplicate(newListing, c)) {
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