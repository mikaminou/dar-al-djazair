/**
 * Shared title type enum — critical for land, building, and farm
 * Defines the legal status of the property, affecting transaction risk and value
 */
export const TITLE_TYPES = [
  { 
    value: "acte_notarie", 
    label: { 
      en: "Notarized Deed", 
      fr: "Acte notarié", 
      ar: "عقد موثق" 
    } 
  },
  { 
    value: "livret_foncier", 
    label: { 
      en: "Land Registry Book", 
      fr: "Livret foncier", 
      ar: "دفتر عقاري" 
    } 
  },
  { 
    value: "permis_de_construire", 
    label: { 
      en: "Building Permit", 
      fr: "Permis de construire", 
      ar: "رخصة بناء" 
    } 
  },
  { 
    value: "en_cours", 
    label: { 
      en: "Under Regularization", 
      fr: "En cours de régularisation", 
      ar: "قيد التصحيح" 
    } 
  },
  { 
    value: "concession_agricole", 
    label: { 
      en: "Agricultural Concession", 
      fr: "Concession agricole", 
      ar: "امتياز زراعي" 
    } 
  },
  { 
    value: "other", 
    label: { 
      en: "Other", 
      fr: "Autre", 
      ar: "أخرى" 
    } 
  },
];