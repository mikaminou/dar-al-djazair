/**
 * Shared lot type enum.
 *
 * Used by:
 *  - Project entity (lot_types field)
 *  - Building property type (units_breakdown field)
 *
 * Do not hardcode lot type strings anywhere else — always import from here.
 */

export const LOT_TYPES = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6_plus",
  "duplex",
  "penthouse",
  "commercial",
  "parking",
];

/** Localized labels for each lot type */
export const LOT_TYPE_LABELS = {
  F1:          { en: "F1 (Studio)",    fr: "F1 (Studio)",    ar: "F1 (استوديو)"  },
  F2:          { en: "F2 (1 bed)",     fr: "F2 (1 ch.)",     ar: "F2 (غرفة)"     },
  F3:          { en: "F3 (2 bed)",     fr: "F3 (2 ch.)",     ar: "F3 (غرفتان)"   },
  F4:          { en: "F4 (3 bed)",     fr: "F4 (3 ch.)",     ar: "F4 (3 غرف)"    },
  F5:          { en: "F5 (4 bed)",     fr: "F5 (4 ch.)",     ar: "F5 (4 غرف)"    },
  F6_plus:     { en: "F6+",           fr: "F6+",            ar: "F6+"           },
  duplex:      { en: "Duplex",         fr: "Duplex",         ar: "دوبلكس"        },
  penthouse:   { en: "Penthouse",      fr: "Penthouse",      ar: "بنتهاوس"       },
  commercial:  { en: "Commercial",     fr: "Commercial",     ar: "تجاري"         },
  parking:     { en: "Parking spot",   fr: "Place parking",  ar: "موقف سيارات"   },
};

/**
 * Returns the localized label for a lot type.
 * @param {string} lotType
 * @param {"en"|"fr"|"ar"} lang
 */
export function getLotTypeLabel(lotType, lang = "fr") {
  return LOT_TYPE_LABELS[lotType]?.[lang] || LOT_TYPE_LABELS[lotType]?.fr || lotType;
}

/**
 * Returns an array of { value, label } objects suitable for select dropdowns.
 * @param {"en"|"fr"|"ar"} lang
 */
export function getLotTypeOptions(lang = "fr") {
  return LOT_TYPES.map(value => ({
    value,
    label: getLotTypeLabel(value, lang),
  }));
}