/**
 * migrateListingAmenities
 * 
 * Migrates all published listings from legacy flat features array
 * into the unified amenities structure in attributes per property type.
 * 
 * For listings with old data, moves known feature keys into attributes
 * based on property type, and stores unknown ones under attributes.legacy_features.
 * 
 * Run this as an admin-only utility function via the dashboard.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Legacy feature keys that exist in the old FEATURES_LIST
const LEGACY_FEATURES = [
  "parking", "garage", "garden", "balcony", "terrace", "pool",
  "elevator", "security", "air_conditioning", "heating", "solar_panels",
  "well", "intercom", "double_glazing", "generator", "water_tank",
  "cave", "concierge", "fiber_internet", "has_storefront", "has_storage",
  "has_water_access", "has_electricity", "has_road_access"
];

// Map legacy keys to property type-specific amenity field names
const LEGACY_TO_AMENITY_MAP = {
  "apartment": ["parking", "balcony", "elevator", "fiber_internet", "terrace", "cave", "concierge",
                "security", "air_conditioning", "heating", "solar_panels", "well", "intercom", "double_glazing", "generator", "water_tank"],
  "house": ["garden", "garage", "terrace", "pool", "fiber_internet",
            "security", "air_conditioning", "heating", "solar_panels", "well", "intercom", "double_glazing", "generator", "water_tank"],
  "villa": ["garden", "garage_spots", "pool", "terrace", "fiber_internet",
           "security", "air_conditioning", "heating", "solar_panels", "well", "intercom", "double_glazing", "generator", "water_tank"],
  "land": ["has_water_access", "has_electricity", "has_road_access"],
  "commercial": ["has_storefront", "has_storage", "parking", "security", "air_conditioning"],
  "building": ["has_elevator", "parking_spots", "has_basement", "security", "generator", "water_tank"],
  "office": ["has_elevator", "parking_spots", "air_conditioning", "fiber_internet", "security"],
  "farm": ["has_water_access", "has_electricity"]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { listing_id } = body;

    if (!listing_id) {
      return Response.json({ error: "listing_id required" }, { status: 400 });
    }

    // Fetch the listing
    const listings = await base44.asServiceRole.entities.Listing.filter({ id: listing_id }, null, 1).catch(() => []);
    if (!listings[0]) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }

    const listing = listings[0];
    const propType = listing.property_type || "apartment";
    const amenityKeys = LEGACY_TO_AMENITY_MAP[propType] || [];

    // If no legacy features, nothing to migrate
    if (!listing.features || listing.features.length === 0) {
      return Response.json({ migrated: false, reason: "No legacy features found" });
    }

    // Build new attributes
    const newAttrs = { ...(listing.attributes || {}) };
    const legacyFeatures = [];

    for (const feat of listing.features) {
      if (amenityKeys.includes(feat)) {
        // Known amenity for this type → map to boolean in attributes
        newAttrs[feat] = true;
      } else if (LEGACY_FEATURES.includes(feat)) {
        // Known legacy feature but not for this type → store in legacy_features for review
        legacyFeatures.push(feat);
      }
      // else: completely unknown, skip
    }

    // Store unknown features for admin review
    if (legacyFeatures.length > 0) {
      newAttrs.legacy_features = legacyFeatures;
    }

    // Update listing: clear features array, set new attributes
    await base44.asServiceRole.entities.Listing.update(listing_id, {
      attributes: newAttrs,
      features: [] // Clear old features array
    });

    return Response.json({
      migrated: true,
      listing_id,
      property_type: propType,
      amenities_migrated: amenityKeys.filter(k => listing.features.includes(k)),
      unknown_features_stored: legacyFeatures
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});