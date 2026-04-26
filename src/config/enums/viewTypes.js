/**
 * Shared view type enum — used across apartment, house, villa
 */
export const VIEW_TYPE_OPTIONS = [
  { value: "sea",
    label: { fr: "Vue mer",
             en: "Sea view",
             ar: "إطلالة بحر" } },
  { value: "mountain",
    label: { fr: "Vue montagne",
             en: "Mountain view",
             ar: "إطلالة جبل" } },
  { value: "city",
    label: { fr: "Vue ville",
             en: "City view",
             ar: "إطلالة مدينة" } },
  { value: "garden",
    label: { fr: "Vue jardin",
             en: "Garden view",
             ar: "إطلالة حديقة" } },
  { value: "courtyard",
    label: { fr: "Vue cour",
             en: "Courtyard view",
             ar: "إطلالة فناء" } },
  { value: "street",
    label: { fr: "Vue rue",
             en: "Street view",
             ar: "إطلالة شارع" } },
  { value: "panoramic",
    label: { fr: "Vue panoramique",
             en: "Panoramic view",
             ar: "إطلالة بانورامية" } },
];

// Villa-specific views (includes pool view)
export const VILLA_VIEW_OPTIONS = [
  ...VIEW_TYPE_OPTIONS,
  { value: "pool",
    label: { fr: "Vue piscine",
             en: "Pool view",
             ar: "إطلالة مسبح" } },
];

// Backward compatibility alias
export const VIEW_OPTIONS = VIEW_TYPE_OPTIONS;