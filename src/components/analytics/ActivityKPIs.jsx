import React from "react";
import { MessageSquare, Eye, Users, Calendar, TrendingUp, MessageCircle } from "lucide-react";

export default function ActivityKPIs({ data, lang }) {
  const { leads, sentMessages, receivedMessages, appointments, listings } = data;

  const totalViews     = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);
  const wonLeads       = leads.filter(l => l.status === "won").length;
  const convRate       = leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;
  const confirmedAppts = appointments.filter(a => a.status === "confirmed").length;
  const cancelledAppts = appointments.filter(a => a.status === "cancelled").length;

  const T = {
    totalLeads:  { en: "Total Leads",       fr: "Leads Totaux",       ar: "إجمالي العملاء"     },
    wonLeads:    { en: "Won Leads",         fr: "Leads Gagnés",       ar: "عملاء ناجحون"        },
    convRate:    { en: "Win Rate",          fr: "Taux de gain",       ar: "معدل الفوز"          },
    totalViews:  { en: "Total Views",       fr: "Vues Totales",       ar: "إجمالي المشاهدات"   },
    msgSent:     { en: "Messages Sent",     fr: "Msgs Envoyés",       ar: "رسائل مرسلة"         },
    msgReceived: { en: "Messages Received", fr: "Msgs Reçus",         ar: "رسائل مستلمة"        },
    apptConf:    { en: "Confirmed Appts",   fr: "RDV Confirmés",      ar: "مواعيد مؤكدة"        },
    apptCanc:    { en: "Cancelled Appts",   fr: "RDV Annulés",        ar: "مواعيد ملغاة"        },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  const kpis = [
    { label: t("totalLeads"),  value: leads.length,           color: "text-blue-600",    bg: "bg-blue-50",    Icon: Users         },
    { label: t("wonLeads"),    value: wonLeads,                color: "text-emerald-600", bg: "bg-emerald-50", Icon: TrendingUp     },
    { label: t("convRate"),    value: `${convRate}%`,          color: "text-amber-600",   bg: "bg-amber-50",   Icon: TrendingUp     },
    { label: t("totalViews"),  value: totalViews,              color: "text-indigo-600",  bg: "bg-indigo-50",  Icon: Eye            },
    { label: t("msgSent"),     value: sentMessages.length,     color: "text-purple-600",  bg: "bg-purple-50",  Icon: MessageSquare  },
    { label: t("msgReceived"), value: receivedMessages.length, color: "text-pink-600",    bg: "bg-pink-50",    Icon: MessageCircle  },
    { label: t("apptConf"),    value: confirmedAppts,          color: "text-green-600",   bg: "bg-green-50",   Icon: Calendar       },
    { label: t("apptCanc"),    value: cancelledAppts,          color: "text-red-600",     bg: "bg-red-50",     Icon: Calendar       },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {kpis.map(({ label, value, color, bg, Icon }) => (
        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 mt-1 leading-tight">{label}</div>
        </div>
      ))}
    </div>
  );
}