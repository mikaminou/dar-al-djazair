import React from "react";
import { Input } from "@/components/ui/input";

/**
 * Numeric min/max range with unit chip on the right of the label.
 */
export default function RangeField({ field, filters, onChange, lang }) {
  const minKey = `min_${field.key}`;
  const maxKey = `max_${field.key}`;
  const labelText = field.label?.[lang] || field.label?.fr || field.label?.en;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          {labelText}
        </label>
        {field.unit && (
          <span className="text-[10px] text-gray-400 font-medium">{field.unit}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          inputMode="numeric"
          value={filters[minKey] || ""}
          onChange={e => onChange(minKey, e.target.value)}
          placeholder={lang === "ar" ? "من" : lang === "fr" ? "Min" : "Min"}
          min={field.min}
          step={field.step}
          className="h-9 text-sm rounded-lg"
        />
        <span className="text-gray-300 text-sm">→</span>
        <Input
          type="number"
          inputMode="numeric"
          value={filters[maxKey] || ""}
          onChange={e => onChange(maxKey, e.target.value)}
          placeholder={lang === "ar" ? "إلى" : lang === "fr" ? "Max" : "Max"}
          max={field.max}
          step={field.step}
          className="h-9 text-sm rounded-lg"
        />
      </div>
    </div>
  );
}