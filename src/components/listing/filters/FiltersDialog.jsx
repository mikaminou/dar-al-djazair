import React, { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFilterSchema, countActiveTypeFilters } from "../perTypeFilterSchema";
import { PROPERTY_TYPES } from "@/components/propertyTypes.config";
import RangeField from "./RangeField";
import MinCountField from "./MinCountField";
import BooleanToggle from "./BooleanToggle";
import FilterChipGroup from "./FilterChipGroup";

function isFieldVisible(field, filters) {
  if (!field.dependsOn) return true;
  const { key, value } = field.dependsOn;
  return filters[key] === value || filters[key] === String(value);
}

function countSection(section, filters) {
  let n = 0;
  for (const f of section.fields) {
    if (f.type === "range" || f.type === "min") {
      if (filters[`min_${f.key}`]) n++;
      if (f.type === "range" && filters[`max_${f.key}`]) n++;
    } else if (f.type === "multi_enum") {
      const v = filters[f.key];
      if (Array.isArray(v) ? v.length > 0 : !!v) n++;
    } else {
      if (filters[f.key] !== undefined && filters[f.key] !== "" && filters[f.key] !== null) n++;
    }
  }
  return n;
}

function renderField(field, filters, onChange, lang) {
  if (field.type === "range") return <RangeField field={field} filters={filters} onChange={onChange} lang={lang} />;
  if (field.type === "min")   return <MinCountField field={field} filters={filters} onChange={onChange} lang={lang} />;
  if (field.type === "enum") {
    return (
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1.5 block">
          {field.label?.[lang] || field.label?.fr}
        </label>
        <FilterChipGroup options={field.options} value={filters[field.key] || ""} onChange={v => onChange(field.key, v)} lang={lang} />
      </div>
    );
  }
  if (field.type === "multi_enum") {
    return (
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1.5 block">
          {field.label?.[lang] || field.label?.fr}
        </label>
        <FilterChipGroup options={field.options} value={filters[field.key]} onChange={v => onChange(field.key, v)} multi lang={lang} />
      </div>
    );
  }
  return null;
}

export default function FiltersDialog({ open, onOpenChange, propertyType, filters, onChange, onClear, lang = "fr" }) {
  const schema = propertyType ? getFilterSchema(propertyType) : null;
  const typeDef = PROPERTY_TYPES.find(pt => pt.value === propertyType);
  const sections = schema?.sections || [];

  const [activeKey, setActiveKey] = useState(sections[0]?.key);
  useEffect(() => { if (sections[0] && !sections.find(s => s.key === activeKey)) setActiveKey(sections[0].key); }, [sections, activeKey]);

  const activeSection = useMemo(() => sections.find(s => s.key === activeKey) || sections[0], [sections, activeKey]);
  const activeCount = countActiveTypeFilters(propertyType, filters);
  const handleFieldChange = (key, val) => onChange({ ...filters, [key]: val });

  const visibleFields = activeSection ? activeSection.fields.filter(f => isFieldVisible(f, filters)) : [];
  const booleans = visibleFields.filter(f => f.type === "boolean");
  const others   = visibleFields.filter(f => f.type !== "boolean");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            {lang === "ar" ? "الفلاتر" : lang === "fr" ? "Filtres" : "Filters"}
            {activeCount > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full align-middle">
                {activeCount}
              </span>
            )}
          </DialogTitle>
          <button onClick={() => onOpenChange(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        {!schema ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
              {lang === "ar" ? "اختر نوع العقار أولاً" : lang === "fr" ? "Choisissez d'abord un type de bien" : "Pick a property type first"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              {lang === "ar" ? "ستظهر فلاتر مخصصة." : lang === "fr" ? "Des filtres personnalisés apparaîtront." : "Personalized filters will appear."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Left nav */}
            <div className="w-44 sm:w-52 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0f1115] overflow-y-auto py-2 flex-shrink-0">
              <div className="px-3 py-2 mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-3 h-3" />
                <span className="truncate">{typeDef?.label?.[lang] || typeDef?.label?.fr} {typeDef?.icon}</span>
              </div>
              {sections.map(s => {
                const c = countSection(s, filters);
                const active = s.key === activeKey;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveKey(s.key)}
                    className={`w-full text-left px-3 py-2.5 text-sm font-medium flex items-center justify-between transition-colors border-l-2 ${
                      active
                        ? "bg-white dark:bg-[#13161c] text-emerald-700 dark:text-emerald-400 border-emerald-600"
                        : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-white/60 dark:hover:bg-[#13161c]/60"
                    }`}
                  >
                    <span className="truncate">{s.label?.[lang] || s.label?.fr}</span>
                    {c > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full leading-none ml-1.5 flex-shrink-0">
                        {c}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {others.map(f => <div key={f.key}>{renderField(f, filters, handleFieldChange, lang)}</div>)}
              {booleans.length > 0 && (
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-2 block">
                    {lang === "ar" ? "خيارات" : lang === "fr" ? "Options" : "Options"}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {booleans.map(f => <BooleanToggle key={f.key} field={f} filters={filters} onChange={handleFieldChange} lang={lang} />)}
                  </div>
                </div>
              )}
              {visibleFields.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  {lang === "ar" ? "لا توجد فلاتر هنا." : lang === "fr" ? "Aucun filtre ici." : "No filters here."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-between bg-white dark:bg-[#13161c]">
          <button
            onClick={onClear}
            disabled={activeCount === 0}
            className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
          >
            {lang === "ar" ? "مسح الكل" : lang === "fr" ? "Tout effacer" : "Clear all"}
          </button>
          <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
            {lang === "ar" ? "تطبيق" : lang === "fr" ? "Appliquer" : "Apply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}