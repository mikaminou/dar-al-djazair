/**
 * Shared utilities for reading, formatting, and migrating listing attributes.
 * All functions are pure and dependency-free (no React, no fetch).
 *
 * This is the single place that handles:
 *  - Legacy column → attributes migration/adapter
 *  - Attribute value formatting (units, enums, booleans)
 *  - Notification template rendering
 *  - Social caption rendering
 *  - Duplicate detection per property type
 */
import { getPropertyType, getFieldsForType } from "@/components/propertyTypes.config";

// ─── Legacy adapter ───────────────────────────────────────────────────────────

/**
 * Legacy top-level columns that may be on old listings.
 * Maps column name → attribute key.
 */
const LEGACY_COLUMN_MAP = {
  area:          "area",
  rooms:         "rooms",
  bedrooms:      "bedrooms",
  bathrooms:     "bathrooms",
  floor:         "floor",
  total_floors:  "total_floors",
  furnished:     "furnished",
  year_built:    "year_built",
};

/**
 * Returns a merged attributes object: config-driven attributes take priority,
 * legacy columns fill in missing values.
 * This keeps backward compatibility without DB migration.
 */
export function resolveAttributes(listing) {
  const attrs = { ...(listing.attributes || {}) };
  for (const [col, attrKey] of Object.entries(LEGACY_COLUMN_MAP)) {
    if (attrs[attrKey] === undefined && listing[col] !== undefined && listing[col] !== null) {
      attrs[attrKey] = listing[col];
    }
  }
  return attrs;
}

// ─── Value formatting ─────────────────────────────────────────────────────────

/**
 * Format a single attribute value for display.
 * Returns a human-readable string or null if value is empty.
 */
export function formatAttributeValue(value, fieldDef, lang = "en") {
  if (value === null || value === undefined || value === "") return null;

  if (fieldDef.type === "boolean") {
    const labels = fieldDef.cardBadgeLabel?.[lang];
    if (labels) return value ? (labels.true || String(value)) : (labels.false || null);
    return value ? "✓" : "✗";
  }

  if (fieldDef.type === "enum") {
    const opt = fieldDef.options?.find(o => o.value === value);
    return opt ? (opt.label[lang] || opt.label.fr || value) : value;
  }

  if (fieldDef.type === "multi_enum") {
    if (!Array.isArray(value) || value.length === 0) return null;
    return value.map(v => {
      const opt = fieldDef.options?.find(o => o.value === v);
      return opt ? (opt.label[lang] || opt.label.fr || v) : v;
    }).join(", ");
  }

  if (fieldDef.type === "unit_number") {
    if (typeof value === "object" && value.value !== undefined) {
      return `${value.value} ${value.unit || ""}`.trim();
    }
    return String(value);
  }

  if (fieldDef.type === "number") {
    const unit = fieldDef.unit ? ` ${fieldDef.unit}` : "";
    return `${value}${unit}`;
  }

  return String(value);
}

/**
 * Returns all non-empty attribute key/value pairs for a listing,
 * with localized labels and formatted values.
 */
export function getFormattedAttributes(listing, lang = "en") {
  const attrs = resolveAttributes(listing);
  const fields = getFieldsForType(listing.property_type || "");
  const result = [];
  for (const field of fields) {
    const raw = attrs[field.key];
    if (raw === null || raw === undefined || raw === "") continue;
    const formatted = formatAttributeValue(raw, field, lang);
    if (formatted === null) continue;
    result.push({
      key: field.key,
      label: field.label[lang] || field.label.fr || field.key,
      value: formatted,
      rawValue: raw,
      fieldDef: field,
    });
  }
  return result;
}

// ─── Notification template rendering ─────────────────────────────────────────

/**
 * Per-type notification templates.
 * Placeholders: {{commune}}, {{wilaya}}, {{bedrooms}}, {{area_value}},
 *   {{area_unit}}, {{total_area_value}}, {{price_display}}
 * Unknown placeholders are removed silently.
 */
