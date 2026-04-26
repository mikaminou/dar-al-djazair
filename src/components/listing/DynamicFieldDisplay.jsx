/**
 * DynamicFieldDisplay
 * Read-only display of a listing's type-specific attributes.
 * Driven by propertyTypes.config.js — no hardcoded field logic.
 * Props:
 *   propertyType  (string)  — e.g. "apartment"
 *   attributes    (object)  — the listing's attribute values
 *   lang          (string)  — "en" | "fr" | "ar"
 */

import React from "react";
import { getPropertyType } from "../propertyTypes.config";

function lbl(field, lang) {
  return field.label?.[lang] || field.label?.fr || field.key;
}

function formatValue(field, rawValue, lang) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;

  if (field.type === "boolean") {
    return rawValue ? (lang === "ar" ? "نعم" : lang === "fr" ? "Oui" : "Yes") : null; // hide falsy booleans
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
    }).join(", ");
  }

  if (field.type === "unit_number") {
    return rawValue; // unit displayed separately
  }

  // number / text
  const unit = field.unit ? ` ${field.unit}` : "";
  return `${rawValue}${unit}`;
}

export default function DynamicFieldDisplay({ propertyType, attributes = {}, lang = "fr" }) {
  const typeDef = getPropertyType(propertyType);
  if (!typeDef || !attributes) return null;

  const sortedGroups = [...typeDef.groups].sort((a, b) => a.order - b.order);

  // Collect visible fields with formatted values grouped
  const grouped = {};
  for (const field of typeDef.fields) {
    // Check conditional visibility
    if (field.conditional) {
      if (attributes[field.conditional.field] !== field.conditional.value) continue;
    }

    const unitKey = `${field.key}_unit`;
    let raw = attributes[field.key];
    let displayValue = formatValue(field, raw, lang);

    // For unit_number: append unit
    if (field.type === "unit_number" && displayValue !== null) {
      const unit = attributes[unitKey] || field.unitOptions?.[0] || "";
      displayValue = `${displayValue} ${unit}`;
    }

    if (displayValue === null || displayValue === undefined || displayValue === "") continue;

    if (!grouped[field.group]) grouped[field.group] = [];
    grouped[field.group].push({ field, displayValue });
  }

  const hasAny = Object.values(grouped).some(arr => arr.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-4">
      {sortedGroups.map(group => {
        const items = grouped[group.key];
        if (!items || items.length === 0) return null;

        return (
          <div key={group.key}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {group.label?.[lang] || group.label?.fr}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {items.map(({ field, displayValue }) => (
                <div key={field.key} className="flex flex-col">
                  <span className="text-xs text-gray-400">{lbl(field, lang)}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{displayValue}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}