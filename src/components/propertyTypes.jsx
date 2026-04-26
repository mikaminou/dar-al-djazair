/**
 * SINGLE SOURCE OF TRUTH — property type definitions.
 *
 * To add a new property type: add one entry to PROPERTY_TYPE_DEFS.
 * To add a field to an existing type: add one entry to that type's `fields` array.
 * No other file needs to change for structural fields.
 *
 * Field types:
 *   number      → numeric input
 *   boolean     → toggle / checkbox
 *   enum        → single select
 *   multi_enum  → multi-select chips
 *   unit_number → number + unit selector
 *   text        → free text
 *
 * Card display flags (on FieldDefinition):
 *   showInListingCard?: boolean      — include in card fact row candidates
 *   cardOrder?: number               — lower = higher priority (default 99)
 *   cardIcon?: string                — icon key resolved in ListingCardFacts
 *   cardFormat?: 'value_unit'|'icon_value'|'boolean_chip'|'enum_label'
 *
 * Badge flags (on FieldDefinition):
 *   showAsCardBadge?: boolean        — render in badge row
 *   cardBadgePriority?: number       — higher = shown first (default 0)
 *   cardBadgeStyle?: 'positive'|'neutral'|'warning'
 *   cardBadgeLabel?: { [lang]: { true?: string, false?: string, [val]: string } }
 *   cardBadgeCondition?: 'rent_only' | 'sale_only' | 'if_true' | 'if_false' | 'always'
 *
 * Conditional visibility:
 *   conditional?: { field: string, value: any | any[] }
 *   Field renders only when the dependent field has the specified value(s).
 */

// ─── Shared Enums ─────────────────────────────────────────────────────────────
import { ORIENTATION_OPTIONS } from "../config/enums/orientation";
import { VIEW_TYPE_OPTIONS, VILLA_VIEW_OPTIONS } from "../config/enums/viewTypes";
import { TITLE_TYPES } from "../config/enums/titleTypes";
import { IRRIGATION_TYPES } from "../config/enums/irrigationType";
import { CROP_OPTIONS } from "../config/enums/crops";
import { SOIL_TYPES } from "../config/enums/soilTypes";
import { OFFICE_LAYOUT_OPTIONS } from "../config/enums/officeLayout";
import { PARKING_TYPES } from "../config/enums/parkingType";
import { HEATING_TYPE_OPTIONS } from "../config/enums/heatingTypes";

// ─── Shared option sets ───────────────────────────────────────────────────────
// ─── Universal amenities (relevant to most types) ────────────────────────────
const UNIVERSAL_AMENITIES = [
  { value: "security",       label: { en: "Security",       fr: "Sécurité",        ar: "أمان"          } },
  { value: "air_conditioning",label: { en: "Air Conditioning", fr: "Climatisation", ar: "تكييف هواء"  } },
  { value: "solar_panels",   label: { en: "Solar Panels",   fr: "Panneaux solaires",ar: "ألواح شمسية" } },
  { value: "well",           label: { en: "Well",           fr: "Puits",           ar: "بئر"           } },
  { value: "intercom",       label: { en: "Intercom",       fr: "Interphone",      ar: "جرس باب"      } },
  { value: "double_glazing", label: { en: "Double Glazing", fr: "Double vitrage",  ar: "زجاج مزدوج"   } },
  { value: "generator",      label: { en: "Generator",      fr: "Générateur",      ar: "مولد كهرباء" } },
];

const FURNISHED_OPTIONS = [
  { value: "furnished",      label: { en: "Furnished",      fr: "Meublé",          ar: "مفروش"        } },
  { value: "semi_furnished", label: { en: "Semi-furnished", fr: "Semi-meublé",     ar: "مفروش جزئياً"  } },
  { value: "unfurnished",    label: { en: "Unfurnished",    fr: "Non meublé",      ar: "غير مفروش"    } },
];

