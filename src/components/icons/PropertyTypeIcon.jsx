/**
 * Property Type Icon Registry
 *
 * This is the ONLY place property type icon imports happen.
 * All UI surfaces (listing cards, detail page, form, search filters, type chips)
 * must import from this file rather than mapping icons individually.
 *
 * To add a new property type icon:
 * 1. Import the Lucide icon component here.
 * 2. Add it to PROPERTY_TYPE_ICONS keyed by the property type slug.
 */
import React from "react";
import {
  Building2,
  Home,
  Castle,
  Trees,
  Store,
  Building,
  Monitor,
  Tractor,
} from "lucide-react";

/**
 * Map of property type key → Lucide icon component.
 * Keys match the `key` field in PROPERTY_TYPE_DEFS.
 */
export const PROPERTY_TYPE_ICONS = {
  apartment:  Building2,
  house:      Home,
  villa:      Castle,
  land:       Trees,
  commercial: Store,
  building:   Building,
  office:     Monitor,
  farm:       Tractor,
};

/**
 * Renders the icon for a given property type.
 *
 * @param {object} props
 * @param {string} props.type - property type key (e.g. "apartment")
 * @param {string} [props.className] - Tailwind classes
 * @param {number} [props.size] - icon size in px (default 16)
 */
export default function PropertyTypeIcon({ type, className = "w-4 h-4", size }) {
  const Icon = PROPERTY_TYPE_ICONS[type];
  if (!Icon) return null;
  return <Icon className={className} size={size} />;
}