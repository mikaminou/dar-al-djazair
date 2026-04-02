import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useLang } from "../components/LanguageContext";
import { Building2, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ProjectCard from "../components/project/ProjectCard";
import { WILAYAS } from "../components/constants";

const LOT_TYPES = ["F1","F2","F3","F4","F5","F6+","Duplex","Penthouse","Commercial","Parking"];

const PROJECT_STATUS_OPTIONS = [
  { value: "all",               fr: "Tous les statuts",   en: "All Statuses",     ar: "كل الحالات" },
  { value: "upcoming",          fr: "À venir",            en: "Upcoming",         ar: "قادم" },
  { value: "under_construction",fr: "En construction",    en: "Under Construction",ar: "قيد الإنشاء" },
  { value: "ready_to_move",     fr: "Prêt à habiter",     en: "Ready to Move",    ar: "جاهز" },
  { value: "sold_out",          fr: "Complet",            en: "Sold Out",         ar: "مكتمل" },
];

export default function Projects() {
  const { lang } = useLang();
  const [projects, setProjects] = useState([]);
  const [lotTypesByProject, setLotTypesByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    wilaya: "all", project_status: "all", lot_type: "all",
    listing_type: "all", min_price: "", max_price: "",
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.Project.filter({ status: "active" }, "-created_date", 100).catch(() => []);
    setProjects(data);
    if (data.length > 0) {
      const allLotTypes = await base44.entities.ProjectLotType.list("-created_date", 500).catch(() => []);
      const map = {};
      allLotTypes.forEach(lt => {
        if (!map[lt.project_id]) map[lt.project_id] = [];
        map[lt.project_id].push(lt);
      });
      setLotTypesByProject(map);
    }
    setLoading(false);
  }

  const L = lang;
  const t = (fr, en, ar) => L === "ar" ? ar : L === "fr" ? fr : en;

  const filtered = projects.filter(p => {
    if (filters.wilaya !== "all" && p.wilaya !== filters.wilaya) return false;
    if (filters.project_status !== "all" && p.project_status !== filters.project_status) return false;
    if (filters.listing_type !== "all" && p.listing_type !== "both" && p.listing_type !== filters.listing_type) return false;
    const lts = lotTypesByProject[p.id] || [];
    if (filters.lot_type !== "all" && !lts.some(lt => lt.lot_type === filters.lot_type)) return false;
    if (filters.min_price) {
      const min = Math.min(...lts.map(lt => lt.price_min).filter(Boolean));
      if (min > Number(filters.min_price)) return false;
    }
    if (filters.max_price) {
      const min = Math.min(...lts.map(lt => lt.price_min).filter(Boolean));
      if (min > Number(filters.max_price)) return false;
    }
    return true;
  });

  const usedWilayas = [...new Set(projects.map(p => p.wilaya).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-8 h-8 text-emerald-300" />
            <div>
              <h1 className="text-3xl font-bold">{t("Projets Immobiliers", "Real Estate Projects", "مشاريع عقارية")}</h1>
              <p className="text-emerald-200 mt-1">{t("Découvrez les nouveaux projets et résidences", "Discover new developments and residences", "اكتشف المشاريع العقارية الجديدة")}</p>
            </div>
          </div>
          <p className="text-emerald-300 text-sm">{projects.length} {t("projet(s)", "project(s)", "مشروع")}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">{t("Filtrer les projets", "Filter projects", "تصفية المشاريع")}</span>
            </div>
            {filtersOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {filtersOpen && (
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <Select value={filters.wilaya} onValueChange={v => setFilters(f => ({ ...f, wilaya: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("Wilaya", "Wilaya", "الولاية")} /></SelectTrigger>
                  <SelectContent className="max-h-52">
                    <SelectItem value="all">{t("Toutes les wilayas", "All wilayas", "كل الولايات")}</SelectItem>
                    {usedWilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.project_status} onValueChange={v => setFilters(f => ({ ...f, project_status: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("Statut", "Status", "الحالة")} /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o[L] || o.fr}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.listing_type} onValueChange={v => setFilters(f => ({ ...f, listing_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("Opération", "Type", "العملية")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("Tout", "All", "الكل")}</SelectItem>
                    <SelectItem value="sale">{t("Vente", "Sale", "بيع")}</SelectItem>
                    <SelectItem value="rent">{t("Location", "Rent", "إيجار")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.lot_type} onValueChange={v => setFilters(f => ({ ...f, lot_type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={t("Type de lot", "Lot type", "نوع اللوت")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("Tous les types", "All types", "كل الأنواع")}</SelectItem>
                    {LOT_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input type="number" placeholder={t("Prix min", "Min price", "سعر أدنى")} value={filters.min_price} onChange={e => setFilters(f => ({ ...f, min_price: e.target.value }))} className="h-9 text-xs" />
                  <Input type="number" placeholder={t("Max", "Max", "أقصى")} value={filters.max_price} onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))} className="h-9 text-xs" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-400">{filtered.length} {t("projet(s)", "project(s)", "مشروع")}</span>
                <button onClick={() => setFilters({ wilaya: "all", project_status: "all", lot_type: "all", listing_type: "all", min_price: "", max_price: "" })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                  <X className="w-3 h-3" />{t("Effacer les filtres", "Clear filters", "مسح الفلاتر")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="bg-white h-72 rounded-2xl animate-pulse border" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>{t("Aucun projet disponible", "No projects available", "لا توجد مشاريع متاحة")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <ProjectCard key={p.id} project={p} lotTypes={lotTypesByProject[p.id] || []} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}