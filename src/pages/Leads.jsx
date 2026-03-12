import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import {
  Users, ChevronRight, PhoneCall, XCircle, Inbox,
  Mail, UserCircle, MessageSquare, LayoutGrid, List, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import { PROPERTY_TYPES } from "../components/constants";
import LeadsKanban from "../components/leads/LeadsKanban";

function FilterPills({ filters, lang }) {
  const pills = [];
  if (filters?.listing_type) pills.push(filters.listing_type === "sale" ? (lang === "fr" ? "Vente" : lang === "ar" ? "بيع" : "Sale") : (lang === "fr" ? "Location" : lang === "ar" ? "إيجار" : "Rent"));
  if (filters?.wilaya) pills.push(`📍 ${filters.wilaya}`);
  if (filters?.property_type) {
    const pt = PROPERTY_TYPES.find(p => p.value === filters.property_type);
    if (pt) pills.push(pt.label[lang] || pt.label.fr);
  }
  if (filters?.min_price || filters?.max_price) {
    const r = [filters.min_price && `${Number(filters.min_price).toLocaleString()} DA`, filters.max_price && `${Number(filters.max_price).toLocaleString()} DA`].filter(Boolean).join(" – ");
    pills.push(`💰 ${r}`);
  }
  if (filters?.min_bedrooms) pills.push(`🛏 ${filters.min_bedrooms}+`);
  if (filters?.min_area) pills.push(`📐 ≥${filters.min_area}m²`);
  if (filters?.features?.length) filters.features.forEach(f => pills.push(`✓ ${f}`));
  if (pills.length === 0) return <span className="text-xs text-gray-400">{lang === "fr" ? "Tous types" : "All types"}</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p, i) => (
        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
      ))}
    </div>
  );
}

const STATUS_CONFIG = {
  new:       { label: { en: "New",       fr: "Nouveau",   ar: "جديد"        }, color: "bg-blue-100 text-blue-700"     },
  contacted: { label: { en: "Contacted", fr: "Contacté",  ar: "تم التواصل"   }, color: "bg-amber-100 text-amber-700"   },
  viewing:   { label: { en: "Viewing",   fr: "Visite",    ar: "معاينة"       }, color: "bg-purple-100 text-purple-700" },
  won:       { label: { en: "Won 🏆",    fr: "Gagné 🏆",  ar: "ناجح 🏆"      }, color: "bg-emerald-100 text-emerald-700"},
  lost:      { label: { en: "Lost",      fr: "Perdu",     ar: "فاشل"         }, color: "bg-red-100 text-red-600"       },
  closed:    { label: { en: "Closed",    fr: "Clôturé",   ar: "مغلق"        }, color: "bg-gray-100 text-gray-500"     },
};