export const PROPERTY_TYPE_DEFS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // APARTMENT — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "apartment",
    label: { en: "Apartment", fr: "Appartement", ar: "شقة" },
    icon: "🏢",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "construction",    label: { en: "Construction",    fr: "Construction",     ar: "البناء"   }, order: 4 },
    ],
    fields: [
      { key: "area",         type: "number",  required: true,                               label: { en: "Area (m²)",    fr: "Surface (m²)",   ar: "المساحة (م²)"    }, unit: "m²",  min: 1, warnBelow: 20, warnAbove: 1000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 2, cardIcon: "ruler",  cardFormat: "value_unit" },
      { key: "rooms",        type: "number",  required: true,                               label: { en: "Rooms",        fr: "Pièces",         ar: "الغرف"           },             min: 1, max: 50,                          group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 4, cardIcon: "grid",   cardFormat: "icon_value" },
      { key: "bedrooms",     type: "number",  required: true,                               label: { en: "Bedrooms",     fr: "Chambres",       ar: "غرف النوم"       },             min: 0, max: 20,                          group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "bed",    cardFormat: "icon_value" },
      { key: "bathrooms",    type: "number",  required: true,                               label: { en: "Bathrooms",    fr: "Salles de bain", ar: "الحمامات"        },             min: 0, max: 10,                          group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 5, cardIcon: "bath",   cardFormat: "icon_value" },
      { key: "floor",        type: "number",  required: true,                               label: { en: "Floor",        fr: "Étage",          ar: "الطابق"          }, helperText: { en: "0 = Ground floor", fr: "0 = Rez-de-chaussée", ar: "0 = الطابق الأرضي" }, min: 0, max: 50, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "floors", cardFormat: "icon_value" },
      { key: "building_total_floors", type: "number",  required: false,                     label: { en: "Floors in Building", fr: "Étages dans l'immeuble", ar: "طوابق العمارة" }, min: 1, max: 200, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "is_top_floor", type: "boolean", required: false,                              label: { en: "Top Floor",    fr: "Dernier étage",  ar: "الطابق الأخير"   }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 11, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Top Floor" }, fr: { true: "Dernier étage" }, ar: { true: "الطابق الأخير" } } },
      { key: "orientation",  type: "multi_enum", required: false,                           label: { en: "Orientation", fr: "Orientation", ar: "التوجيه" }, options: ORIENTATION_OPTIONS, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "view_type",    type: "multi_enum", required: false,                           label: { en: "View",        fr: "Vue",           ar: "الإطلالة"         }, options: VIEW_TYPE_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "furnished",    type: "enum",    required: { whenListingType: "rent" },        label: { en: "Furnished",    fr: "Ameublement",    ar: "التأثيث"         }, options: FURNISHED_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "rent_only",
        cardBadgeLabel: { en: { furnished: "Furnished" }, fr: { furnished: "Meublé" }, ar: { furnished: "مفروش" } } },
      { key: "heating_type",  type: "enum",    required: false,                            label: { en: "Heating type", fr: "Type de chauffage", ar: "نوع التدفئة" }, options: HEATING_TYPE_OPTIONS, group: "amenities", showInSearchFilter: true, showInListingCard: false },
      { key: "water_tank",   type: "boolean", required: false,                              label: { en: "Water tank",   fr: "Réservoir / Bâche à eau", ar: "خزان ماء"    }, group: "amenities", showInSearchFilter: true, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Water tank" }, fr: { true: "Bâche à eau" }, ar: { true: "خزان ماء" } } },
      { key: "balcony",      type: "boolean", required: false,                              label: { en: "Balcony",      fr: "Balcon",         ar: "شرفة"            }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
         showAsCardBadge: true, cardBadgePriority: 12, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
         cardBadgeLabel: { en: { true: "Balcony" }, fr: { true: "Balcon" }, ar: { true: "شرفة" } } },
        { key: "parking",      type: "boolean", required: false,                              label: { en: "Parking",      fr: "Parking",        ar: "موقف سيارات"    }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
          showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
          cardBadgeLabel: { en: { true: "Parking" }, fr: { true: "Parking" }, ar: { true: "موقف" } } },
        { key: "parking_type", type: "enum",    required: false, conditional: { field: "parking", value: true }, label: { en: "Parking Type", fr: "Type de parking", ar: "نوع الموقف" }, options: PARKING_TYPES, group: "amenities", showInSearchFilter: false, showInListingCard: false },
        { key: "elevator",     type: "boolean", required: false,                              label: { en: "Elevator",     fr: "Ascenseur",      ar: "مصعد"            }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
          showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
          cardBadgeLabel: { en: { true: "Elevator" }, fr: { true: "Ascenseur" }, ar: { true: "مصعد" } } },
        { key: "fiber_internet",type: "boolean", required: false,                              label: { en: "Fiber Internet", fr: "Fibre optique",  ar: "ألياف بصرية"   }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
        { key: "terrace",      type: "boolean", required: false,                              label: { en: "Terrace",      fr: "Terrasse",       ar: "تراس"            }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
          showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
          cardBadgeLabel: { en: { true: "Terrace" }, fr: { true: "Terrasse" }, ar: { true: "تراس" } } },
        { key: "cave",         type: "boolean", required: false,                              label: { en: "Cellar",       fr: "Cellier",        ar: "قبو"             }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
        { key: "concierge",    type: "boolean", required: false,                              label: { en: "Concierge",    fr: "Concierge",      ar: "بواب"            }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
        ...UNIVERSAL_AMENITIES.map(opt => ({ 
          key: opt.value, type: "boolean", required: false, label: opt.label, 
          group: "amenities", showInSearchFilter: false, showInListingCard: false 
        })),
        { key: "building_age",   type: "number",  required: false,                              label: { en: "Building Year Built",   fr: "Année de constr. de l'immeuble", ar: "سنة بناء العمارة"     },             min: 1900, max: 2030,                   group: "construction",    showInSearchFilter: false, showInListingCard: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // HOUSE — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "house",
    label: { en: "House", fr: "Maison", ar: "منزل" },
    icon: "🏠",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "construction",    label: { en: "Construction",    fr: "Construction",     ar: "البناء"   }, order: 4 },
    ],
    fields: [
      { key: "area",       type: "number",  required: true,                        label: { en: "Built Area (m²)",  fr: "Surface habitable (m²)", ar: "المساحة المبنية (م²)" }, unit: "m²",  min: 1, warnBelow: 40, warnAbove: 2000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "ruler", cardFormat: "value_unit" },
      { key: "land_area",  type: "number",  required: false,                       label: { en: "Land Area (m²)",   fr: "Surface terrain (m²)",  ar: "مساحة الأرض (م²)"    }, unit: "m²",  min: 1,                           group: "surfaces",        showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "tree", cardFormat: "value_unit" },
      { key: "rooms",      type: "number",  required: true,                        label: { en: "Rooms",            fr: "Pièces",                ar: "الغرف"                },             min: 1, max: 50,                      group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 4, cardIcon: "grid", cardFormat: "icon_value" },
      { key: "bedrooms",   type: "number",  required: true,                        label: { en: "Bedrooms",         fr: "Chambres",              ar: "غرف النوم"            },             min: 0, max: 20,                      group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 2, cardIcon: "bed",  cardFormat: "icon_value" },
      { key: "bathrooms",  type: "number",  required: true,                        label: { en: "Bathrooms",        fr: "Salles de bain",        ar: "الحمامات"             },             min: 0, max: 10,                      group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 5, cardIcon: "bath", cardFormat: "icon_value" },
      { key: "levels",     type: "number",  required: true,                        label: { en: "Levels / Floors",  fr: "Niveaux",               ar: "الطوابق"              },             min: 1, max: 10,                      group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "orientation",  type: "multi_enum", required: false,                  label: { en: "Orientation", fr: "Orientation", ar: "التوجيه" }, options: ORIENTATION_OPTIONS, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "view_type",    type: "multi_enum", required: false,                  label: { en: "View",        fr: "Vue",           ar: "الإطلالة"         }, options: VIEW_TYPE_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "furnished",  type: "enum",    required: { whenListingType: "rent" }, label: { en: "Furnished",        fr: "Ameublement",           ar: "التأثيث"              }, options: FURNISHED_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "has_basement",  type: "boolean", required: false,                    label: { en: "Basement",        fr: "Sous-sol",           ar: "قبو"                 }, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "heating_type",  type: "enum",    required: false,                    label: { en: "Heating type", fr: "Type de chauffage", ar: "نوع التدفئة" }, options: HEATING_TYPE_OPTIONS, group: "amenities", showInSearchFilter: true, showInListingCard: false },
      { key: "water_tank",   type: "boolean", required: false,                     label: { en: "Water tank",   fr: "Réservoir / Bâche à eau", ar: "خزان ماء"    }, group: "amenities", showInSearchFilter: true, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Water tank" }, fr: { true: "Bâche à eau" }, ar: { true: "خزان ماء" } } },
      { key: "garden",     type: "boolean", required: false,                       label: { en: "Garden",           fr: "Jardin",                ar: "حديقة"                }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Garden" }, fr: { true: "Jardin" }, ar: { true: "حديقة" } } },
      { key: "pool",     type: "boolean", required: false,                         label: { en: "Pool",             fr: "Piscine",               ar: "مسبح"                 }, group: "amenities",        showInSearchFilter: true, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Pool" }, fr: { true: "Piscine" }, ar: { true: "مسبح" } } },
      { key: "garage",     type: "boolean", required: false,                       label: { en: "Garage",           fr: "Garage",                ar: "مرآب"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 7, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Garage" }, fr: { true: "Garage" }, ar: { true: "مرآب" } } },
      { key: "parking_type", type: "enum",    required: false, conditional: { field: "garage", value: true }, label: { en: "Parking Type", fr: "Type de parking", ar: "نوع الموقف" }, options: PARKING_TYPES, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "has_well",   type: "boolean", required: false,                       label: { en: "Well",             fr: "Puits",                 ar: "بئر"                  }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Well" }, fr: { true: "Puits" }, ar: { true: "بئر" } } },
      { key: "boundary_walls", type: "boolean", required: false,                   label: { en: "Walled / Fenced",  fr: "Clôturé",               ar: "مسوّر"                }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Walled" }, fr: { true: "Clôturé" }, ar: { true: "مسوّر" } } },
      { key: "has_summer_kitchen", type: "boolean", required: false,               label: { en: "Summer Kitchen",   fr: "Cuisine d'été",         ar: "مطبخ صيفي"           }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 4, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Summer Kitchen" }, fr: { true: "Cuisine d'été" }, ar: { true: "مطبخ صيفي" } } },
      { key: "terrace",      type: "boolean", required: false,                       label: { en: "Terrace",          fr: "Terrasse",              ar: "تراس"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Terrace" }, fr: { true: "Terrasse" }, ar: { true: "تراس" } } },
      { key: "pool",         type: "boolean", required: false,                       label: { en: "Pool",             fr: "Piscine",               ar: "مسبح"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Pool" }, fr: { true: "Piscine" }, ar: { true: "مسبح" } } },
      { key: "fiber_internet",type: "boolean", required: false,                       label: { en: "Fiber Internet",   fr: "Fibre optique",       ar: "ألياف بصرية"         }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
       ...UNIVERSAL_AMENITIES.map(opt => ({ 
         key: opt.value, type: "boolean", required: false, label: opt.label, 
         group: "amenities", showInSearchFilter: false, showInListingCard: false 
       })),
       { key: "year_built", type: "number",  required: false,                       label: { en: "Year Built",       fr: "Année de constr.",      ar: "سنة البناء"           },             min: 1900, max: 2030,               group: "construction",    showInSearchFilter: false, showInListingCard: false },
       ],
       },

  // ─────────────────────────────────────────────────────────────────────────────
  // VILLA — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "villa",
    label: { en: "Villa", fr: "Villa", ar: "فيلا" },
    icon: "🏡",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "construction",    label: { en: "Construction",    fr: "Construction",     ar: "البناء"   }, order: 4 },
    ],
    fields: [
      { key: "area",         type: "number",  required: true,                        label: { en: "Built Area (m²)",  fr: "Surface habitable (m²)", ar: "المساحة المبنية (م²)" }, unit: "m²",  min: 1, warnBelow: 80, warnAbove: 5000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 2, cardIcon: "ruler", cardFormat: "value_unit" },
      { key: "land_area",    type: "number",  required: true,                        label: { en: "Land Area (m²)",   fr: "Surface terrain (m²)",  ar: "مساحة الأرض (م²)"    }, unit: "m²",  min: 1,                          group: "surfaces",        showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "tree", cardFormat: "value_unit" },
      { key: "rooms",        type: "number",  required: true,                        label: { en: "Rooms",            fr: "Pièces",                ar: "الغرف"                },             min: 1, max: 50,                     group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 4, cardIcon: "grid", cardFormat: "icon_value" },
      { key: "bedrooms",     type: "number",  required: true,                        label: { en: "Bedrooms",         fr: "Chambres",              ar: "غرف النوم"            },             min: 0, max: 20,                     group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "bed",  cardFormat: "icon_value" },
      { key: "bathrooms",    type: "number",  required: true,                        label: { en: "Bathrooms",        fr: "Salles de bain",        ar: "الحمامات"             },             min: 0, max: 10,                     group: "characteristics", showInSearchFilter: true,  showInListingCard: true,  cardOrder: 5, cardIcon: "bath", cardFormat: "icon_value" },
      { key: "levels",       type: "number",  required: true,                        label: { en: "Levels / Floors",  fr: "Niveaux",               ar: "الطوابق"              },             min: 1, max: 10,                     group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_servant_quarters", type: "boolean", required: false,              label: { en: "Servant Quarters", fr: "Chambre de bonne",      ar: "غرفة الخدم"           }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 12, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Servant Quarters" }, fr: { true: "Chambre de bonne" }, ar: { true: "غرفة الخدم" } } },
      { key: "is_gated_community", type: "boolean", required: false,                label: { en: "Gated Community",  fr: "Résidence sécurisée",   ar: "مجمع آمن"             }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 11, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Gated" }, fr: { true: "Sécurisée" }, ar: { true: "آمن" } } },
      { key: "view_type",    type: "multi_enum", required: false,                  label: { en: "View",        fr: "Vue",           ar: "الإطلالة"         }, options: VILLA_VIEW_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "furnished",    type: "enum",    required: { whenListingType: "rent" }, label: { en: "Furnished",        fr: "Ameublement",           ar: "التأثيث"              }, options: FURNISHED_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "has_basement",  type: "boolean", required: false,                    label: { en: "Basement",        fr: "Sous-sol",           ar: "قبو"                 }, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "heating_type",  type: "enum",    required: false,                    label: { en: "Heating type", fr: "Type de chauffage", ar: "نوع التدفئة" }, options: HEATING_TYPE_OPTIONS, group: "amenities", showInSearchFilter: true, showInListingCard: false },
      { key: "water_tank",   type: "boolean", required: false,                     label: { en: "Water tank",   fr: "Réservoir / Bâche à eau", ar: "خزان ماء"    }, group: "amenities", showInSearchFilter: true, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Water tank" }, fr: { true: "Bâche à eau" }, ar: { true: "خزان ماء" } } },
      { key: "garden",       type: "boolean", required: false,                       label: { en: "Garden",           fr: "Jardin",                ar: "حديقة"                }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Garden" }, fr: { true: "Jardin" }, ar: { true: "حديقة" } } },
      { key: "pool",         type: "boolean", required: false,                       label: { en: "Pool",             fr: "Piscine",               ar: "مسبح"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Pool" }, fr: { true: "Piscine" }, ar: { true: "مسبح" } } },
      { key: "has_summer_kitchen", type: "boolean", required: false,               label: { en: "Summer Kitchen",   fr: "Cuisine d'été",         ar: "مطبخ صيفي"           }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Summer Kitchen" }, fr: { true: "Cuisine d'été" }, ar: { true: "مطبخ صيفي" } } },
      { key: "has_summer_living_room", type: "boolean", required: false,           label: { en: "Summer Living Room", fr: "Salon d'été",           ar: "صالة صيفية"           }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Summer Living" }, fr: { true: "Salon d'été" }, ar: { true: "صالة صيفية" } } },
      { key: "has_well",   type: "boolean", required: false,                       label: { en: "Well",             fr: "Puits",                 ar: "بئر"                  }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "boundary_walls", type: "boolean", required: false,                   label: { en: "Walled / Fenced",  fr: "Clôturé",               ar: "مسوّر"                }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "has_alarm",    type: "boolean", required: false,                     label: { en: "Alarm System",     fr: "Alarme",                ar: "نظام إنذار"          }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 7, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Alarm" }, fr: { true: "Alarme" }, ar: { true: "إنذار" } } },
      { key: "garage_spots", type: "number",  required: false,                       label: { en: "Garage Spots",     fr: "Places de garage",      ar: "أماكن المرآب"         },             min: 0, max: 20,                     group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "terrace",      type: "boolean", required: false,                       label: { en: "Terrace",          fr: "Terrasse",              ar: "تراس"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Terrace" }, fr: { true: "Terrasse" }, ar: { true: "تراس" } } },
      { key: "fiber_internet",type: "boolean", required: false,                       label: { en: "Fiber Internet",   fr: "Fibre optique",       ar: "ألياف بصرية"         }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      ...UNIVERSAL_AMENITIES.map(opt => ({ 
        key: opt.value, type: "boolean", required: false, label: opt.label, 
        group: "amenities", showInSearchFilter: false, showInListingCard: false 
      })),
      { key: "year_built",   type: "number",  required: false,                       label: { en: "Year Built",       fr: "Année de constr.",      ar: "سنة البناء"           },             min: 1900, max: 2030,               group: "construction",    showInSearchFilter: false, showInListingCard: false },
      ],
      },

      // ─────────────────────────────────────────────────────────────────────────────
      // LAND — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "land",
    label: { en: "Land", fr: "Terrain", ar: "أرض" },
    icon: "🌿",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",           fr: "Surfaces",           ar: "المساحات"          }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics",    fr: "Caractéristiques",   ar: "الخصائص"          }, order: 2 },
      { key: "amenities",       label: { en: "Access & Utilities", fr: "Accès & Réseaux",    ar: "الوصول والمرافق"  }, order: 3 },
    ],
    fields: [
      { key: "area",             type: "unit_number", required: true,  label: { en: "Area",          fr: "Surface",        ar: "المساحة"      }, unitOptions: ["m²", "hectares"], min: 1, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "ruler",  cardFormat: "value_unit" },
      { key: "buildable",        type: "boolean",     required: true,  label: { en: "Buildable",     fr: "Constructible",  ar: "قابل للبناء"  }, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 2, cardIcon: "build",  cardFormat: "boolean_chip",
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "always",
        cardBadgeLabel: { en: { true: "Buildable", false: "Not buildable" }, fr: { true: "Constructible", false: "Non constructible" }, ar: { true: "قابل للبناء", false: "غير قابل للبناء" } } },
      { key: "title_type",       type: "enum",        required: true,  label: { en: "Title Type",    fr: "Type d'acte",    ar: "نوع العقد"    }, options: TITLE_TYPES, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "corner_plot",      type: "boolean",     required: false, label: { en: "Corner Plot",   fr: "Lot d'angle",    ar: "قطعة زاوية"    }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Corner" }, fr: { true: "Angle" }, ar: { true: "زاوية" } } },
      { key: "slope",            type: "enum",        required: false, label: { en: "Topography",    fr: "Topographie",    ar: "الطبوغرافيا"   }, options: [
        { value: "flat",         label: { en: "Flat",         fr: "Plat",         ar: "مستوي"       } },
        { value: "slight_slope", label: { en: "Slight Slope", fr: "Légère pente", ar: "انحدار طفيف" } },
        { value: "steep_slope",  label: { en: "Steep Slope",  fr: "Pente raide",  ar: "انحدار حاد"  } },
        { value: "multiple_levels", label: { en: "Multiple Levels", fr: "Plusieurs niveaux", ar: "مستويات متعددة" } },
      ], group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "frontage_count",   type: "number",      required: false, label: { en: "Number of Frontages", fr: "Nombre de façades", ar: "عدد الواجهات" }, min: 1, max: 4, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "max_floors_allowed", type: "number",    required: false, conditional: { field: "buildable", value: true }, label: { en: "Max Floors Allowed", fr: "R+ autorisé", ar: "الحد الأقصى للطوابق" }, min: 1, max: 30, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "zoning_type",      type: "enum",        required: false, label: { en: "Zoning Type",   fr: "Zone",           ar: "نوع المنطقة"  }, options: [
        { value: "residential",  label: { en: "Residential",  fr: "Résidentielle", ar: "سكني"    } },
        { value: "commercial",   label: { en: "Commercial",   fr: "Commerciale",   ar: "تجاري"   } },
        { value: "agricultural", label: { en: "Agricultural", fr: "Agricole",      ar: "زراعي"   } },
        { value: "industrial",   label: { en: "Industrial",   fr: "Industrielle",  ar: "صناعي"   } },
        { value: "mixed",        label: { en: "Mixed",        fr: "Mixte",         ar: "مختلط"   } },
      ], group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "frontage_meters",  type: "number",      required: false, label: { en: "Frontage (m)",  fr: "Façade (m)",     ar: "الواجهة (م)"  }, unit: "m", min: 0, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "width", cardFormat: "value_unit" },
      { key: "has_water_access", type: "boolean",     required: false, label: { en: "Water Access",  fr: "Accès à l'eau",  ar: "توصيل ماء"    }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 7, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Water" }, fr: { true: "Eau" }, ar: { true: "ماء" } } },
      { key: "has_electricity",  type: "boolean",     required: false, label: { en: "Electricity",   fr: "Électricité",    ar: "توصيل كهرباء" }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Electricity" }, fr: { true: "Électricité" }, ar: { true: "كهرباء" } } },
      { key: "has_road_access",  type: "boolean",     required: false, label: { en: "Road Access",   fr: "Accès routier",  ar: "وصول بالطريق" }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 6, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Road" }, fr: { true: "Accès routier" }, ar: { true: "طريق" } } },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMERCIAL — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "commercial",
    label: { en: "Commercial", fr: "Local Commercial", ar: "محل تجاري" },
    icon: "🏪",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "suitability",     label: { en: "Suitable For",    fr: "Adapté à",         ar: "مناسب لـ" }, order: 4 },
      { key: "construction",    label: { en: "Construction",    fr: "Construction",     ar: "البناء"   }, order: 5 },
    ],
    fields: [
      { key: "area",            type: "number",     required: true,  label: { en: "Area (m²)",     fr: "Surface (m²)",    ar: "المساحة (م²)" }, unit: "m²", min: 1, warnBelow: 10, warnAbove: 5000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "ruler", cardFormat: "value_unit" },
      { key: "floor",           type: "number",     required: false, label: { en: "Floor",          fr: "Étage",           ar: "الطابق"        }, min: 0, max: 100, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "frontage_meters", type: "number",     required: true,  label: { en: "Frontage (m)",   fr: "Façade (m)",      ar: "الواجهة (م)"   }, unit: "m", min: 0, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 2, cardIcon: "width", cardFormat: "value_unit" },
      { key: "has_storefront",  type: "boolean",    required: false, label: { en: "Has Storefront", fr: "Devanture",       ar: "واجهة تجارية"  }, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "commercial_license_included", type: "boolean", required: false, label: { en: "Commercial License Incl.", fr: "Registre de commerce inclus", ar: "رخصة تجارية مشمولة" }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "positive", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "License Incl." }, fr: { true: "Registre inclus" }, ar: { true: "رخصة مشمولة" } } },
      { key: "current_activity", type: "text",      required: false, label: { en: "Current Activity", fr: "Activité actuelle", ar: "النشاط الحالي" }, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "entrance_count",   type: "number",    required: false, label: { en: "Number of Entrances", fr: "Nombre d'entrées", ar: "عدد المداخل" }, min: 1, max: 10, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "ceiling_height",   type: "number",    required: false, label: { en: "Ceiling Height (m)", fr: "Hauteur sous plafond (m)", ar: "ارتفاع السقف (م)" }, unit: "m", min: 2, max: 30, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_storage",     type: "boolean",    required: false, label: { en: "Has Storage",    fr: "Espace stockage", ar: "مستودع"        }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "parking",         type: "boolean",    required: false, label: { en: "Parking",        fr: "Parking",         ar: "موقف سيارات"  }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Parking" }, fr: { true: "Parking" }, ar: { true: "موقف" } } },
      { key: "has_water_meter",  type: "boolean",    required: false, label: { en: "Water Meter",     fr: "Compteur d'eau",  ar: "عداد ماء"      }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "has_electricity_meter", type: "boolean", required: false, label: { en: "Electricity Meter", fr: "Compteur d'électricité", ar: "عداد كهرباء" }, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "has_gas",         type: "boolean",    required: false, label: { en: "Natural Gas",    fr: "Gaz de ville",    ar: "غاز طبيعي"     }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "security",        type: "boolean",    required: false, label: { en: "Security",       fr: "Sécurité",        ar: "أمان"          }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "air_conditioning", type: "boolean",    required: false, label: { en: "Air Conditioning", fr: "Climatisation",   ar: "تكييف هواء"  }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "suitable_for",    type: "multi_enum", required: false, label: { en: "Suitable For",   fr: "Adapté pour",     ar: "مناسب لـ"      }, options: [
        { value: "restaurant", label: { en: "Restaurant", fr: "Restaurant", ar: "مطعم"   } },
        { value: "retail",     label: { en: "Retail",     fr: "Commerce",   ar: "تجزئة"  } },
        { value: "pharmacy",   label: { en: "Pharmacy",   fr: "Pharmacie",  ar: "صيدلية" } },
        { value: "office",     label: { en: "Office",     fr: "Bureau",     ar: "مكتب"   } },
        { value: "warehouse",  label: { en: "Warehouse",  fr: "Entrepôt",   ar: "مستودع" } },
        { value: "showroom",   label: { en: "Showroom",   fr: "Showroom",   ar: "معرض"   } },
        { value: "other",      label: { en: "Other",      fr: "Autre",      ar: "أخرى"   } },
      ], group: "suitability", showInSearchFilter: false, showInListingCard: true, cardOrder: 3, cardIcon: "tag", cardFormat: "enum_label" },
      { key: "year_built",      type: "number",     required: false, label: { en: "Year Built",     fr: "Année de constr.", ar: "سنة البناء"   }, min: 1900, max: 2030, group: "construction", showInSearchFilter: false, showInListingCard: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BUILDING — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "building",
    label: { en: "Building", fr: "Immeuble", ar: "عمارة" },
    icon: "🏗️",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "construction",    label: { en: "Construction",    fr: "Construction",     ar: "البناء"   }, order: 4 },
    ],
    fields: [
      { key: "total_area",       type: "number",  required: true,  label: { en: "Total Area (m²)",  fr: "Surface totale (m²)", ar: "المساحة الإجمالية (م²)" }, unit: "m²", min: 1, warnBelow: 100, warnAbove: 50000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 3, cardIcon: "ruler",    cardFormat: "value_unit" },
      { key: "total_floors",     type: "number",  required: true,  label: { en: "Total Floors",     fr: "Nombre d'étages",     ar: "إجمالي الطوابق"         }, min: 1, max: 100, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 2, cardIcon: "floors",   cardFormat: "icon_value" },
      { key: "total_units",      type: "number",  required: true,  label: { en: "Total Units",      fr: "Nombre d'unités",     ar: "إجمالي الوحدات"         }, min: 1, max: 1000, group: "characteristics", showInSearchFilter: false, showInListingCard: true, cardOrder: 1, cardIcon: "building", cardFormat: "icon_value" },
      { key: "units_breakdown",  type: "structured", required: true, label: { en: "Building composition", fr: "Composition de l'immeuble", ar: "تركيبة العمارة" }, group: "characteristics", showInSearchFilter: true, filterMode: "multi_enum", validationRule: "units_breakdown_sum_match_total_units" },
      { key: "title_type",       type: "enum",    required: false, label: { en: "Title Type",       fr: "Type d'acte",         ar: "نوع العقد"              }, options: TITLE_TYPES, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "is_under_lease",   type: "boolean", required: false, label: { en: "Currently Leased",  fr: "Actuellement loué",   ar: "مؤجر حالياً"             }, group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 9, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Leased" }, fr: { true: "Loué" }, ar: { true: "مؤجر" } } },
      { key: "monthly_revenue",  type: "number",  required: false, conditional: { field: "is_under_lease", value: true }, label: { en: "Current Monthly Income (DA)", fr: "Revenu mensuel actuel (DA)", ar: "الدخل الشهري الحالي (دج)" }, unit: "DA", min: 0, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "ground_floor_use", type: "enum",    required: false, label: { en: "Ground Floor Use", fr: "RDC",                 ar: "استخدام الطابق الأرضي"  }, options: [
        { value: "residential", label: { en: "Residential", fr: "Résidentiel", ar: "سكني"  } },
        { value: "commercial",  label: { en: "Commercial",  fr: "Commercial",  ar: "تجاري" } },
        { value: "parking",     label: { en: "Parking",     fr: "Parking",     ar: "موقف"  } },
        { value: "mixed",       label: { en: "Mixed",       fr: "Mixte",       ar: "مختلط" } },
      ], group: "characteristics", showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "neutral", cardBadgeCondition: "always",
        cardBadgeLabel: { en: { commercial: "Commercial GF" }, fr: { commercial: "RDC commercial" }, ar: { commercial: "الطابق الأرضي تجاري" } } },
      { key: "has_basement",     type: "boolean", required: false, label: { en: "Basement",         fr: "Sous-sol",            ar: "قبو"                     }, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_concierge_apartment", type: "boolean", required: false, label: { en: "Concierge Apt", fr: "Loge de gardien", ar: "شقة البواب" }, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "parking_spots",    type: "number",  required: false, label: { en: "Parking Spots",    fr: "Places de parking",   ar: "أماكن الانتظار"         }, min: 0, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "has_elevator",     type: "boolean", required: false, label: { en: "Elevator",         fr: "Ascenseur",           ar: "مصعد"                    }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Elevator" }, fr: { true: "Ascenseur" }, ar: { true: "مصعد" } } },
      { key: "has_collective_heating", type: "boolean", required: false, label: { en: "Collective Heating", fr: "Chauffage collectif", ar: "تدفئة جماعية" }, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "security",         type: "boolean", required: false, label: { en: "Security",         fr: "Sécurité",            ar: "أمان"                    }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "generator",        type: "boolean", required: false, label: { en: "Generator",        fr: "Générateur",          ar: "مولد كهرباء"            }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "water_tank",       type: "boolean", required: false, label: { en: "Water Tank",       fr: "Citerne d'eau",       ar: "خزان ماء"               }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "year_built",       type: "number",  required: false, label: { en: "Year Built",       fr: "Année de constr.",    ar: "سنة البناء"              }, min: 1900, max: 2030, group: "construction", showInSearchFilter: false, showInListingCard: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OFFICE — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "office",
    label: { en: "Office", fr: "Bureau", ar: "مكتب" },
    icon: "🖥️",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات"  }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص"  }, order: 2 },
      { key: "amenities",       label: { en: "Amenities",       fr: "Équipements",      ar: "المرافق"  }, order: 3 },
      { key: "suitability",     label: { en: "Suitable For",    fr: "Adapté à",         ar: "مناسب لـ" }, order: 4 },
    ],
    fields: [
      { key: "area",          type: "number",     required: true,                        label: { en: "Area (m²)",     fr: "Surface (m²)",  ar: "المساحة (م²)" }, unit: "m²", min: 1, warnBelow: 10, warnAbove: 2000, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "ruler",  cardFormat: "value_unit" },
      { key: "floor",         type: "number",     required: true,                        label: { en: "Floor",         fr: "Étage",         ar: "الطابق"        }, min: 0, max: 100, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 2, cardIcon: "floors", cardFormat: "icon_value" },
      { key: "office_layout",  type: "enum",      required: true,                        label: { en: "Layout Type",   fr: "Type d'espace", ar: "نوع المساحة"   }, options: OFFICE_LAYOUT_OPTIONS, group: "characteristics", showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "layout", cardFormat: "enum_label",
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "neutral", cardBadgeCondition: "always",
        cardBadgeLabel: { en: { open_space: "Open Space", partitioned: "Partitioned", mixed: "Mixed" }, fr: { open_space: "Open space", partitioned: "Cloisonné", mixed: "Mixte" }, ar: { open_space: "مساحة مفتوحة", partitioned: "مقسّم", mixed: "مختلط" } } },
      { key: "ceiling_height", type: "number",    required: false,                       label: { en: "Ceiling Height (m)", fr: "Hauteur sous plafond (m)", ar: "ارتفاع السقف (م)" }, unit: "m", min: 2, max: 30, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "workstation_capacity", type: "number", required: false,                    label: { en: "Workstation Capacity", fr: "Capacité postes de travail", ar: "سعة محطات العمل" }, min: 1, max: 500, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "meeting_room_count", type: "number",  required: false,                     label: { en: "Meeting Rooms", fr: "Salles de réunion", ar: "غرف الاجتماعات" }, min: 0, max: 20, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_reception_area", type: "boolean", required: false,                     label: { en: "Reception Area", fr: "Espace d'accueil", ar: "منطقة الاستقبال" }, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "furnished",     type: "enum",       required: { whenListingType: "rent" }, label: { en: "Furnished",     fr: "Ameublement",   ar: "التأثيث"       }, options: FURNISHED_OPTIONS, group: "characteristics", showInSearchFilter: true, showInListingCard: false },
      { key: "parking_spots", type: "number",     required: false,                       label: { en: "Parking Spots", fr: "Places parking",ar: "أماكن الانتظار"}, min: 0, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "has_elevator",  type: "boolean",    required: false,                       label: { en: "Elevator",      fr: "Ascenseur",     ar: "مصعد"          }, group: "amenities",        showInSearchFilter: false, showInListingCard: false,
        showAsCardBadge: true, cardBadgePriority: 5, cardBadgeStyle: "neutral", cardBadgeCondition: "if_true",
        cardBadgeLabel: { en: { true: "Elevator" }, fr: { true: "Ascenseur" }, ar: { true: "مصعد" } } },
      { key: "is_accessible",  type: "boolean",    required: false,                       label: { en: "Wheelchair Accessible", fr: "Accessible aux PMR", ar: "متاح للأشخاص ذوي الإعاقة" }, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "has_kitchen",    type: "boolean",    required: false,                       label: { en: "Kitchen / Pantry", fr: "Cuisine / Coin café", ar: "مطبخ / ركن القهوة" }, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "has_archive_room", type: "boolean",  required: false,                       label: { en: "Archive Room", fr: "Salle d'archives", ar: "غرفة الأرشيف" }, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "air_conditioning", type: "boolean",    required: false,                       label: { en: "Air Conditioning", fr: "Climatisation",   ar: "تكييف هواء"  }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "fiber_internet",  type: "boolean",    required: false,                       label: { en: "Fiber Internet",   fr: "Fibre optique",   ar: "ألياف بصرية" }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "security",        type: "boolean",    required: false,                       label: { en: "Security",        fr: "Sécurité",        ar: "أمان"          }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "suitable_for",  type: "multi_enum", required: false,                       label: { en: "Suitable For",  fr: "Adapté pour",   ar: "مناسب لـ"      }, options: [
        { value: "startup",        label: { en: "Startup",        fr: "Startup",           ar: "شركة ناشئة"  } },
        { value: "law_firm",       label: { en: "Law Firm",       fr: "Cabinet juridique", ar: "مكتب محاماة" } },
        { value: "medical_office", label: { en: "Medical Office", fr: "Cabinet médical",   ar: "عيادة"       } },
        { value: "agency",         label: { en: "Agency",         fr: "Agence",            ar: "وكالة"       } },
        { value: "coworking",      label: { en: "Co-working",     fr: "Co-working",        ar: "مشترك"       } },
        { value: "other",          label: { en: "Other",          fr: "Autre",             ar: "أخرى"        } },
      ], group: "suitability", showInSearchFilter: false, showInListingCard: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FARM — IMPROVED
  // ─────────────────────────────────────────────────────────────────────────────
  {
    key: "farm",
    label: { en: "Farm", fr: "Ferme / Hacienda", ar: "مزرعة" },
    icon: "🌾",
    groups: [
      { key: "surfaces",        label: { en: "Surfaces",              fr: "Surfaces",                   ar: "المساحات"          }, order: 1 },
      { key: "characteristics", label: { en: "Characteristics",       fr: "Caractéristiques",           ar: "الخصائص"          }, order: 2 },
      { key: "amenities",       label: { en: "Utilities & Equipment", fr: "Réseaux & Équipements",      ar: "المرافق والتجهيزات"}, order: 3 },
      { key: "construction",    label: { en: "Construction",          fr: "Construction",               ar: "البناء"           }, order: 4 },
    ],
    fields: [
      { key: "total_area",         type: "number",     required: true,  label: { en: "Total Area (ha)",     fr: "Surface totale (ha)",        ar: "المساحة الإجمالية (هكتار)"    }, unit: "ha",  min: 0.01, group: "surfaces",        showInSearchFilter: true,  showInListingCard: true,  cardOrder: 1, cardIcon: "ruler",       cardFormat: "value_unit" },
      { key: "buildable_area",     type: "number",     required: false, label: { en: "Buildable Area (m²)", fr: "Surface constructible (m²)", ar: "المساحة القابلة للبناء (م²)"  }, unit: "m²",  min: 1,    group: "surfaces",        showInSearchFilter: false, showInListingCard: false },
      { key: "title_type",         type: "enum",       required: true,  label: { en: "Title Type",         fr: "Type d'acte",                ar: "نوع العقد"                    }, options: TITLE_TYPES, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "proximity_to_road_meters", type: "number", required: false, label: { en: "Distance to Road (m)", fr: "Distance à la route (m)", ar: "المسافة للطريق (م)" }, unit: "m", min: 0, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_house",          type: "boolean",    required: false, label: { en: "Has House",           fr: "Maison incluse",              ar: "يشمل منزلاً"                  }, group: "amenities",        showInSearchFilter: false, showInListingCard: true,  cardOrder: 4, cardIcon: "home",        cardFormat: "boolean_chip" },
      { key: "house_area",         type: "number",     required: false, conditional: { field: "has_house", value: true }, label: { en: "House Area (m²)",     fr: "Surface maison (m²)",        ar: "مساحة المنزل (م²)"            }, unit: "m²",  min: 1,    group: "surfaces", showInSearchFilter: false, showInListingCard: false },
      { key: "has_water_access",   type: "boolean",    required: true,  label: { en: "Water Access",        fr: "Accès à l'eau",              ar: "توصيل ماء"                    }, group: "amenities",        showInSearchFilter: false, showInListingCard: true,  cardOrder: 2, cardIcon: "water",       cardFormat: "boolean_chip",
        showAsCardBadge: true, cardBadgePriority: 10, cardBadgeStyle: "positive", cardBadgeCondition: "always",
        cardBadgeLabel: { en: { true: "Water", false: "No water" }, fr: { true: "Eau", false: "Sans eau" }, ar: { true: "ماء", false: "بدون ماء" } } },
      { key: "water_source",       type: "enum",       required: false, conditional: { field: "has_water_access", value: true }, label: { en: "Water Source",        fr: "Source d'eau",               ar: "مصدر الماء"                   }, options: [
        { value: "well",           label: { en: "Well",           fr: "Puits",         ar: "بئر"       } },
        { value: "river",          label: { en: "River",          fr: "Rivière",       ar: "نهر"       } },
        { value: "public_network", label: { en: "Public Network", fr: "Réseau public", ar: "شبكة عامة" } },
        { value: "multiple",       label: { en: "Multiple",       fr: "Multiple",      ar: "متعدد"     } },
      ], group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "irrigation_type",    type: "enum",       required: false, conditional: { field: "has_water_access", value: true }, label: { en: "Irrigation Type",    fr: "Type d'irrigation",          ar: "نوع الري"                     }, options: IRRIGATION_TYPES, group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "has_electricity",    type: "boolean",    required: true,  label: { en: "Electricity",         fr: "Électricité",                ar: "توصيل كهرباء"                 }, group: "amenities",        showInSearchFilter: false, showInListingCard: true,  cardOrder: 3, cardIcon: "electricity", cardFormat: "boolean_chip",
        showAsCardBadge: true, cardBadgePriority: 8, cardBadgeStyle: "positive", cardBadgeCondition: "always",
        cardBadgeLabel: { en: { true: "Electricity", false: "No electricity" }, fr: { true: "Électricité", false: "Sans électricité" }, ar: { true: "كهرباء", false: "بدون كهرباء" } } },
      { key: "soil_type",          type: "enum",       required: false, label: { en: "Soil Type",           fr: "Type de sol",                ar: "نوع التربة"                   }, options: SOIL_TYPES, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "current_crops",      type: "multi_enum", required: false, label: { en: "Current Crops",      fr: "Cultures actuelles",         ar: "المحاصيل الحالية"             }, options: CROP_OPTIONS, group: "characteristics", showInSearchFilter: false, showInListingCard: false },
      { key: "has_fencing",        type: "boolean",    required: false, label: { en: "Fenced",             fr: "Clôturé",                    ar: "مسوّر"                        }, group: "amenities",        showInSearchFilter: false, showInListingCard: false },
      { key: "equipment_included", type: "multi_enum", required: false, label: { en: "Equipment Included",  fr: "Équipements inclus",         ar: "التجهيزات المشمولة"           }, options: [
        { value: "irrigation_system",    label: { en: "Irrigation System",   fr: "Système d'irrigation", ar: "نظام ري"       } },
        { value: "greenhouses",          label: { en: "Greenhouses",         fr: "Serres",               ar: "بيوت بلاستيكية"} },
        { value: "tractor",              label: { en: "Tractor",             fr: "Tracteur",             ar: "جرار"          } },
        { value: "storage",              label: { en: "Storage",             fr: "Stockage",             ar: "مستودع"        } },
        { value: "livestock_buildings",  label: { en: "Livestock Buildings", fr: "Bâtiments élevage",    ar: "مباني الماشية" } },
        { value: "other",                label: { en: "Other",               fr: "Autre",                ar: "أخرى"          } },
      ], group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "livestock_included", type: "multi_enum", required: false, label: { en: "Livestock Included",  fr: "Bétail inclus",              ar: "ماشية مشمولة"                 }, options: [
        { value: "cattle",        label: { en: "Cattle",        fr: "Bovins",       ar: "ماشية"     } },
        { value: "sheep",         label: { en: "Sheep",         fr: "Ovins",        ar: "أغنام"     } },
        { value: "goats",         label: { en: "Goats",         fr: "Caprins",      ar: "ماعز"      } },
        { value: "poultry",       label: { en: "Poultry",       fr: "Volailles",    ar: "دواجن"     } },
        { value: "horses",        label: { en: "Horses",        fr: "Chevaux",      ar: "خيول"      } },
        { value: "other",         label: { en: "Other",         fr: "Autre",        ar: "أخرى"      } },
      ], group: "amenities", showInSearchFilter: false, showInListingCard: false },
      { key: "year_built",         type: "number",     required: false, label: { en: "Year Built",          fr: "Année de constr.",           ar: "سنة البناء"                   }, min: 1900, max: 2030, group: "construction", showInSearchFilter: false, showInListingCard: false },
    ],
  },
];

// ─── Pure accessor functions (Single Source of Truth API) ────────────────────

/** Returns the PropertyTypeDefinition for a given key, or null */
export function getPropertyType(key) {
  return PROPERTY_TYPE_DEFS.find(pt => pt.key === key) || null;
}

/** Returns all property type definitions */
export function getAllPropertyTypes() {
  return PROPERTY_TYPE_DEFS;
}

/** Returns the field definitions for a given property type key */
export function getFieldsForType(key) {
  const pt = getPropertyType(key);
  return pt ? pt.fields : [];
}

/**
 * Returns the required fields for a given property type and listing type.
 * A field is required if required===true OR required.whenListingType === listingType.
 */
export function getRequiredFields(propertyTypeKey, listingType) {
  return getFieldsForType(propertyTypeKey).filter(f => {
    if (f.required === true) return true;
    if (f.required && typeof f.required === "object") {
      return f.required.whenListingType === listingType;
    }
    return false;
  });
}

/**
 * Returns fields that should be shown in the search filter for a given type.
 */
export function getSearchFilterFields(propertyTypeKey) {
  return getFieldsForType(propertyTypeKey).filter(f => f.showInSearchFilter);
}

/**
 * Returns fields to show in the listing card, sorted by cardOrder.
 */
export function getCardFields(propertyTypeKey) {
  return getFieldsForType(propertyTypeKey)
    .filter(f => f.showInListingCard)
    .sort((a, b) => (a.cardOrder ?? 99) - (b.cardOrder ?? 99));
}

/**
 * Returns badge-eligible fields for the listing card, sorted by priority descending.
 */
export function getCardBadgeFields(propertyTypeKey) {
  return getFieldsForType(propertyTypeKey)
    .filter(f => f.showAsCardBadge)
    .sort((a, b) => (b.cardBadgePriority ?? 0) - (a.cardBadgePriority ?? 0));
}

/**
 * Validates a form value object against the config for a given property type.
 * Returns { valid: boolean, errors: { [fieldKey]: string } }
 */
export function validateAttributes(attributes, propertyTypeKey, listingType) {
  const requiredFields = getRequiredFields(propertyTypeKey, listingType);
  const errors = {};
  for (const field of requiredFields) {
    const val = attributes[field.key];
    if (val === undefined || val === null || val === "") {
      errors[field.key] = "required";
    } else if (field.type === "number" || field.type === "unit_number") {
      const n = Number(val);
      if (isNaN(n)) { errors[field.key] = "invalid_number"; continue; }
      if (field.min !== undefined && n < field.min) errors[field.key] = "below_min";
      if (field.max !== undefined && n > field.max) errors[field.key] = "above_max";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Computes the intersection of field keys between two property types.
 */
export function getSharedFieldKeys(typeKeyA, typeKeyB) {
  const keysA = new Set(getFieldsForType(typeKeyA).map(f => f.key));
  return getFieldsForType(typeKeyB).map(f => f.key).filter(k => keysA.has(k));
}

/**
 * Given an attributes object and a property type change,
 * returns a new attributes object retaining only shared field values.
 */
export function migrateAttributes(attributes, fromType, toType) {
  const shared = getSharedFieldKeys(fromType, toType);
  const result = {};
  for (const key of shared) {
    if (attributes[key] !== undefined) result[key] = attributes[key];
  }
  return result;
}

// ─── Convenience re-export: flat PROPERTY_TYPES list for dropdowns ────────────
export const PROPERTY_TYPES = PROPERTY_TYPE_DEFS.map(({ key, label, icon }) => ({
  value: key,
  label,
  icon,
}));