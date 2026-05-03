import React from "react";

/**
 * Compact stepper for count fields (bedrooms, bathrooms…).
 * Inline label + tight pill row — no full-width stretch.
 */
const STEPS = [
  { v: "",   label: { en: "Any", fr: "Tous", ar: "الكل" } },
  { v: "1+", label: "1+" },
  { v: "2+", label: "2+" },
  { v: "3+", label: "3+" },
  { v: "4+", label: "4+" },
  { v: "5+", label: "5+" },
];

export default function MinCountField({ field, filters, onChange, lang }) {
  const key = `min_${field.key}`;
  const current = filters[key] || "";
  const labelText = field.label?.[lang] || field.label?.fr || field.label?.en;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 shrink-0">
        {labelText}
      </span>
      <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        {STEPS.map(s => {
          const active = current === s.v;
          const text = typeof s.label === "object" ? (s.label[lang] || s.label.fr) : s.label;
          return (
            <button
              key={s.v || "any"}
              type="button"
              onClick={() => onChange(key, s.v)}
              className={`min-w-[36px] h-7 px-2 text-xs rounded-md transition-all font-semibold ${
                active
                  ? "bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}