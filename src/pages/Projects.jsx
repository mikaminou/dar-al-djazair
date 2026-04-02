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
  { value: "all",               fr: "Tous les statuts",   en: "All Statuses",       ar: "كل الحالات" },
  { value: "upcoming",          fr: "À venir",            en: "Upcoming",           ar: "قادم" },
  { value: "under_construction",fr: "En construction",    en: "Under Construction", ar: "قيد الإنشاء" },
  { value: "semi_fini",         fr: "Semi-fini",          en: "Semi-Finished",      ar: "نصف تشطيب" },
  { value: "fini",             fr: "Fini",              en: "Finished",           ar: "تشطيب كامل" },
];

export default function Projects() {
  const { lang } = useLang();
  const [projects, setProjects] = useState([]);
  const [lotTypesByProject, setLotTypesByProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    wilaya: "all", project_status: "all", lot_type: "all",
    listing_type: "all", max_price: "", min_area: "", max_area: "",
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
    if (filters.max_price && lts.length > 0) {
      const lowestPrice = Math.min(...lts.map(lt => lt.price_min).filter(v => v != null && v > 0));
      if (isFinite(lowestPrice) && lowestPrice > Number(filters.max_price)) return false;
    }
    if (filters.min_area && lts.length > 0) {
      const highestArea = Math.max(...lts.map(lt => lt.area_max).filter(v => v != null && v > 0));
      if (isFinite(highestArea) && highestArea < Number(filters.min_area)) return false;
    }
    if (filters.max_area && lts.length > 0) {
      const lowestArea = Math.min(...lts.map(lt => lt.area_min).filter(v => v != null && v > 0));
      if (isFinite(lowestArea) && lowestArea > Number(filters.max_area)) return false;
    }
    return true;
  });

  // no derived wilaya list needed — use WILAYAS constant directly

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
          {/* Mobile toggle */}
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="md:hidden w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-gray-700">{t("Filtrer les projets", "Filter projects", "تصفية المشاريع")}</span>
              {Object.values(filters).some(v => v && v !== "all") && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">•</span>
              )}
            </div>
            {filtersOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          <div className={`${filtersOpen ? "block" : "hidden"} md:block px-5 py-4`}>
            {/* Row 1: main selects */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Select value={filters.wilaya} onValueChange={v => setFilters(f => ({ ...f, wilaya: v }))}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t("Wilaya", "Wilaya", "الولاية")} /></SelectTrigger>
                <SelectContent className="max-h-52">
                  <SelectItem value="all">{t("Toutes les wilayas", "All wilayas", "كل الولايات")}</SelectItem>
                  {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[L] || w.label.fr}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.project_status} onValueChange={v => setFilters(f => ({ ...f, project_status: v }))}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t("Avancement", "Progress", "التقدم")} /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o[L] || o.fr}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.listing_type} onValueChange={v => setFilters(f => ({ ...f, listing_type: v }))}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t("Opération", "Operation", "العملية")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Vente & Location", "Sale & Rent", "بيع وإيجار")}</SelectItem>
                  <SelectItem value="sale">{t("Vente", "Sale", "بيع")}</SelectItem>
                  <SelectItem value="rent">{t("Location", "Rent", "إيجار")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.lot_type} onValueChange={v => setFilters(f => ({ ...f, lot_type: v }))}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={t("Type de bien", "Property type", "نوع العقار")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("Tous les types", "All types", "كل الأنواع")}</SelectItem>
                  {LOT_TYPES.map(lt => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Row 2: ranges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t("Budget max", "Max budget", "الحد الأقصى للسعر")}</span>
                <Input type="number" value={filters.max_price} onChange={e => setFilters(f => ({ ...f, max_price: e.target.value }))} className="h-10 text-sm pl-24 pr-3" placeholder="" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t("Surface min (m²)", "Min area (m²)", "مساحة دنيا م²")}</span>
                <Input type="number" value={filters.min_area} onChange={e => setFilters(f => ({ ...f, min_area: e.target.value }))} className="h-10 text-sm pl-28 pr-3" placeholder="" />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{t("Surface max (m²)", "Max area (m²)", "مساحة قصوى م²")}</span>
                <Input type="number" value={filters.max_area} onChange={e => setFilters(f => ({ ...f, max_area: e.target.value }))} className="h-10 text-sm pl-28 pr-3" placeholder="" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 font-medium">{filtered.length} {t("projet(s)", "project(s)", "مشروع")}</span>
                {Object.values(filters).some(v => v && v !== "all") && (
                  <button onClick={() => setFilters({ wilaya: "all", project_status: "all", lot_type: "all", listing_type: "all", max_price: "", min_area: "", max_area: "" })} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
                    <X className="w-3 h-3" />{t("Effacer", "Clear", "مسح")}
                  </button>
                )}
              </div>
            </div>
          </div>
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