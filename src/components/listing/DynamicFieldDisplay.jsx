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

import React from "react";
import { getPropertyType } from "../propertyTypes.config";
import {
  Ruler, LayoutGrid, BedDouble, Bath, Layers, Sofa, Fence, ParkingSquare,
  Calendar, Compass, Sun, Snowflake, Trees, Waves, Mountain, Wifi,
  Dumbbell, ShieldCheck, Wrench, Home, Building2, Briefcase, Tractor,
  Car, DoorOpen, Key, MapPin, Sprout, Droplets, Zap, Thermometer,
  CheckCircle2, MinusCircle, Users, Maximize2,
} from "lucide-react";

// Map a field key (or fallback group) to a Lucide icon. Unknown keys fall
// back to a neutral icon so the layout never breaks.
const FIELD_ICONS = {
  area: Ruler,
  surface: Ruler,
  rooms: LayoutGrid,
  bedrooms: BedDouble,
  bathrooms: Bath,
  floor: Layers,
  total_floors: Layers,
  furnished: Sofa,
  balcony: Fence,
  parking: ParkingSquare,
  garage: Car,
  year_built: Calendar,
  orientation: Compass,
  view: Mountain,
  sun_exposure: Sun,
  air_conditioning: Snowflake,
  heating: Thermometer,
  garden: Trees,
  pool: Waves,
  internet: Wifi,
  gym: Dumbbell,
  security: ShieldCheck,
  elevator: Building2,
  workshop: Wrench,
  office_layout: Briefcase,
  total_units: Home,
  capacity: Users,
  buildable: DoorOpen,
  title_type: Key,
  zoning: MapPin,
  soil_type: Sprout,
  irrigation: Droplets,
  electricity: Zap,
  land_area: Maximize2,
  crops: Tractor,
};

function iconFor(field) {
  return FIELD_ICONS[field.key] || CheckCircle2;
}

// ─── Attributes adapter ───────────────────────────────────────────────────────
// All type-specific fields now live as top-level columns. We merge any legacy
// `attributes` object with config-defined top-level keys so this component
// keeps working for both old and new listings.
export function legacyAttributesAdapter(listing) {
  if (!listing) return {};
  const attrs = { ...(listing.attributes || {}) };
  const typeDef = getPropertyType(
    listing.property_type === "new_development" ? "building" : listing.property_type
  );
  if (typeDef) {
    for (const f of typeDef.fields) {
      if (attrs[f.key] === undefined && listing[f.key] !== undefined && listing[f.key] !== null && listing[f.key] !== "") {
        attrs[f.key] = listing[f.key];
      }
    }
  }
  if (attrs.area === undefined && listing.area !== undefined && listing.area !== null && listing.area !== "") {
    attrs.area = listing.area;
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

// ─── Stat tile ────────────────────────────────────────────────────────────────
// Renders a single field as an icon-stat tile (icon → value → label).
function StatTile({ field, displayValue, lang }) {
  const Icon = iconFor(field);
  const yes = lang === "ar" ? "نعم" : lang === "fr" ? "Oui" : "Yes";
  const no  = lang === "ar" ? "لا"  : lang === "fr" ? "Non" : "No";

  let valueNode;
  if (displayValue === "__TRUE__") {
    valueNode = (
      <span className="flex items-center justify-center gap-1">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
        {yes}
      </span>
    );
  } else if (displayValue === "__FALSE__") {
    valueNode = (
      <span className="flex items-center justify-center gap-1 text-gray-400">
        <MinusCircle className="w-4 h-4" strokeWidth={2.5} />
        {no}
      </span>
    );
  } else if (Array.isArray(displayValue)) {
    valueNode = <span className="text-base">{displayValue.join(", ")}</span>;
  } else {
    valueNode = displayValue;
  }

  return (
    <div className="bg-white dark:bg-[#13161c] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col items-center text-center gap-2">
      <Icon className="w-7 h-7 text-emerald-600" strokeWidth={2} />
      <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">
        {valueNode}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {lbl(field, lang)}
      </div>
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

  // Build a flat, group-ordered list of {field, displayValue} tiles.
  const groupOrder = Object.fromEntries(
    [...typeDef.groups].sort((a, b) => a.order - b.order).map((g, i) => [g.key, i])
  );

  const tiles = [];
  for (const field of typeDef.fields) {
    if (field.conditional) {
      if (resolvedAttrs[field.conditional.field] !== field.conditional.value) continue;
    }

    const unitKey = `${field.key}_unit`;
    const raw = resolvedAttrs[field.key];
    let displayValue = formatValue(field, raw, lang);

    if (field.type === "unit_number" && displayValue !== null && displayValue !== undefined) {
      const unit = resolvedAttrs[unitKey] || field.unitOptions?.[0] || "";
      displayValue = `${displayValue} ${unit}`;
    }

    if (displayValue === null || displayValue === undefined || displayValue === "") continue;
    if (Array.isArray(displayValue) && displayValue.length === 0) continue;

    tiles.push({ field, displayValue });
  }

  if (tiles.length === 0) return null;

  // Order tiles by their group's display order, preserving field order within a group.
  tiles.sort((a, b) => (groupOrder[a.field.group] ?? 99) - (groupOrder[b.field.group] ?? 99));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {tiles.map(({ field, displayValue }) => (
        <StatTile key={field.key} field={field} displayValue={displayValue} lang={lang} />
      ))}
    </div>
  );
}