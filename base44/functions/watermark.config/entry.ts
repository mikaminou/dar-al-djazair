/**
 * Watermark Configuration — single source of truth for all watermark appearance settings.
 * Edit only this file to change any visual property of watermarks.
 */

export const WATERMARK_CONFIG = {
  // Position
  position: "bottom-right",

  // Margin as a fraction of the shorter image side
  marginRatio: 0.03,

  // Image watermark (when owner has a profile picture)
  image: {
    // Size as a fraction of the shorter image side
    sizeRatio: 0.12,
    // Opacity 0–255 (60–70% → 153–178)
    opacity: 165,
  },

  // Text watermark (when owner has no profile picture)
  text: {
    // Font size as a fraction of the shorter image side
    fontSizeRatio: 0.03,
    color: { r: 255, g: 255, b: 255 },
    // Shadow offset in pixels
    shadowOffset: 2,
    shadowColor: { r: 0, g: 0, b: 0 },
    // Opacity 0–255 (70% → 178)
    opacity: 178,
  },
};