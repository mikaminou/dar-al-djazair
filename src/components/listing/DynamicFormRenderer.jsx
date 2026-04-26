/**
 * DynamicFormRenderer
 * Renders type-specific property fields driven entirely by propertyTypes.config.js.
 * Props:
 *   propertyType  (string)  — e.g. "apartment"
 *   listingType   (string)  — "sale" | "rent"
 *   value         (object)  — current attribute values
 *   onChange      (fn)      — (key, newValue) => void
 *   errors        (object)  — { [key]: errorMessageString }
 *   warnings      (object)  — { [key]: warningMessageString }
 *   lang          (string)  — "en" | "fr" | "ar"
 */

import React from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPropertyType, getRequiredFields } from "../propertyTypes.config";

function lbl(field, lang) {
  return field.label?.[lang] || field.label?.fr || field.key;
}

function isRequired(field, listingType) {
  if (field.required === true) return true;
  if (field.required && typeof field.required === "object") {
    return field.required.whenListingType === listingType;
  }
  return false;
}

function isVisible(field, value) {
  if (!field.conditional) return true;
  return value[field.conditional.field] === field.conditional.value;
}

// ─── Field renderers ─────────────────────────────────────────────────────────

function NumberField({ field, value, onChange, error, warning, lang, listingType }) {
  const req = isRequired(field, listingType);
  const isAmenity = field.group === "amenities";
  
  // Numeric amenities (e.g., parking_spots, garage_spots) render as stepper pills
  if (isAmenity) {
    const numVal = Number(value[field.key] ?? 0);
    return (
      <div>
        <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
          {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
        <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1.5 w-fit bg-white hover:border-emerald-300 transition-colors">
          <button
            type="button"
            onClick={() => onChange(field.key, Math.max((field.min ?? 0), numVal - 1))}
            disabled={numVal <= (field.min ?? 0)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-emerald-600 hover:bg-emerald-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          >
            −
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[24px] text-center">{numVal}</span>
          <button
            type="button"
            onClick={() => onChange(field.key, Math.min((field.max ?? 999), numVal + 1))}
            disabled={field.max !== undefined && numVal >= field.max}
            className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-emerald-600 hover:bg-emerald-50 disabled:text-gray-300 disabled:hover:bg-transparent transition-colors"
          >
            +
          </button>
        </div>
        {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      </div>
    );
  }
  
  // Non-amenity number fields: standard text input
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={value[field.key] ?? ""}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder?.[lang] || "0"}
          className={`pr-12 focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors ${error ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
        />
        {field.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
            {field.unit}
          </span>
        )}
      </div>
      {field.helperText?.[lang] && !error && (
        <p className="text-[11px] text-gray-400 mt-1">{field.helperText[lang]}</p>
      )}
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {warning && !error && <p className="flex items-center gap-1 text-xs text-amber-600 mt-1"><AlertTriangle className="w-3 h-3" />{warning}</p>}
    </div>
  );
}

function TextField({ field, value, onChange, error, lang, listingType }) {
  const req = isRequired(field, listingType);
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        type="text"
        value={value[field.key] ?? ""}
        onChange={e => onChange(field.key, e.target.value)}
        placeholder={field.placeholder?.[lang] || ""}
        className={error ? "border-red-400" : ""}
      />
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function BooleanField({ field, value, onChange, lang }) {
  const active = !!value[field.key];
  // Amenities group: render as pill toggles
  const isAmenity = field.group === "amenities";
  
  if (isAmenity) {
    return (
      <button
        type="button"
        onClick={() => onChange(field.key, !active)}
        className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
          active
            ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
            : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300"
        }`}
      >
        {lbl(field, lang)}
      </button>
    );
  }
  
  // Non-amenity booleans: render as radio dots
  return (
    <button
      type="button"
      onClick={() => onChange(field.key, !active)}
      className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all flex items-center gap-2 ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm"
          : "border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/40"
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        active ? "border-emerald-500 bg-emerald-500" : "border-gray-300"
      }`}>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
      </span>
      {lbl(field, lang)}
    </button>
  );
}

function EnumField({ field, value, onChange, error, lang, listingType }) {
  const req = isRequired(field, listingType);
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Select value={value[field.key] || ""} onValueChange={v => onChange(field.key, v)}>
        <SelectTrigger className={`text-sm focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors ${error ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}>
          <SelectValue placeholder={lang === "ar" ? "اختر..." : lang === "fr" ? "Choisir..." : "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {(field.options || []).map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label?.[lang] || opt.label?.fr || opt.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function MultiEnumField({ field, value, onChange, lang }) {
  const selected = Array.isArray(value[field.key]) ? value[field.key] : [];
  const toggle = (v) => {
    onChange(field.key, selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  };
  return (
    <div className="sm:col-span-2 md:col-span-3">
      <Label className="text-xs font-semibold text-gray-600 mb-2 block">{lbl(field, lang)}</Label>
      <div className="flex flex-wrap gap-1.5">
        {(field.options || []).map(opt => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium ${
                active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-emerald-200"
              }`}
            >
              {opt.label?.[lang] || opt.label?.fr || opt.value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UnitNumberField({ field, value, onChange, error, lang, listingType }) {
  const req = isRequired(field, listingType);
  const unitKey = `${field.key}_unit`;
  const currentUnit = value[unitKey] || (field.unitOptions?.[0] || "");
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-600 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          min={field.min}
          value={value[field.key] ?? ""}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder="0"
          className={`flex-1 focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-colors ${error ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
        />
        {/* Unit toggle pills */}
        {field.unitOptions && field.unitOptions.length > 1 ? (
          <div className="flex gap-1">
            {field.unitOptions.map(u => (
              <button
                key={u}
                type="button"
                onClick={() => onChange(unitKey, u)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  currentUnit === u
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-emerald-400"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        ) : (
          <span className="flex items-center px-3 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg font-medium">
            {currentUnit}
          </span>
        )}
      </div>
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export default function DynamicFormRenderer({ propertyType, listingType, value, onChange, errors = {}, warnings = {}, lang = "fr" }) {
  const typeDef = getPropertyType(propertyType);
  if (!typeDef) return null;

  const sortedGroups = [...typeDef.groups].sort((a, b) => a.order - b.order);

  const fieldsByGroup = {};
  for (const field of typeDef.fields) {
    if (!isVisible(field, value)) continue;
    if (!fieldsByGroup[field.group]) fieldsByGroup[field.group] = [];
    fieldsByGroup[field.group].push(field);
  }

  const boolFields = [];
  const amenityFields = [];
  const nonBoolFields = {};

  // Separate: amenities → pill grid, other booleans → radio dots grid, rest → standard grid
  for (const group of sortedGroups) {
    const fields = fieldsByGroup[group.key] || [];
    for (const field of fields) {
      if (field.group === "amenities" && (field.type === "boolean" || field.type === "number")) {
        amenityFields.push({ field, group });
      } else if (field.type === "boolean") {
        boolFields.push({ field, group });
      } else {
        if (!nonBoolFields[group.key]) nonBoolFields[group.key] = [];
        nonBoolFields[group.key].push(field);
      }
    }
  }

  function renderField(field) {
    const error = errors[field.key] || null;
    const warning = warnings[field.key] || null;
    const props = { field, value, onChange, error, warning, lang, listingType };
    if (field.type === "number")     return <NumberField key={field.key} {...props} />;
    if (field.type === "text")       return <TextField key={field.key} {...props} />;
    if (field.type === "enum")       return <EnumField key={field.key} {...props} />;
    if (field.type === "multi_enum") return <MultiEnumField key={field.key} {...props} />;
    if (field.type === "unit_number")return <UnitNumberField key={field.key} {...props} />;
    if (field.type === "boolean")    return <BooleanField key={field.key} {...props} />;
    return null;
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map(group => {
        const regular = nonBoolFields[group.key] || [];
        const bools = boolFields.filter(b => b.group.key === group.key).map(b => b.field);
        const amenities = amenityFields.filter(a => a.group.key === group.key).map(a => a.field);
        
        if (regular.length === 0 && bools.length === 0 && amenities.length === 0) return null;

        return (
          <div key={group.key}>
            {/* Group header with separator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest whitespace-nowrap">
                {group.label?.[lang] || group.label?.fr}
              </span>
              <div className="flex-1 h-px bg-emerald-100" />
            </div>

            {/* Standard fields (number, text, enum, unit_number) */}
            {regular.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {regular.map(f => renderField(f))}
              </div>
            )}
            
            {/* Non-amenity booleans (radio dots) */}
            {bools.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {bools.map(f => renderField(f))}
              </div>
            )}
            
            {/* Amenity pills (flex wrap) */}
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {amenities.map(f => renderField(f))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}