/**
 * Centralised validation for the PostListing form.
 * All messages are returned in { en, fr, ar } and callers pick the right lang.
 */

// ─── Message dictionary ───────────────────────────────────────────────────────

export const VM = {
  required: {
    en: "This field is required.",
    fr: "Ce champ est obligatoire.",
    ar: "هذا الحقل مطلوب.",
  },
  listing_type_invalid: {
    en: "Please select a valid listing type.",
    fr: "Veuillez sélectionner un type d'annonce valide.",
    ar: "يرجى اختيار نوع الإعلان.",
  },
  property_type_invalid: {
    en: "Please select a valid property type.",
    fr: "Veuillez sélectionner un type de bien valide.",
    ar: "يرجى اختيار نوع العقار.",
  },
  land_rent_warning: {
    en: "Land is typically listed for sale, not rent. Are you sure?",
    fr: "Les terrains sont généralement mis en vente, pas en location. Êtes-vous sûr ?",
    ar: "الأراضي عادةً للبيع لا للإيجار. هل أنت متأكد؟",
  },
  wilaya_required: {
    en: "Please select a wilaya.",
    fr: "Veuillez sélectionner une wilaya.",
    ar: "يرجى اختيار الولاية.",
  },
  commune_required: {
    en: "Please select a commune.",
    fr: "Veuillez sélectionner une commune.",
    ar: "يرجى اختيار البلدية.",
  },
  address_too_short: {
    en: "Address must be at least 5 characters.",
    fr: "L'adresse doit comporter au moins 5 caractères.",
    ar: "يجب أن يكون العنوان 5 أحرف على الأقل.",
  },
  title_required: {
    en: "Title is required.",
    fr: "Le titre est obligatoire.",
    ar: "العنوان مطلوب.",
  },
  title_too_short: {
    en: "Title must be at least 5 characters.",
    fr: "Le titre doit comporter au moins 5 caractères.",
    ar: "يجب أن يكون العنوان 5 أحرف على الأقل.",
  },
  price_required: {
    en: "Price is required.",
    fr: "Le prix est obligatoire.",
    ar: "السعر مطلوب.",
  },
  price_not_positive: {
    en: "Price must be greater than 0.",
    fr: "Le prix doit être supérieur à 0.",
    ar: "يجب أن يكون السعر أكبر من 0.",
  },
  price_sale_low_warning: {
    en: "Price seems too low for a sale listing. Please verify.",
    fr: "Le prix semble trop bas pour une vente. Veuillez vérifier.",
    ar: "السعر يبدو منخفضاً جداً للبيع. يرجى التحقق.",
  },
  price_sale_high_warning: {
    en: "Price seems unusually high. Please verify.",
    fr: "Le prix semble inhabituellement élevé. Veuillez vérifier.",
    ar: "السعر يبدو مرتفعاً جداً. يرجى التحقق.",
  },
  price_rent_low_warning: {
    en: "Rent seems too low. Please verify.",
    fr: "Le loyer semble trop bas. Veuillez vérifier.",
    ar: "الإيجار يبدو منخفضاً جداً. يرجى التحقق.",
  },
  price_rent_high_warning: {
    en: "Rent seems unusually high. Please verify.",
    fr: "Le loyer semble inhabituellement élevé. Veuillez vérifier.",
    ar: "الإيجار يبدو مرتفعاً جداً. يرجى التحقق.",
  },
  area_required: {
    en: "Area is required for this property type.",
    fr: "La surface est obligatoire pour ce type de bien.",
    ar: "المساحة مطلوبة لهذا النوع من العقار.",
  },
  area_too_small: {
    en: "Area seems too small. Please verify.",
    fr: "La surface semble trop petite. Veuillez vérifier.",
    ar: "المساحة تبدو صغيرة جداً. يرجى التحقق.",
  },
  area_too_large_warning: {
    en: "Area seems very large. Please verify.",
    fr: "La surface semble très grande. Veuillez vérifier.",
    ar: "المساحة تبدو كبيرة جداً. يرجى التحقق.",
  },
  bedrooms_required: {
    en: "Number of bedrooms is required.",
    fr: "Le nombre de chambres est obligatoire.",
    ar: "عدد غرف النوم مطلوب.",
  },
  bedrooms_too_many: {
    en: "Please verify the number of bedrooms.",
    fr: "Veuillez vérifier le nombre de chambres.",
    ar: "يرجى التحقق من عدد غرف النوم.",
  },
  bathrooms_required: {
    en: "Number of bathrooms is required.",
    fr: "Le nombre de salles de bain est obligatoire.",
    ar: "عدد الحمامات مطلوب.",
  },
  bathrooms_too_many: {
    en: "Please verify the number of bathrooms.",
    fr: "Veuillez vérifier le nombre de salles de bain.",
    ar: "يرجى التحقق من عدد الحمامات.",
  },
  floor_invalid: {
    en: "Floor must be a non-negative number (0 = ground floor).",
    fr: "L'étage doit être un nombre positif (0 = rez-de-chaussée).",
    ar: "رقم الطابق يجب أن يكون صفراً أو أكثر (0 = الطابق الأرضي).",
  },
  floor_too_high: {
    en: "Floor number seems too high. Maximum is 100.",
    fr: "L'étage semble trop élevé. Maximum 100.",
    ar: "رقم الطابق مرتفع جداً. الحد الأقصى 100.",
  },
  furnished_required: {
    en: "Please specify if the property is furnished.",
    fr: "Veuillez indiquer si le bien est meublé.",
    ar: "يرجى تحديد ما إذا كان العقار مفروشاً.",
  },
  photo_format: {
    en: "This file format is not supported. Please use JPG, PNG, or WEBP.",
    fr: "Format de fichier non supporté. Utilisez JPG, PNG ou WEBP.",
    ar: "تنسيق الملف غير مدعوم. يرجى استخدام JPG أو PNG أو WEBP.",
  },
  photo_size: {
    en: "This photo is too large. Maximum size is 10 MB per photo.",
    fr: "Cette photo est trop volumineuse. Taille max : 10 Mo.",
    ar: "هذه الصورة كبيرة جداً. الحد الأقصى 10 ميغابايت.",
  },
  photo_resolution: {
    en: "This photo is too small. Please use a higher resolution image (min 400×300).",
    fr: "Cette photo est trop petite. Utilisez une image en plus haute résolution (min 400×300).",
    ar: "هذه الصورة صغيرة جداً. يرجى استخدام صورة بدقة أعلى (الحد الأدنى 400×300).",
  },
  photos_max: {
    en: "You have reached the maximum of 20 photos.",
    fr: "Vous avez atteint le maximum de 20 photos.",
    ar: "لقد وصلت إلى الحد الأقصى من 20 صورة.",
  },
  contact_name_required: {
    en: "Contact name is required.",
    fr: "Le nom du contact est obligatoire.",
    ar: "اسم جهة الاتصال مطلوب.",
  },
  contact_name_too_short: {
    en: "Name must be at least 2 characters.",
    fr: "Le nom doit comporter au moins 2 caractères.",
    ar: "يجب أن يكون الاسم حرفين على الأقل.",
  },
  contact_phone_or_email: {
    en: "Please provide at least a phone number or an email address.",
    fr: "Veuillez fournir au moins un numéro de téléphone ou une adresse e-mail.",
    ar: "يرجى توفير رقم هاتف أو بريد إلكتروني على الأقل.",
  },
  phone_invalid: {
    en: "Please enter a valid Algerian phone number.",
    fr: "Veuillez entrer un numéro de téléphone algérien valide.",
    ar: "يرجى إدخال رقم هاتف جزائري صحيح.",
  },
  email_invalid: {
    en: "Please enter a valid email address.",
    fr: "Veuillez entrer une adresse e-mail valide.",
    ar: "يرجى إدخال بريد إلكتروني صحيح.",
  },
};

