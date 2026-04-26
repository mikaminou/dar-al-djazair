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
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
        {field.unit && <span className="ml-1 text-gray-400 font-normal">({field.unit})</span>}
      </Label>
      <Input
        type="number"
        min={field.min}
        max={field.max}
        value={value[field.key] ?? ""}
        onChange={e => onChange(field.key, e.target.value)}
        placeholder={field.placeholder?.[lang] || "0"}
        className={`text-center ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="flex items-center gap-1 text-xs text-red-600 mt-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      {warning && !error && <p className="flex items-center gap-1 text-xs text-amber-600 mt-1"><AlertTriangle className="w-3 h-3" />{warning}</p>}
    </div>
  );
}

function TextField({ field, value, onChange, error, lang, listingType }) {
  const req = isRequired(field, listingType);
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
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
  return (
    <button
      type="button"
      onClick={() => onChange(field.key, !active)}
      className={`w-full text-left px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-gray-200 text-gray-500 hover:border-emerald-200"
      }`}
    >
      <span className="mr-1.5">{active ? "✓" : "○"}</span>
      {lbl(field, lang)}
    </button>
  );
}

function EnumField({ field, value, onChange, error, lang, listingType }) {
  const req = isRequired(field, listingType);
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Select value={value[field.key] || ""} onValueChange={v => onChange(field.key, v)}>
        <SelectTrigger className={`text-sm ${error ? "border-red-400" : "border-gray-200"}`}>
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
    <div>
      <Label className="text-xs font-semibold text-gray-700 mb-2 block">{lbl(field, lang)}</Label>
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
      <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
        {lbl(field, lang)}{req && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="number"
          min={field.min}
          value={value[field.key] ?? ""}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder="0"
          className={`flex-1 ${error ? "border-red-400" : ""}`}
        />
        <Select value={currentUnit} onValueChange={v => onChange(unitKey, v)}>
          <SelectTrigger className="w-28 border-gray-200 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.unitOptions || []).map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  const nonBoolFields = {};

  // Separate booleans (rendered together in a grid) vs other types
  for (const group of sortedGroups) {
    const fields = fieldsByGroup[group.key] || [];
    for (const field of fields) {
      if (field.type === "boolean") {
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
        if (regular.length === 0 && bools.length === 0) return null;

        return (
          <div key={group.key}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {group.label?.[lang] || group.label?.fr}
            </p>
            {regular.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {regular.map(f => renderField(f))}
              </div>
            )}
            {bools.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {bools.map(f => renderField(f))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}