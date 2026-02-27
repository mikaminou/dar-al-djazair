import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import ListingCard from "../components/listing/ListingCard";
import { useLang } from "../components/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const { t, lang } = useLang();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const favs = await base44.entities.Favorite.list().catch(() => []);
    const favIds = favs.map(f => f.listing_id);
    setFavorites(favIds);
    if (favIds.length > 0) {
      const all = await Promise.all(favIds.map(id => base44.entities.Listing.filter({ id })));
      setListings(all.flat().filter(Boolean));
    }
    setLoading(false);
  }

  async function toggleFavorite(listing) {
    const isFav = favorites.includes(listing.id);
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setFavorites(prev => prev.filter(id => id !== listing.id));
      setListings(prev => prev.filter(l => l.id !== listing.id));
    } else {
      await base44.entities.Favorite.create({ listing_id: listing.id });
      setFavorites(prev => [...prev, listing.id]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 fill-white" /> {t.favorites}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="bg-white h-64 rounded-xl animate-pulse border" />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <Heart className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-lg mb-4">{lang === "ar" ? "لا توجد إعلانات محفوظة" : lang === "fr" ? "Aucun favori sauvegardé" : "No saved listings yet"}</p>
            <Link to={createPageUrl("Listings")}>
              <Button className="bg-emerald-600 hover:bg-emerald-700">{t.search}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} isFavorite={favorites.includes(listing.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}