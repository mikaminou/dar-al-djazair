/**
 * ListingCardFacts — pure sub-component.
 * Reads config card flags, picks top facts, handles fallbacks.
 * Memoized: re-renders only when attrs or lang change.
 */
import React, { useMemo } from "react";
import { getCardFields } from "../propertyTypes.config";
import {
  BedDouble, Maximize2, Layers, Trees, Building2,
  Ruler, Tag, LayoutGrid, Droplets, Zap, Home,
} from "lucide-react";
import { legacyAttributesAdapter } from "./DynamicFieldDisplay";

// ─── Icon registry ────────────────────────────────────────────────────────────
const ICON_MAP = {
  bed:         <BedDouble className="w-3.5 h-3.5" />,
  ruler:       <Maximize2 className="w-3.5 h-3.5" />,
  floors:      <Layers className="w-3.5 h-3.5" />,
  tree:        <Trees className="w-3.5 h-3.5" />,
  building:    <Building2 className="w-3.5 h-3.5" />,
  width:       <Ruler className="w-3.5 h-3.5" />,
  tag:         <Tag className="w-3.5 h-3.5" />,
  layout:      <LayoutGrid className="w-3.5 h-3.5" />,
  water:       <Droplets className="w-3.5 h-3.5" />,
  electricity: <Zap className="w-3.5 h-3.5" />,
  home:        <Home className="w-3.5 h-3.5" />,
  build:       <Building2 className="w-3.5 h-3.5" />,
  grid:        <LayoutGrid className="w-3.5 h-3.5" />,
  bath:        <Droplets className="w-3.5 h-3.5" />,
};

// ─── Format a single fact value into a display string ────────────────────────
function formatFact(field, attrs, lang) {
  const raw = attrs[field.key];
  const fmt = field.cardFormat;

  if (fmt === "boolean_chip") {
    if (raw === true || raw === false) {
      const labels = field.cardBadgeLabel?.[lang] || field.cardBadgeLabel?.fr || {};
      return raw
        ? (labels.true || (lang === "fr" ? "Oui" : lang === "ar" ? "نعم" : "Yes"))
        : (labels.false || (lang === "fr" ? "Non" : lang === "ar" ? "لا" : "No"));
    }
    return null;
  }

  if (fmt === "enum_label" && field.type === "multi_enum") {
    if (!Array.isArray(raw) || raw.length === 0) return null;
    const first = raw[0];
    const opt = (field.options || []).find(o => o.value === first);
    return opt ? (opt.label?.[lang] || opt.label?.fr || first) : first;
  }

  if (fmt === "enum_label" && field.type === "enum") {
    const opt = (field.options || []).find(o => o.value === raw);
    return opt ? (opt.label?.[lang] || opt.label?.fr || raw) : raw;
  }

  // value_unit or icon_value — both just show the numeric value
  if (raw === undefined || raw === null || raw === "") return null;

  const num = Number(raw);
  if (isNaN(num)) return null;

  // For unit_number, append stored unit
  if (field.type === "unit_number") {
    const unit = attrs[`${field.key}_unit`] || field.unitOptions?.[0] || "";
    return `${num.toLocaleString()} ${unit}`.trim();
  }

  const unit = field.unit ? ` ${field.unit}` : "";
  return `${num.toLocaleString()}${unit}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ListingCardFacts = React.memo(function ListingCardFacts({
  listing,
  lang = "fr",
  maxFacts = 3,
}) {
  const facts = useMemo(() => {
    const pt = listing?.property_type;
    if (!pt) return [];

    const attrs = Object.keys(listing.attributes || {}).length > 0
      ? listing.attributes
      : legacyAttributesAdapter(listing);

    const cardFields = getCardFields(pt); // already sorted by cardOrder
    const results = [];

    for (const field of cardFields) {
      if (results.length >= maxFacts) break;
      const display = formatFact(field, attrs, lang);
      if (display === null || display === undefined || display === "") continue;
      results.push({
        key: field.key,
        icon: ICON_MAP[field.cardIcon] || null,
        display,
        isBooleanChip: field.cardFormat === "boolean_chip",
      });
    }

    return results;
  }, [listing, lang, maxFacts]);

  if (facts.length === 0) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
      {facts.map(fact => (
        <span key={fact.key} className="flex items-center gap-1">
          {fact.icon}
          <span>{fact.display}</span>
        </span>
      ))}
    </div>
  );
});

export default ListingCardFacts;