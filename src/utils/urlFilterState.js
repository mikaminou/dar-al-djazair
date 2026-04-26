/**
 * URL ↔ Filter State encoder/decoder for the marketplace.
 *
 * Universal filter keys map directly (type, pt, w, c, min_price, max_price).
 * Dynamic attribute filters are prefixed with "attr_".
 * Sort and view are encoded as "sort" and "view".
 *
 * Unknown or invalid params are silently dropped.
 */

// Universal filter URL key mappings
const UNIVERSAL_MAP = {
  listing_type:         "type",
  property_type:        "pt",
  wilaya:               "w",
  commune:              "c",
  min_price:            "min_price",
  max_price:            "max_price",
  agency_office_wilaya: "agw",
  furnished:            "fur",
};

const UNIVERSAL_MAP_REVERSE = Object.fromEntries(
  Object.entries(UNIVERSAL_MAP).map(([k, v]) => [v, k])
);

const VALID_LISTING_TYPES = new Set(["sale", "rent"]);
const VALID_PROPERTY_TYPES = new Set([
  "apartment", "house", "villa", "land",
  "commercial", "building", "office", "farm",
]);

/**
 * Encode current filter state + sort + view → URL search string
 */
export function encodeFiltersToUrl(filters, sort, view) {
  const params = new URLSearchParams();

  // Universal filters
  for (const [filterKey, urlKey] of Object.entries(UNIVERSAL_MAP)) {
    const val = filters[filterKey];
    if (val && val !== "") params.set(urlKey, val);
  }

  // Dynamic attribute filters (everything else except features)
  const skip = new Set([...Object.keys(UNIVERSAL_MAP), "features"]);
  for (const [key, val] of Object.entries(filters)) {
    if (skip.has(key)) continue;
    if (val === "" || val === null || val === undefined) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    params.set(`attr_${key}`, Array.isArray(val) ? val.join(",") : String(val));
  }

  // Features array
  if (filters.features?.length) {
    params.set("attr_features", filters.features.join(","));
  }

  if (sort && sort !== "-created_date") params.set("sort", sort);
  if (view && view !== "grid") params.set("view", view);

  return params.toString();
}

/**
 * Decode URL search string → filter state + sort + view
 */
export function decodeFiltersFromUrl(search) {
  const params = new URLSearchParams(search);
  const filters = {};
  let sort = "-created_date";
  let view = "grid";

  // Universal filters
  for (const [urlKey, filterKey] of Object.entries(UNIVERSAL_MAP_REVERSE)) {
    const val = params.get(urlKey);
    if (!val) continue;

    // Validate enum values
    if (filterKey === "listing_type" && !VALID_LISTING_TYPES.has(val)) continue;
    if (filterKey === "property_type" && !VALID_PROPERTY_TYPES.has(val)) continue;

    filters[filterKey] = val;
  }

  // Dynamic attribute filters
  for (const [urlKey, val] of params.entries()) {
    if (!urlKey.startsWith("attr_")) continue;
    const attrKey = urlKey.slice(5); // strip "attr_"

    if (attrKey === "features") {
      filters.features = val.split(",").filter(Boolean);
    } else {
      filters[attrKey] = val;
    }
  }

  // Sort and view
  const sortParam = params.get("sort");
  if (sortParam) sort = sortParam;
  const viewParam = params.get("view");
  if (viewParam && ["grid", "list"].includes(viewParam)) view = viewParam;

  return { filters, sort, view };
}

/**
 * Push updated filter/sort/view state to browser URL without page reload.
 */
export function pushFilterStateToUrl(filters, sort, view) {
  const qs = encodeFiltersToUrl(filters, sort, view);
  const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", newUrl);
}