import React from "react";
import { Users, TrendingDown } from "lucide-react";

// Funnel uses "cumulative" counts: how many leads reached AT LEAST this stage.
const STAGES = [
  {
    key: "new",
    statuses: ["new", "contacted", "viewing", "won", "lost", "closed"],
    color: "#3b82f6",
    label: { en: "New (all leads)", fr: "Nouveaux (tous)", ar: "جديد (الكل)" },
  },
  {
    key: "contacted",
    statuses: ["contacted", "viewing", "won"],
    color: "#f59e0b",
    label: { en: "Contacted",       fr: "Contactés",       ar: "تم التواصل" },
  },
  {
    key: "viewing",
    statuses: ["viewing", "won"],
    color: "#a855f7",
    label: { en: "Viewing",         fr: "En visite",       ar: "في معاينة"  },
  },
  {
    key: "won",
    statuses: ["won"],
    color: "#059669",
    label: { en: "Won",             fr: "Gagnés",          ar: "ناجحون"     },
  },
];

export default function FunnelChart({ leads, lang }) {
  const stages = STAGES.map(s => ({
    ...s,
    count: leads.filter(l => s.statuses.includes(l.status)).length,
  }));

  const maxCount = stages[0].count || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-600" />
        {lang === "ar" ? "قمع التحويل" : lang === "fr" ? "Entonnoir de Conversion" : "Lead Conversion Funnel"}
      </h2>
      <p className="text-xs text-gray-400 mb-5">
        {lang === "ar" ? "نسبة التسرب بين كل مرحلة" : lang === "fr" ? "Taux de décrochage entre chaque étape" : "Drop-off rate between each stage"}
      </p>

      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <Users className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">{lang === "ar" ? "لا يوجد عملاء بعد" : lang === "fr" ? "Aucun lead encore" : "No leads yet"}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {stages.map((stage, i) => {
            const pct = Math.round((stage.count / maxCount) * 100);
            const prev = stages[i - 1];
            const dropoffPct = prev && prev.count > 0
              ? Math.round(((prev.count - stage.count) / prev.count) * 100)
              : null;

            return (
              <div key={stage.key}>
                {dropoffPct !== null && (
                  <div className="flex items-center gap-1.5 py-1 pl-1">
                    <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-400 font-medium">
                      {dropoffPct}% {lang === "fr" ? "de perte" : lang === "ar" ? "تسرب" : "drop-off"}
                      <span className="text-gray-400 font-normal ml-1">({prev.count - stage.count} {lang === "fr" ? "leads" : lang === "ar" ? "عملاء" : "leads"})</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-28 text-xs font-medium text-gray-600 text-right flex-shrink-0 leading-tight">
                    {stage.label[lang] || stage.label.en}
                  </div>
                  <div className="flex-1 h-10 bg-gray-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end pr-3 transition-all duration-700"
                      style={{
                        width: `${Math.max(pct, 6)}%`,
                        backgroundColor: stage.color,
                      }}
                    >
                      <span className="text-white text-sm font-bold">{stage.count}</span>
                    </div>
                  </div>
                  <div className="w-10 text-xs text-gray-400 flex-shrink-0 font-medium">{pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}