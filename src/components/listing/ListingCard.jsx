import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, MapPin, Maximize2, BedDouble, Bath, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../LanguageContext";
import { formatPrice } from "../price.config";
import VerifiedBadge from "../trust/VerifiedBadge";

export default function ListingCard({ listing, isFavorite, onToggleFavorite, onToggleCompare, isCompared }) {
  const { t, lang } = useLang();

  const mainImage = listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 group ${isCompared ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-100"}`}>
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
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm hover:scale-110 transition-transform z-10"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
        </button>
      </div>

      <div className="p-4">
        <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
          <h3 className="text-lg font-bold text-emerald-700">{listing.title}</h3>
        </Link>
        {listing.owner_is_verified && (
          <div className="mb-2">
            <VerifiedBadge type={listing.owner_verification_type || "individual"} size="xs" lang={lang} />
          </div>
        )}

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

        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            <span className="text-lg font-bold text-emerald-700">{formatPrice(listing.price, listing.listing_type, lang)}</span>
          </div>
          {onToggleCompare && (
            <button
              onClick={() => onToggleCompare(listing)}
              className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors ${isCompared ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"}`}
            >
              <Scale className="w-3 h-3" />
              {isCompared
                ? (lang === "ar" ? "إزالة" : lang === "fr" ? "Retirer" : "Remove")
                : (lang === "ar" ? "قارن" : lang === "fr" ? "Comparer" : "Compare")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}