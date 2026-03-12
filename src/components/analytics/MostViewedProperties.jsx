import React from "react";
import { Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#e0f2fe", "#f0f9ff", "#f8fafc"];

export default function MostViewedProperties({ listings, lang }) {
  const top = [...listings]
    .filter(l => (l.views_count || 0) > 0)
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 7)
    .map(l => ({
      name:  l.title?.length > 22 ? l.title.slice(0, 22) + "…" : (l.title || "—"),
      views: l.views_count || 0,
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Eye className="w-4 h-4 text-blue-600" />
        {lang === "ar" ? "الإعلانات الأكثر مشاهدة" : lang === "fr" ? "Biens les plus consultés" : "Most Viewed Properties"}
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        {lang === "ar" ? "أعلى 7 إعلانات" : lang === "fr" ? "Top 7 par vues" : "Top 7 by view count"}
      </p>

      {top.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <Eye className="w-10 h-10 mb-2 opacity-30" />
          <p className="text-sm">
            {lang === "ar" ? "لا توجد مشاهدات بعد" : lang === "fr" ? "Aucune vue pour l'instant" : "No views yet"}
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={top} layout="vertical" barSize={18} margin={{ left: 0, right: 16 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              cursor={{ fill: "#f0f9ff" }}
            />
            <Bar dataKey="views" radius={[0, 4, 4, 0]} name={lang === "fr" ? "Vues" : lang === "ar" ? "مشاهدات" : "Views"}>
              {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}