import React, { useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { WILAYAS, PROPERTY_TYPES, FEATURES_LIST } from "../constants";
import { useLang } from "../LanguageContext";
import SelectDrawer from "../SelectDrawer";
import SmartPriceInput from "../price/SmartPriceInput";

const BEDROOMS_OPTIONS = ["1", "2", "3", "4", "5+"];
const FURNISHED_OPTIONS = [
  { value: "furnished",      label: { en: "Furnished", fr: "Meublé", ar: "مفروش" } },
  { value: "semi_furnished", label: { en: "Semi-furnished", fr: "Semi-meublé", ar: "نصف مفروش" } },
  { value: "unfurnished",    label: { en: "Unfurnished", fr: "Non meublé", ar: "غير مفروش" } },
];

export default function SearchFilters({ filters, onChange, onSearch, compact = false }) {
  const { t, lang } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [drawerOpen, setDrawerOpen] = useState(null);

  const update = (key, val) => onChange({ ...filters, [key]: val });

  const toggleFeature = (feat) => {
    const current = filters.features || [];
    const next = current.includes(feat)
      ? current.filter(f => f !== feat)
      : [...current, feat];
    update("features", next);
  };

  const activeAdvancedCount = [
    filters.min_bedrooms, filters.min_bathrooms, filters.min_area,
    filters.furnished, ...(filters.features || [])
  ].filter(Boolean).length;

  const listingTypeOptions = [
    { value: "all", label: t.listingType },
    { value: "sale", label: t.sale },
    { value: "rent", label: t.forRent },
  ];
  const propertyTypeOptions = [{ value: "all", label: t.allTypes }, ...PROPERTY_TYPES.map(pt => ({ value: pt.value, label: pt.label[lang] || pt.label.fr }))];
  const wilayaOptions = [{ value: "all", label: t.allWilayas }, ...WILAYAS.map(w => ({ value: w, label: w }))];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 select-none">
      {/* Basic row */}
      <div className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-6" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-6"}`}>
        {isMobile ? (
          <>
            <button
              onClick={() => setDrawerOpen("listing_type")}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 text-left"
            >
              {listingTypeOptions.find(o => o.value === (filters.listing_type || "all"))?.label}
            </button>
            <SelectDrawer
              open={drawerOpen === "listing_type"}
              onOpenChange={(open) => setDrawerOpen(open ? "listing_type" : null)}
              options={listingTypeOptions}
              value={filters.listing_type || "all"}
              onValueChange={v => update("listing_type", v === "all" ? "" : v)}
              label={t.listingType}
            />

            <button
              onClick={() => setDrawerOpen("property_type")}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 text-left"
            >
              {propertyTypeOptions.find(o => o.value === (filters.property_type || "all"))?.label}
            </button>
            <SelectDrawer
              open={drawerOpen === "property_type"}
              onOpenChange={(open) => setDrawerOpen(open ? "property_type" : null)}
              options={propertyTypeOptions}
              value={filters.property_type || "all"}
              onValueChange={v => update("property_type", v === "all" ? "" : v)}
              label={t.allTypes}
            />

            <button
              onClick={() => setDrawerOpen("wilaya")}
              className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600 text-left"
            >
              {wilayaOptions.find(o => o.value === (filters.wilaya || "all"))?.label}
            </button>
            <SelectDrawer
              open={drawerOpen === "wilaya"}
              onOpenChange={(open) => setDrawerOpen(open ? "wilaya" : null)}
              options={wilayaOptions}
              value={filters.wilaya || "all"}
              onValueChange={v => update("wilaya", v === "all" ? "" : v)}
              label={t.allWilayas}
            />
          </>
        ) : (
          <>
            <Select value={filters.listing_type || "all"} onValueChange={v => update("listing_type", v === "all" ? "" : v)}>
              <SelectTrigger className="border-gray-200 select-none">
                <SelectValue placeholder={t.listingType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.listingType}</SelectItem>
                <SelectItem value="sale">{t.sale}</SelectItem>
                <SelectItem value="rent">{t.forRent}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.property_type || "all"} onValueChange={v => update("property_type", v === "all" ? "" : v)}>
              <SelectTrigger className="border-gray-200 select-none">
                <SelectValue placeholder={t.allTypes} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                {PROPERTY_TYPES.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.wilaya || "all"} onValueChange={v => update("wilaya", v === "all" ? "" : v)}>
              <SelectTrigger className="border-gray-200 select-none">
                <SelectValue placeholder={t.allWilayas} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allWilayas}</SelectItem>
                {WILAYAS.map(w => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <SmartPriceInput
          listingType={filters.listing_type || "sale"}
          value={filters.min_price || ""}
          onChange={v => update("min_price", v)}
          lang={lang}
          placeholder={t.minPrice}
        />

        <SmartPriceInput
          listingType={filters.listing_type || "sale"}
          value={filters.max_price || ""}
          onChange={v => update("max_price", v)}
          lang={lang}
          placeholder={t.maxPrice}
        />

        <Button onClick={onSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 select-none">
          <Search className="w-4 h-4" />
          {t.search}
        </Button>
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="mt-3 flex items-center gap-2 text-sm text-emerald-700 font-medium hover:text-emerald-900 transition-colors select-none"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {lang === "ar" ? "فلاتر متقدمة" : lang === "fr" ? "Filtres avancés" : "Advanced Filters"}
        {activeAdvancedCount > 0 && (
          <Badge className="bg-emerald-100 text-emerald-800 text-xs px-1.5 py-0">{activeAdvancedCount}</Badge>
        )}
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Advanced panel */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Min bedrooms */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t.bedrooms} (min)</label>
              <Select value={filters.min_bedrooms || "any"} onValueChange={v => update("min_bedrooms", v === "any" ? "" : v)}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{lang === "ar" ? "أي عدد" : lang === "fr" ? "N'importe" : "Any"}</SelectItem>
                  {BEDROOMS_OPTIONS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Min bathrooms */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t.bathrooms} (min)</label>
              <Select value={filters.min_bathrooms || "any"} onValueChange={v => update("min_bathrooms", v === "any" ? "" : v)}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{lang === "ar" ? "أي عدد" : lang === "fr" ? "N'importe" : "Any"}</SelectItem>
                  {["1","2","3","4+"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Min area */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t.minArea || "Min Area"} (m²)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.min_area || ""}
                onChange={e => update("min_area", e.target.value)}
                className="border-gray-200"
              />
            </div>

            {/* Furnished */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t.furnished}</label>
              <Select value={filters.furnished || "any"} onValueChange={v => update("furnished", v === "any" ? "" : v)}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{lang === "ar" ? "الكل" : lang === "fr" ? "Tous" : "Any"}</SelectItem>
                  {FURNISHED_OPTIONS.map(fo => (
                    <SelectItem key={fo.value} value={fo.value}>{fo.label[lang] || fo.label.fr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Features / Amenities */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">{t.features}</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES_LIST.map(feat => {
                const active = (filters.features || []).includes(feat);
                return (
                  <button
                    key={feat}
                    onClick={() => toggleFeature(feat)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                    }`}
                  >
                    {feat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear advanced */}
          {activeAdvancedCount > 0 && (
            <button
              onClick={() => onChange({ ...filters, min_bedrooms: "", min_bathrooms: "", min_area: "", furnished: "", features: [] })}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
            >
              <X className="w-3 h-3" /> {lang === "ar" ? "مسح الفلاتر المتقدمة" : lang === "fr" ? "Effacer les filtres avancés" : "Clear advanced filters"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}