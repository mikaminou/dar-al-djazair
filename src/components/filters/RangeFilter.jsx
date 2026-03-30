import React from "react";
import { Input } from "@/components/ui/input";

/**
 * RangeFilter — reusable range filter component.
 *
 * mode="numeric"  → two text inputs (min / max) with optional unit label.
 * mode="discrete" → pill buttons for min selection (e.g. 1, 2, 3, 4+).
 */
export default function RangeFilter({
  label,
  mode = "numeric",
  // numeric mode
  minValue = "",
  maxValue = "",
  onMinChange,
  onMaxChange,
  unit = "",
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  // discrete mode
  options = [],          // [{ value: "1", label: "1" }, ...]
  selectedMin = "",
  onSelectMin,
  anyLabel = "Any",
}) {
  return (
    <div>
      {label && (
        <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
      )}

      {mode === "numeric" ? (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            placeholder={minPlaceholder}
            value={minValue}
            onChange={e => onMinChange?.(e.target.value)}
            className="border-gray-200 text-sm h-9"
          />
          <span className="text-gray-400 text-xs shrink-0">{unit || "–"}</span>
          <Input
            type="number"
            placeholder={maxPlaceholder}
            value={maxValue}
            onChange={e => onMaxChange?.(e.target.value)}
            className="border-gray-200 text-sm h-9"
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onSelectMin?.("")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !selectedMin
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {anyLabel}
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => onSelectMin?.(opt.value === selectedMin ? "" : opt.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedMin === opt.value
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}