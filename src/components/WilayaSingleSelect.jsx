import React, { useState, useRef, useEffect } from "react";
import { WILAYAS } from "./constants";
import { ChevronDown, Search, X } from "lucide-react";

export default function WilayaSingleSelect({ value, onChange, lang, placeholder, className = "", hasError = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = WILAYAS.find(w => w.value === value);
  const label = w => w.label[lang] || w.label.fr;
  const filtered = WILAYAS.filter(w => label(w).toLowerCase().includes(search.toLowerCase()) || w.value.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const inputCls = "bg-white text-gray-900 dark:bg-[#1a1d24] dark:border-gray-700 dark:text-gray-100";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm h-9 ${inputCls} ${hasError ? "border-red-400" : "border-input"} focus:outline-none focus:ring-1 focus:ring-emerald-500`}
      >
        <span className={selected ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}>
          {selected ? label(selected) : (placeholder || "...")}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange(""); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#1a1d24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 dark:bg-[#0f1115] rounded-md">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === "ar" ? "بحث..." : lang === "fr" ? "Rechercher..." : "Search..."}
                className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">{lang === "ar" ? "لا توجد نتائج" : lang === "fr" ? "Aucun résultat" : "No results"}</p>
            ) : filtered.map(w => (
              <button
                key={w.value}
                type="button"
                onClick={() => { onChange(w.value); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${w.value === value ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium" : "text-gray-700 dark:text-gray-200"}`}
              >
                {label(w)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}