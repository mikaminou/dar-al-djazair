import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { BarChart3, Calendar } from "lucide-react";
import ActivityKPIs from "../components/analytics/ActivityKPIs";
import FunnelChart from "../components/analytics/FunnelChart";
import LeadsTimeline from "../components/analytics/LeadsTimeline";
import TimeToConversionTable from "../components/analytics/TimeToConversionTable";
import MostViewedProperties from "../components/analytics/MostViewedProperties";

export default function OwnerDashboard() {
  const { lang } = useLang();
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }

    const [leads, sentMessages, receivedMessages, appointments, listings] = await Promise.all([
      base44.entities.Lead.filter({ agent_email: me.email }, "-created_date", 500),
      base44.entities.Message.filter({ sender_email: me.email }, "-created_date", 1000),
      base44.entities.Message.filter({ recipient_email: me.email }, "-created_date", 1000),
      base44.entities.Appointment.filter({ agent_email: me.email }, "-created_date", 500),
      base44.entities.Listing.filter({ created_by: me.email }, "-views_count", 100),
    ]);

    setData({ leads, sentMessages, receivedMessages, appointments, listings, me });
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!data?.me) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">{lang === "ar" ? "يرجى تسجيل الدخول" : lang === "fr" ? "Veuillez vous connecter" : "Please sign in to view your dashboard."}</p>
    </div>
  );

  const T = {
    title:   { en: "Analytics Dashboard",          fr: "Tableau de Bord",            ar: "لوحة التحليلات"         },
    sub:     { en: "Track your property performance",fr: "Performance de vos biens",  ar: "تحليل أدائك العقاري"   },
    weekly:  { en: "Weekly",                         fr: "Hebdo",                      ar: "أسبوعي"                },
    monthly: { en: "Monthly",                        fr: "Mensuel",                    ar: "شهري"                  },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-emerald-300" />
            <div>
              <h1 className="text-2xl font-bold">{t("title")}</h1>
              <p className="text-emerald-200 text-sm">{t("sub")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
            {["weekly", "monthly"].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${period === p ? "bg-white text-emerald-800" : "text-white/70 hover:text-white"}`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {t(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <ActivityKPIs data={data} lang={lang} />

        <div className="grid lg:grid-cols-2 gap-6">
          <FunnelChart leads={data.leads} lang={lang} />
          <MostViewedProperties listings={data.listings} lang={lang} />
        </div>

        <LeadsTimeline leads={data.leads} period={period} lang={lang} />

        <TimeToConversionTable leads={data.leads} lang={lang} />
      </div>
    </div>
  );
}