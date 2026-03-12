import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, startOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns";

export default function LeadsTimeline({ leads, period, lang }) {
  const data = useMemo(() => {
    const now = new Date();
    if (period === "weekly") {
      return Array.from({ length: 8 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
        const weekEnd   = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return {
          label: format(weekStart, "dd MMM"),
          leads: leads.filter(l => {
            const d = new Date(l.created_date);
            return d >= weekStart && d < weekEnd;
          }).length,
        };
      });
    } else {
      return Array.from({ length: 12 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(now, 11 - i));
        const monthEnd   = startOfMonth(subMonths(now, 10 - i));
        return {
          label: format(monthStart, "MMM yy"),
          leads: leads.filter(l => {
            const d = new Date(l.created_date);
            return d >= monthStart && d < monthEnd;
          }).length,
        };
      });
    }
  }, [leads, period]);

  const leadsLabel = lang === "fr" ? "Leads" : lang === "ar" ? "عملاء" : "Leads";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        {lang === "ar" ? "العملاء عبر الزمن" : lang === "fr" ? "Leads au fil du temps" : "Leads Over Time"}
      </h2>
      <p className="text-xs text-gray-400 mb-5">
        {period === "weekly"
          ? (lang === "ar" ? "آخر 8 أسابيع" : lang === "fr" ? "8 dernières semaines" : "Last 8 weeks")
          : (lang === "ar" ? "آخر 12 شهراً" : lang === "fr" ? "12 derniers mois" : "Last 12 months")}
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={period === "weekly" ? 32 : 24}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            cursor={{ fill: "#f0fdf4" }}
          />
          <Bar dataKey="leads" fill="#059669" radius={[4, 4, 0, 0]} name={leadsLabel} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}