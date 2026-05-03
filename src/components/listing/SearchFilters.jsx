import React, { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAS, PROPERTY_TYPES } from "../constants";
import { COMMUNES_BY_WILAYA } from "../communesData";
import { useLang } from "../LanguageContext";
import SelectDrawer from "../SelectDrawer";
import SmartPriceInput from "../price/SmartPriceInput";
import PerTypeFilters from "./filters/PerTypeFilters";
import { getAllFilterKeysForType, countActiveTypeFilters } from "./perTypeFilterSchema";

// Generic, never-stripped filter keys (universal across all property types)
const UNIVERSAL_FILTER_KEYS = new Set([
  "listing_type", "property_type", "wilaya", "commune",
  "min_price", "max_price", "features", "agency_office_wilaya",
]);

export default function SearchFilters({ filters, onChange, onSearch, compact = false }) {
  const { t, lang } = useLang();
  const [advOpen, setAdvOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [drawerOpen, setDrawerOpen] = useState(null);

  const update = (key, val) => {
    // When property_type changes, strip type-specific filter keys that don't
    // exist on the new type — keeps URL/saved-search state clean.
    if (key === "property_type") {
      const newType = val;
      const validKeysForNewType = new Set(getAllFilterKeysForType(newType));
      const cleaned = {};
      for (const [k, v] of Object.entries(filters)) {
        if (UNIVERSAL_FILTER_KEYS.has(k) || validKeysForNewType.has(k)) {
          cleaned[k] = v;
        }
      }
      onChange({ ...cleaned, [key]: val });
      return;
    }
    onChange({ ...filters, [key]: val });
  };

  const wilayaOptions = [{ value: "all", label: t.allWilayas }, ...WILAYAS.map(w => ({ value: w.value, label: w.label[lang] || w.label.fr }))];
  const propertyTypeOptions = [{ value: "all", label: t.allTypes }, ...PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.label[lang] || pt.label.fr }))];
  const communeOptions = filters.wilaya
    ? [{ value: "all", label: lang === "ar" ? "كل البلديات" : lang === "fr" ? "Toutes communes" : "All communes" }, ...(COMMUNES_BY_WILAYA[filters.wilaya] || []).map(c => ({ value: c, label: c }))]
    : [];

  const listingType = filters.listing_type || "sale";

  // Active count for the new per-type panel (drives the badge on the toggle)
  const dynamicActiveCount = countActiveTypeFilters(filters.property_type, filters);

  return (
    <div className="bg-white dark:bg-[#13161c] rounded-2xl shadow-md overflow-hidden select-none">
      {/* ── Listing type tabs ── */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {[
          { value: "", label: lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "All" },
          { value: "sale", label: lang === "ar" ? "للبيع" : lang === "fr" ? "Vente" : "Buy" },
          { value: "rent", label: lang === "ar" ? "للإيجار" : lang === "fr" ? "Location" : "Rent" },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => update("listing_type", opt.value)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              (filters.listing_type || "") === opt.value
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Main search bar ── */}
      <div className="p-3 flex flex-col gap-3">
        {/* Row 1: property type + wilaya + commune + search button */}
        <div className="flex gap-2 flex-wrap">
          {/* Property type */}
          {isMobile ? (
            <>
              <button
                onClick={() => setDrawerOpen("property_type")}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-1 min-w-[110px]"
              >
                <span className="truncate flex-1 text-left">
                  {propertyTypeOptions.find(o => o.value === (filters.property_type || "all"))?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>
              <SelectDrawer open={drawerOpen === "property_type"} onOpenChange={o => setDrawerOpen(o ? "property_type" : null)} options={propertyTypeOptions} value={filters.property_type || "all"} onValueChange={v => update("property_type", v === "all" ? "" : v)} label={t.allTypes} />
            </>
          ) : (
            <Select value={filters.property_type || "all"} onValueChange={v => update("property_type", v === "all" ? "" : v)}>
              <SelectTrigger className="flex-1 min-w-[130px] border-gray-200 rounded-xl bg-gray-50 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {PROPERTY_TYPES.map(pt => <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Wilaya */}
          {isMobile ? (
            <>
              <button
                onClick={() => setDrawerOpen("wilaya")}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-1 min-w-[110px]"
              >
                <span className="truncate flex-1 text-left">
                  {wilayaOptions.find(o => o.value === (filters.wilaya || "all"))?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              </button>
              <SelectDrawer open={drawerOpen === "wilaya"} onOpenChange={o => setDrawerOpen(o ? "wilaya" : null)} options={wilayaOptions} value={filters.wilaya || "all"} onValueChange={v => update("wilaya", v === "all" ? "" : v)} label={t.allWilayas} />
            </>
          ) : (
            <Select value={filters.wilaya || "all"} onValueChange={v => onChange({ ...filters, wilaya: v === "all" ? "" : v, commune: "" })}>
              <SelectTrigger className="flex-1 min-w-[140px] border-gray-200 rounded-xl bg-gray-50 h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">{t.allWilayas}</SelectItem>
                {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* Commune — only when wilaya is selected */}
          {filters.wilaya && communeOptions.length > 1 && (
            isMobile ? (
              <>
                <button
                  onClick={() => setDrawerOpen("commune")}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 flex-1 min-w-[110px]"
                >
                  <span className="truncate flex-1 text-left">
                    {communeOptions.find(o => o.value === (filters.commune || "all"))?.label}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </button>
                <SelectDrawer open={drawerOpen === "commune"} onOpenChange={o => setDrawerOpen(o ? "commune" : null)} options={communeOptions} value={filters.commune || "all"} onValueChange={v => update("commune", v === "all" ? "" : v)} label={lang === "ar" ? "البلدية" : "Commune"} />
              </>
            ) : (
              <Select value={filters.commune || "all"} onValueChange={v => update("commune", v === "all" ? "" : v)}>
                <SelectTrigger className="flex-1 min-w-[140px] border-gray-200 rounded-xl bg-gray-50 h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {communeOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )
          )}

          {/* Search button */}
          <Button onClick={onSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-10 px-5 flex-shrink-0">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">{t.search}</span>
          </Button>
        </div>

        {/* Row 2: Price range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 font-medium mb-1 block">
              {lang === "ar" ? "السعر الأدنى" : lang === "fr" ? "Prix min" : "Min price"}
            </label>
            <SmartPriceInput
              listingType={listingType}
              value={filters.min_price ? Number(filters.min_price) : ""}
              onChange={v => update("min_price", v)}
              lang={lang}
              placeholder={lang === "ar" ? "مثال: 50" : lang === "fr" ? "Ex: 50" : "e.g. 50"}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-medium mb-1 block">
              {lang === "ar" ? "السعر الأقصى" : lang === "fr" ? "Prix max" : "Max price"}
            </label>
            <SmartPriceInput
              listingType={listingType}
              value={filters.max_price ? Number(filters.max_price) : ""}
              onChange={v => update("max_price", v)}
              lang={lang}
              placeholder={lang === "ar" ? "مثال: 500" : lang === "fr" ? "Ex: 500" : "e.g. 500"}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Advanced filters trigger ── */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => setAdvOpen(v => !v)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 font-medium transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {lang === "ar" ? "فلاتر إضافية" : lang === "fr" ? "Plus de filtres" : "More filters"}
          {dynamicActiveCount > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {dynamicActiveCount}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* ── Advanced / Per-type panel ── */}
      {advOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-[#0f1115]">
          <PerTypeFilters
            propertyType={filters.property_type}
            filters={filters}
            onChange={onChange}
            lang={lang}
          />

          {dynamicActiveCount > 0 && (
            <button
              onClick={() => {
                const cleared = {
                  listing_type: filters.listing_type,
                  property_type: filters.property_type,
                  wilaya: filters.wilaya,
                  commune: filters.commune,
                  min_price: filters.min_price,
                  max_price: filters.max_price,
                };
                onChange(cleared);
              }}
              className="mt-4 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              {lang === "ar" ? "مسح كل الفلاتر" : lang === "fr" ? "Effacer tous les filtres" : "Clear all filters"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}