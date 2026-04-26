/**
 * Parking type enum — conditional on parking or garage = true
 */
export const PARKING_TYPES = [
  { 
    value: "covered", 
    label: { 
      en: "Covered", 
      fr: "Couvert", 
      ar: "مغطى" 
    } 
  },
  { 
    value: "uncovered", 
    label: { 
      en: "Uncovered", 
      fr: "À ciel ouvert", 
      ar: "مكشوف" 
    } 
  },
  { 
    value: "garage", 
    label: { 
      en: "Garage", 
      fr: "Garage", 
      ar: "مرآب" 
    } 
  },
  { 
    value: "street", 
    label: { 
      en: "Street Parking", 
      fr: "Rue", 
      ar: "شارع" 
    } 
  },
];