import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Eye, ToggleLeft, ToggleRight, Users, BarChart3, CalendarDays, SlidersHorizontal, X, MapPin, ChevronDown, ChevronUp } from "lucide-react";
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
    if (filters.minPrice && l.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && l.price > Number(filters.maxPrice)) return false;
    return true;
  });

  const hasActiveFilters = filters.status !== "all" || filters.property_type !== "all" || filters.minPrice || filters.maxPrice;

  function resetFilters() {
    setFilters({ status: "all", property_type: "all", minPrice: "", maxPrice: "" });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t.myListings}</h1>
          <Link to={createPageUrl("PostListing")}>
            <Button className="bg-amber-500 hover:bg-amber-600 gap-2">
              <Plus className="w-4 h-4" /> {t.postListing}
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        {!loading && listings.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Filter className="w-4 h-4" />
                {lang === "ar" ? "تصفية" : lang === "fr" ? "Filtrer" : "Filter"}
              </div>

              <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder={lang === "ar" ? "الحالة" : lang === "fr" ? "Statut" : "Status"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "ar" ? "كل الحالات" : lang === "fr" ? "Tous statuts" : "All statuses"}</SelectItem>
                  <SelectItem value="active">{lang === "ar" ? "نشط" : lang === "fr" ? "Actif" : "Active"}</SelectItem>
                  <SelectItem value="archived">{lang === "ar" ? "مؤرشف" : lang === "fr" ? "Archivé" : "Archived"}</SelectItem>
                  <SelectItem value="sold">{lang === "ar" ? "مباع" : lang === "fr" ? "Vendu" : "Sold"}</SelectItem>
                  <SelectItem value="rented">{lang === "ar" ? "مؤجر" : lang === "fr" ? "Loué" : "Rented"}</SelectItem>
                  <SelectItem value="pending">{lang === "ar" ? "معلق" : lang === "fr" ? "En attente" : "Pending"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.property_type} onValueChange={v => setFilters(f => ({ ...f, property_type: v }))}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder={lang === "ar" ? "نوع العقار" : lang === "fr" ? "Type" : "Property type"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{lang === "ar" ? "كل الأنواع" : lang === "fr" ? "Tous types" : "All types"}</SelectItem>
                  {PROPERTY_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder={lang === "ar" ? "سعر أدنى" : lang === "fr" ? "Prix min" : "Min price"}
                  value={filters.minPrice}
                  onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-gray-400 text-xs">—</span>
                <Input
                  type="number"
                  placeholder={lang === "ar" ? "سعر أقصى" : lang === "fr" ? "Prix max" : "Max price"}
                  value={filters.maxPrice}
                  onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  className="w-28 h-8 text-xs"
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs text-gray-500 gap-1">
                  <X className="w-3 h-3" />
                  {lang === "ar" ? "إعادة تعيين" : lang === "fr" ? "Réinitialiser" : "Reset"}
                </Button>
              )}

              <span className="text-xs text-gray-400 ml-auto">
                {filteredListings.length}/{listings.length} {lang === "ar" ? "إعلان" : lang === "fr" ? "annonces" : "listings"}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white h-20 rounded-xl animate-pulse border" />)}</div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-4">{t.noResults}</p>
            <Link to={createPageUrl("PostListing")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">{t.postListing}</Button>
            </Link>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
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