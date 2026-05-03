import React from "react";

/**
 * Generic chip selector. Used by boolean / enum / multi_enum.
 * `multi` enables multi-select (returns array); otherwise single value.
 */
export default function FilterChipGroup({ options, value, onChange, multi = false, includeAny = true, lang = "fr" }) {
  const ANY = { value: "", label: { en: "Any", fr: "Tous", ar: "الكل" } };
  const items = multi ? options : (includeAny ? [ANY, ...options] : options);

  const isActive = (optVal) => {
    if (multi) return Array.isArray(value) && value.includes(optVal);
    return (value ?? "") === optVal;
  };

  const handleClick = (optVal) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      const next = arr.includes(optVal) ? arr.filter(v => v !== optVal) : [...arr, optVal];
      onChange(next.length ? next : "");
    } else {
      onChange(optVal === value ? "" : optVal);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(opt => {
        const active = isActive(opt.value);
        return (
          <button
            key={opt.value || "any"}
            type="button"
            onClick={() => handleClick(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium ${
              active
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            {opt.label?.[lang] || opt.label?.fr || opt.label?.en || opt.value}
          </button>
        );
      })}
    </div>
  );
}