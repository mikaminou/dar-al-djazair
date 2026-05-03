/**
 * PER-TYPE FILTER SCHEMA — single source of truth for the advanced filters.
 *
 * Each entry mirrors the columns of the corresponding `listing_<type>` DB table
 * (see supabase/migrations/0015_property_type_tables.sql), grouped into UI
 * sections so the user only ever sees what's relevant to the chosen type.
 *
 * Field shape:
 *   { key, type, label, ...(type-specific) }
 *
 * Field types:
 *   - "range"       → numeric range (min_<key> / max_<key>); { unit?, min?, max?, step? }
 *   - "min"         → numeric min only (min_<key>); typical for counts (bedrooms, etc.)
 *   - "boolean"     → yes / no / any chip group
 *   - "enum"        → single-select pill group; { options }
 *   - "multi_enum"  → multi-select pill group; { options }
 *
 * Sections render collapsibly; first section is open by default.
 */
import { ORIENTATION_OPTIONS } from "@/config/enums/orientation";
import { VIEW_TYPE_OPTIONS, VILLA_VIEW_OPTIONS } from "@/config/enums/viewTypes";
import { TITLE_TYPES } from "@/config/enums/titleTypes";
import { OFFICE_LAYOUT_OPTIONS } from "@/config/enums/officeLayout";
import { HEATING_TYPE_OPTIONS } from "@/config/enums/heatingTypes";
import { IRRIGATION_TYPES } from "@/config/enums/irrigationType";
import { CROP_OPTIONS } from "@/config/enums/crops";
import { SOIL_TYPES } from "@/config/enums/soilTypes";

// ── Shared option sets ─────────────────────────────────────────────────────
const FURNISHED_OPTS = [
  { value: "furnished",      label: { en: "Furnished",      fr: "Meublé",       ar: "مفروش"        } },
  { value: "semi_furnished", label: { en: "Semi-furnished", fr: "Semi-meublé",  ar: "نصف مفروش"    } },
  { value: "unfurnished",    label: { en: "Unfurnished",    fr: "Non meublé",   ar: "غير مفروش"   } },
];

const PARKING_TYPES_OPTS = [
  { value: "garage",     label: { en: "Garage",     fr: "Garage",     ar: "مرآب"      } },
  { value: "covered",    label: { en: "Covered",    fr: "Couvert",    ar: "مغطى"      } },
  { value: "outdoor",    label: { en: "Outdoor",    fr: "Extérieur",  ar: "خارجي"     } },
  { value: "street",     label: { en: "Street",     fr: "Rue",        ar: "شارع"      } },
];

const SLOPE_OPTS = [
  { value: "flat",            label: { en: "Flat",            fr: "Plat",            ar: "مستوي"        } },
  { value: "slight_slope",    label: { en: "Slight Slope",    fr: "Légère pente",    ar: "انحدار طفيف" } },
  { value: "steep_slope",     label: { en: "Steep Slope",     fr: "Pente raide",     ar: "انحدار حاد"  } },
  { value: "multiple_levels", label: { en: "Multiple Levels", fr: "Plusieurs niv.",  ar: "مستويات"      } },
];

const ZONING_OPTS = [
  { value: "residential",  label: { en: "Residential",  fr: "Résidentielle", ar: "سكني"  } },
  { value: "commercial",   label: { en: "Commercial",   fr: "Commerciale",   ar: "تجاري" } },
  { value: "agricultural", label: { en: "Agricultural", fr: "Agricole",      ar: "زراعي" } },
  { value: "industrial",   label: { en: "Industrial",   fr: "Industrielle",  ar: "صناعي" } },
  { value: "mixed",        label: { en: "Mixed",        fr: "Mixte",         ar: "مختلط" } },
];

const GROUND_FLOOR_USE_OPTS = [
  { value: "residential", label: { en: "Residential", fr: "Résidentiel", ar: "سكني"   } },
  { value: "commercial",  label: { en: "Commercial",  fr: "Commercial",  ar: "تجاري"  } },
  { value: "parking",     label: { en: "Parking",     fr: "Parking",     ar: "موقف"   } },
  { value: "mixed",       label: { en: "Mixed",       fr: "Mixte",       ar: "مختلط"  } },
];

