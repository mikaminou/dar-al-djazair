/**
 * QuickFilterChips — horizontally scrollable chip row above results.
 * Reads from quickFilterChips.config.js — zero hardcoded type logic.
 * A chip is highlighted when its filters match the current filter state.
 * Tapping an active chip clears those filters.
 */
import React from "react";
import { QUICK_FILTER_CHIPS } from "../quickFilterChips.config";

function chipsMatch(chipFilters, currentFilters) {
  for (const [key, val] of Object.entries(chipFilters)) {
    if (String(currentFilters[key] ?? "") !== String(val)) return false;
  }
  return true;
}

export default function QuickFilterChips({ filters, onChange, lang = "fr" }) {
  function applyChip(chip) {
    const isActive = chipsMatch(chip.filters, filters);
    if (isActive) {
      // Clear chip's filters
      const cleared = { ...filters };
      for (const key of Object.keys(chip.filters)) {
        cleared[key] = "";
      }
      onChange(cleared);
    } else {
      onChange({ ...filters, ...chip.filters });
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {QUICK_FILTER_CHIPS.map(chip => {
        const active = chipsMatch(chip.filters, filters);
        return (
          <button
            key={chip.id}
            onClick={() => applyChip(chip)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex-shrink-0 ${
              active
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            <span>{chip.icon}</span>
            <span>{chip.label[lang] || chip.label.fr}</span>
          </button>
        );
      })}
    </div>
  );
}