import React, { useMemo } from "react";
import { X } from "lucide-react";
import { getFilterSchema } from "../perTypeFilterSchema";

/**
 * Renders a chip per active filter with an inline remove (×) button.
 * Reads the per-type schema to produce human-readable labels.
 */
function getActiveChips(propertyType, filters, lang) {
  const schema = getFilterSchema(propertyType);
  if (!schema) return [];

  const chips = [];
  const labelOf = (l) => l?.[lang] || l?.fr || l?.en || "";
  const optionLabel = (options, value) => {
    const opt = options?.find(o => o.value === value);
    return opt ? labelOf(opt.label) : value;
  };

  for (const section of schema.sections) {
    for (const f of section.fields) {
      const fLabel = labelOf(f.label);

      if (f.type === "range") {
        const min = filters[`min_${f.key}`];
        const max = filters[`max_${f.key}`];
        if (min) chips.push({
          id: `min_${f.key}`,
          label: `${fLabel} ≥ ${min}${f.unit ? ` ${f.unit}` : ""}`,
          clear: { [`min_${f.key}`]: "" },
        });
        if (max) chips.push({
          id: `max_${f.key}`,
          label: `${fLabel} ≤ ${max}${f.unit ? ` ${f.unit}` : ""}`,
          clear: { [`max_${f.key}`]: "" },
        });
      } else if (f.type === "min") {
        const v = filters[`min_${f.key}`];
        if (v) chips.push({
          id: `min_${f.key}`,
          label: `${fLabel}: ${v}`,
          clear: { [`min_${f.key}`]: "" },
        });
      } else if (f.type === "boolean") {
        const v = filters[f.key];
        if (v === true || v === "true") chips.push({ id: f.key, label: fLabel, clear: { [f.key]: "" } });
        else if (v === false || v === "false") chips.push({ id: f.key, label: `${lang === "ar" ? "بدون" : lang === "fr" ? "Sans" : "No"} ${fLabel}`, clear: { [f.key]: "" } });
      } else if (f.type === "enum") {
        const v = filters[f.key];
        if (v) chips.push({
          id: f.key,
          label: `${fLabel}: ${optionLabel(f.options, v)}`,
          clear: { [f.key]: "" },
        });
      } else if (f.type === "multi_enum") {
        const arr = filters[f.key];
        if (Array.isArray(arr) && arr.length > 0) {
          arr.forEach(val => {
            chips.push({
              id: `${f.key}_${val}`,
              label: `${fLabel}: ${optionLabel(f.options, val)}`,
              clear: { [f.key]: arr.filter(x => x !== val) },
            });
          });
        }
      }
    }
  }
  return chips;
}

export default function ActiveFiltersBar({ propertyType, filters, onChange, lang }) {
  const chips = useMemo(() => getActiveChips(propertyType, filters, lang), [propertyType, filters, lang]);
  if (chips.length === 0) return null;

  const removeChip = (clear) => {
    const next = { ...filters };
    for (const [k, v] of Object.entries(clear)) {
      if (Array.isArray(v) && v.length === 0) next[k] = "";
      else next[k] = v;
    }
    onChange(next);
  };

  return (
    <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f1115]">
      <div className="flex flex-wrap gap-1.5">
        {chips.map(chip => (
          <button
            key={chip.id}
            type="button"
            onClick={() => removeChip(chip.clear)}
            className="group flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <span className="max-w-[200px] truncate">{chip.label}</span>
            <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </div>
  );
}