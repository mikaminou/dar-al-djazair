import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Users, BarChart3, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import { formatPrice } from "../components/constants";

export default function MyListingsPage() {
  const { t, lang } = useLang();
  const [listings, setListings] = useState([]);
  const [leadCounts, setLeadCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    if (!user) { setLoading(false); return; }
    const [data, leads] = await Promise.all([
      base44.entities.Listing.filter({ created_by: user.email }, "-created_date", 50),
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
    // Soft-hide all messages for this listing from the owner's view
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
  }

  const statusColor = { active: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", archived: "bg-gray-100 text-gray-500", sold: "bg-blue-100 text-blue-700", rented: "bg-purple-100 text-purple-700" };

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

      <div className="max-w-5xl mx-auto px-4 py-8">
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
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleStatus(listing)}
                    title={listing.status === "active" ? "Archive" : "Activate"}
                    className="text-gray-400 hover:text-emerald-600"
                  >
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