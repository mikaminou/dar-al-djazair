/**
 * Quick Filter Chips Configuration
 * Single source of truth for all quick-filter chips in the marketplace.
 *
 * To add a new chip: add one entry to QUICK_FILTER_CHIPS.
 * No other file needs to change.
 *
 * Each chip:
 *   id       — unique identifier
 *   label    — { fr, ar, en }
 *   icon     — emoji or string icon
 *   filters  — the filter state applied when the chip is tapped
 */

export const QUICK_FILTER_CHIPS = [
  {
    id: "f3_alger",
    label: { fr: "F3 Alger", ar: "F3 الجزائر", en: "F3 Algiers" },
    icon: "🏢",
    filters: {
      property_type: "apartment",
      wilaya: "Alger",
      min_bedrooms: "2",
    },
  },
  {
    id: "villa_piscine",
    label: { fr: "Villa avec piscine", ar: "فيلا مع مسبح", en: "Villa with pool" },
    icon: "🏘️",
    filters: {
      property_type: "villa",
      pool: "true",
    },
  },
  {
    id: "terrain_constructible",
    label: { fr: "Terrain constructible", ar: "أرض قابلة للبناء", en: "Buildable land" },
    icon: "🌿",
    filters: {
      property_type: "land",
      buildable: "true",
    },
  },
  {
    id: "local_commercial",
    label: { fr: "Local commercial", ar: "محل تجاري", en: "Commercial space" },
    icon: "🏪",
    filters: {
      property_type: "commercial",
      listing_type: "rent",
    },
  },
  {
    id: "immeuble_entier",
    label: { fr: "Immeuble entier", ar: "عمارة كاملة", en: "Whole building" },
    icon: "🏗️",
    filters: {
      property_type: "building",
    },
  },
  {
    id: "ferme",
    label: { fr: "Ferme / Hacienda", ar: "مزرعة", en: "Farm" },
    icon: "🌾",
    filters: {
      property_type: "farm",
    },
  },
  {
    id: "bureau_partage",
    label: { fr: "Bureau open space", ar: "مكتب مفتوح", en: "Open space office" },
    icon: "🖥️",
    filters: {
      property_type: "office",
      partitioned: "false",
    },
  },
];