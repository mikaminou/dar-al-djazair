/**
 * matchesSearch — config-driven listing filter utility.
 *
 * Pure function — no side effects, no imports of React.
 * Reads attribute-based filters from the property type config.
 * Adding a new property type or field in the config requires
 * zero changes to this file.
 */
import { getFieldsForType } from "@/components/propertyTypes.config";

/**
 * Legacy adapter: returns attribute value, checking listing.attributes first,
 * then falling back to top-level legacy columns.
 */
function getAttr(listing, key) {
  if (listing.attributes && listing.attributes[key] !== undefined) {
    return listing.attributes[key];
  }
  // Legacy top-level columns
  return listing[key];
}

/**
 * Normalize a unit_number field value to a canonical unit (m²).
 * unit_number fields are stored as { value, unit }.
 * For area: 1 hectare = 10000 m²
 */
function normalizeToM2(attrValue) {
  if (!attrValue) return null;
  if (typeof attrValue === "number") return attrValue;
  const { value, unit } = attrValue;
  if (!value) return null;
  if (unit === "hectares") return Number(value) * 10000;
  return Number(value); // m² or unitless
}

/**
 * Get the numeric value from an attribute (handles unit_number objects).
 */
function numericValue(attrValue) {
  if (!attrValue) return null;
  if (typeof attrValue === "number") return attrValue;
  if (typeof attrValue === "object" && attrValue.value !== undefined) return Number(attrValue.value);
  return Number(attrValue);
}

/**
 * Core match function.
 *
 * filters shape:
 * {
 *   listing_type?:  string,
 *   property_type?: string,
 *   wilaya?:        string,
 *   min_price?:     number|string,
 *   max_price?:     number|string,
 *   // Dynamic attribute filters — named min_<key>, max_<key>, or exact <key>
 *   // e.g. min_bedrooms, min_area, furnished, buildable
 *   [key: string]:  any,
 * }
 *
 * Returns true if the listing matches ALL active filters.
 */
export function matchesSearch(listing, filters) {
  if (!filters) return true;

  // ── Core columns ─────────────────────────────────────────────────────────────
  if (filters.listing_type && listing.listing_type !== filters.listing_type) return false;
  if (filters.property_type && listing.property_type !== filters.property_type) return false;
  if (filters.wilaya && listing.wilaya !== filters.wilaya) return false;

  const price = Number(listing.price) || 0;
  if (filters.min_price && price < Number(filters.min_price)) return false;
  if (filters.max_price && price > Number(filters.max_price)) return false;

  // ── Features list (static feature tags) ──────────────────────────────────────
  if (filters.features?.length) {
    if (!filters.features.every(f => (listing.features || []).includes(f))) return false;
  }

  // ── Agency office wilaya (handled externally in Listings page) ──────────────

  // ── Dynamic attribute filters from config ────────────────────────────────────
  const propertyType = listing.property_type;
  if (!propertyType) return true; // no type — skip attribute filters

  const fieldDefs = getFieldsForType(propertyType);
  const fieldMap = Object.fromEntries(fieldDefs.map(f => [f.key, f]));

  // Collect attribute-based filter keys from the filters object.
  // Conventions:
  //   min_<key>  → numeric lower bound on attribute <key>
  //   max_<key>  → numeric upper bound on attribute <key>
  //   <key>      → exact match (enum, boolean, etc.)
  const handledPrefixes = new Set(["listing_type", "property_type", "wilaya", "min_price", "max_price", "features", "agency_office_wilaya"]);

  for (const [filterKey, filterVal] of Object.entries(filters)) {
    if (!filterVal && filterVal !== false && filterVal !== 0) continue;
    if (handledPrefixes.has(filterKey)) continue;

    let attrKey = filterKey;
    let mode = "exact"; // "exact" | "min" | "max"

    if (filterKey.startsWith("min_")) { attrKey = filterKey.slice(4); mode = "min"; }
    else if (filterKey.startsWith("max_")) { attrKey = filterKey.slice(4); mode = "max"; }

    const fieldDef = fieldMap[attrKey];
    if (!fieldDef) {
      // Field not defined for this property type → no match (exclude listing)
      // ONLY applies if there's an actual non-empty filter value
      if (filterVal !== "" && filterVal !== null && filterVal !== undefined) return false;
      continue;
    }

    const attrVal = getAttr(listing, attrKey);

    if (fieldDef.type === "unit_number") {
      // Normalize both sides to m² for comparison
      const listingM2 = normalizeToM2(attrVal);
      const filterM2 = normalizeToM2(typeof filterVal === "object" ? filterVal : { value: filterVal, unit: "m²" });
      if (listingM2 === null) return false;
      if (mode === "min" && listingM2 < filterM2) return false;
      if (mode === "max" && listingM2 > filterM2) return false;
    } else if (fieldDef.type === "number") {
      const n = numericValue(attrVal);
      if (n === null || isNaN(n)) return false;
      if (mode === "min") {
        // Support "3+" syntax
        const isPlus = String(filterVal).endsWith("+");
        const threshold = parseInt(filterVal);
        if (isPlus ? n < threshold : n < threshold) return false;
      }
      if (mode === "max" && n > Number(filterVal)) return false;
      if (mode === "exact") {
        const isPlus = String(filterVal).endsWith("+");
        const threshold = parseInt(filterVal);
        if (isPlus ? n < threshold : n !== threshold) return false;
      }
    } else if (fieldDef.type === "boolean") {
      const boolVal = attrVal === true || attrVal === "true";
      const filterBool = filterVal === true || filterVal === "true";
      if (mode === "exact" && boolVal !== filterBool) return false;
    } else if (fieldDef.type === "enum") {
      if (mode === "exact" && attrVal !== filterVal) return false;
    } else if (fieldDef.type === "multi_enum") {
      // Filter value can be a single value or array — listing must include it
      const listingVals = Array.isArray(attrVal) ? attrVal : (attrVal ? [attrVal] : []);
      const required = Array.isArray(filterVal) ? filterVal : [filterVal];
      if (!required.every(v => listingVals.includes(v))) return false;
    } else if (fieldDef.type === "text") {
      if (mode === "exact" && attrVal !== filterVal) return false;
    }
  }

  return true;
}

/**
 * Apply matchesSearch to a list of listings.
 * Drop-in replacement for the old applyClientFilters function.
 */
export function applyDynamicFilters(listings, filters) {
  return listings.filter(l => matchesSearch(l, filters));
}