import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, Users, TrendingUp, MessageSquare, CheckCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";

const STATUS_COLORS = { new: "#3b82f6", contacted: "#f59e0b", viewing: "#a855f7", closed: "#6b7280" };
const STATUS_LABELS = {
  new:       { en: "New",       fr: "Nouveau",  ar: "جديد"       },
  contacted: { en: "Contacted", fr: "Contacté", ar: "تم التواصل"  },
  viewing:   { en: "Viewing",   fr: "Visite",   ar: "معاينة"      },
  closed:    { en: "Closed",    fr: "Clôturé",  ar: "مغلق"       },
};

export default function ListingAnalyticsPage() {
  const { lang } = useLang();
  const [listing, setListing] = useState(null);
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id");

  useEffect(() => { if (listingId) load(); }, [listingId]);

  async function load() {
    setLoading(true);
    const [listingData, leadsData, messagesData] = await Promise.all([
      base44.entities.Listing.filter({ id: listingId }).then(r => r[0]).catch(() => null),
      base44.entities.Lead.filter({ listing_id: listingId }, "-created_date", 200).catch(() => []),
      base44.entities.Message.filter({ listing_id: listingId }, "-created_date", 500).catch(() => []),
    ]);
    setListing(listingData);
    setLeads(leadsData);
    setMessages(messagesData);
    setLoading(false);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <p>{lang === "ar" ? "الإعلان غير موجود" : lang === "fr" ? "Annonce introuvable" : "Listing not found"}</p>
    </div>
  );

  const leadsByStatus = ["new", "contacted", "viewing", "closed"].map(s => ({
    status: s,
    count: leads.filter(l => l.status === s).length,
    label: STATUS_LABELS[s][lang] || STATUS_LABELS[s].en,
    color: STATUS_COLORS[s],
  }));

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round(((listing.views_count || 0) > 0 ? (totalLeads / (listing.views_count || 1)) * 100 : 0)) : 0;

  // Messages per day (last 14 days)
  const now = new Date();
  const msgByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString();
    const count = messages.filter(m => new Date(m.created_date).toLocaleDateString() === key).length;
    return { day: d.toLocaleDateString(lang === "ar" ? "ar" : lang === "fr" ? "fr-FR" : "en", { weekday: "short" }), count };
  });

  const T = {
    title:      { en: "Analytics", fr: "Analytiques", ar: "التحليلات" },
    views:      { en: "Total Views", fr: "Vues totales", ar: "إجمالي المشاهدات" },
    totalLeads: { en: "Total Leads", fr: "Total Leads", ar: "إجمالي العملاء" },
    conversion: { en: "Lead Conversion", fr: "Taux de conversion", ar: "معدل التحويل" },
    totalMsgs:  { en: "Messages", fr: "Messages", ar: "الرسائل" },
    funnel:     { en: "Lead Funnel", fr: "Entonnoir des leads", ar: "قمع العملاء" },
    msgActivity:{ en: "Message Activity (7 days)", fr: "Activité messages (7 jours)", ar: "نشاط الرسائل (7 أيام)" },
    backTo:     { en: "Back to listings", fr: "Retour aux annonces", ar: "العودة للإعلانات" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to={createPageUrl("MyListings")} className="flex items-center gap-2 text-emerald-200 hover:text-white text-sm mb-3 w-fit">
            <ArrowLeft className="w-4 h-4" /> {t("backTo")}
          </Link>
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-emerald-300" />
            <div>
              <h1 className="text-xl font-bold">{t("title")}</h1>
              <p className="text-emerald-200 text-sm truncate max-w-xs">{listing.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: t("views"), value: listing.views_count || 0, color: "text-blue-600", bg: "bg-blue-50" },
            { icon: Users, label: t("totalLeads"), value: totalLeads, color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: TrendingUp, label: t("conversion"), value: `${conversionRate}%`, color: "text-amber-600", bg: "bg-amber-50" },
            { icon: MessageSquare, label: t("totalMsgs"), value: messages.length, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lead Funnel */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" /> {t("funnel")}
            </h2>
            {totalLeads === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <Users className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">{lang === "ar" ? "لا يوجد عملاء بعد" : lang === "fr" ? "Aucun lead encore" : "No leads yet"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leadsByStatus.map(({ status, count, label, color }) => (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="font-bold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: totalLeads > 0 ? `${(count / totalLeads) * 100}%` : "0%", backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> {t("msgActivity")}
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={msgByDay} barSize={20}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {msgByDay.map((_, i) => <Cell key={i} fill="#059669" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent leads */}
        {leads.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">{lang === "ar" ? "العملاء المحتملون" : lang === "fr" ? "Leads récents" : "Recent Leads"}</h2>
            <div className="space-y-2">
              {leads.slice(0, 10).map(lead => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{lead.seeker_email?.split("@")[0]}</p>
                    <p className="text-xs text-gray-400">{new Date(lead.created_date).toLocaleDateString()}</p>
                  </div>
                  <Badge style={{ backgroundColor: STATUS_COLORS[lead.status] + "20", color: STATUS_COLORS[lead.status], border: "none" }}>
                    {STATUS_LABELS[lead.status]?.[lang] || lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}