/**
 * ═══════════════════════════════════════════════════════════
 * ALGERIAN REAL ESTATE PRICE CONFIGURATION
 * ═══════════════════════════════════════════════════════════
 *
 * In Algeria, sale prices are expressed in millions of DA.
 * A seller who types 100 means 100 million DA (100,000,000).
 * A value of 1200 means 1 milliard 200 millions (1,200,000,000).
 * A value of 2000 means 2 milliards (2,000,000,000).
 *
 * Rental prices are expressed as the actual monthly DA value.
 * A landlord who types 35000 means 35,000 DA per month.
 * A value of 120000 means 120,000 DA per month.
 *
 * These conventions are specific to the Algerian market and
 * should not be changed without updating this file and
 * retesting the full price input flow.
 *
 * The stored value in the database is ALWAYS a clean integer
 * representing the actual DA amount (never a shorthand).
 * ═══════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────
// THRESHOLDS — single place to adjust all interpretation logic
// ─────────────────────────────────────────────────────────────
export const THRESHOLDS = {
  // Sale: clear millions range — typed 50 → 50,000,000 DA
  SALE_MILLIONS_MIN: 1,
  SALE_MILLIONS_MAX: 999,

  // Sale: clear milliard range — typed 1200 → 1,200,000,000 DA
  SALE_MILLIARD_MIN: 1_000,
  SALE_MILLIARD_MAX: 9_999,

  // Sale: ambiguous — digit count is unclear, show picker
  SALE_AMBIGUOUS_MIN: 10_000,

  // Sale: already a full raw value — accept directly, no multiplication
  SALE_FULL_VALUE_MIN: 100_000_000,

  // Ambiguous option filter bounds
  SALE_MIN_REALISTIC: 500_000,
  SALE_MAX_REALISTIC: 50_000_000_000,
};

// ─────────────────────────────────────────────────────────────
// DISPLAY FORMATTING — single source of truth
// ─────────────────────────────────────────────────────────────

/**
 * Main entry point. Use this everywhere a price is displayed.
 * @param {number|string} amount - stored integer DA value
 * @param {'sale'|'rent'} listingType
 * @param {'fr'|'en'|'ar'} lang
 * @returns {string}
 */
export function formatPrice(amount, listingType = 'sale', lang = 'fr') {
  if (amount == null || amount === '') return '';
  const n = Number(amount);
  if (isNaN(n) || n < 0) return '';
  if (listingType === 'rent') return formatRentalDisplay(n, lang);
  return formatSaleDisplay(n, lang);
}

/**
 * Formats a sale price as human-readable milliards/millions.
 * @param {number} n
 * @param {'fr'|'en'|'ar'} lang
 * @returns {string}
 */
export function formatSaleDisplay(n, lang = 'fr') {
  const DA = lang === 'ar' ? 'دج' : 'DA';

  if (n >= 1_000_000_000) {
    const milliards = Math.floor(n / 1_000_000_000);
    const millions  = Math.round((n % 1_000_000_000) / 1_000_000);
    if (millions === 0) {
      if (lang === 'ar') return `${milliards} مليار ${DA}`;
      if (lang === 'en') return `${milliards} billion ${DA}`;
      return `${milliards} milliard${milliards > 1 ? 's' : ''} ${DA}`;
    }
    if (lang === 'ar') {
      return milliards === 1
        ? `مليار و ${millions} مليون ${DA}`
        : `${milliards} مليار و ${millions} مليون ${DA}`;
    }
    if (lang === 'en') return `${milliards}B ${millions}M ${DA}`;
    return `${milliards} milliard${milliards > 1 ? 's' : ''} ${millions} million${millions > 1 ? 's' : ''} ${DA}`;
  }

  if (n >= 1_000_000) {
    const millions = Math.round(n / 1_000_000);
    if (lang === 'ar') return `${millions} مليون ${DA}`;
    if (lang === 'en') return `${millions} million${millions > 1 ? 's' : ''} ${DA}`;
    return `${millions} million${millions > 1 ? 's' : ''} ${DA}`;
  }

  // Fallback for sub-1M values
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-GB';
  return `${new Intl.NumberFormat(locale).format(n)} ${DA}`;
}

/**
 * Formats a rental price with /month suffix.
 * @param {number} n
 * @param {'fr'|'en'|'ar'} lang
 * @returns {string}
 */
export function formatRentalDisplay(n, lang = 'fr') {
  const locale   = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-GB';
  const DA       = lang === 'ar' ? 'دج' : 'DA';
  const perMonth = lang === 'ar' ? '/ شهر' : lang === 'fr' ? '/ mois' : '/ month';
  return `${new Intl.NumberFormat(locale).format(n)} ${DA} ${perMonth}`;
}

// ─────────────────────────────────────────────────────────────
// SALE PRICE INPUT INTERPRETATION
// ─────────────────────────────────────────────────────────────

/**
 * Interprets typed input for a sale listing.
 * @param {string|number} typed - raw value from input field
 * @returns {{ storedValue?: number, isAmbiguous: boolean } | null}
 */
export function interpretSaleInput(typed) {
  const n = Number(typed);
  if (!typed || typed === '' || isNaN(n) || n <= 0) return null;

  // Already a full raw amount — accept as-is
  if (n >= THRESHOLDS.SALE_FULL_VALUE_MIN) {
    return { storedValue: n, isAmbiguous: false };
  }

  // Clear milliard range: 1000–9999 → ×1,000,000
  if (n >= THRESHOLDS.SALE_MILLIARD_MIN && n <= THRESHOLDS.SALE_MILLIARD_MAX) {
    return { storedValue: n * 1_000_000, isAmbiguous: false };
  }

  // Clear millions range: 1–999 → ×1,000,000
  if (n >= THRESHOLDS.SALE_MILLIONS_MIN && n <= THRESHOLDS.SALE_MILLIONS_MAX) {
    return { storedValue: n * 1_000_000, isAmbiguous: false };
  }

  // Ambiguous — show picker
  return { isAmbiguous: true };
}

/**
 * Generates localized option labels for an ambiguous sale input.
 * @param {number} n - raw typed number
 * @param {'fr'|'en'|'ar'} lang
 * @returns {Array<{value: number, label: string}>}
 */
export function getAmbiguousOptions(n, lang = 'fr') {
  const candidates = [n, n * 10, n * 100, n * 1_000];
  return candidates
    .filter(v => v >= THRESHOLDS.SALE_MIN_REALISTIC && v <= THRESHOLDS.SALE_MAX_REALISTIC)
    .slice(0, 4)
    .map(v => ({ value: v, label: formatSaleDisplay(v, lang) }));
}

/**
 * Converts a stored integer sale price back to a typed shorthand for the input field.
 * e.g. 50,000,000 → "50", 1,200,000,000 → "1200"
 * @param {number} storedValue
 * @returns {string}
 */
export function storedValueToTyped(storedValue) {
  if (!storedValue) return '';
  const n = Number(storedValue);
  if (isNaN(n) || n <= 0) return '';
  const shorthand = Math.round(n / 1_000_000);
  if (
    shorthand >= THRESHOLDS.SALE_MILLIONS_MIN &&
    shorthand <= THRESHOLDS.SALE_MILLIARD_MAX
  ) {
    return String(shorthand);
  }
  return String(n);
}