/**
 * Listing feature flags — central config for toggling listing-related features.
 * Edit here to enable/disable features across the entire app.
 */
export const LISTING_CONFIG = {
  // Allow professional users to hide the price on their listing
  ALLOW_HIDE_PRICE: true,

  // Allow professional users to hide the exact location (commune/address/map)
  ALLOW_HIDE_LOCATION: true,

  // Allow the listing owner to generate a rental contract PDF on-demand
  ALLOW_RENTAL_CONTRACT: true,

  // Default values when creating a new listing
  DEFAULT_PRICE_VISIBLE: true,    // price is shown by default
  DEFAULT_LOCATION_VISIBLE: false, // exact location is hidden by default (only wilaya shown)
};