const SUITABLE_FOR_COMMERCIAL_OPTS = [
  { value: "restaurant", label: { en: "Restaurant", fr: "Restaurant", ar: "مطعم"   } },
  { value: "retail",     label: { en: "Retail",     fr: "Commerce",   ar: "تجزئة"  } },
  { value: "pharmacy",   label: { en: "Pharmacy",   fr: "Pharmacie",  ar: "صيدلية" } },
  { value: "office",     label: { en: "Office",     fr: "Bureau",     ar: "مكتب"   } },
  { value: "warehouse",  label: { en: "Warehouse",  fr: "Entrepôt",   ar: "مستودع" } },
  { value: "showroom",   label: { en: "Showroom",   fr: "Showroom",   ar: "معرض"   } },
];

const SUITABLE_FOR_OFFICE_OPTS = [
  { value: "startup",        label: { en: "Startup",        fr: "Startup",         ar: "شركة ناشئة"  } },
  { value: "law_firm",       label: { en: "Law Firm",       fr: "Cabinet juridique",ar: "مكتب محاماة" } },
  { value: "medical_office", label: { en: "Medical Office", fr: "Cabinet médical",  ar: "عيادة"       } },
  { value: "agency",         label: { en: "Agency",         fr: "Agence",          ar: "وكالة"       } },
  { value: "coworking",      label: { en: "Co-working",     fr: "Co-working",      ar: "مشترك"       } },
];

const WATER_SOURCE_OPTS = [
  { value: "well",           label: { en: "Well",           fr: "Puits",         ar: "بئر"      } },
  { value: "river",          label: { en: "River",          fr: "Rivière",       ar: "نهر"      } },
  { value: "public_network", label: { en: "Public Network", fr: "Réseau public", ar: "شبكة عامة" } },
  { value: "multiple",       label: { en: "Multiple",       fr: "Multiple",      ar: "متعدد"    } },
];

const EQUIPMENT_OPTS = [
  { value: "irrigation_system",   label: { en: "Irrigation System",   fr: "Irrigation",     ar: "نظام ري"     } },
  { value: "greenhouses",         label: { en: "Greenhouses",         fr: "Serres",         ar: "بيوت بلاستيكية" } },
  { value: "tractor",             label: { en: "Tractor",             fr: "Tracteur",       ar: "جرار"        } },
  { value: "storage",             label: { en: "Storage",             fr: "Stockage",       ar: "مستودع"      } },
  { value: "livestock_buildings", label: { en: "Livestock Buildings", fr: "Bât. élevage",   ar: "مباني الماشية" } },
];

const LIVESTOCK_OPTS = [
  { value: "cattle",  label: { en: "Cattle",  fr: "Bovins",   ar: "ماشية" } },
  { value: "sheep",   label: { en: "Sheep",   fr: "Ovins",    ar: "أغنام" } },
  { value: "goats",   label: { en: "Goats",   fr: "Caprins",  ar: "ماعز"  } },
  { value: "poultry", label: { en: "Poultry", fr: "Volailles",ar: "دواجن" } },
  { value: "horses",  label: { en: "Horses",  fr: "Chevaux",  ar: "خيول"  } },
];

// ── Section labels ─────────────────────────────────────────────────────────
const SECTION = {
  surfaces:        { en: "Surfaces",        fr: "Surfaces",         ar: "المساحات" },
  rooms:           { en: "Rooms",           fr: "Pièces",           ar: "الغرف" },
  characteristics: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص" },
  amenities:       { en: "Amenities",       fr: "Équipements",      ar: "المرافق" },
  utilities:       { en: "Utilities",       fr: "Réseaux",          ar: "المرافق العامة" },
  suitability:     { en: "Suitable For",    fr: "Adapté à",         ar: "مناسب لـ" },
  composition:     { en: "Composition",     fr: "Composition",      ar: "التركيبة" },
  construction:    { en: "Construction",    fr: "Construction",     ar: "البناء" },
  layout:          { en: "Layout",          fr: "Aménagement",      ar: "التخطيط" },
};

