/**
 * ListingCardBadges — pure sub-component.
 * Reads badge config flags, picks up-to-3 badges, handles conditions.
 * Memoized: pure — same listing + lang → same output.
 */
import React, { useMemo } from "react";
import { getCardBadgeFields } from "../propertyTypes.config";
import { legacyAttributesAdapter } from "./DynamicFieldDisplay";

const STYLE_CLASSES = {
  positive: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  neutral:  "bg-gray-100 text-gray-600 border border-gray-200",
  warning:  "bg-orange-50 text-orange-700 border border-orange-200",
};

function resolveBadgeLabel(field, val, lang) {
  const labels = field.cardBadgeLabel?.[lang] || field.cardBadgeLabel?.fr || {};
  if (val === true)  return labels["true"] || null;
  if (val === false) return labels["false"] || null;
  // enum value
  if (typeof val === "string") return labels[val] || null;
  return null;
}

function isBadgeVisible(field, val, listing, attrs) {
  const cond = field.cardBadgeCondition;
  if (cond === "rent_only" && listing.listing_type !== "rent") return false;
  if (cond === "sale_only" && listing.listing_type !== "sale") return false;
  if (cond === "if_true"  && val !== true) return false;
  if (cond === "if_false" && val !== false) return false;
  // "always" — show whenever there's a label to show
  return true;
}

const ListingCardBadges = React.memo(function ListingCardBadges({
  listing,
  lang = "fr",
  maxBadges = 3,
}) {
  const badges = useMemo(() => {
    const pt = listing?.property_type;
    if (!pt) return [];

    const attrs = Object.keys(listing.attributes || {}).length > 0
      ? listing.attributes
      : legacyAttributesAdapter(listing);

    const badgeFields = getCardBadgeFields(pt); // sorted by priority desc
    const results = [];

    for (const field of badgeFields) {
      if (results.length >= maxBadges) break;

      const val = attrs[field.key];
      if (val === undefined || val === null) continue;
      if (!isBadgeVisible(field, val, listing, attrs)) continue;

      const label = resolveBadgeLabel(field, val, lang);
      if (!label) continue;

      // Warn style for "false" boolean badges (e.g. "Non constructible")
      let style = field.cardBadgeStyle || "neutral";
      if (val === false) style = "warning";

      results.push({ key: field.key, label, style });
    }

    return results;
  }, [listing, lang, maxBadges]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.map(badge => (
        <span
          key={badge.key}
          className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STYLE_CLASSES[badge.style]}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
});

export default ListingCardBadges;