const NOTIFICATION_TEMPLATES = {
  apartment: {
    matchedListing: {
      en: "A {{bedrooms}}-bedroom apartment in {{commune}}, {{wilaya}}",
      fr: "Un appartement de {{bedrooms}} chambres à {{commune}}, {{wilaya}}",
      ar: "شقة {{bedrooms}} غرف في {{commune}}، {{wilaya}}",
    },
    reservedListing: {
      en: "The apartment in {{commune}} has been reserved",
      fr: "L'appartement à {{commune}} a été réservé",
      ar: "تم حجز الشقة في {{commune}}",
    },
    soldListing: {
      en: "The apartment in {{commune}} has been sold",
      fr: "L'appartement à {{commune}} a été vendu",
      ar: "تم بيع الشقة في {{commune}}",
    },
    rentedListing: {
      en: "The apartment in {{commune}} has been rented",
      fr: "L'appartement à {{commune}} a été loué",
      ar: "تم تأجير الشقة في {{commune}}",
    },
    availableAgain: {
      en: "The apartment in {{commune}} is available again",
      fr: "L'appartement à {{commune}} est à nouveau disponible",
      ar: "الشقة في {{commune}} متاحة مجدداً",
    },
  },
  house: {
    matchedListing: {
      en: "A house with {{bedrooms}} bedrooms in {{commune}}, {{wilaya}}",
      fr: "Une maison de {{bedrooms}} chambres à {{commune}}, {{wilaya}}",
      ar: "منزل {{bedrooms}} غرف في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The house in {{commune}} has been reserved", fr: "La maison à {{commune}} a été réservée", ar: "تم حجز المنزل في {{commune}}" },
    soldListing:     { en: "The house in {{commune}} has been sold",     fr: "La maison à {{commune}} a été vendue",   ar: "تم بيع المنزل في {{commune}}" },
    rentedListing:   { en: "The house in {{commune}} has been rented",   fr: "La maison à {{commune}} a été louée",    ar: "تم تأجير المنزل في {{commune}}" },
    availableAgain:  { en: "The house in {{commune}} is available again",fr: "La maison à {{commune}} est disponible", ar: "المنزل في {{commune}} متاح مجدداً" },
  },
  villa: {
    matchedListing: {
      en: "A villa with {{bedrooms}} bedrooms in {{commune}}, {{wilaya}}",
      fr: "Une villa de {{bedrooms}} chambres à {{commune}}, {{wilaya}}",
      ar: "فيلا {{bedrooms}} غرف في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The villa in {{commune}} has been reserved", fr: "La villa à {{commune}} a été réservée", ar: "تم حجز الفيلا في {{commune}}" },
    soldListing:     { en: "The villa in {{commune}} has been sold",     fr: "La villa à {{commune}} a été vendue",   ar: "تم بيع الفيلا في {{commune}}" },
    rentedListing:   { en: "The villa in {{commune}} has been rented",   fr: "La villa à {{commune}} a été louée",    ar: "تم تأجير الفيلا في {{commune}}" },
    availableAgain:  { en: "The villa in {{commune}} is available again",fr: "La villa à {{commune}} est disponible", ar: "الفيلا في {{commune}} متاحة مجدداً" },
  },
  land: {
    matchedListing: {
      en: "A plot of {{area_value}} {{area_unit}} in {{commune}}, {{wilaya}}",
      fr: "Un terrain de {{area_value}} {{area_unit}} à {{commune}}, {{wilaya}}",
      ar: "أرض {{area_value}} {{area_unit}} في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The land in {{commune}} has been reserved", fr: "Le terrain à {{commune}} a été réservé", ar: "تم حجز الأرض في {{commune}}" },
    soldListing:     { en: "The land in {{commune}} has been sold",     fr: "Le terrain à {{commune}} a été vendu",   ar: "تم بيع الأرض في {{commune}}" },
    rentedListing:   { en: "The land in {{commune}} has been rented",   fr: "Le terrain à {{commune}} a été loué",    ar: "تم تأجير الأرض في {{commune}}" },
    availableAgain:  { en: "The land in {{commune}} is available again",fr: "Le terrain à {{commune}} est disponible",ar: "الأرض في {{commune}} متاحة مجدداً" },
  },
  commercial: {
    matchedListing: {
      en: "A commercial space of {{area_value}} m² in {{commune}}, {{wilaya}}",
      fr: "Un local commercial de {{area_value}} m² à {{commune}}, {{wilaya}}",
      ar: "محل تجاري {{area_value}} م² في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The commercial space in {{commune}} has been reserved", fr: "Le local à {{commune}} a été réservé", ar: "تم حجز المحل في {{commune}}" },
    soldListing:     { en: "The commercial space in {{commune}} has been sold",     fr: "Le local à {{commune}} a été vendu",   ar: "تم بيع المحل في {{commune}}" },
    rentedListing:   { en: "The commercial space in {{commune}} has been rented",   fr: "Le local à {{commune}} a été loué",    ar: "تم تأجير المحل في {{commune}}" },
    availableAgain:  { en: "The commercial space in {{commune}} is available again",fr: "Le local à {{commune}} est disponible",ar: "المحل في {{commune}} متاح مجدداً" },
  },
  building: {
    matchedListing: {
      en: "A building with {{total_units}} units in {{commune}}, {{wilaya}}",
      fr: "Un immeuble de {{total_units}} unités à {{commune}}, {{wilaya}}",
      ar: "عمارة {{total_units}} وحدة في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The building in {{commune}} has been reserved", fr: "L'immeuble à {{commune}} a été réservé", ar: "تم حجز العمارة في {{commune}}" },
    soldListing:     { en: "The building in {{commune}} has been sold",     fr: "L'immeuble à {{commune}} a été vendu",   ar: "تم بيع العمارة في {{commune}}" },
    rentedListing:   { en: "The building in {{commune}} has been rented",   fr: "L'immeuble à {{commune}} a été loué",    ar: "تم تأجير العمارة في {{commune}}" },
    availableAgain:  { en: "The building in {{commune}} is available again",fr: "L'immeuble à {{commune}} est disponible",ar: "العمارة في {{commune}} متاحة مجدداً" },
  },
  office: {
    matchedListing: {
      en: "An office of {{area_value}} m² in {{commune}}, {{wilaya}}",
      fr: "Un bureau de {{area_value}} m² à {{commune}}, {{wilaya}}",
      ar: "مكتب {{area_value}} م² في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The office in {{commune}} has been reserved", fr: "Le bureau à {{commune}} a été réservé", ar: "تم حجز المكتب في {{commune}}" },
    soldListing:     { en: "The office in {{commune}} has been sold",     fr: "Le bureau à {{commune}} a été vendu",   ar: "تم بيع المكتب في {{commune}}" },
    rentedListing:   { en: "The office in {{commune}} has been rented",   fr: "Le bureau à {{commune}} a été loué",    ar: "تم تأجير المكتب في {{commune}}" },
    availableAgain:  { en: "The office in {{commune}} is available again",fr: "Le bureau à {{commune}} est disponible",ar: "المكتب في {{commune}} متاح مجدداً" },
  },
  farm: {
    matchedListing: {
      en: "A farm of {{total_area_value}} hectares in {{commune}}, {{wilaya}}",
      fr: "Une ferme de {{total_area_value}} hectares à {{commune}}, {{wilaya}}",
      ar: "مزرعة {{total_area_value}} هكتار في {{commune}}، {{wilaya}}",
    },
    reservedListing: { en: "The farm in {{commune}} has been reserved", fr: "La ferme à {{commune}} a été réservée", ar: "تم حجز المزرعة في {{commune}}" },
    soldListing:     { en: "The farm in {{commune}} has been sold",     fr: "La ferme à {{commune}} a été vendue",   ar: "تم بيع المزرعة في {{commune}}" },
    rentedListing:   { en: "The farm in {{commune}} has been rented",   fr: "La ferme à {{commune}} a été louée",    ar: "تم تأجير المزرعة في {{commune}}" },
    availableAgain:  { en: "The farm in {{commune}} is available again",fr: "La ferme à {{commune}} est disponible", ar: "المزرعة في {{commune}} متاحة مجدداً" },
  },
};

