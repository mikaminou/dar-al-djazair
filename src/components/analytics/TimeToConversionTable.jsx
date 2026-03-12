import React from "react";
import { Clock } from "lucide-react";

export default function TimeToConversionTable({ leads, lang }) {
  const wonLeads = leads.filter(l => l.status === "won");

  // Group by listing_id and compute avg days (created_date → updated_date as proxy)
  const byListing = {};
  wonLeads.forEach(lead => {
    const days = Math.max(
      0,
      Math.round((new Date(lead.updated_date) - new Date(lead.created_date)) / 86_400_000)
    );
    if (!byListing[lead.listing_id]) {
      byListing[lead.listing_id] = {
        title: lead.listing_title || `#${lead.listing_id}`,
        days: [],
      };
    }
    byListing[lead.listing_id].days.push(days);
  });

  const rows = Object.entries(byListing)
    .map(([id, r]) => ({
      id,
      title: r.title,
      count: r.days.length,
      avg:   Math.round(r.days.reduce((a, b) => a + b, 0) / r.days.length),
      min:   Math.min(...r.days),
      max:   Math.max(...r.days),
    }))
    .sort((a, b) => a.avg - b.avg);

  const maxAvg = Math.max(...rows.map(r => r.avg), 1);

  const T = {
    title:    { en: "Time to Conversion",       fr: "Durée de Conversion",          ar: "وقت التحويل"                },
    sub:      { en: "Avg. days from lead creation to Won, by property",
                fr: "Jours moyens entre la création du lead et 'Gagné', par bien",
                ar: "متوسط الأيام من إنشاء العميل إلى الفوز — حسب العقار"          },
    property: { en: "Property",                  fr: "Bien",                         ar: "العقار"                     },
    won:      { en: "Won",                        fr: "Gagnés",                       ar: "فائزون"                     },
    avgDays:  { en: "Avg. Days",                  fr: "Jours moy.",                   ar: "متوسط الأيام"               },
    range:    { en: "Range",                       fr: "Intervalle",                   ar: "المدى"                      },
    noData:   { en: "No won leads yet",            fr: "Aucun lead gagné pour l'instant", ar: "لا يوجد عملاء ناجحون بعد" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-600" />
        {t("title")}
      </h2>
      <p className="text-xs text-gray-400 mb-5">{t("sub")}</p>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <Clock className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">{t("noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium text-xs">{t("property")}</th>
                <th className="text-center py-2 pr-4 text-gray-500 font-medium text-xs w-16">{t("won")}</th>
                <th className="text-left py-2 text-gray-500 font-medium text-xs w-64">{t("avgDays")}</th>
                <th className="text-right py-2 text-gray-500 font-medium text-xs w-24">{t("range")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-gray-800 font-medium max-w-xs truncate">{row.title}</td>
                  <td className="py-3 pr-4 text-center">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{row.count}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${(row.avg / maxAvg) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-700 font-bold text-xs w-12 text-right flex-shrink-0">
                        {row.avg}d
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-xs text-gray-400">{row.min}d – {row.max}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}