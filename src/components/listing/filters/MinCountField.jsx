import React from "react";

/**
 * Stepper for count fields (bedrooms, bathrooms…) — Any / 1+ / 2+ / 3+ / 4+ / 5+.
 */
const STEPS = [
  { v: "",  label: { en: "Any", fr: "Tous", ar: "الكل" } },
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
    <div>
      <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1.5 block">
        {labelText}
      </label>
      <div className="flex gap-1 flex-wrap">
        {STEPS.map(s => {
          const active = current === s.v || (current === "" && s.v === "");
          const text = typeof s.label === "object" ? (s.label[lang] || s.label.fr) : s.label;
          return (
            <button
              key={s.v || "any"}
              type="button"
              onClick={() => onChange(key, s.v)}
              className={`flex-1 min-w-[42px] h-8 text-xs rounded-md border transition-all font-semibold ${
                active
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
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