import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Eye, ToggleLeft, ToggleRight, Users, BarChart3, CalendarDays, SlidersHorizontal, X, MapPin, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useLang } from "../components/LanguageContext";
import { formatPrice, PROPERTY_TYPES, WILAYAS } from "../components/constants";

export default function MyListingsPage() {
  const { t, lang } = useLang();
  const [listings, setListings] = useState([]);
  const [leadCounts, setLeadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "all", property_type: "all", wilaya: "all", minPrice: "", maxPrice: "" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    if (!user) { setLoading(false); return; }
    const [data, leads] = await Promise.all([
      base44.entities.Listing.filter({ created_by: user.email }, "-created_date", 100),
      base44.entities.Lead.filter({ agent_email: user.email, status: "new" }, "-created_date", 200).catch(() => []),
    ]);
    setListings(data);
    const counts = {};
    leads.forEach(l => { counts[l.listing_id] = (counts[l.listing_id] || 0) + 1; });
    setLeadCounts(counts);
    setLoading(false);
  }

  async function deleteListing(id) {
    if (!confirm(lang === "ar" ? "هل تريد حذف هذا الإعلان؟" : lang === "fr" ? "Supprimer cette annonce ?" : "Delete this listing?")) return;
    const user = await base44.auth.me().catch(() => null);
    if (user) {
      const msgs = await base44.entities.Message.filter({ listing_id: id }, "-created_date", 500).catch(() => []);
      const ownerMsgs = msgs.filter(m => m.sender_email === user.email || m.recipient_email === user.email);
      await Promise.all(ownerMsgs.map(m => {
        const hiddenFor = [...new Set([...(m.hidden_for || []), user.email])];
        return base44.entities.Message.update(m.id, { hidden_for: hiddenFor });
      }));
    }
    await base44.entities.Listing.delete(id);
    setListings(prev => prev.filter(l => l.id !== id));
  }

  async function toggleStatus(listing) {
    const newStatus = listing.status === "active" ? "archived" : "active";
    await base44.entities.Listing.update(listing.id, { status: newStatus });
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l));
    const user = await base44.auth.me().catch(() => null);
    if (user && newStatus === "archived") {
      const msgs = await base44.entities.Message.filter({ listing_id: listing.id }, "-created_date", 500).catch(() => []);
      const ownerMsgs = msgs.filter(m => m.sender_email === user.email || m.recipient_email === user.email);
      await Promise.all(ownerMsgs.map(m => {
        const hiddenFor = [...new Set([...(m.hidden_for || []), user.email])];
        return base44.entities.Message.update(m.id, { hidden_for: hiddenFor });
      }));
    } else if (user && newStatus === "active") {
      const msgs = await base44.entities.Message.filter({ listing_id: listing.id }, "-created_date", 500).catch(() => []);
      await Promise.all(msgs.map(m => {
        const hiddenFor = (m.hidden_for || []).filter(e => e !== user.email);
        return base44.entities.Message.update(m.id, { hidden_for: hiddenFor });
      }));
    }
  }

  const statusColor = { active: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", archived: "bg-gray-100 text-gray-500", sold: "bg-blue-100 text-blue-700", rented: "bg-purple-100 text-purple-700" };

  const filteredListings = listings.filter(l => {
    if (filters.status !== "all" && l.status !== filters.status) return false;
    if (filters.property_type !== "all" && l.property_type !== filters.property_type) return false;
    if (filters.wilaya !== "all" && l.wilaya !== filters.wilaya) return false;
    if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    return true;
  });

  const hasActiveFilters = filters.status !== "all" || filters.property_type !== "all" || filters.wilaya !== "all" || filters.minPrice || filters.maxPrice;
  const activeFilterCount = [filters.status !== "all", filters.property_type !== "all", filters.wilaya !== "all", !!filters.minPrice, !!filters.maxPrice].filter(Boolean).length;

  function resetFilters() {
    setFilters({ status: "all", property_type: "all", wilaya: "all", minPrice: "", maxPrice: "" });
  }

  // Get only wilayas that the user has listings in
  const usedWilayas = [...new Set(listings.map(l => l.wilaya).filter(Boolean))].sort();

  const statusOptions = [
    { value: "all", label: { fr: "Tous", ar: "الكل", en: "All" } },
    { value: "active", label: { fr: "Actifs", ar: "نشط", en: "Active" }, color: "emerald" },
    { value: "archived", label: { fr: "Archivés", ar: "مؤرشف", en: "Archived" }, color: "gray" },
    { value: "sold", label: { fr: "Vendus", ar: "مباع", en: "Sold" }, color: "blue" },
    { value: "rented", label: { fr: "Loués", ar: "مؤجر", en: "Rented" }, color: "purple" },
    { value: "pending", label: { fr: "En attente", ar: "معلق", en: "Pending" }, color: "yellow" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">{t.myListings}</h1>
          </div>
          {!loading && listings.length > 0 && (
            <p className="text-emerald-200 text-sm">
              {listings.length} {lang === "ar" ? "إعلان" : lang === "fr" ? "annonce(s) au total" : "total listing(s)"}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        {!loading && listings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 overflow-hidden">
            {/* Filter toggle bar */}
            <button
              onClick={() => setFiltersOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">
                  {lang === "ar" ? "تصفية الإعلانات" : lang === "fr" ? "Filtrer les annonces" : "Filter listings"}
                </span>
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <span className="text-xs text-gray-400">
                    {filteredListings.length}/{listings.length} {lang === "ar" ? "نتيجة" : lang === "fr" ? "résultat(s)" : "result(s)"}
                  </span>
                )}
                {filtersOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {filtersOpen && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                {/* Status pills */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {lang === "ar" ? "الحالة" : lang === "fr" ? "Statut" : "Status"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFilters(f => ({ ...f, status: opt.value }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          filters.status === opt.value
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                        }`}
                      >
                        {opt.label[lang] || opt.label.fr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Wilaya */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.wilaya}</span>
                    </p>
                    <Select value={filters.wilaya} onValueChange={v => setFilters(f => ({ ...f, wilaya: v }))}>
                      <SelectTrigger className="h-9 text-sm border-gray-200">
                        <SelectValue placeholder={t.allWilayas} />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        <SelectItem value="all">{t.allWilayas}</SelectItem>
                        {usedWilayas.map(w => (
                          <SelectItem key={w} value={w}>{w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Property type */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.propertyType}</p>
                    <Select value={filters.property_type} onValueChange={v => setFilters(f => ({ ...f, property_type: v }))}>
                      <SelectTrigger className="h-9 text-sm border-gray-200">
                        <SelectValue placeholder={t.allTypes} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allTypes}</SelectItem>
                        {PROPERTY_TYPES.map(pt => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price range */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.price}</p>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        placeholder={t.minPrice}
                        value={filters.minPrice}
                        onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                        className="h-9 text-sm border-gray-200"
                      />
                      <span className="text-gray-300 font-light">—</span>
                      <Input
                        type="number"
                        placeholder={t.maxPrice}
                        value={filters.maxPrice}
                        onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                        className="h-9 text-sm border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end pt-1">
                    <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium">
                      <X className="w-3.5 h-3.5" />
                      {lang === "ar" ? "مسح كل الفلاتر" : lang === "fr" ? "Effacer tous les filtres" : "Clear all filters"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white h-20 rounded-xl animate-pulse border" />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">{t.noResults}</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>{lang === "ar" ? "لا توجد نتائج لهذه الفلاتر" : lang === "fr" ? "Aucun résultat pour ces filtres" : "No listings match these filters"}</p>
            <button onClick={resetFilters} className="mt-2 text-emerald-600 text-sm underline">
              {lang === "ar" ? "مسح الفلاتر" : lang === "fr" ? "Effacer les filtres" : "Clear filters"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                <img
                  src={listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&q=70"}
                  alt=""
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{listing.title}</h3>
                    <Badge className={statusColor[listing.status] || "bg-gray-100"}>{listing.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{listing.wilaya} • {formatPrice(listing.price, lang)}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {listing.views_count || 0} {lang === "ar" ? "مشاهدة" : lang === "fr" ? "vues" : "views"}
                    </p>
                    {leadCounts[listing.id] > 0 && (
                      <Link to={createPageUrl("Leads")} className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full hover:bg-emerald-100">
                        <Users className="w-3 h-3" /> {leadCounts[listing.id]} {lang === "ar" ? "عميل محتمل" : lang === "fr" ? "lead(s)" : "lead(s)"}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => toggleStatus(listing)} title={listing.status === "active" ? "Archive" : "Activate"} className="text-gray-400 hover:text-emerald-600">
                    {listing.status === "active" ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5" />}
                  </Button>
                  <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`PostListing?edit=${listing.id}`)}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-amber-600" title={t.editListing}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`ListingAnalytics?id=${listing.id}`)}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-emerald-600" title="Analytics">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl(`AgentAvailability?id=${listing.id}`)}>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600" title="Availability">
                      <CalendarDays className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => deleteListing(listing.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}