import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { SlidersHorizontal, LayoutGrid, List, ArrowUpDown, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ListingCard from "../components/listing/ListingCard";
import SearchFilters from "../components/listing/SearchFilters";
import CompareBar from "../components/listing/CompareBar";
import { useLang } from "../components/LanguageContext";

export default function ListingsPage() {
  const { t } = useLang();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("-created_date");
  const [compareList, setCompareList] = useState([]);

  function toggleCompare(listing) {
    setCompareList(prev => {
      if (prev.find(l => l.id === listing.id)) return prev.filter(l => l.id !== listing.id);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, listing];
    });
  }

  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      listing_type: params.get("listing_type") || "",
      property_type: params.get("property_type") || "",
      wilaya: params.get("wilaya") || "",
      min_price: params.get("min_price") || "",
      max_price: params.get("max_price") || "",
    };
  });

  useEffect(() => {
    loadListings();
  }, [sortBy]);

  async function loadListings() {
    setLoading(true);
    const query = { status: "active" };
    if (filters.listing_type) query.listing_type = filters.listing_type;
    if (filters.property_type) query.property_type = filters.property_type;
    if (filters.wilaya) query.wilaya = filters.wilaya;

    let data = await base44.entities.Listing.filter(query, sortBy, 50);

    if (filters.min_price) data = data.filter(l => l.price >= Number(filters.min_price));
    if (filters.max_price) data = data.filter(l => l.price <= Number(filters.max_price));

    setListings(data);

    const favs = await base44.entities.Favorite.list().catch(() => []);
    setFavorites(favs.map(f => f.listing_id));
    setLoading(false);
  }

  async function toggleFavorite(listing) {
    const isFav = favorites.includes(listing.id);
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setFavorites(prev => prev.filter(id => id !== listing.id));
    } else {
      await base44.entities.Favorite.create({ listing_id: listing.id });
      setFavorites(prev => [...prev, listing.id]);
    }
  }

  async function saveSearch() {
    await base44.entities.SavedSearch.create({
      name: `Search ${new Date().toLocaleDateString()}`,
      filters,
      alert_enabled: true
    });
    alert(t.saveSearch + " ✓");
  }

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

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={saveSearch} className="gap-2 text-xs">
              <BookmarkPlus className="w-3 h-3" /> {t.saveSearch}
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-xs border-gray-200">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_date">{t.newest}</SelectItem>
                <SelectItem value="price">{t.priceAsc}</SelectItem>
                <SelectItem value="-price">{t.priceDesc}</SelectItem>
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
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-4">
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
    </div>

      <CompareBar
        compareList={compareList}
        onRemove={(id) => setCompareList(prev => prev.filter(l => l.id !== id))}
        onClear={() => setCompareList([])}
      />
    </div>
  );
}