import React, { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAS, PROPERTY_TYPES, FEATURES_LIST } from "../constants";
import { COMMUNES_BY_WILAYA } from "../communesData";
import { useLang } from "../LanguageContext";
import SelectDrawer from "../SelectDrawer";
import RangeFilter from "../filters/RangeFilter";
import SmartPriceInput from "../price/SmartPriceInput";

const FURNISHED_OPTIONS = [
  { value: "furnished",      label: { en: "Furnished", fr: "Meublé", ar: "مفروش" } },
  { value: "semi_furnished", label: { en: "Semi-furnished", fr: "Semi-meublé", ar: "نصف مفروش" } },
  { value: "unfurnished",    label: { en: "Unfurnished", fr: "Non meublé", ar: "غير مفروش" } },
];

const EMPTY_ADVANCED = { bedrooms: "", bathrooms: "", min_area: "", max_area: "", furnished: "", features: [], agency_office_wilaya: "" };

export default function SearchFilters({ filters, onChange, onSearch, compact = false }) {
  const { t, lang } = useLang();
  const [advOpen, setAdvOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [drawerOpen, setDrawerOpen] = useState(null);

  const update = (key, val) => onChange({ ...filters, [key]: val });
  const toggleFeature = (feat) => {
    const current = filters.features || [];
    update("features", current.includes(feat) ? current.filter(f => f !== feat) : [...current, feat]);
  };

  const advancedActive = [
    filters.bedrooms && `${filters.bedrooms} ${lang === "ar" ? "غرف" : lang === "fr" ? "ch." : "bed"}`,
    filters.bathrooms && `${filters.bathrooms} ${lang === "ar" ? "حمام" : lang === "fr" ? "sdb" : "bath"}`,
    (filters.min_area || filters.max_area) && `${filters.min_area || 0}–${filters.max_area || "∞"} m²`,
    filters.furnished && FURNISHED_OPTIONS.find(f => f.value === filters.furnished)?.label[lang],
    filters.agency_office_wilaya && (WILAYAS.find(w => w.value === filters.agency_office_wilaya)?.label[lang] || filters.agency_office_wilaya),
    ...(filters.features || []).map(fv => FEATURES_LIST.find(f => f.value === fv)?.label[lang] || fv),
  ].filter(Boolean);

  const wilayaOptions = [{ value: "all", label: t.allWilayas }, ...WILAYAS.map(w => ({ value: w.value, label: w.label[lang] || w.label.fr }))];
  const propertyTypeOptions = [{ value: "all", label: t.allTypes }, ...PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.label[lang] || pt.label.fr }))];
  const communeOptions = filters.wilaya
    ? [{ value: "all", label: lang === "ar" ? "كل البلديات" : lang === "fr" ? "Toutes communes" : "All communes" }, ...(COMMUNES_BY_WILAYA[filters.wilaya] || []).map(c => ({ value: c, label: c }))]
    : [];

  const listingType = filters.listing_type || "sale";

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

        {/* Row 2: Min price + Max price inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 font-medium mb-1 block">
              {lang === "ar" ? "السعر الأدنى" : lang === "fr" ? "Prix min" : "Min price"}
            </label>
            <SmartPriceInput
              listingType={listingType || "sale"}
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
              listingType={listingType || "sale"}
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
          {advancedActive.length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {advancedActive.length}
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Active filter chips */}
        {advancedActive.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {advancedActive.slice(0, 3).map((chip, i) => (
              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                {chip}
              </span>
            ))}
            {advancedActive.length > 3 && (
              <span className="text-[10px] text-gray-400">+{advancedActive.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Advanced panel ── */}
      {advOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-5 bg-gray-50 dark:bg-[#0f1115]">
          {/* Bedrooms + Bathrooms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <RangeFilter
              mode="discrete"
              label={lang === "ar" ? "غرف النوم" : lang === "fr" ? "Chambres" : "Bedrooms"}
              options={["1","2","3","4","5","6+"].map(n => ({ value: n, label: n }))}
              selectedValue={filters.bedrooms || ""}
              onSelect={v => update("bedrooms", v)}
              anyLabel={lang === "ar" ? "أي" : lang === "fr" ? "Tous" : "Any"}
            />
            <RangeFilter
              mode="discrete"
              label={lang === "ar" ? "الحمامات" : lang === "fr" ? "Salles de bain" : "Bathrooms"}
              options={["1","2","3","4+"].map(n => ({ value: n, label: n }))}
              selectedValue={filters.bathrooms || ""}
              onSelect={v => update("bathrooms", v)}
              anyLabel={lang === "ar" ? "أي" : lang === "fr" ? "Tous" : "Any"}
            />
          </div>

          {/* Area + Furnished */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            <RangeFilter
              min={0}
              max={2000}
              step={10}
              label={lang === "ar" ? "المساحة (م²)" : lang === "fr" ? "Surface (m²)" : "Area (m²)"}
              minValue={filters.min_area || ""}
              maxValue={filters.max_area || ""}
              onMinChange={v => update("min_area", v)}
              onMaxChange={v => update("max_area", v)}
              unit="m²"
            />
            <div>
              <label className="text-xs text-gray-500 font-medium mb-2 block">
                {lang === "ar" ? "التأثيث" : lang === "fr" ? "Ameublement" : "Furnishing"}
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => update("furnished", "")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    !filters.furnished
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                  }`}
                >
                  {lang === "ar" ? "أي" : lang === "fr" ? "Tous" : "Any"}
                </button>
                {FURNISHED_OPTIONS.map(fo => (
                  <button
                    key={fo.value}
                    onClick={() => update("furnished", fo.value === filters.furnished ? "" : fo.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      filters.furnished === fo.value
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                    }`}
                  >
                    {fo.label[lang] || fo.label.fr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agency office wilaya filter */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">
              {lang === "ar" ? "وكالات لها مكاتب في" : lang === "fr" ? "Agences avec bureaux dans" : "Agencies with offices in"}
            </label>
            <Select value={filters.agency_office_wilaya || "all"} onValueChange={v => update("agency_office_wilaya", v === "all" ? "" : v)}>
              <SelectTrigger className="border-gray-200 rounded-xl bg-white dark:bg-gray-800 h-9 text-sm">
                <SelectValue placeholder={lang === "ar" ? "أي ولاية" : lang === "fr" ? "Toutes wilayas" : "Any wilaya"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">{lang === "ar" ? "أي ولاية" : lang === "fr" ? "Toutes wilayas" : "Any wilaya"}</SelectItem>
                {WILAYAS.map(w => <SelectItem key={w.value} value={w.value}>{w.label[lang] || w.label.fr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">
              {lang === "ar" ? "المميزات" : lang === "fr" ? "Équipements" : "Amenities"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {FEATURES_LIST.map(feat => {
                const active = (filters.features || []).includes(feat.value);
                return (
                  <button
                    key={feat.value}
                    onClick={() => toggleFeature(feat.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                    }`}
                  >
                    {feat.label[lang] || feat.label.fr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear */}
          {advancedActive.length > 0 && (
            <button
              onClick={() => onChange({ ...filters, ...EMPTY_ADVANCED })}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
            >
              <X className="w-3.5 h-3.5" />
              {lang === "ar" ? "مسح الفلاتر الإضافية" : lang === "fr" ? "Effacer les filtres" : "Clear advanced filters"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}