import React from "react";
import { Check } from "lucide-react";

/**
 * Dense boolean toggle — simple ON / OFF chip.
 * Three states cycle: undefined → true → false → undefined.
 */
export default function BooleanToggle({ field, filters, onChange, lang }) {
  const v = filters[field.key];
  const state = v === true || v === "true" ? "yes" : v === false || v === "false" ? "no" : "any";

  const cycle = () => {
    if (state === "any") onChange(field.key, true);
    else if (state === "yes") onChange(field.key, false);
    else onChange(field.key, "");
  };

  const labelText = field.label?.[lang] || field.label?.fr || field.label?.en;

  const styles = {
    any: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400",
    yes: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
    no:  "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className={`flex items-center gap-1.5 text-xs px-3 h-8 rounded-full border transition-all font-medium ${styles[state]}`}
      title={state === "yes" ? "Yes" : state === "no" ? "No" : "Any"}
    >
      {state === "yes" && <Check className="w-3 h-3" />}
      {state === "no" && <span className="text-base leading-none">−</span>}
      <span>{labelText}</span>
    </button>
  );
}