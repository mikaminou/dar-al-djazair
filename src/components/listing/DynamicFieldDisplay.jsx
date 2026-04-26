/**
 * DynamicFieldDisplay
 * Read-only display of a listing's type-specific attributes.
 * Driven by propertyTypes.config.js — no hardcoded field logic.
 *
 * Props:
 *   propertyType  (string)  — e.g. "apartment"
 *   attributes    (object)  — the listing's attribute values
 *   listing       (object)  — full listing record (for legacy fallback)
 *   lang          (string)  — "en" | "fr" | "ar"
 */

import React, { useState } from "react";
import { getPropertyType } from "../propertyTypes.config";
import { ChevronDown } from "lucide-react";

// ─── Legacy attributes adapter ────────────────────────────────────────────────
// For listings created before the attributes refactor, map top-level columns
// into the attributes shape so DynamicFieldDisplay renders them.
export function legacyAttributesAdapter(listing) {
  if (!listing) return {};
  const attrs = { ...(listing.attributes || {}) };
  const legacyFields = ["area", "rooms", "bedrooms", "bathrooms", "floor", "total_floors", "furnished", "year_built"];
  for (const key of legacyFields) {
    if (listing[key] !== undefined && listing[key] !== null && listing[key] !== "" && attrs[key] === undefined) {
      attrs[key] = listing[key];
    }
  }
  return attrs;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lbl(field, lang) {
  return field.label?.[lang] || field.label?.fr || field.key;
}

function formatValue(field, rawValue, lang) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;

  if (field.type === "boolean") {
    // Return a special marker — rendered as a badge below
    return rawValue ? "__TRUE__" : "__FALSE__";
  }

  if (field.type === "enum") {
    const opt = (field.options || []).find(o => o.value === rawValue);
    return opt ? (opt.label?.[lang] || opt.label?.fr || rawValue) : rawValue;
  }

  if (field.type === "multi_enum") {
    if (!Array.isArray(rawValue) || rawValue.length === 0) return null;
    return rawValue.map(v => {
      const opt = (field.options || []).find(o => o.value === v);
      return opt ? (opt.label?.[lang] || opt.label?.fr || v) : v;
    });
  }

  if (field.type === "unit_number") {
    return rawValue; // unit appended by caller
  }

  // number / text
  if (field.type === "number" && typeof rawValue === "number") {
    const formatted = rawValue.toLocaleString(lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US");
    const unit = field.unit ? ` ${field.unit}` : "";
    return `${formatted}${unit}`;
  }

  const unit = field.unit ? ` ${field.unit}` : "";
  return `${rawValue}${unit}`;
}

// ─── Value renderer ───────────────────────────────────────────────────────────
function FieldValue({ field, displayValue, lang }) {
  if (displayValue === "__TRUE__") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        ✓ {lang === "ar" ? "نعم" : lang === "fr" ? "Oui" : "Yes"}
      </span>
    );
  }
  if (displayValue === "__FALSE__") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
        — {lang === "ar" ? "لا" : lang === "fr" ? "Non" : "No"}
      </span>
    );
  }
  if (Array.isArray(displayValue)) {
    return (
      <div className="flex flex-wrap gap-1 mt-0.5">
        {displayValue.map((v, i) => (
          <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
            {v}
          </span>
        ))}
      </div>
    );
  }
  return <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{displayValue}</span>;
}

// ─── Collapsible group card ───────────────────────────────────────────────────
function GroupCard({ group, items, lang, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {group.label?.[lang] || group.label?.fr}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
          {items.map(({ field, displayValue }) => (
            <div key={field.key} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400">{lbl(field, lang)}</span>
              <FieldValue field={field} displayValue={displayValue} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DynamicFieldDisplay({ propertyType, attributes = {}, listing = null, lang = "fr" }) {
  // Apply legacy adapter if attributes is sparse but listing has top-level columns
  const resolvedAttrs = Object.keys(attributes).length === 0 && listing
    ? legacyAttributesAdapter(listing)
    : attributes;

  const typeDef = getPropertyType(propertyType === "new_development" ? "building" : propertyType);
  if (!typeDef) return null;

  const sortedGroups = [...typeDef.groups].sort((a, b) => a.order - b.order);

  // Group fields with their computed display values
  const grouped = {};
  for (const field of typeDef.fields) {
    // Conditional visibility
    if (field.conditional) {
      if (resolvedAttrs[field.conditional.field] !== field.conditional.value) continue;
    }

    const unitKey = `${field.key}_unit`;
    const raw = resolvedAttrs[field.key];
    let displayValue = formatValue(field, raw, lang);

    // For unit_number: append unit
    if (field.type === "unit_number" && displayValue !== null && displayValue !== undefined) {
      const unit = resolvedAttrs[unitKey] || field.unitOptions?.[0] || "";
      displayValue = `${displayValue} ${unit}`;
    }

    // Hide null / empty (but keep FALSE boolean — it's meaningful)
    if (displayValue === null || displayValue === undefined || displayValue === "") continue;
    if (Array.isArray(displayValue) && displayValue.length === 0) continue;

    if (!grouped[field.group]) grouped[field.group] = [];
    grouped[field.group].push({ field, displayValue });
  }

  const hasAny = Object.values(grouped).some(arr => arr.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      {sortedGroups.map((group, idx) => {
        const items = grouped[group.key];
        if (!items || items.length === 0) return null;
        return (
          <GroupCard
            key={group.key}
            group={group}
            items={items}
            lang={lang}
            defaultOpen={idx === 0}
          />
        );
      })}
    </div>
  );
}