const lbl = (en, fr, ar) => ({ en, fr, ar });

// Helper: a list of universal boolean amenities present on most types
const UNIVERSAL_AMENITIES_BOOL = [
  { key: "security",         label: lbl("Security",         "Sécurité",         "أمان") },
  { key: "air_conditioning", label: lbl("Air Conditioning", "Climatisation",    "تكييف") },
  { key: "solar_panels",     label: lbl("Solar Panels",     "Panneaux solaires","ألواح شمسية") },
  { key: "well",             label: lbl("Well",             "Puits",            "بئر") },
  { key: "intercom",         label: lbl("Intercom",         "Interphone",       "جرس باب") },
  { key: "double_glazing",   label: lbl("Double Glazing",   "Double vitrage",   "زجاج مزدوج") },
  { key: "generator",        label: lbl("Generator",        "Générateur",       "مولد") },
  { key: "fiber_internet",   label: lbl("Fiber Internet",   "Fibre optique",    "ألياف بصرية") },
];

// ── Per-type schemas ───────────────────────────────────────────────────────
export const PER_TYPE_FILTER_SCHEMA = {
  apartment: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area", type: "range", label: lbl("Area", "Surface", "المساحة"), unit: "m²", min: 0, max: 1000, step: 10 },
        ],
      },
      {
        key: "rooms", label: SECTION.rooms,
        fields: [
          { key: "bedrooms",  type: "min", label: lbl("Bedrooms",  "Chambres",     "غرف النوم") },
          { key: "bathrooms", type: "min", label: lbl("Bathrooms", "Salles de bain","الحمامات") },
          { key: "rooms",     type: "min", label: lbl("Rooms",     "Pièces",       "الغرف") },
          { key: "floor",     type: "min", label: lbl("Floor",     "Étage",        "الطابق") },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "is_top_floor", type: "boolean",    label: lbl("Top Floor",    "Dernier étage", "الطابق الأخير") },
          { key: "furnished",    type: "enum",       label: lbl("Furnished",    "Ameublement",   "التأثيث"), options: FURNISHED_OPTS },
          { key: "orientation",  type: "multi_enum", label: lbl("Orientation",  "Orientation",   "التوجيه"), options: ORIENTATION_OPTIONS },
          { key: "view_type",    type: "multi_enum", label: lbl("View",         "Vue",           "الإطلالة"), options: VIEW_TYPE_OPTIONS },
          { key: "heating_type", type: "enum",       label: lbl("Heating",      "Chauffage",     "التدفئة"), options: HEATING_TYPE_OPTIONS },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "balcony",      type: "boolean", label: lbl("Balcony",   "Balcon",      "شرفة") },
          { key: "terrace",      type: "boolean", label: lbl("Terrace",   "Terrasse",    "تراس") },
          { key: "elevator",     type: "boolean", label: lbl("Elevator",  "Ascenseur",   "مصعد") },
          { key: "parking",      type: "boolean", label: lbl("Parking",   "Parking",     "موقف") },
          { key: "parking_type", type: "enum",    label: lbl("Parking Type","Type de parking","نوع الموقف"), options: PARKING_TYPES_OPTS, dependsOn: { key: "parking", value: true } },
          { key: "cave",         type: "boolean", label: lbl("Cellar",    "Cellier",     "قبو") },
          { key: "concierge",    type: "boolean", label: lbl("Concierge", "Concierge",   "بواب") },
          { key: "water_tank",   type: "boolean", label: lbl("Water Tank","Bâche à eau", "خزان ماء") },
          ...UNIVERSAL_AMENITIES_BOOL.map(a => ({ key: a.key, type: "boolean", label: a.label })),
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "building_age",          type: "range", label: lbl("Built Year",         "Année de construction","سنة البناء"), min: 1900, max: 2030, step: 1 },
          { key: "building_total_floors", type: "min",   label: lbl("Floors in Building", "Étages immeuble",      "طوابق العمارة") },
        ],
      },
    ],
  },

  house: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area",      type: "range", label: lbl("Built Area", "Surface habitable","المساحة المبنية"), unit: "m²", min: 0, max: 2000, step: 10 },
          { key: "land_area", type: "range", label: lbl("Land Area",  "Surface terrain", "مساحة الأرض"),     unit: "m²", min: 0, max: 5000, step: 50 },
        ],
      },
      {
        key: "rooms", label: SECTION.rooms,
        fields: [
          { key: "bedrooms",  type: "min", label: lbl("Bedrooms",  "Chambres",      "غرف النوم") },
          { key: "bathrooms", type: "min", label: lbl("Bathrooms", "Salles de bain","الحمامات") },
          { key: "rooms",     type: "min", label: lbl("Rooms",     "Pièces",        "الغرف") },
          { key: "levels",    type: "min", label: lbl("Levels",    "Niveaux",       "الطوابق") },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "furnished",    type: "enum",       label: lbl("Furnished",    "Ameublement", "التأثيث"), options: FURNISHED_OPTS },
          { key: "orientation",  type: "multi_enum", label: lbl("Orientation",  "Orientation", "التوجيه"), options: ORIENTATION_OPTIONS },
          { key: "view_type",    type: "multi_enum", label: lbl("View",         "Vue",         "الإطلالة"), options: VIEW_TYPE_OPTIONS },
          { key: "heating_type", type: "enum",       label: lbl("Heating",      "Chauffage",   "التدفئة"),  options: HEATING_TYPE_OPTIONS },
          { key: "has_basement", type: "boolean",    label: lbl("Basement",     "Sous-sol",    "قبو") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "garden",             type: "boolean", label: lbl("Garden",         "Jardin",       "حديقة") },
          { key: "pool",               type: "boolean", label: lbl("Pool",           "Piscine",      "مسبح") },
          { key: "terrace",            type: "boolean", label: lbl("Terrace",        "Terrasse",     "تراس") },
          { key: "garage",             type: "boolean", label: lbl("Garage",         "Garage",       "مرآب") },
          { key: "parking_type",       type: "enum",    label: lbl("Parking Type",   "Type parking", "نوع الموقف"), options: PARKING_TYPES_OPTS, dependsOn: { key: "garage", value: true } },
          { key: "boundary_walls",     type: "boolean", label: lbl("Walled",         "Clôturé",      "مسوّر") },
          { key: "has_well",           type: "boolean", label: lbl("Well",           "Puits",        "بئر") },
          { key: "has_summer_kitchen", type: "boolean", label: lbl("Summer Kitchen", "Cuisine d'été","مطبخ صيفي") },
          { key: "water_tank",         type: "boolean", label: lbl("Water Tank",     "Bâche à eau",  "خزان ماء") },
          ...UNIVERSAL_AMENITIES_BOOL.map(a => ({ key: a.key, type: "boolean", label: a.label })),
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "year_built", type: "range", label: lbl("Year Built", "Année de construction", "سنة البناء"), min: 1900, max: 2030, step: 1 },
        ],
      },
    ],
  },

  villa: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area",      type: "range", label: lbl("Built Area", "Surface habitable","المساحة المبنية"), unit: "m²", min: 0, max: 5000,  step: 20  },
          { key: "land_area", type: "range", label: lbl("Land Area",  "Surface terrain", "مساحة الأرض"),     unit: "m²", min: 0, max: 10000, step: 100 },
        ],
      },
      {
        key: "rooms", label: SECTION.rooms,
        fields: [
          { key: "bedrooms",     type: "min", label: lbl("Bedrooms",      "Chambres",       "غرف النوم") },
          { key: "bathrooms",    type: "min", label: lbl("Bathrooms",     "Salles de bain", "الحمامات") },
          { key: "rooms",        type: "min", label: lbl("Rooms",         "Pièces",         "الغرف") },
          { key: "levels",       type: "min", label: lbl("Levels",        "Niveaux",        "الطوابق") },
          { key: "garage_spots", type: "min", label: lbl("Garage Spots",  "Places garage",  "أماكن المرآب") },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "is_gated_community",   type: "boolean",    label: lbl("Gated Community",   "Résidence sécurisée","مجمع آمن") },
          { key: "has_servant_quarters", type: "boolean",    label: lbl("Servant Quarters",  "Chambre de bonne",   "غرفة الخدم") },
          { key: "furnished",            type: "enum",       label: lbl("Furnished",         "Ameublement",        "التأثيث"), options: FURNISHED_OPTS },
          { key: "view_type",            type: "multi_enum", label: lbl("View",              "Vue",                "الإطلالة"), options: VILLA_VIEW_OPTIONS },
          { key: "heating_type",         type: "enum",       label: lbl("Heating",           "Chauffage",          "التدفئة"),  options: HEATING_TYPE_OPTIONS },
          { key: "has_basement",         type: "boolean",    label: lbl("Basement",          "Sous-sol",           "قبو") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "pool",                   type: "boolean", label: lbl("Pool",                "Piscine",            "مسبح") },
          { key: "garden",                 type: "boolean", label: lbl("Garden",              "Jardin",             "حديقة") },
          { key: "terrace",                type: "boolean", label: lbl("Terrace",             "Terrasse",           "تراس") },
          { key: "has_summer_kitchen",     type: "boolean", label: lbl("Summer Kitchen",      "Cuisine d'été",      "مطبخ صيفي") },
          { key: "has_summer_living_room", type: "boolean", label: lbl("Summer Living Room",  "Salon d'été",        "صالة صيفية") },
          { key: "boundary_walls",         type: "boolean", label: lbl("Walled",              "Clôturé",            "مسوّر") },
          { key: "has_alarm",              type: "boolean", label: lbl("Alarm",               "Alarme",             "إنذار") },
          { key: "has_well",               type: "boolean", label: lbl("Well",                "Puits",              "بئر") },
          { key: "water_tank",             type: "boolean", label: lbl("Water Tank",          "Bâche à eau",        "خزان ماء") },
          ...UNIVERSAL_AMENITIES_BOOL.map(a => ({ key: a.key, type: "boolean", label: a.label })),
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "year_built", type: "range", label: lbl("Year Built", "Année de construction", "سنة البناء"), min: 1900, max: 2030, step: 1 },
        ],
      },
    ],
  },

  land: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area",            type: "range", label: lbl("Land Area",     "Surface terrain", "مساحة الأرض"),  unit: "m²", min: 0, max: 50000, step: 100 },
          { key: "frontage_meters", type: "range", label: lbl("Frontage",      "Façade",          "الواجهة"),      unit: "m",  min: 0, max: 200,   step: 1   },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "buildable",          type: "boolean", label: lbl("Buildable",         "Constructible","قابل للبناء") },
          { key: "corner_plot",        type: "boolean", label: lbl("Corner Plot",       "Lot d'angle",  "قطعة زاوية") },
          { key: "title_type",         type: "enum",    label: lbl("Title Type",        "Type d'acte",  "نوع العقد"), options: TITLE_TYPES },
          { key: "zoning_type",        type: "enum",    label: lbl("Zoning",            "Zone",         "المنطقة"),    options: ZONING_OPTS },
          { key: "slope",              type: "enum",    label: lbl("Topography",        "Topographie",  "الطبوغرافيا"), options: SLOPE_OPTS },
          { key: "frontage_count",     type: "min",     label: lbl("Frontages",         "Façades",      "الواجهات") },
          { key: "max_floors_allowed", type: "min",     label: lbl("Max Floors Allowed","R+ max",       "أقصى طوابق"), dependsOn: { key: "buildable", value: true } },
        ],
      },
      {
        key: "utilities", label: SECTION.utilities,
        fields: [
          { key: "has_water_access", type: "boolean", label: lbl("Water Access", "Accès à l'eau",  "ماء")     },
          { key: "has_electricity",  type: "boolean", label: lbl("Electricity",  "Électricité",    "كهرباء") },
          { key: "has_road_access",  type: "boolean", label: lbl("Road Access",  "Accès routier",  "طريق")    },
        ],
      },
    ],
  },

  commercial: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area",            type: "range", label: lbl("Area",           "Surface",                 "المساحة"),       unit: "m²", min: 0, max: 5000, step: 10 },
          { key: "frontage_meters", type: "range", label: lbl("Frontage",       "Façade",                  "الواجهة"),       unit: "m",  min: 0, max: 100,  step: 1  },
          { key: "ceiling_height",  type: "range", label: lbl("Ceiling Height", "Hauteur sous plafond",    "ارتفاع السقف"), unit: "m",  min: 2, max: 30,   step: 0.5 },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "floor",                       type: "min",     label: lbl("Floor",            "Étage",                       "الطابق") },
          { key: "entrance_count",              type: "min",     label: lbl("Entrances",        "Entrées",                     "المداخل") },
          { key: "has_storefront",              type: "boolean", label: lbl("Storefront",       "Devanture",                   "واجهة تجارية") },
          { key: "commercial_license_included", type: "boolean", label: lbl("License Included", "Registre de commerce inclus", "رخصة مشمولة") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "has_storage",           type: "boolean", label: lbl("Storage",          "Stockage",         "مستودع") },
          { key: "parking",               type: "boolean", label: lbl("Parking",          "Parking",          "موقف") },
          { key: "has_water_meter",       type: "boolean", label: lbl("Water Meter",      "Compteur d'eau",   "عداد ماء") },
          { key: "has_electricity_meter", type: "boolean", label: lbl("Electricity Meter","Compteur élec.",   "عداد كهرباء") },
          { key: "has_gas",               type: "boolean", label: lbl("Natural Gas",      "Gaz de ville",     "غاز طبيعي") },
          { key: "security",              type: "boolean", label: lbl("Security",         "Sécurité",         "أمان") },
          { key: "air_conditioning",      type: "boolean", label: lbl("Air Conditioning", "Climatisation",    "تكييف") },
        ],
      },
      {
        key: "suitability", label: SECTION.suitability,
        fields: [
          { key: "suitable_for", type: "multi_enum", label: lbl("Suitable For", "Adapté pour", "مناسب لـ"), options: SUITABLE_FOR_COMMERCIAL_OPTS },
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "year_built", type: "range", label: lbl("Year Built", "Année de construction", "سنة البناء"), min: 1900, max: 2030, step: 1 },
        ],
      },
    ],
  },

  building: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "total_area", type: "range", label: lbl("Total Area", "Surface totale", "المساحة الإجمالية"), unit: "m²", min: 0, max: 50000, step: 100 },
        ],
      },
      {
        key: "composition", label: SECTION.composition,
        fields: [
          { key: "total_floors", type: "min", label: lbl("Total Floors", "Étages",  "الطوابق") },
          { key: "total_units",  type: "min", label: lbl("Total Units",  "Unités",  "الوحدات") },
          { key: "parking_spots",type: "min", label: lbl("Parking Spots","Places parking","أماكن الانتظار") },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "title_type",              type: "enum",    label: lbl("Title Type",       "Type d'acte",         "نوع العقد"), options: TITLE_TYPES },
          { key: "ground_floor_use",        type: "enum",    label: lbl("Ground Floor Use", "RDC",                 "الطابق الأرضي"), options: GROUND_FLOOR_USE_OPTS },
          { key: "is_under_lease",          type: "boolean", label: lbl("Currently Leased", "Actuellement loué",   "مؤجر حالياً") },
          { key: "has_basement",            type: "boolean", label: lbl("Basement",         "Sous-sol",            "قبو") },
          { key: "has_concierge_apartment", type: "boolean", label: lbl("Concierge Apt",    "Loge de gardien",     "شقة البواب") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "has_elevator",           type: "boolean", label: lbl("Elevator",            "Ascenseur",           "مصعد") },
          { key: "has_collective_heating", type: "boolean", label: lbl("Collective Heating",  "Chauffage collectif", "تدفئة جماعية") },
          { key: "security",               type: "boolean", label: lbl("Security",            "Sécurité",            "أمان") },
          { key: "generator",              type: "boolean", label: lbl("Generator",           "Générateur",          "مولد") },
          { key: "water_tank",             type: "boolean", label: lbl("Water Tank",          "Citerne",             "خزان ماء") },
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "year_built", type: "range", label: lbl("Year Built", "Année de construction", "سنة البناء"), min: 1900, max: 2030, step: 1 },
        ],
      },
    ],
  },

  office: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "area",           type: "range", label: lbl("Area",           "Surface",              "المساحة"),       unit: "m²", min: 0, max: 2000, step: 10 },
          { key: "ceiling_height", type: "range", label: lbl("Ceiling Height", "Hauteur sous plafond","ارتفاع السقف"), unit: "m",  min: 2, max: 30,   step: 0.5 },
        ],
      },
      {
        key: "layout", label: SECTION.layout,
        fields: [
          { key: "floor",                type: "min",  label: lbl("Floor",                "Étage",                          "الطابق") },
          { key: "office_layout",        type: "enum", label: lbl("Layout Type",          "Type d'espace",                  "نوع المساحة"), options: OFFICE_LAYOUT_OPTIONS },
          { key: "workstation_capacity", type: "min",  label: lbl("Workstation Capacity", "Capacité postes",                "محطات العمل") },
          { key: "meeting_room_count",   type: "min",  label: lbl("Meeting Rooms",        "Salles de réunion",              "غرف الاجتماعات") },
          { key: "parking_spots",        type: "min",  label: lbl("Parking Spots",        "Places parking",                 "أماكن الانتظار") },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "furnished",          type: "enum",    label: lbl("Furnished",       "Ameublement",        "التأثيث"), options: FURNISHED_OPTS },
          { key: "has_reception_area", type: "boolean", label: lbl("Reception Area",  "Espace d'accueil",   "منطقة الاستقبال") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "has_elevator",     type: "boolean", label: lbl("Elevator",      "Ascenseur",       "مصعد") },
          { key: "is_accessible",    type: "boolean", label: lbl("Accessible",    "Accessible PMR",  "متاح للجميع") },
          { key: "has_kitchen",      type: "boolean", label: lbl("Kitchen",       "Coin café",       "مطبخ") },
          { key: "has_archive_room", type: "boolean", label: lbl("Archive Room",  "Salle d'archives","أرشيف") },
          { key: "air_conditioning", type: "boolean", label: lbl("Air Conditioning","Climatisation", "تكييف") },
          { key: "fiber_internet",   type: "boolean", label: lbl("Fiber Internet","Fibre optique",   "ألياف بصرية") },
          { key: "security",         type: "boolean", label: lbl("Security",      "Sécurité",        "أمان") },
        ],
      },
      {
        key: "suitability", label: SECTION.suitability,
        fields: [
          { key: "suitable_for", type: "multi_enum", label: lbl("Suitable For", "Adapté pour", "مناسب لـ"), options: SUITABLE_FOR_OFFICE_OPTS },
        ],
      },
    ],
  },

  farm: {
    sections: [
      {
        key: "surfaces", label: SECTION.surfaces,
        fields: [
          { key: "total_area",     type: "range", label: lbl("Total Area",     "Surface totale",        "المساحة الإجمالية"), unit: "ha", min: 0, max: 1000,  step: 1  },
          { key: "buildable_area", type: "range", label: lbl("Buildable Area", "Surface constructible","المساحة القابلة للبناء"), unit: "m²", min: 0, max: 5000, step: 50 },
          { key: "house_area",     type: "range", label: lbl("House Area",     "Surface maison",        "مساحة المنزل"),       unit: "m²", min: 0, max: 1000, step: 10, dependsOn: { key: "has_house", value: true } },
        ],
      },
      {
        key: "characteristics", label: SECTION.characteristics,
        fields: [
          { key: "title_type",               type: "enum",       label: lbl("Title Type",          "Type d'acte",          "نوع العقد"),   options: TITLE_TYPES },
          { key: "soil_type",                type: "enum",       label: lbl("Soil Type",           "Type de sol",          "نوع التربة"),  options: SOIL_TYPES },
          { key: "current_crops",            type: "multi_enum", label: lbl("Current Crops",       "Cultures actuelles",   "المحاصيل"),    options: CROP_OPTIONS },
          { key: "proximity_to_road_meters", type: "range",      label: lbl("Distance to Road",    "Distance à la route",  "المسافة للطريق"), unit: "m", min: 0, max: 5000, step: 50 },
          { key: "has_house",                type: "boolean",    label: lbl("Has House",           "Maison incluse",       "يشمل منزلاً") },
          { key: "has_fencing",              type: "boolean",    label: lbl("Fenced",              "Clôturé",              "مسوّر") },
        ],
      },
      {
        key: "utilities", label: SECTION.utilities,
        fields: [
          { key: "has_water_access", type: "boolean", label: lbl("Water Access",   "Accès à l'eau",  "ماء") },
          { key: "water_source",     type: "enum",    label: lbl("Water Source",   "Source d'eau",   "مصدر الماء"), options: WATER_SOURCE_OPTS,  dependsOn: { key: "has_water_access", value: true } },
          { key: "irrigation_type",  type: "enum",    label: lbl("Irrigation",     "Irrigation",     "نوع الري"),  options: IRRIGATION_TYPES,   dependsOn: { key: "has_water_access", value: true } },
          { key: "has_electricity",  type: "boolean", label: lbl("Electricity",    "Électricité",    "كهرباء") },
        ],
      },
      {
        key: "amenities", label: SECTION.amenities,
        fields: [
          { key: "equipment_included", type: "multi_enum", label: lbl("Equipment Included", "Équipements inclus", "تجهيزات"),  options: EQUIPMENT_OPTS },
          { key: "livestock_included", type: "multi_enum", label: lbl("Livestock Included", "Bétail inclus",      "ماشية"),    options: LIVESTOCK_OPTS },
        ],
      },
      {
        key: "construction", label: SECTION.construction,
        fields: [
          { key: "year_built", type: "range", label: lbl("Year Built", "Année de construction", "سنة البناء"), min: 1900, max: 2030, step: 1 },
        ],
      },
    ],
  },
};

