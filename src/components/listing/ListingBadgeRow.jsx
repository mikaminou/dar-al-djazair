/**
 * ListingBadgeRow
 * Renders prominent attribute badges near the price section.
 * Driven by showAsBadge flags in propertyTypes.config.js.
 */
import React from "react";
import { getPropertyType } from "../propertyTypes.config";

const BADGE_RULES = {
  land: [
    {
      field: "buildable",
      render: (val, lang) => val
        ? { label: lang === "ar" ? "قابل للبناء" : lang === "fr" ? "Constructible" : "Buildable", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }
        : { label: lang === "ar" ? "غير قابل للبناء" : lang === "fr" ? "Non constructible" : "Not buildable", color: "bg-orange-100 text-orange-700 border-orange-200" },
    },
  ],
  farm: [
    {
      field: "has_water_access",
      render: (val, lang) => val === false
        ? { label: lang === "ar" ? "بدون ماء" : lang === "fr" ? "Sans accès à l'eau" : "No water access", color: "bg-amber-100 text-amber-700 border-amber-200" }
        : null,
    },
  ],
  building: [
    {
      field: "total_units",
      render: (val, lang) => val > 0
        ? { label: `${val} ${lang === "ar" ? "وحدة" : lang === "fr" ? "unités" : "units"}`, color: "bg-blue-100 text-blue-700 border-blue-200" }
        : null,
    },
  ],
  apartment: [
    {
      field: "furnished",
      condition: (attrs, listing) => listing?.listing_type === "rent",
      render: (val, lang) => val === "furnished"
        ? { label: lang === "ar" ? "مفروش" : lang === "fr" ? "Meublé" : "Furnished", color: "bg-purple-100 text-purple-700 border-purple-200" }
        : null,
    },
    {
      field: "elevator",
      condition: (attrs, listing) => (attrs?.floor || listing?.floor || 0) > 3,
      render: (val, lang) => val
        ? { label: lang === "ar" ? "مع مصعد" : lang === "fr" ? "Avec ascenseur" : "With elevator", color: "bg-slate-100 text-slate-700 border-slate-200" }
        : null,
    },
  ],
};

export default function ListingBadgeRow({ listing, lang = "fr" }) {
  const attrs = listing?.attributes || {};
  const rules = BADGE_RULES[listing?.property_type] || [];
  const badges = [];

  for (const rule of rules) {
    const val = attrs[rule.field];
    if (val === undefined && rule.field !== "buildable") continue;
    if (rule.condition && !rule.condition(attrs, listing)) continue;
    const badge = rule.render(val, lang);
    if (badge) badges.push(badge);
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {badges.map((badge, i) => (
        <span
          key={i}
          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}