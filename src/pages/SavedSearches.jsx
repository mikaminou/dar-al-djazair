import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  Bell, BellOff, Trash2, Search, ChevronRight, SlidersHorizontal,
  MapPin, Home, DollarSign, BedDouble, Bath, Maximize2, Sofa, Star,
  Sparkles, ChevronDown
} from "lucide-react";
import SearchRecommendationsPanel from "../components/savedSearches/SearchRecommendationsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLang } from "../components/LanguageContext";
import { PROPERTY_TYPES } from "../components/constants";

function buildSearchUrl(filters) {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v && v !== "" && !(Array.isArray(v) && v.length === 0)) {
      params.set(k, Array.isArray(v) ? v.join(",") : v);
    }
  });
  return createPageUrl("Listings") + "?" + params.toString();
}

function FilterPill({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </span>
  );
}

function FilterSummary({ filters, lang }) {
  const pills = [];
  if (filters.listing_type) pills.push({ icon: Home, label: filters.listing_type === "sale" ? (lang === "ar" ? "للبيع" : lang === "fr" ? "À Vendre" : "For Sale") : (lang === "ar" ? "للإيجار" : lang === "fr" ? "À Louer" : "For Rent") });
  if (filters.wilaya) pills.push({ icon: MapPin, label: filters.wilaya });
  if (filters.property_type) {
    const pt = PROPERTY_TYPES.find(p => p.value === filters.property_type);
    pills.push({ icon: Home, label: pt?.label[lang] || filters.property_type });
  }
  if (filters.min_price || filters.max_price) {
    const range = [filters.min_price && `${Number(filters.min_price).toLocaleString()} DA`, filters.max_price && `${Number(filters.max_price).toLocaleString()} DA`].filter(Boolean).join(" – ");
    pills.push({ icon: DollarSign, label: range });
  }
  if (filters.min_bedrooms) pills.push({ icon: BedDouble, label: `${filters.min_bedrooms}+ ch.` });
  if (filters.min_bathrooms) pills.push({ icon: Bath, label: `${filters.min_bathrooms}+ sdb.` });
  if (filters.min_area) pills.push({ icon: Maximize2, label: `≥${filters.min_area} m²` });
  if (filters.furnished) pills.push({ icon: Sofa, label: filters.furnished });
  if (filters.features?.length) filters.features.forEach(f => pills.push({ icon: Star, label: f }));

  if (pills.length === 0) return <span className="text-xs text-gray-400">{lang === "ar" ? "كل الإعلانات" : lang === "fr" ? "Tous les biens" : "All listings"}</span>;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pills.map((p, i) => <FilterPill key={i} icon={p.icon} label={p.label} />)}
    </div>
  );
}

