/**
 * Listing-status rules that affect messaging UI.
 * Centralised so they can't drift across components.
 */

/** Statuses that block sending new messages on a thread. */
export const UNAVAILABLE_STATUSES = ['reserved', 'sold', 'rented', 'deleted'];

/** Statuses that mean the deal has closed (used for the "Closed" filter). */
export const CLOSED_STATUSES = ['sold', 'rented', 'reserved'];

export function isListingUnavailable(status) {
  return UNAVAILABLE_STATUSES.includes(status);
}

export function isListingClosed(status) {
  return CLOSED_STATUSES.includes(status);
}

/**
 * Localised notice shown to a non-owner participant when the listing's
 * status no longer permits messaging. Returns the generic notice for any
 * status not explicitly mapped (including 'deleted').
 */
export function getUnavailableNoticeText(status, lang) {
  if (status === 'reserved') {
    return lang === 'ar' ? 'هذا العقار محجوز حالياً.'
         : lang === 'fr' ? 'Ce bien est actuellement réservé.'
         : 'This property is currently reserved.';
  }
  if (status === 'sold') {
    return lang === 'ar' ? 'تم بيع هذا العقار.'
         : lang === 'fr' ? 'Ce bien a été vendu.'
         : 'This property has been sold.';
  }
  if (status === 'rented') {
    return lang === 'ar' ? 'تم تأجير هذا العقار.'
         : lang === 'fr' ? 'Ce bien a été loué.'
         : 'This property has been rented.';
  }
  return lang === 'ar' ? 'هذا الإعلان لم يعد متاحاً.'
       : lang === 'fr' ? "Cette annonce n'est plus disponible."
       : 'This listing is no longer available.';
}