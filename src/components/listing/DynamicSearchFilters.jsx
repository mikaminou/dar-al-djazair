/**
 * DynamicSearchFilters
 * Renders type-specific filter fields based on the selected property_type.
 * Reads showInSearchFilter fields from propertyTypes.config.js.
 * Zero hardcoded type conditionals — all driven by config.
 *
 * Props:
 *   propertyType  (string)  — currently selected property type key, or ""
 *   filters       (object)  — current filter state
 *   onChange      (fn)      — (key, value) => void
 *   lang          (string)  — "en" | "fr" | "ar"
 */
import React from "react";
import { getSearchFilterFields } from "../propertyTypes.config";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// ── Field renderers ───────────────────────────────────────────────────────────

function BooleanChipField({ field, filters, onChange, lang }) {
  const key = field.key;
  const val = filters[key] ?? "";
  const setVal = (v) => onChange(key, v === val ? "" : v);

  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        {field.label?.[lang] || field.label?.fr}
      </label>
      <div className="flex gap-2 flex-wrap">
        {[
          { v: "", label: lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "Any" },
          { v: "true",  label: lang === "ar" ? "نعم" : lang === "fr" ? "Oui" : "Yes" },
          { v: "false", label: lang === "ar" ? "لا" : lang === "fr" ? "Non" : "No" },
        ].map(opt => (
          <button
            key={opt.v}
            onClick={() => setVal(opt.v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              val === opt.v
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EnumField({ field, filters, onChange, lang }) {
   const key = field.key;
   return (
     <div>
       <label className="text-xs text-gray-500 font-medium mb-1.5 block">
         {field.label?.[lang] || field.label?.fr}
       </label>
       <Select value={filters[key] || "all"} onValueChange={v => onChange(key, v === "all" ? "" : v)}>
         <SelectTrigger className="border-gray-200 bg-white dark:bg-gray-800 h-9 text-xs rounded-lg">
           <SelectValue />
         </SelectTrigger>
         <SelectContent>
           <SelectItem value="all">{lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "Any"}</SelectItem>
           {(field.options || []).map(opt => (
             <SelectItem key={opt.value} value={opt.value}>
               {opt.label?.[lang] || opt.label?.fr || opt.value}
             </SelectItem>
           ))}
         </SelectContent>
       </Select>
     </div>
   );
}

function MultiEnumField({ field, filters, onChange, lang }) {
   const key = field.key;
   const selectedValues = filters[key] ? (Array.isArray(filters[key]) ? filters[key] : [filters[key]]) : [];

   const toggle = (val) => {
     const newVals = selectedValues.includes(val)
       ? selectedValues.filter(v => v !== val)
       : [...selectedValues, val];
     onChange(key, newVals.length > 0 ? newVals : "");
   };

   return (
     <div>
       <label className="text-xs text-gray-500 font-medium mb-1.5 block">
         {field.label?.[lang] || field.label?.fr}
       </label>
       <div className="flex flex-wrap gap-2">
         {(field.options || []).map(opt => (
           <button
             key={opt.value}
             onClick={() => toggle(opt.value)}
             className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
               selectedValues.includes(opt.value)
                 ? "bg-emerald-600 text-white border-emerald-600"
                 : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
             }`}
           >
             {opt.label?.[lang] || opt.label?.fr || opt.value}
           </button>
         ))}
       </div>
     </div>
   );
}

function NumberRangeField({ field, filters, onChange, lang }) {
  const minKey = `min_${field.key}`;
  const maxKey = `max_${field.key}`;
  const unit = field.unit ? ` (${field.unit})` : "";
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        {field.label?.[lang] || field.label?.fr}{unit}
      </label>
      <div className="flex gap-1.5 items-center">
        <Input
          type="number"
          value={filters[minKey] || ""}
          onChange={e => onChange(minKey, e.target.value)}
          placeholder={lang === "ar" ? "من" : lang === "fr" ? "Min" : "Min"}
          className="h-9 text-xs"
          min={field.min}
        />
        <span className="text-gray-400 text-xs flex-shrink-0">–</span>
        <Input
          type="number"
          value={filters[maxKey] || ""}
          onChange={e => onChange(maxKey, e.target.value)}
          placeholder={lang === "ar" ? "إلى" : lang === "fr" ? "Max" : "Max"}
          className="h-9 text-xs"
          max={field.max}
        />
      </div>
    </div>
  );
}

function NumberMinField({ field, filters, onChange, lang }) {
  const minKey = `min_${field.key}`;
  const unit = field.unit ? ` (${field.unit})` : "";
  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        {field.label?.[lang] || field.label?.fr}{unit} min
      </label>
      <Input
        type="number"
        value={filters[minKey] || ""}
        onChange={e => onChange(minKey, e.target.value)}
        placeholder="0"
        className="h-9 text-xs"
        min={field.min}
      />
    </div>
  );
}

function UnitNumberRangeField({ field, filters, onChange, lang }) {
  const minKey = `min_${field.key}`;
  const maxKey = `max_${field.key}`;
  const unitKey = `${field.key}_unit`;
  const currentUnit = filters[unitKey] || (field.unitOptions?.[0] || "m²");

  return (
    <div>
      <label className="text-xs text-gray-500 font-medium mb-1.5 block">
        {field.label?.[lang] || field.label?.fr}
      </label>
      <div className="flex gap-1.5 items-center mb-1.5">
        <Input
          type="number"
          value={filters[minKey] || ""}
          onChange={e => onChange(minKey, e.target.value)}
          placeholder="Min"
          className="h-9 text-xs flex-1"
        />
        <span className="text-gray-400 text-xs">–</span>
        <Input
          type="number"
          value={filters[maxKey] || ""}
          onChange={e => onChange(maxKey, e.target.value)}
          placeholder="Max"
          className="h-9 text-xs flex-1"
        />
      </div>
      {field.unitOptions && field.unitOptions.length > 1 && (
        <div className="flex gap-1.5">
          {field.unitOptions.map(u => (
            <button
              key={u}
              onClick={() => onChange(unitKey, u)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                currentUnit === u
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white dark:bg-gray-800 text-gray-500 border-gray-200 hover:border-emerald-400"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DynamicSearchFilters({ propertyType, filters, onChange, lang = "fr" }) {
  const fields = propertyType ? getSearchFilterFields(propertyType) : [];

  if (!propertyType) {
    return (
      <p className="text-xs text-gray-400 italic text-center py-3">
        {lang === "ar"
          ? "اختر نوع العقار لتصفية البحث"
          : lang === "fr"
          ? "Sélectionnez un type de bien pour affiner votre recherche"
          : "Select a property type for more filters"}
      </p>
    );
  }

  if (fields.length === 0) return null;

  const handleChange = (key, val) => onChange({ ...filters, [key]: val });

  return (
     <div className="space-y-4">
       {fields.map(field => {
         if (field.type === "boolean") {
           return <BooleanChipField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />;
         }
         if (field.type === "enum") {
           return <EnumField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />;
         }
         if (field.type === "multi_enum") {
           return <MultiEnumField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />;
         }
         if (field.type === "unit_number") {
           return <UnitNumberRangeField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />;
         }
         if (field.type === "number") {
           // Count fields (bedrooms, bathrooms, etc.) get min-only; areas get range
           const countFields = ["bedrooms", "bathrooms", "floor", "total_units", "total_floors", "rooms", "levels"];
           const isCountField = countFields.includes(field.key);
           return isCountField
             ? <NumberMinField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />
             : <NumberRangeField key={field.key} field={field} filters={filters} onChange={(k, v) => handleChange(k, v)} lang={lang} />;
         }
         return null;
       })}
     </div>
   );
}