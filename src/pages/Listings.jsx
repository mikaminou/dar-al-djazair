import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  SlidersHorizontal, LayoutGrid, List, ArrowUpDown,
  BookmarkPlus, Check, BookmarkCheck, RefreshCw, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ListingCard from "../components/listing/ListingCard";
import SearchFilters from "../components/listing/SearchFilters";
import CompareBar from "../components/listing/CompareBar";
import QuickFilterChips from "../components/listing/QuickFilterChips";
import { useLang } from "../components/LanguageContext";
import { applyDynamicFilters } from "@/utils/matchesSearch";
import { decodeFiltersFromUrl, pushFilterStateToUrl } from "@/utils/urlFilterState";
import { getAllPropertyTypes } from "@/components/propertyTypes.config";

// ── Sort options (base + type-specific added dynamically) ────────────────────
const BASE_SORT_OPTIONS = [
  { value: "-created_date", label: { en: "Newest", fr: "Plus récent", ar: "الأحدث" } },
  { value: "price",         label: { en: "Price ↑", fr: "Prix ↑", ar: "السعر ↑" } },
  { value: "-price",        label: { en: "Price ↓", fr: "Prix ↓", ar: "السعر ↓" } },
  { value: "area",          label: { en: "Smallest area", fr: "Plus petite surface", ar: "أصغر مساحة" } },
  { value: "-area",         label: { en: "Largest area", fr: "Plus grande surface", ar: "أكبر مساحة" } },
  { value: "-views_count",  label: { en: "Most viewed", fr: "Plus vus", ar: "الأكثر مشاهدة" } },
];

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#13161c] rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="bg-gray-200 dark:bg-gray-700" style={{ aspectRatio: "4/3" }} />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-3" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ filters, lang, onSaveSearch }) {
  const allTypes = getAllPropertyTypes();
  const typeDef = allTypes.find(t => t.key === filters.property_type);
  const typeLabel = typeDef?.label?.[lang] || typeDef?.label?.fr || filters.property_type;

  return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-4">{typeDef?.icon || "🔍"}</div>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {filters.property_type
          ? (lang === "ar"
              ? `لا يوجد ${typeLabel} بهذه المعايير`
              : lang === "fr"
              ? `Aucun ${typeLabel} trouvé pour ces critères`
              : `No ${typeLabel} found for these criteria`)
          : (lang === "ar" ? "لا توجد نتائج" : lang === "fr" ? "Aucun bien correspondant" : "No listings found")}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {lang === "ar"
          ? "جرب توسيع نطاق البحث الجغرافي أو رفع الميزانية"
          : lang === "fr"
          ? "Essayez d'élargir votre zone géographique ou votre fourchette de prix"
          : "Try expanding your location or price range"}
      </p>
      <Button
        variant="outline"
        onClick={onSaveSearch}
        className="gap-2 text-sm border-emerald-400 text-emerald-700 hover:bg-emerald-50"
      >
        <BookmarkPlus className="w-4 h-4" />
        {lang === "ar"
          ? `احفظ البحث للتنبيه عند توفر ${typeLabel || "عقار"}`
          : lang === "fr"
          ? `Être alerté dès qu'un ${typeLabel || "bien"} correspond`
          : `Alert me when a matching ${typeLabel || "property"} appears`}
      </Button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ListingsPage() {
  const { t, lang } = useLang();

  // Initialise state from URL
  const initialState = useMemo(() => decodeFiltersFromUrl(window.location.search), []);

  const [filters, setFilters] = useState(initialState.filters);
  const [sortBy, setSortBy] = useState(initialState.sort);
  const [view, setView] = useState(initialState.view);

  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [financialState, setFinancialState] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const debounceRef = useRef(null);

  // Push URL on filter/sort/view change
  useEffect(() => {
    pushFilterStateToUrl(filters, sortBy, view);
  }, [filters, sortBy, view]);

  // Debounced load on filter change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadListings();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [filters, sortBy]);

  useEffect(() => { loadSavedSearches(); }, []);

  async function loadSavedSearches() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) return;
    const data = await base44.entities.SavedSearch.filter({ created_by: me.email }, "-created_date", 50).catch(() => []);
    setSavedSearches(data);
  }

  async function loadListings() {
    setLoading(true);
    const query = { status: "active" };
    if (filters.listing_type)  query.listing_type  = filters.listing_type;
    if (filters.property_type) query.property_type = filters.property_type;
    if (filters.wilaya)        query.wilaya        = filters.wilaya;

    let data = await base44.entities.Listing.filter(query, sortBy, 100).catch(() => []);
    data = applyDynamicFilters(data, filters);

    // Agency office wilaya filter
    if (filters.agency_office_wilaya) {
      const agencyUsers = await base44.entities.User.filter({ role: "professional" }, null, 500).catch(() => []);
      const matchingEmails = new Set(
        agencyUsers
          .filter(u => Array.isArray(u.agency_offices) && u.agency_offices.some(o => o.wilaya === filters.agency_office_wilaya))
          .map(u => u.email)
      );
      data = data.filter(l => matchingEmails.has(l.created_by));
    }

    setListings(data);

    const me = await base44.auth.me().catch(() => null);
    const favs = me
      ? await base44.entities.Favorite.filter({ user_email: me.email }).catch(() => [])
      : [];
    setFavorites(favs.map(f => f.listing_id));
    setLoading(false);
  }

  const toggleCompare = useCallback((listing) => {
    setCompareList(prev => {
      if (prev.find(l => l.id === listing.id)) return prev.filter(l => l.id !== listing.id);
      if (prev.length >= 2) return prev;
      return [...prev, listing];
    });
  }, []);

  async function toggleFavorite(listing) {
    const me = await base44.auth.me().catch(() => null);
    if (!me) { base44.auth.redirectToLogin(window.location.href); return; }
    const isFav = favorites.includes(listing.id);
    if (isFav) {
      setFavorites(prev => prev.filter(id => id !== listing.id));
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id, user_email: me.email });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
    } else {
      setFavorites(prev => [...prev, listing.id]);
      await base44.entities.Favorite.create({ listing_id: listing.id, user_email: me.email });
    }
  }

  // Pull to refresh
  function onTouchStart(e) {
    if (containerRef.current?.scrollTop === 0) touchStartRef.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (!touchStartRef.current || containerRef.current?.scrollTop !== 0) return;
    if (e.touches[0].clientY - touchStartRef.current > 80 && !isRefreshing) {
      setIsRefreshing(true);
      loadListings().then(() => { setIsRefreshing(false); touchStartRef.current = null; });
    }
  }
  function onTouchEnd() { touchStartRef.current = null; }

  function generateSearchName(f, fs) {
    const parts = [];
    const allTypes = getAllPropertyTypes();
    const typeDef = allTypes.find(t => t.key === f.property_type);
    if (typeDef) parts.push(typeDef.label?.[lang] || typeDef.label?.fr || f.property_type);
    if (f.listing_type) parts.push(f.listing_type === "sale" ? (lang === "fr" ? "à vendre" : lang === "ar" ? "للبيع" : "for sale") : (lang === "fr" ? "à louer" : lang === "ar" ? "للإيجار" : "for rent"));
    if (f.wilaya) parts.push(lang === "fr" ? `à ${f.wilaya}` : lang === "ar" ? `في ${f.wilaya}` : `in ${f.wilaya}`);
    if (parts.length === 0) return lang === "fr" ? "Nouvelle recherche" : lang === "ar" ? "بحث جديد" : "New search";
    return parts.join(" ");
  }

  async function confirmSaveSearch() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) { setSaveDialogOpen(false); base44.auth.redirectToLogin(window.location.href); return; }
    const name = generateSearchName(filters, financialState);
    const newSearch = await base44.entities.SavedSearch.create({
      name,
      filters,
      alert_enabled: true,
      user_email: me.email,
      ...(financialState ? { financial_state: financialState } : {}),
    });
    setSavedSearches(prev => [newSearch, ...prev]);
    setSaved(true);

    // Generate leads
    const candidates = await base44.entities.Listing.filter({ status: "active", ...(filters.listing_type ? { listing_type: filters.listing_type } : {}), ...(filters.property_type ? { property_type: filters.property_type } : {}), ...(filters.wilaya ? { wilaya: filters.wilaya } : {}) }, "-created_date", 100).catch(() => []);
    const matched = applyDynamicFilters(candidates, filters);
    const seenAgents = new Set();
    for (const listing of matched) {
      if (!listing.created_by || listing.created_by === me.email) continue;
      const key = `${listing.created_by}:${listing.id}`;
      if (seenAgents.has(key)) continue;
      seenAgents.add(key);
      base44.entities.Lead.create({ listing_id: listing.id, listing_title: listing.title, listing_wilaya: listing.wilaya, agent_email: listing.created_by, seeker_email: me.email, search_name: name, search_filters: filters, status: "new" }).catch(() => {});
    }

    setTimeout(() => { setSaveDialogOpen(false); setSaved(false); setFinancialState(""); }, 1200);
  }

  // Sort options — add type-specific ones when a single type is selected
  const sortOptions = useMemo(() => {
    const extra = [];
    if (filters.property_type === "apartment") {
      extra.push({ value: "floor", label: { en: "Floor ↑", fr: "Étage ↑", ar: "طابق ↑" } });
      extra.push({ value: "-floor", label: { en: "Floor ↓", fr: "Étage ↓", ar: "طابق ↓" } });
    }
    if (filters.property_type === "building") {
      extra.push({ value: "-total_units", label: { en: "Most units", fr: "Plus d'unités", ar: "أكثر وحدات" } });
    }
    if (filters.property_type === "land") {
      extra.push({ value: "-frontage_meters", label: { en: "Largest frontage", fr: "Plus grande façade", ar: "أكبر واجهة" } });
    }
    return [...BASE_SORT_OPTIONS, ...extra];
  }, [filters.property_type]);

  const isSaved = savedSearches.some(s => {
    if (!s.filters) return false;
    const a = JSON.stringify({ ...s.filters, features: (s.filters.features || []).sort() });
    const b = JSON.stringify({ ...filters, features: (filters.features || []).sort() });
    return a === b;
  });
  const matchedSearch = savedSearches.find(s => {
    if (!s.filters) return false;
    const a = JSON.stringify({ ...s.filters, features: (s.filters.features || []).sort() });
    const b = JSON.stringify({ ...filters, features: (filters.features || []).sort() });
    return a === b;
  });

  const gridCols = view === "list"
    ? "grid-cols-1"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gray-50 dark:bg-[#0f1115] select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Hero search bar ── */}
      <div className="bg-emerald-800 dark:bg-emerald-900 py-6 px-4 relative">
        {isRefreshing && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2">
            <RefreshCw className="w-5 h-5 text-emerald-300 animate-spin" />
          </div>
        )}
        <div className="max-w-6xl mx-auto">
          <SearchFilters filters={filters} onChange={setFilters} onSearch={loadListings} compact />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">

        {/* ── Quick chips ── */}
        <div className="mb-4">
          <QuickFilterChips filters={filters} onChange={setFilters} lang={lang} />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {loading
              ? (lang === "fr" ? "Chargement..." : lang === "ar" ? "جارٍ التحميل..." : "Loading...")
              : <><span className="font-bold text-gray-900 dark:text-gray-100">{listings.length}</span> {t.results}</>}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Save search button */}
            {matchedSearch ? (
              <Button variant="outline" size="sm" className="gap-2 text-xs border-emerald-400 text-emerald-700 bg-emerald-50 cursor-default max-w-[180px]" disabled>
                <BookmarkCheck className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{matchedSearch.name || (lang === "ar" ? "بحث محفوظ" : lang === "fr" ? "Sauvegardé" : "Saved")}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const me = await base44.auth.me().catch(() => null);
                  if (!me) { base44.auth.redirectToLogin(window.location.href); return; }
                  setSaveDialogOpen(true);
                }}
                className="gap-2 text-xs"
              >
                <BookmarkPlus className="w-3 h-3" />
                {t.saveSearch}
              </Button>
            )}

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-9 text-xs border-gray-200">
                <ArrowUpDown className="w-3 h-3 mr-1 flex-shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label[lang] || s.label.fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile filter sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "ar" ? "الفلاتر" : lang === "fr" ? "Filtres" : "Filters"}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                <SearchFilters filters={filters} onChange={setFilters} onSearch={() => loadListings()} />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ── Results ── */}
        {loading ? (
          <div className={`grid gap-5 ${gridCols}`}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <EmptyState
            filters={filters}
            lang={lang}
            onSaveSearch={async () => {
              const me = await base44.auth.me().catch(() => null);
              if (!me) { base44.auth.redirectToLogin(window.location.href); return; }
              setSaveDialogOpen(true);
            }}
          />
        ) : (
          <div className={`grid gap-5 ${gridCols}`}>
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                lang={lang}
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

      {/* ── Save Search Dialog ── */}
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
              <p className="text-sm text-gray-500 text-center">
                {lang === "ar"
                  ? "سنعلمك عند توفر عقارات مطابقة"
                  : lang === "fr"
                  ? "Vous serez alerté dès qu'un bien correspond"
                  : "We'll alert you when matching properties appear"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-emerald-600 font-medium mb-0.5">
                    {lang === "ar" ? "اسم البحث" : lang === "fr" ? "Nom de la recherche" : "Search name"}
                  </p>
                  <p className="text-sm text-emerald-900 dark:text-emerald-200 font-semibold">
                    {generateSearchName(filters, financialState)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">
                    {lang === "ar" ? "الوضع المالي (اختياري)" : lang === "fr" ? "Situation financière (optionnel)" : "Financial state (optional)"}
                  </Label>
                  <Select value={financialState} onValueChange={setFinancialState}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder={lang === "ar" ? "اختر..." : lang === "fr" ? "Sélectionnez..." : "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{lang === "ar" ? "شراء نقدي" : lang === "fr" ? "Achat comptant" : "Cash buyer"}</SelectItem>
                      <SelectItem value="pre_approved">{lang === "ar" ? "قرض معتمد" : lang === "fr" ? "Crédit pré-approuvé" : "Pre-approved loan"}</SelectItem>
                      <SelectItem value="arranging">{lang === "ar" ? "تمويل قيد الترتيب" : lang === "fr" ? "Financement en cours" : "Still arranging"}</SelectItem>
                      <SelectItem value="unspecified">{lang === "ar" ? "غير محدد" : lang === "fr" ? "Non précisé" : "Unspecified"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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