/**
 * Build template placeholders from a listing.
 */
function buildTemplatePlaceholders(listing, lang) {
  const attrs = resolveAttributes(listing);
  const areaField = attrs.area;
  const areaValue = typeof areaField === "object" ? areaField.value : areaField;
  const areaUnit  = typeof areaField === "object" ? areaField.unit  : "m²";

  return {
    commune:          listing.commune || listing.wilaya || "",
    wilaya:           listing.wilaya || "",
    bedrooms:         String(attrs.bedrooms ?? ""),
    area_value:       String(areaValue ?? ""),
    area_unit:        areaUnit,
    total_area_value: String(attrs.total_area ?? ""),
    total_units:      String(attrs.total_units ?? ""),
    price_display:    listing.price ? `${listing.price.toLocaleString()} DA` : "",
  };
}

/**
 * Render a notification template string, replacing placeholders.
 * Placeholders with empty values are removed gracefully.
 */
function renderTemplate(template, placeholders) {
  return template
    .replace(/{{(\w+)}}/g, (_, key) => {
      const val = placeholders[key];
      return val !== undefined && val !== "" ? val : "";
    })
    // Clean up double spaces or trailing punctuation from empty slots
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Render a notification message for a listing.
 * @param {object} listing
 * @param {"matchedListing"|"reservedListing"|"soldListing"|"rentedListing"|"availableAgain"} eventType
 * @param {"en"|"fr"|"ar"} lang
 */
export function renderNotificationBody(listing, eventType, lang = "fr") {
  const type = listing.property_type;
  const typeTemplates = NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.apartment;
  const template = typeTemplates[eventType]?.[lang] || typeTemplates[eventType]?.fr || "";
  if (!template) return listing.title || "";
  return renderTemplate(template, buildTemplatePlaceholders(listing, lang));
}

// ─── Social caption generation ────────────────────────────────────────────────

const SOCIAL_CAPTION_TEMPLATES = {
  apartment: {
    en: `🏠 {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} bed · {{area_value}} m² · Floor {{floor}}\nPrice: {{price_display}}`,
    fr: `🏠 {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} ch · {{area_value}} m² · Étage {{floor}}\nPrix : {{price_display}}`,
    ar: `🏠 {{title}} — {{commune}}، {{wilaya}}\n{{bedrooms}} غرف · {{area_value}} م² · طابق {{floor}}\nالسعر: {{price_display}}`,
  },
  house: {
    en: `🏡 {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} bed · {{area_value}} m²\nPrice: {{price_display}}`,
    fr: `🏡 {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} ch · {{area_value}} m²\nPrix : {{price_display}}`,
    ar: `🏡 {{title}} — {{commune}}، {{wilaya}}\n{{bedrooms}} غرف · {{area_value}} م²\nالسعر: {{price_display}}`,
  },
  villa: {
    en: `🏘️ {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} bed · {{area_value}} m²\nPrice: {{price_display}}`,
    fr: `🏘️ {{title}} — {{commune}}, {{wilaya}}\n{{bedrooms}} ch · {{area_value}} m²\nPrix : {{price_display}}`,
    ar: `🏘️ {{title}} — {{commune}}، {{wilaya}}\n{{bedrooms}} غرف · {{area_value}} م²\nالسعر: {{price_display}}`,
  },
  land: {
    en: `🌳 {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} {{area_unit}}\nPrice: {{price_display}}`,
    fr: `🌳 {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} {{area_unit}}\nPrix : {{price_display}}`,
    ar: `🌳 {{title}} — {{commune}}، {{wilaya}}\n{{area_value}} {{area_unit}}\nالسعر: {{price_display}}`,
  },
  commercial: {
    en: `🏪 {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} m²\nPrice: {{price_display}}`,
    fr: `🏪 {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} m²\nPrix : {{price_display}}`,
    ar: `🏪 {{title}} — {{commune}}، {{wilaya}}\n{{area_value}} م²\nالسعر: {{price_display}}`,
  },
  building: {
    en: `🏗️ {{title}} — {{commune}}, {{wilaya}}\n{{total_units}} units · {{area_value}} m²\nPrice: {{price_display}}`,
    fr: `🏗️ {{title}} — {{commune}}, {{wilaya}}\n{{total_units}} unités · {{area_value}} m²\nPrix : {{price_display}}`,
    ar: `🏗️ {{title}} — {{commune}}، {{wilaya}}\n{{total_units}} وحدات · {{area_value}} م²\nالسعر: {{price_display}}`,
  },
  office: {
    en: `🖥️ {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} m² office\nPrice: {{price_display}}`,
    fr: `🖥️ {{title}} — {{commune}}, {{wilaya}}\nBureau {{area_value}} m²\nPrix : {{price_display}}`,
    ar: `🖥️ {{title}} — {{commune}}، {{wilaya}}\nمكتب {{area_value}} م²\nالسعر: {{price_display}}`,
  },
  farm: {
    en: `🚜 {{title}} — {{commune}}, {{wilaya}}\n{{total_area_value}} hectares\nPrice: {{price_display}}`,
    fr: `🚜 {{title}} — {{commune}}, {{wilaya}}\n{{total_area_value}} hectares\nPrix : {{price_display}}`,
    ar: `🚜 {{title}} — {{commune}}، {{wilaya}}\n{{total_area_value}} هكتار\nالسعر: {{price_display}}`,
  },
};

/** Per-type suggested hashtags */
export const TYPE_HASHTAGS = {
  apartment:  ["#appartement", "#immobilier"],
  house:      ["#maison", "#immobilier"],
  villa:      ["#villa", "#standing", "#immobilier"],
  land:       ["#terrain", "#foncier", "#immobilier"],
  commercial: ["#commercial", "#localcommercial", "#immobilier"],
  building:   ["#immeuble", "#immeubleentier", "#immobilier"],
  office:     ["#bureau", "#espacepro", "#immobilier"],
  farm:       ["#ferme", "#agricole", "#terreagricole"],
};

/**
 * Generate a social media caption for a listing.
 * Empty placeholders are stripped gracefully.
 */
export function renderSocialCaption(listing, lang = "fr") {
  const type = listing.property_type || "apartment";
  const templates = SOCIAL_CAPTION_TEMPLATES[type] || SOCIAL_CAPTION_TEMPLATES.apartment;
  const template = templates[lang] || templates.fr;
  const attrs = resolveAttributes(listing);

  const areaField = attrs.area;
  const areaValue = typeof areaField === "object" ? areaField.value : areaField;
  const areaUnit  = typeof areaField === "object" ? areaField.unit  : "m²";

  const placeholders = {
    title:            listing.title || "",
    commune:          listing.commune || listing.wilaya || "",
    wilaya:           listing.wilaya || "",
    bedrooms:         String(attrs.bedrooms ?? ""),
    area_value:       String(areaValue ?? attrs.total_area ?? ""),
    area_unit:        areaUnit,
    total_area_value: String(attrs.total_area ?? ""),
    total_units:      String(attrs.total_units ?? ""),
    floor:            String(attrs.floor ?? ""),
    price_display:    listing.price ? `${listing.price.toLocaleString()} DA` : "",
  };

  // Replace, then strip lines that became empty after substitution
  return template
    .replace(/{{(\w+)}}/g, (_, key) => placeholders[key] ?? "")
    .split("\n")
    .map(line => line.replace(/\s{2,}/g, " ").trim())
    .filter(line => line && line !== "·" && !line.match(/^[\s·]+$/))
    .join("\n");
}

/**
 * Generate suggested hashtags for a listing.
 */
export function getSuggestedHashtags(listing) {
  const type = listing.property_type || "";
  const typeHashes = TYPE_HASHTAGS[type] || ["#immobilier"];
  const wilayaHash = listing.wilaya ? [`#${listing.wilaya.toLowerCase().replace(/\s+/g, "")}`] : [];
  const typeLabel = listing.listing_type === "sale" ? ["#vente"] : ["#location", "#louer"];
  const dedup = [...new Set([...typeHashes, ...wilayaHash, ...typeLabel])];
  return dedup;
}

// ─── Duplicate detection per property type ────────────────────────────────────

/**
 * Fields used to detect potential duplicate exclusive listings, per property type.
 * Each entry: { field, tolerance } — tolerance is a % (0.10 = 10%) for numeric fields,
 * or null for exact string matches.
 */
const DUPLICATE_DETECTION_CONFIG = {
  apartment: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "bedrooms",   tolerance: null, source: "attr" },
    { field: "bathrooms",  tolerance: null, source: "attr" },
    { field: "price",      tolerance: 0.10, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr" },
  ],
  house: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "bedrooms",   tolerance: null, source: "attr" },
    { field: "price",      tolerance: 0.10, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr" },
  ],
  villa: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "bedrooms",   tolerance: null, source: "attr" },
    { field: "price",      tolerance: 0.10, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr" },
  ],
  land: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr", normalize: "m2" },
    { field: "frontage_meters", tolerance: 0.10, source: "attr" },
  ],
  building: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "total_units",tolerance: 0.10, source: "attr" },
    { field: "total_area", tolerance: 0.10, source: "attr" },
  ],
  farm: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "total_area", tolerance: 0.10, source: "attr" },
  ],
  commercial: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "price",      tolerance: 0.10, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr" },
  ],
  office: [
    { field: "wilaya",     tolerance: null, source: "listing" },
    { field: "commune",    tolerance: null, source: "listing" },
    { field: "price",      tolerance: 0.10, source: "listing" },
    { field: "area",       tolerance: 0.10, source: "attr" },
  ],
};

