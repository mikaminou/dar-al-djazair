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

  // Media upload limits for professional listings
  MAX_IMAGES: 20,
  MAX_VIDEOS: 5,

  // Accepted file types
  ACCEPTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ACCEPTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],

  // Max file sizes (HD quality caps)
  MAX_IMAGE_SIZE_MB: 10,   // 10 MB per image (HD photo)
  MAX_VIDEO_SIZE_MB: 500,  // 500 MB per video (HD video)
};