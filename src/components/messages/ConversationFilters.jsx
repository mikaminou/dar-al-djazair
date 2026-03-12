import React from "react";

const FILTERS = [
  { value: "all",      label: { en: "All",      fr: "Tous",     ar: "الكل"    } },
  { value: "open",     label: { en: "Active",   fr: "Actifs",   ar: "نشطة"    } },
  { value: "closed",   label: { en: "Closed",   fr: "Fermés",   ar: "مغلقة"   } },
  { value: "archived", label: { en: "Archived", fr: "Archivés", ar: "أرشيف"   } },
];

export default function ConversationFilters({ filter, onChange, lang }) {
  return (
    <div className="flex gap-1 px-3 py-2 border-b border-gray-100 overflow-x-auto scrollbar-none">
      {FILTERS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap
            ${filter === o.value
              ? "bg-emerald-100 text-emerald-700 font-semibold"
              : "text-gray-500 hover:bg-gray-100"}`}
        >
          {o.label[lang] || o.label.en}
        </button>
      ))}
    </div>
  );
}