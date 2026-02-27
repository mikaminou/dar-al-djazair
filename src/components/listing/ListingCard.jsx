import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MapPin, Maximize2, BedDouble, Bath } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../LanguageContext";
import { formatPrice } from "../constants";

export default function ListingCard({ listing, isFavorite, onToggleFavorite }) {
  const { t, lang } = useLang();

  const mainImage = listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="relative overflow-hidden">
        <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
          <img
            src={mainImage}
            alt={listing.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={listing.listing_type === "sale" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
            {listing.listing_type === "sale" ? t.sale : t.forRent}
          </Badge>
          {listing.is_featured && (
            <Badge className="bg-amber-500 text-white">{t.featured}</Badge>
          )}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite && onToggleFavorite(listing); }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>

      <div className="p-4">
        <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1 hover:text-emerald-700">{listing.title}</h3>
        </Link>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{listing.commune ? `${listing.commune}, ` : ""}{listing.wilaya}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
          {listing.area && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> {listing.area} {t.m2}
            </span>
          )}
          {listing.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3 h-3" /> {listing.bedrooms}
            </span>
          )}
          {listing.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-3 h-3" /> {listing.bathrooms}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-emerald-700">{formatPrice(listing.price, lang)}</span>
            {listing.listing_type === "rent" && listing.price_period === "monthly" && (
              <span className="text-xs text-gray-400 ml-1">{t.perMonth}</span>
            )}
          </div>
          <Link
            to={createPageUrl(`ListingDetail?id=${listing.id}`)}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
          >
            {t.viewDetails} →
          </Link>
        </div>
      </div>
    </div>
  );
}