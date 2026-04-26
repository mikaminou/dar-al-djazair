import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

/**
 * WilayaMultiSelect
 * Props:
 *  - options: Array of { value: string, label: { en, fr, ar } }
 *  - value: string[]
 *  - onChange: (values: string[]) => void
 *  - lang: "en" | "fr" | "ar"
 *  - placeholder?: string
 */
export default function WilayaMultiSelect({ options = [], value = [], onChange, lang = "fr", placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const getLabel = (opt) => opt.label[lang] || opt.label.fr || opt.value;

  const filtered = options.filter(opt =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter(v => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const remove = (val, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== val));
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const ph = placeholder || (lang === "ar" ? "اختر الولايات..." : lang === "fr" ? "Sélectionner les wilayas..." : "Select wilayas...");

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className="min-h-[38px] w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1d24] rounded-md px-3 py-1.5 flex flex-wrap gap-1.5 items-center cursor-pointer"
      >
        {value.length === 0 ? (
          <span className="text-sm text-gray-400 dark:text-gray-500 select-none">{ph}</span>
        ) : (
          value.map(v => {
            const opt = options.find(o => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium px-2 py-0.5 rounded-full"
              >
                {opt ? getLabel(opt) : v}
                <button
                  type="button"
                  onClick={(e) => remove(v, e)}
                  className="hover:text-red-500 leading-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === "ar" ? "بحث..." : lang === "fr" ? "Rechercher..." : "Search..."}
              className="w-full text-sm px-2 py-1 rounded bg-gray-50 dark:bg-[#13161c] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                {lang === "ar" ? "لا توجد نتائج" : lang === "fr" ? "Aucun résultat" : "No results"}
              </li>
            ) : filtered.map(opt => {
              const selected = value.includes(opt.value);
              return (
                <li
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
                    selected
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#13161c]"
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    selected
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {selected && "✓"}
                  </span>
                  {getLabel(opt)}
                </li>
              );
            })}
          </ul>
          {value.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700"
              >
                {lang === "ar" ? "مسح الكل" : lang === "fr" ? "Tout effacer" : "Clear all"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}