/** Returns the full schema (all sections + fields) for a property type, or null. */
export function getFilterSchema(propertyType) {
  return PER_TYPE_FILTER_SCHEMA[propertyType] || null;
}

/** Returns a flat list of all field keys (and their min_/max_ derivatives) for a type. */
export function getAllFilterKeysForType(propertyType) {
  const schema = getFilterSchema(propertyType);
  if (!schema) return [];
  const keys = [];
  for (const section of schema.sections) {
    for (const f of section.fields) {
      if (f.type === "range") {
        keys.push(`min_${f.key}`, `max_${f.key}`);
      } else if (f.type === "min") {
        keys.push(`min_${f.key}`);
      } else {
        keys.push(f.key);
      }
    }
  }
  return keys;
}

/** Counts how many of this type's filter fields are currently active in `filters`. */
export function countActiveTypeFilters(propertyType, filters) {
  const schema = getFilterSchema(propertyType);
  if (!schema) return 0;
  let n = 0;
  for (const section of schema.sections) {
    for (const f of section.fields) {
      if (f.type === "range" || f.type === "min") {
        if (filters[`min_${f.key}`]) n++;
        if (f.type === "range" && filters[`max_${f.key}`]) n++;
      } else if (f.type === "multi_enum") {
        const v = filters[f.key];
        if (Array.isArray(v) ? v.length > 0 : !!v) n++;
      } else {
        if (filters[f.key] !== undefined && filters[f.key] !== "" && filters[f.key] !== null) n++;
      }
    }
  }
  return n;
}