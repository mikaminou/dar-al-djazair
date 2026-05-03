import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import RangeField from "./RangeField";
import MinCountField from "./MinCountField";
import BooleanToggle from "./BooleanToggle";
import FilterChipGroup from "./FilterChipGroup";

function isFieldVisible(field, filters) {
  if (!field.dependsOn) return true;
  const { key, value } = field.dependsOn;
  return filters[key] === value || filters[key] === String(value);
}

function renderField(field, filters, onChange, lang) {
  if (field.type === "range") {
    return <RangeField field={field} filters={filters} onChange={onChange} lang={lang} />;
  }
  if (field.type === "min") {
    return <MinCountField field={field} filters={filters} onChange={onChange} lang={lang} />;
  }
  if (field.type === "enum") {
    return (
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1.5 block">
          {field.label?.[lang] || field.label?.fr}
        </label>
        <FilterChipGroup
          options={field.options}
          value={filters[field.key] || ""}
          onChange={v => onChange(field.key, v)}
          lang={lang}
        />
      </div>
    );
  }
  if (field.type === "multi_enum") {
    return (
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold mb-1.5 block">
          {field.label?.[lang] || field.label?.fr}
        </label>
        <FilterChipGroup
          options={field.options}
          value={filters[field.key]}
          onChange={v => onChange(field.key, v)}
          multi
          lang={lang}
        />
      </div>
    );
  }
  return null;
}

/**
 * Collapsible section. Booleans are grouped together at the bottom of the
 * section as a single chip cloud for density. Other fields render full-width.
 */
export default function FilterSection({ section, filters, onChange, lang, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);

  const visibleFields = section.fields.filter(f => isFieldVisible(f, filters));
  if (visibleFields.length === 0) return null;

  const booleans = visibleFields.filter(f => f.type === "boolean");
  const others   = visibleFields.filter(f => f.type !== "boolean");

  // Active count for this section
  const activeCount = visibleFields.reduce((acc, f) => {
    if (f.type === "range" || f.type === "min") {
      if (filters[`min_${f.key}`]) acc++;
      if (f.type === "range" && filters[`max_${f.key}`]) acc++;
    } else if (f.type === "multi_enum") {
      const v = filters[f.key];
      if (Array.isArray(v) ? v.length > 0 : !!v) acc++;
    } else {
      if (filters[f.key] !== undefined && filters[f.key] !== "" && filters[f.key] !== null) acc++;
    }
    return acc;
  }, 0);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#13161c] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {section.label?.[lang] || section.label?.fr}
          </span>
          {activeCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-800">
          {others.map(field => (
            <div key={field.key}>{renderField(field, filters, onChange, lang)}</div>
          ))}

          {booleans.length > 0 && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-1.5">
                {booleans.map(field => (
                  <BooleanToggle
                    key={field.key}
                    field={field}
                    filters={filters}
                    onChange={onChange}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}