export default function SavedSearchesPage() {
  const { lang } = useLang();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchCounts, setMatchCounts] = useState({});
  const [openRecs, setOpenRecs] = useState({}); // { [searchId]: boolean }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setLoading(false); return; }
    const data = await base44.entities.SavedSearch.filter({ created_by: me.email }, "-created_date", 50);
    setSearches(data);
    setLoading(false);
    // count matching listings for each search in background
    data.forEach(async (s) => {
      const query = { status: "active" };
      if (s.filters?.listing_type)  query.listing_type  = s.filters.listing_type;
      if (s.filters?.property_type) query.property_type = s.filters.property_type;
      if (s.filters?.wilaya)        query.wilaya        = s.filters.wilaya;
      const results = await base44.entities.Listing.filter(query, "-created_date", 100).catch(() => []);
      const filtered = results.filter(l => {
        if (s.filters?.min_price && l.price < Number(s.filters.min_price)) return false;
        if (s.filters?.max_price && l.price > Number(s.filters.max_price)) return false;
        if (s.filters?.min_area  && l.area < Number(s.filters.min_area))   return false;
        if (s.filters?.furnished && l.furnished !== s.filters.furnished)    return false;
        if (s.filters?.min_bedrooms) {
          const min = s.filters.min_bedrooms === "5+" ? 5 : Number(s.filters.min_bedrooms);
          if ((l.bedrooms || 0) < min) return false;
        }
        if (s.filters?.min_bathrooms) {
          const min = s.filters.min_bathrooms === "4+" ? 4 : Number(s.filters.min_bathrooms);
          if ((l.bathrooms || 0) < min) return false;
        }
        if (s.filters?.features?.length) {
          if (!s.filters.features.every(f => (l.features || []).includes(f))) return false;
        }
        return true;
      });
      setMatchCounts(prev => ({ ...prev, [s.id]: filtered.length }));
    });
  }

  async function toggleAlert(search) {
    const updated = await base44.entities.SavedSearch.update(search.id, { alert_enabled: !search.alert_enabled });
    setSearches(prev => prev.map(s => s.id === search.id ? { ...s, alert_enabled: !s.alert_enabled } : s));
    // request browser notification permission when enabling alerts
    if (!search.alert_enabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  async function deleteSearch(id) {
    await base44.entities.SavedSearch.delete(id);
    setSearches(prev => prev.filter(s => s.id !== id));
  }

  const label = {
    title:    { en: "Saved Searches", fr: "Recherches sauvegardées", ar: "البحوث المحفوظة" },
    empty:    { en: "No saved searches yet.", fr: "Aucune recherche sauvegardée.", ar: "لا توجد بحوث محفوظة." },
    emptyHint:{ en: "Run a search and click «Save Search» to get started.", fr: "Lancez une recherche et cliquez «Sauvegarder» pour commencer.", ar: "ابدأ بحثاً وانقر على «حفظ البحث»." },
    results:  { en: "listings match", fr: "annonces correspondent", ar: "إعلان مطابق" },
    alert:    { en: "Alert", fr: "Alerte", ar: "تنبيه" },
    viewBtn:  { en: "View results", fr: "Voir les résultats", ar: "عرض النتائج" },
    noLogin:  { en: "Please sign in to view your saved searches.", fr: "Connectez-vous pour voir vos recherches.", ar: "سجل الدخول لعرض بحوثك المحفوظة." },
  };
  const l = (k) => label[k]?.[lang] || label[k]?.en;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{l("title")}</h1>
            <p className="text-sm text-gray-500">{searches.length} {lang === "ar" ? "بحث محفوظ" : lang === "fr" ? "recherche(s)" : "search(es)"}</p>
          </div>
        </div>

        {searches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">{l("empty")}</p>
            <p className="text-sm text-gray-400 mb-5">{l("emptyHint")}</p>
            <a href={createPageUrl("Listings")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Search className="w-4 h-4" /> {lang === "ar" ? "ابحث الآن" : lang === "fr" ? "Rechercher" : "Search now"}
              </Button>
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{s.name || (lang === "ar" ? "بحث محفوظ" : lang === "fr" ? "Recherche" : "Saved Search")}</p>
                    <FilterSummary filters={s.filters} lang={lang} />
                    {matchCounts[s.id] !== undefined && (
                      <p className="text-xs text-emerald-700 font-medium mt-2">
                        🏠 {matchCounts[s.id]} {l("results")}
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteSearch(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4 flex-wrap gap-2">
                  {/* Alert toggle */}
                  <div className="flex items-center gap-2">
                    {s.alert_enabled
                      ? <Bell className="w-4 h-4 text-emerald-600" />
                      : <BellOff className="w-4 h-4 text-gray-400" />}
                    <span className={`text-sm font-medium ${s.alert_enabled ? "text-emerald-700" : "text-gray-400"}`}>
                      {l("alert")}
                    </span>
                    <Switch
                      checked={!!s.alert_enabled}
                      onCheckedChange={() => toggleAlert(s)}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Recommendations button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenRecs(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                      className="gap-1 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {lang === "ar" ? "مقترحات" : lang === "fr" ? "Recommandations" : "Check matches"}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openRecs[s.id] ? "rotate-180" : ""}`} />
                    </Button>

                    {/* View results */}
                    <a href={buildSearchUrl(s.filters)}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs border-gray-200 text-gray-600 hover:bg-gray-50">
                        {l("viewBtn")} <ChevronRight className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Recommendations panel */}
                {openRecs[s.id] && (
                  <div className="border-t border-gray-50 pt-3 mt-2">
                    <SearchRecommendationsPanel search={s} lang={lang} />
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