export default function LeadsPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("new");
  const [view, setView] = useState("list");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    const data = await base44.entities.Lead.filter({ agent_email: me.email }, "-created_date", 200);
    setLeads(data);
    setLoading(false);
  }

  function openConversation(lead) {
    navigate(createPageUrl(`Messages?thread=${lead.listing_id}&contact=${encodeURIComponent(lead.seeker_email)}&lead=${lead.id}`));
  }

  async function updateStatus(lead, status) {
    await base44.entities.Lead.update(lead.id, { status });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status } : l));
  }

  const displayed = filter === "all" ? leads : leads.filter(l => l.status === filter);
  const counts = {
    new:       leads.filter(l => l.status === "new").length,
    contacted: leads.filter(l => l.status === "contacted").length,
    viewing:   leads.filter(l => l.status === "viewing").length,
    won:       leads.filter(l => l.status === "won").length,
    lost:      leads.filter(l => l.status === "lost" || l.status === "closed").length,
  };

  const T = {
    title:       { en: "My Leads",    fr: "Mes Leads",   ar: "العملاء المحتملون" },
    subtitle:    { en: "Buyers & renters who saved a search matching your listings", fr: "Acheteurs/locataires ayant sauvegardé une recherche correspondant à vos annonces", ar: "مشترون ومستأجرون حفظوا بحثاً يطابق إعلاناتك" },
    viewListing: { en: "View listing", fr: "Voir l'annonce", ar: "عرض الإعلان" },
    wants:       { en: "Looking for",  fr: "Cherche",        ar: "يبحث عن" },
    noLeads:     { en: "No leads yet", fr: "Pas encore de leads", ar: "لا توجد عملاء محتملون بعد" },
    noLeadsSub:  { en: "When buyers save searches matching your listings, they'll appear here.", fr: "Quand des acheteurs sauvegardent une recherche correspondant à vos annonces, ils apparaîtront ici.", ar: "عندما يحفظ المشترون بحثاً يطابق إعلاناتك، سيظهرون هنا." },
    all:         { en: "All",          fr: "Tous",           ar: "الكل" },
    markClosed:  { en: "Close",        fr: "Clôturer",       ar: "إغلاق" },
    markViewing: { en: "Viewing",      fr: "Visite",         ar: "معاينة" },
    viewProfile: { en: "View Profile", fr: "Voir profil",    ar: "الملف الشخصي" },
    sendMsg:     { en: "Message",      fr: "Message",        ar: "مراسلة" },
    listView:    { en: "List",         fr: "Liste",          ar: "قائمة" },
    kanbanView:  { en: "Kanban",       fr: "Kanban",         ar: "كانبان" },
  };
  const t = k => T[k]?.[lang] || T[k]?.en;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Users className="w-6 h-6 text-emerald-300" />
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            {counts.new > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{counts.new}</span>
            )}
          </div>
          <p className="text-emerald-200 text-sm">{t("subtitle")}</p>
          <div className="flex gap-3 mt-4 flex-wrap">
            {["new", "contacted", "viewing", "won", "lost"].map(s => (
              <div key={s} className="bg-white/10 rounded-lg px-3 py-1 text-sm">
                <span className="font-bold">{counts[s]}</span>
                <span className="text-emerald-200 ml-1">{STATUS_CONFIG[s].label[lang]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          {view === "list" && (
            <div className="flex gap-2 flex-wrap">
              {["new", "contacted", "viewing", "won", "lost", "all"].map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === s ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-400"
                  }`}
                >
                  {s === "all" ? t("all") : STATUS_CONFIG[s].label[lang]}
                  {s !== "all" && <span className="ml-1.5 opacity-70">({counts[s]})</span>}
                </button>
              ))}
            </div>
          )}
          {view === "kanban" && <div />}

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "list" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4" /> {t("listView")}
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "kanban" ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <LayoutGrid className="w-4 h-4" /> {t("kanbanView")}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white h-28 rounded-xl animate-pulse border" />)}
          </div>
        ) : view === "kanban" ? (
          <LeadsKanban leads={leads} onStatusChange={updateStatus} onMessage={openConversation} lang={lang} />
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">{t("noLeads")}</p>
            <p className="text-sm mt-1">{t("noLeadsSub")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(lead => (
              <div key={lead.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={STATUS_CONFIG[lead.status]?.color}>
                        {STATUS_CONFIG[lead.status]?.label[lang]}
                      </Badge>
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {lead.listing_title || lead.listing_id}
                      </span>
                      {lead.listing_wilaya && (
                        <span className="text-xs text-gray-400">📍 {lead.listing_wilaya}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <a href={`mailto:${lead.seeker_email}`} className="flex items-center gap-1 text-xs text-emerald-700 hover:underline font-medium">
                        <Mail className="w-3 h-3" /> {lead.seeker_email}
                      </a>
                      {lead.search_name && <span className="text-xs text-gray-400">— "{lead.search_name}"</span>}
                    </div>
                    <div className="text-xs text-gray-500 mb-1.5 font-medium">{t("wants")}:</div>
                    <FilterPills filters={lead.search_filters} lang={lang} />
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Button size="sm" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openConversation(lead)}>
                      <MessageSquare className="w-3 h-3" /> {t("sendMsg")}
                    </Button>
                    <Link to={createPageUrl(`Profile?email=${encodeURIComponent(lead.seeker_email)}`)}>
                      <Button variant="outline" size="sm" className="text-xs gap-1 w-full">
                        <UserCircle className="w-3 h-3" /> {t("viewProfile")}
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`ListingDetail?id=${lead.listing_id}`)}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1 w-full text-gray-500">
                        {t("viewListing")} <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {!["won", "lost"].includes(lead.status) && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50 flex-wrap">
                    {lead.status === "new" && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => updateStatus(lead, "contacted")}>
                        <PhoneCall className="w-3 h-3" /> {STATUS_CONFIG.contacted.label[lang]}
                      </Button>
                    )}
                    {(lead.status === "new" || lead.status === "contacted") && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => updateStatus(lead, "viewing")}>
                        <Eye className="w-3 h-3" /> {t("markViewing")}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => updateStatus(lead, "won")}>
                      🏆 {STATUS_CONFIG.won.label[lang]}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus(lead, "lost")}>
                      <XCircle className="w-3 h-3" /> {STATUS_CONFIG.lost.label[lang]}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}