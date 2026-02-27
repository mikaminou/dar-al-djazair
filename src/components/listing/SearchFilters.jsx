import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { WILAYAS, PROPERTY_TYPES } from "../constants";
import { useLang } from "../LanguageContext";

export default function SearchFilters({ filters, onChange, onSearch, compact = false }) {
  const { t, lang } = useLang();

  const update = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-4 ${compact ? "" : "p-6"}`}>
      <div className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-5" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-6"}`}>
        {/* Listing type */}
        <Select value={filters.listing_type || "all"} onValueChange={v => update("listing_type", v === "all" ? "" : v)}>
          <SelectTrigger className="border-gray-200">
            <SelectValue placeholder={t.listingType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.listingType}</SelectItem>
            <SelectItem value="sale">{t.sale}</SelectItem>
            <SelectItem value="rent">{t.forRent}</SelectItem>
          </SelectContent>
        </Select>

        {/* Property type */}
        <Select value={filters.property_type || "all"} onValueChange={v => update("property_type", v === "all" ? "" : v)}>
          <SelectTrigger className="border-gray-200">
            <SelectValue placeholder={t.allTypes} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allTypes}</SelectItem>
            {PROPERTY_TYPES.map(pt => (
              <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Wilaya */}
        <Select value={filters.wilaya || "all"} onValueChange={v => update("wilaya", v === "all" ? "" : v)}>
          <SelectTrigger className="border-gray-200">
            <SelectValue placeholder={t.allWilayas} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allWilayas}</SelectItem>
            {WILAYAS.map(w => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Min Price */}
        <Input
          type="number"
          placeholder={t.minPrice}
          value={filters.min_price || ""}
          onChange={e => update("min_price", e.target.value)}
          className="border-gray-200"
        />

        {/* Max Price */}
        <Input
          type="number"
          placeholder={t.maxPrice}
          value={filters.max_price || ""}
          onChange={e => update("max_price", e.target.value)}
          className="border-gray-200"
        />

        <Button onClick={onSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 col-span-2 md:col-span-1">
          <Search className="w-4 h-4" />
          {t.search}
        </Button>
      </div>
    </div>
  );
}