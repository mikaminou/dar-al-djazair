import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { SlidersHorizontal, LayoutGrid, List, ArrowUpDown, BookmarkPlus, Check, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ListingCard from "../components/listing/ListingCard";
import SearchFilters from "../components/listing/SearchFilters";
import CompareBar from "../components/listing/CompareBar";
import { useLang } from "../components/LanguageContext";

const SORT_OPTIONS = [
  { value: "-created_date", labelKey: "newest" },
  { value: "price",         labelKey: "priceAsc" },
  { value: "-price",        labelKey: "priceDesc" },
  { value: "-area",         labelKey: "areaDesc" },
  { value: "-views_count",  labelKey: "mostViewed" },
];

function applyClientFilters(data, filters) {
  return data.filter(l => {
    if (filters.min_price && l.price < Number(filters.min_price)) return false;
    if (filters.max_price && l.price > Number(filters.max_price)) return false;
    if (filters.min_area  && l.area < Number(filters.min_area))   return false;
    if (filters.furnished && l.furnished !== filters.furnished)    return false;
    if (filters.min_bedrooms) {
      const min = filters.min_bedrooms === "5+" ? 5 : Number(filters.min_bedrooms);
      if ((l.bedrooms || 0) < min) return false;
    }
    if (filters.min_bathrooms) {
      const min = filters.min_bathrooms === "4+" ? 4 : Number(filters.min_bathrooms);
      if ((l.bathrooms || 0) < min) return false;
    }
    if (filters.features?.length) {
      if (!filters.features.every(f => (l.features || []).includes(f))) return false;
    }
    return true;
  });
}

export default function ListingsPage() {
  const { t, lang } = useLang();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("-created_date");
  const [compareList, setCompareList] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      listing_type:   params.get("listing_type") || "",
      property_type:  params.get("property_type") || "",
      wilaya:         params.get("wilaya") || "",
      min_price:      params.get("min_price") || "",
      max_price:      params.get("max_price") || "",
      min_area:       "",
      min_bedrooms:   "",
      min_bathrooms:  "",
      furnished:      "",
      features:       [],
    };
  });

  function toggleCompare(listing) {
    setCompareList(prev => {
      if (prev.find(l => l.id === listing.id)) return prev.filter(l => l.id !== listing.id);
      if (prev.length >= 2) return prev;
      return [...prev, listing];
    });
  }

  useEffect(() => { loadListings(); loadSavedSearches(); }, [sortBy]);

  async function loadSavedSearches() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) return;
    const data = await base44.entities.SavedSearch.filter({ created_by: me.email }, "-created_date", 50).catch(() => []);
    setSavedSearches(data);
  }

  function filtersMatch(savedFilters, currentFilters) {
    const keys = ["listing_type", "property_type", "wilaya", "min_price", "max_price", "min_area", "min_bedrooms", "min_bathrooms", "furnished"];
    for (const k of keys) {
      const a = savedFilters?.[k] || "";
      const b = currentFilters?.[k] || "";
      if (String(a) !== String(b)) return false;
    }
    const aFeats = (savedFilters?.features || []).slice().sort().join(",");
    const bFeats = (currentFilters?.features || []).slice().sort().join(",");
    if (aFeats !== bFeats) return false;
    return true;
  }

  const matchedSearch = savedSearches.find(s => filtersMatch(s.filters, filters));

  async function loadListings() {
    setLoading(true);
    const query = { status: "active" };
    if (filters.listing_type)  query.listing_type  = filters.listing_type;
    if (filters.property_type) query.property_type = filters.property_type;
    if (filters.wilaya)        query.wilaya        = filters.wilaya;

    let data = await base44.entities.Listing.filter(query, sortBy, 100);
    data = applyClientFilters(data, filters);
    setListings(data);

    const me = await base44.auth.me().catch(() => null);
    const favs = me
      ? await base44.entities.Favorite.filter({ user_email: me.email }).catch(() => [])
      : [];
    setFavorites(favs.map(f => f.listing_id));
    setLoading(false);
  }

  async function toggleFavorite(listing) {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const isFav = favorites.includes(listing.id);
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id, user_email: me?.email });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setFavorites(prev => prev.filter(id => id !== listing.id));
    } else {
      await base44.entities.Favorite.create({ listing_id: listing.id, user_email: me?.email });
      setFavorites(prev => [...prev, listing.id]);
    }
  }

  async function confirmSaveSearch() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      setSaveDialogOpen(false);
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    const name = searchName.trim() || `Search ${new Date().toLocaleDateString()}`;
    const newSearch = await base44.entities.SavedSearch.create({ name, filters, alert_enabled: true });
    setSavedSearches(prev => [newSearch, ...prev]);
    setSaved(true);
    setTimeout(() => { setSaveDialogOpen(false); setSaved(false); setSearchName(""); }, 1200);

    // Generate leads: notify agents whose listings match this saved search
    if (me) {
      const query = { status: "active" };
      if (filters.listing_type)  query.listing_type  = filters.listing_type;
      if (filters.property_type) query.property_type = filters.property_type;
      if (filters.wilaya)        query.wilaya        = filters.wilaya;
      const candidates = await base44.entities.Listing.filter(query, "-created_date", 100).catch(() => []);
      const matched = applyClientFilters(candidates, filters);
      // Create one lead per distinct agent (avoid spamming same agent for multiple listings)
      const seenAgents = new Set();
      for (const listing of matched) {
        if (!listing.created_by || listing.created_by === me.email) continue;
        if (seenAgents.has(`${listing.created_by}:${listing.id}`)) continue;
        seenAgents.add(`${listing.created_by}:${listing.id}`);
        base44.entities.Lead.create({
          listing_id:     listing.id,
          listing_title:  listing.title,
          listing_wilaya: listing.wilaya,
          agent_email:    listing.created_by,
          seeker_email:   me.email,
          search_name:    name,
          search_filters: filters,
          status:         "new",
        }).catch(() => {});
      }
    }
  }

  const sortLabel = (key) => {
    const labels = {
      newest:     { en: "Newest", fr: "Plus récent", ar: "الأحدث" },
      priceAsc:   { en: "Price ↑", fr: "Prix ↑", ar: "السعر ↑" },
      priceDesc:  { en: "Price ↓", fr: "Prix ↓", ar: "السعر ↓" },
      areaDesc:   { en: "Largest", fr: "Plus grand", ar: "الأكبر" },
      mostViewed: { en: "Most Viewed", fr: "Plus vus", ar: "الأكثر مشاهدة" },
    };
    return labels[key]?.[lang] || labels[key]?.fr || key;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <SearchFilters filters={filters} onChange={setFilters} onSearch={loadListings} compact />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <p className="text-gray-600 text-sm">
            <span className="font-bold text-gray-900">{listings.length}</span> {t.results}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {matchedSearch ? (
              <Button variant="outline" size="sm" className="gap-2 text-xs border-emerald-400 text-emerald-700 bg-emerald-50 cursor-default max-w-[180px]" disabled>
                <BookmarkCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{matchedSearch.name || (lang === "ar" ? "بحث محفوظ" : lang === "fr" ? "Recherche sauvegardée" : "Saved search")}</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)} className="gap-2 text-xs">
                <BookmarkPlus className="w-3 h-3" /> {t.saveSearch}
              </Button>
            )}

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-xs border-gray-200">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{sortLabel(s.labelKey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-emerald-600 text-white" : "bg-white text-gray-500"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-emerald-600 text-white" : "bg-white text-gray-500"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "ar" ? "الفلاتر" : lang === "fr" ? "Filtres" : "Filters"}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                <SearchFilters filters={filters} onChange={setFilters} onSearch={() => { loadListings(); }} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {loading ? (
          <div className={`grid gap-5 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">{t.noResults}</p>
          </div>
        ) : (
          <div className={`grid gap-5 ${view === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
                isCompared={!!compareList.find(l => l.id === listing.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </div>

      <CompareBar
        compareList={compareList}
        onRemove={(id) => setCompareList(prev => prev.filter(l => l.id !== id))}
        onClear={() => setCompareList([])}
      />

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {lang === "ar" ? "حفظ البحث" : lang === "fr" ? "Sauvegarder la recherche" : "Save Search"}
            </DialogTitle>
          </DialogHeader>
          {saved ? (
            <div className="flex flex-col items-center gap-2 py-6 text-emerald-600">
              <Check className="w-10 h-10" />
              <p className="font-medium">{lang === "ar" ? "تم الحفظ!" : lang === "fr" ? "Sauvegardé !" : "Saved!"}</p>
            </div>
          ) : (
            <>
              <Input
                placeholder={lang === "ar" ? "اسم البحث..." : lang === "fr" ? "Nom de la recherche..." : "Search name..."}
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && confirmSaveSearch()}
                autoFocus
              />
              <DialogFooter className="mt-2">
                <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                  {lang === "ar" ? "إلغاء" : lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button onClick={confirmSaveSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {t.saveSearch}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}