export const t = (key, lang) => VM[key]?.[lang] || VM[key]?.en || key;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_LISTING_TYPES  = ["sale", "rent"];
const VALID_PROPERTY_TYPES = ["apartment", "house", "villa", "land", "commercial", "new_development", "office", "farm"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_MB    = 10;
const MAX_IMAGES           = 20;

const DZ_PHONE_RE = /^(05|06|07)\d{8}$|^\+213[567]\d{8}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Types where bedrooms/bathrooms make sense
export const hasBedrooms   = (pt) => ["apartment", "house", "villa", "new_development"].includes(pt);
export const hasBathrooms  = (pt) => ["apartment", "house", "villa", "new_development", "commercial", "office"].includes(pt);
export const hasFurnished  = (pt) => ["apartment", "house", "villa", "new_development"].includes(pt);
export const areaRequired  = (pt) => ["apartment", "house", "villa", "commercial", "office", "new_development"].includes(pt);
export const areaHasCap    = (pt) => ["apartment", "house", "villa", "new_development"].includes(pt);

// ─── Per-step validators ──────────────────────────────────────────────────────

/** Returns { errors: {}, warnings: {} } */
export function validateStep0(form) {
  const errors = {}, warnings = {};
  if (!VALID_LISTING_TYPES.includes(form.listing_type))   errors.listing_type  = "listing_type_invalid";
  if (!VALID_PROPERTY_TYPES.includes(form.property_type)) errors.property_type = "property_type_invalid";
  if (form.listing_type === "rent" && form.property_type === "land") warnings.property_type = "land_rent_warning";
  return { errors, warnings };
}

export function validateStep2(form) {
  const errors = {};
  if (!form.wilaya)   errors.wilaya   = "wilaya_required";
  if (!form.commune)  errors.commune  = "commune_required";
  if (form.address && form.address.trim().length > 0 && form.address.trim().length < 5) {
    errors.address = "address_too_short";
  }
  return { errors, warnings: {} };
}

export function validateStep1(form) {
  const errors = {}, warnings = {};
  const pt = form.property_type;
  const lt = form.listing_type;

  // Title
  if (!form.title || !form.title.trim()) {
    errors.title = "title_required";
  } else if (form.title.trim().length < 5) {
    errors.title = "title_too_short";
  }

  // Price
  const price = Number(form.price);
  if (!form.price && form.price !== 0) {
    errors.price = "price_required";
  } else if (price <= 0) {
    errors.price = "price_not_positive";
  } else if (lt === "sale") {
    if (price < 100000) warnings.price = "price_sale_low_warning";
    else if (price > 500000000000) warnings.price = "price_sale_high_warning";
  } else if (lt === "rent") {
    if (price < 1000)   warnings.price = "price_rent_low_warning";
    else if (price > 10000000) warnings.price = "price_rent_high_warning";
  }

  // Area
  const area = form.area !== "" ? Number(form.area) : null;
  if (areaRequired(pt)) {
    if (area === null || form.area === "") errors.area = "area_required";
    else if (area < 10)  errors.area = "area_too_small";
    else if (areaHasCap(pt) && area > 100000) warnings.area = "area_too_large_warning";
  } else if (area !== null && form.area !== "") {
    if (area < 10) errors.area = "area_too_small";
    else if (areaHasCap(pt) && area > 100000) warnings.area = "area_too_large_warning";
  }

  // Bedrooms
  if (hasBedrooms(pt)) {
    if (form.bedrooms === "" || form.bedrooms === null || form.bedrooms === undefined) {
      errors.bedrooms = "bedrooms_required";
    } else {
      const b = Number(form.bedrooms);
      if (b < 0 || !Number.isInteger(b)) errors.bedrooms = "bedrooms_required";
      else if (b > 20) errors.bedrooms = "bedrooms_too_many";
    }
  }

  // Bathrooms
  if (hasBathrooms(pt)) {
    if (form.bathrooms === "" || form.bathrooms === null || form.bathrooms === undefined) {
      errors.bathrooms = "bathrooms_required";
    } else {
      const b = Number(form.bathrooms);
      if (b < 0 || !Number.isInteger(b)) errors.bathrooms = "bathrooms_required";
      else if (b > 10) errors.bathrooms = "bathrooms_too_many";
    }
  }

  // Floor
  if (form.floor !== "" && form.floor !== null && form.floor !== undefined) {
    const fl = Number(form.floor);
    if (fl < 0 || !Number.isInteger(fl)) errors.floor = "floor_invalid";
    else if (fl > 100) errors.floor = "floor_too_high";
  }

  // Furnished — required for rent + applicable types
  if (lt === "rent" && hasFurnished(pt)) {
    if (!form.furnished) errors.furnished = "furnished_required";
  }

  return { errors, warnings };
}

export function validateStep3(images) {
  // Photo validation is handled per-upload; here we just check count
  const errors = {};
  if (images.length > MAX_IMAGES) errors.images = "photos_max";
  return { errors, warnings: {} };
}

export function validateStep4(form) {
  const errors = {}, warnings = {};

  if (!form.contact_name || !form.contact_name.trim()) {
    errors.contact_name = "contact_name_required";
  } else if (form.contact_name.trim().length < 2) {
    errors.contact_name = "contact_name_too_short";
  }

  const hasPhone = form.contact_phone && form.contact_phone.trim();
  const hasEmail = form.contact_email && form.contact_email.trim();

  if (!hasPhone && !hasEmail) {
    errors.contact_phone = "contact_phone_or_email";
  } else {
    if (hasPhone && !DZ_PHONE_RE.test(form.contact_phone.trim().replace(/\s/g, ""))) {
      errors.contact_phone = "phone_invalid";
    }
    if (hasEmail && !EMAIL_RE.test(form.contact_email.trim())) {
      errors.contact_email = "email_invalid";
    }
  }

  return { errors, warnings };
}

/** Validates a single File before upload. Returns { error: key|null } */
export function validateImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return { error: "photo_format" };
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return { error: "photo_size" };
  return { error: null };
}

/** Checks image resolution — returns a Promise<{ error: key|null }> */
export function checkImageResolution(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 400 || img.height < 300) resolve({ error: "photo_resolution" });
      else resolve({ error: null });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ error: null }); };
    img.src = url;
  });
}

/** Run all steps and return a map of step → boolean hasErrors */
export function fullValidationPass(form, images) {
  const s0 = validateStep0(form);
  const s1 = validateStep1(form);
  const s2 = validateStep2(form);
  const s3 = validateStep3(images);
  const s4 = validateStep4(form);
  return {
    0: Object.keys(s0.errors).length > 0,
    1: Object.keys(s1.errors).length > 0,
    2: Object.keys(s2.errors).length > 0,
    3: Object.keys(s3.errors).length > 0,
    4: Object.keys(s4.errors).length > 0,
  };
}