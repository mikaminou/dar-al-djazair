import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { MapPin, Home, ExternalLink, Loader2 } from "lucide-react";

function applyFilters(listings, filters) {
  return listings.filter(l => {
    if (filters.min_price && l.price < Number(filters.min_price)) return false;
    if (filters.max_price && l.price > Number(filters.max_price)) return false;
    if (filters.min_area  && l.area  < Number(filters.min_area))  return false;
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

function formatPrice(price) {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(price % 1_000_000 === 0 ? 0 : 1)}M DA`;
  if (price >= 1_000)    return `${(price / 1_000).toFixed(0)}K DA`;
  return `${price} DA`;
}

export default function SearchRecommendationsPanel({ search, lang }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true);
      const query = { status: "active" };
      const f = search.filters || {};
      if (f.listing_type)  query.listing_type  = f.listing_type;
      if (f.property_type) query.property_type = f.property_type;
      if (f.wilaya)        query.wilaya        = f.wilaya;
      const raw = await base44.entities.Listing.filter(query, "-created_date", 100).catch(() => []);
      const filtered = applyFilters(raw, f);
      setResults(filtered.slice(0, 5));
      setLoading(false);
    }
    fetchRecommendations();
  }, [search.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">
          {lang === "ar" ? "جارٍ البحث..." : lang === "fr" ? "Recherche en cours..." : "Finding matches..."}
        </span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-6 px-2 text-center">
        <div className="text-3xl mb-2">🏡</div>
        <p className="font-semibold text-gray-700 text-sm mb-1">
          {lang === "ar" ? "لا توجد نتائج حالياً" : lang === "fr" ? "Pas encore de résultats" : "No matches right now"}
        </p>
        <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
          {lang === "ar"
            ? "لا توجد عقارات مطابقة حالياً، لكن إعلانات جديدة تُضاف يومياً — تحقق قريباً!"
            : lang === "fr"
            ? "Aucun bien ne correspond à vos critères pour l'instant, mais de nouvelles annonces sont publiées chaque jour — revenez bientôt !"
            : "No properties match your criteria right now, but new listings are added every day — check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
        {lang === "ar" ? `${results.length} عقار مقترح` : lang === "fr" ? `${results.length} bien${results.length > 1 ? "s" : ""} recommandé${results.length > 1 ? "s" : ""}` : `${results.length} recommended propert${results.length > 1 ? "ies" : "y"}`}
      </p>
      {results.map(listing => (
        <a
          key={listing.id}
          href={createPageUrl("ListingDetail") + `?id=${listing.id}`}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
        >
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-gray-200">
            {listing.images?.[0]
              ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Home className="w-5 h-5 text-gray-400" /></div>}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700">{listing.title}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{listing.wilaya}{listing.commune ? `, ${listing.commune}` : ""}</span>
            </div>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatPrice(listing.price)}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}