import React from "react";
import { Sparkles, Lock } from "lucide-react";
import { getFilterSchema, countActiveTypeFilters } from "../perTypeFilterSchema";
import { PROPERTY_TYPES } from "@/components/propertyTypes.config";
import FilterSection from "./FilterSection";

/**
 * The new, redesigned advanced-filter panel.
 * - Collapsible sections (Surfaces, Rooms, …) mirroring the per-type DB columns.
 * - First section auto-opens.
 * - Empty state when no property type selected.
 */
export default function PerTypeFilters({ propertyType, filters, onChange, lang = "fr" }) {
  const schema = propertyType ? getFilterSchema(propertyType) : null;
  const typeDef = PROPERTY_TYPES.find(pt => pt.value === propertyType);

  if (!propertyType || !schema) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-[#13161c] border border-dashed border-emerald-200 dark:border-emerald-800/50 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
          {lang === "ar" ? "اختر نوع العقار أولاً" : lang === "fr" ? "Choisissez d'abord un type de bien" : "Pick a property type first"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
          {lang === "ar"
            ? "ستظهر فلاتر مخصصة بناءً على نوع العقار الذي تختاره."
            : lang === "fr"
            ? "Des filtres personnalisés apparaîtront selon le type de bien choisi."
            : "Personalized filters will appear based on the property type you select."}
        </p>
      </div>
    );
  }

  const activeCount = countActiveTypeFilters(propertyType, filters);
  const handleFieldChange = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-3">
      {/* Header — confirms personalization */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {lang === "ar"
              ? `فلاتر مخصصة لـ ${typeDef?.label?.[lang] || typeDef?.label?.fr}`
              : lang === "fr"
              ? `Filtres pour ${typeDef?.label?.[lang] || typeDef?.label?.fr}`
              : `Filters for ${typeDef?.label?.[lang] || typeDef?.label?.fr}`}
          </span>
          <span className="text-base">{typeDef?.icon}</span>
        </div>
        {activeCount > 0 && (
          <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeCount} {lang === "ar" ? "نشط" : lang === "fr" ? "actif" : "active"}
          </span>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {schema.sections.map((section, idx) => (
          <FilterSection
            key={section.key}
            section={section}
            filters={filters}
            onChange={handleFieldChange}
            lang={lang}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}