function withinTolerance(a, b, pct) {
  if (!a || !b) return false;
  return Math.abs(Number(a) - Number(b)) / Math.max(Number(a), Number(b)) <= pct;
}

function normalizeAreaToM2(val) {
  if (!val) return null;
  if (typeof val === "object") {
    return val.unit === "hectares" ? Number(val.value) * 10000 : Number(val.value);
  }
  return Number(val);
}

/**
 * Check whether a candidate listing is a potential duplicate of a reference listing.
 * Uses per-type config rules.
 */
export function isPotentialDuplicate(referencelisting, candidateListing) {
  const type = referencelisting.property_type;
  const rules = DUPLICATE_DETECTION_CONFIG[type] || [
    // Generic fallback
    { field: "wilaya",  tolerance: null, source: "listing" },
    { field: "commune", tolerance: null, source: "listing" },
    { field: "price",   tolerance: 0.10, source: "listing" },
    { field: "area",    tolerance: 0.10, source: "attr" },
  ];

  const refAttrs  = resolveAttributes(referencelisting);
  const candAttrs = resolveAttributes(candidateListing);

  for (const rule of rules) {
    const refVal  = rule.source === "listing" ? referencelisting[rule.field] : refAttrs[rule.field];
    const candVal = rule.source === "listing" ? candidateListing[rule.field] : candAttrs[rule.field];

    if (rule.tolerance === null) {
      // Exact string match (case-insensitive)
      if (!refVal || !candVal) return false;
      if (String(refVal).toLowerCase().trim() !== String(candVal).toLowerCase().trim()) return false;
    } else {
      // Numeric range
      const a = rule.normalize === "m2" ? normalizeAreaToM2(refVal) : Number(refVal);
      const b = rule.normalize === "m2" ? normalizeAreaToM2(candVal) : Number(candVal);
      if (!withinTolerance(a, b, rule.tolerance)) return false;
    }
  }
  return true;
}

// ─── Saved search migration ───────────────────────────────────────────────────

/**
 * Migrate a legacy saved search filter object to the new attributes-based shape.
 * Idempotent — safe to run multiple times.
 *
 * Legacy shape: { listing_type, property_type, wilaya, min_price, max_price,
 *                 min_area, max_area, bedrooms, bathrooms, furnished, features }
 *
 * New shape: { listing_type, property_type, wilaya, min_price, max_price,
 *              attributes: { min_bedrooms, min_bathrooms, min_area, furnished, ... } }
 */
export function migrateSavedSearchFilters(oldFilters) {
  if (!oldFilters) return { attributes: {} };

  // Already migrated
  if (oldFilters.attributes !== undefined) return oldFilters;

  const {
    listing_type, property_type, wilaya,
    min_price, max_price,
    min_area, max_area,
    bedrooms, bathrooms,
    furnished,
    features,
    ...rest
  } = oldFilters;

  const attributes = {};
  if (min_area)   attributes.min_area    = min_area;
  if (max_area)   attributes.max_area    = max_area;
  if (bedrooms)   attributes.min_bedrooms = bedrooms;
  if (bathrooms)  attributes.min_bathrooms = bathrooms;
  if (furnished)  attributes.furnished   = furnished;

  return {
    listing_type:  listing_type  || null,
    property_type: property_type || null,
    wilaya:        wilaya        || null,
    min_price:     min_price     || null,
    max_price:     max_price     || null,
    attributes,
  };
}