/**
 * ListingCard — universal card component.
 *
 * Variants:
 *   'default'  — public marketplace (favourite + compare)
 *   'compact'  — smaller, no footer, fewer facts
 *   'owner'    — adds edit/delete controls
 *   'admin'    — adds approve/decline controls
 *
 * Dynamic facts and badges are driven entirely by propertyTypes.config.js.
 * No type-specific conditionals live here.
 */
import React, { memo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Heart, Scale, MapPin, Star, Lock, Pencil, Trash2,
  CheckCircle, XCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "../price.config";
import VerifiedBadge from "../trust/VerifiedBadge";
import ListingCardFacts from "./ListingCardFacts";
import ListingCardBadges from "./ListingCardBadges";
import { getAllPropertyTypes } from "../propertyTypes.config";
import { formatDistanceToNow } from "date-fns";
import { fr, ar as arLocale, enUS } from "date-fns/locale";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOCALE_MAP = { fr, ar: arLocale, en: enUS };

function relativeDate(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: LOCALE_MAP[lang] || fr,
    });
  } catch {
    return "";
  }
}

// Status → visual config
const STATUS_CONFIG = {
  active:    { label: null,    overlay: null,       saturate: false },
  pending:   { label: { fr: "En attente", en: "Pending", ar: "قيد المراجعة" }, overlay: null, saturate: false },
  reserved:  { label: { fr: "Réservé",    en: "Reserved", ar: "محجوز" },         overlay: "lock", saturate: true  },
  sold:      { label: { fr: "Vendu",      en: "Sold",     ar: "مُباع" },          overlay: "banner",saturate: true  },
  rented:    { label: { fr: "Loué",       en: "Rented",   ar: "مُؤجَّر" },        overlay: "banner",saturate: true  },
  archived:  { label: { fr: "Archivé",    en: "Archived", ar: "مؤرشف" },          overlay: null,   saturate: true  },
  declined:  { label: { fr: "Refusé",     en: "Declined", ar: "مرفوض" },          overlay: null,   saturate: true  },
  changes_requested: { label: { fr: "Modifications demandées", en: "Changes requested", ar: "تعديلات مطلوبة" }, overlay: null, saturate: false },
};

function getStatusBadgeColor(status) {
  if (status === "active")   return "bg-emerald-600 text-white";
  if (status === "reserved") return "bg-red-600 text-white";
  if (status === "sold")     return "bg-gray-700 text-white";
  if (status === "rented")   return "bg-blue-700 text-white";
  if (status === "pending" || status === "changes_requested") return "bg-amber-500 text-white";
  return "bg-gray-500 text-white";
}

function getTypeBadgeLabel(propertyType, lang) {
  const all = getAllPropertyTypes();
  const found = all.find(t => t.value === propertyType);
  if (!found) return propertyType;
  return found.label?.[lang] || found.label?.fr || propertyType;
}

const isUnavailable = status => ["reserved", "sold", "rented", "deleted", "archived"].includes(status);

// ─── Cover image with carousel ────────────────────────────────────────────────
const CardCover = memo(function CardCover({ listing, lang, showCompact }) {
  const images = listing.images?.filter(Boolean) || [];
  const mainImage = images[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const current = images[idx] || mainImage;
  const hasMultiple = images.length > 1;
  const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.active;
  const unavail = isUnavailable(listing.status);
  const detailUrl = createPageUrl(`ListingDetail?id=${listing.id}`);

  const go = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    setIdx(prev => (prev + dir + images.length) % images.length);
  }, [images.length]);

  return (
    <div
      className="relative overflow-hidden bg-gray-100"
      style={{ aspectRatio: "4/3" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {unavail ? (
        <div className={`w-full h-full ${statusCfg.saturate ? "saturate-50" : ""}`}>
          <img src={current} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <Link to={detailUrl} tabIndex={-1}>
          <img src={current} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        </Link>
      )}

      {/* Status overlay banner */}
      {statusCfg.overlay === "banner" && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
          <span className="text-white font-bold text-2xl uppercase tracking-widest opacity-90 rotate-[-20deg] border-4 border-white px-4 py-1 rounded">
            {statusCfg.label?.[lang] || statusCfg.label?.fr}
          </span>
        </div>
      )}
      {statusCfg.overlay === "lock" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-3 pointer-events-none">
          <Lock className="w-6 h-6 text-white" />
        </div>
      )}

      {/* Top-left badges */}
      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 max-w-[60%]">
        {listing.status === "active" || listing.status == null ? (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${listing.listing_type === "sale" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}`}>
            {listing.listing_type === "sale"
              ? (lang === "ar" ? "للبيع" : lang === "fr" ? "À vendre" : "For sale")
              : (lang === "ar" ? "للإيجار" : lang === "fr" ? "À louer" : "For rent")}
          </span>
        ) : (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusBadgeColor(listing.status)}`}>
            {statusCfg.label?.[lang] || statusCfg.label?.fr || listing.status}
          </span>
        )}
        {listing.is_featured && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            {lang === "ar" ? "مميز" : lang === "fr" ? "À la une" : "Featured"}
          </span>
        )}
      </div>

      {/* Top-right: property type chip */}
      <div className="absolute top-2 right-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
          {getTypeBadgeLabel(listing.property_type, lang)}
        </span>
      </div>

      {/* Exclusive badge */}
      {listing.is_exclusive && (
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-600 text-white">
            <Star className="w-3 h-3" />
            {lang === "ar" ? "حصري" : lang === "fr" ? "Exclusif" : "Exclusive"}
          </span>
        </div>
      )}

      {/* Carousel arrows — desktop only, on hover */}
      {hasMultiple && hovered && (
        <>
          <button
            onClick={e => go(e, -1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-opacity hidden sm:flex"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={e => go(e, 1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow transition-opacity hidden sm:flex"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.slice(0, 5).map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// ─── Main card ────────────────────────────────────────────────────────────────
const ListingCard = memo(function ListingCard({
  listing,
  variant = "default",
  isFavorite,
  onToggleFavorite,
  onToggleCompare,
  isCompared,
  onEdit,
  onDelete,
  onApprove,
  onDecline,
  lang = "fr",
  // Legacy prop support
  language,
}) {
  const effectiveLang = language || lang;
  const maxFacts = 3;
  const maxBadges = 3;

  const unavail = isUnavailable(listing.status);
  const detailUrl = createPageUrl(`ListingDetail?id=${listing.id}`);

  const handleFav = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(listing);
  }, [listing, onToggleFavorite]);

  return (
    <div
      className={`
        bg-white dark:bg-[#13161c] rounded-xl border overflow-hidden
        hover:shadow-md transition-all duration-200 group
        ${isCompared ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-100 dark:border-gray-800"}
        ${unavail ? "opacity-75" : ""}
      `}
    >
      {/* Cover */}
      <div className="relative">
        <CardCover listing={listing} lang={effectiveLang} showCompact={variant === "compact"} />

        {/* Favourite button (default + compact variants) */}
        {(variant === "default" || variant === "compact") && (
          <button
            onClick={handleFav}
            className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:scale-110 transition-transform z-10"
            aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Title */}
        {unavail ? (
          <p className="font-semibold text-gray-500 text-sm mb-1 line-clamp-1">{listing.title}</p>
        ) : (
          <Link to={detailUrl}>
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-1 hover:text-emerald-700 transition-colors">
              {listing.title}
            </p>
          </Link>
        )}

        {/* Verified badge */}
        {listing.owner_is_verified && (
          <div className="mb-1.5">
            <VerifiedBadge type={listing.owner_verification_type || "individual"} size="xs" lang={effectiveLang} />
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-2.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {listing.commune ? `${listing.commune}, ` : ""}{listing.wilaya}
          </span>
        </div>

        {/* Dynamic facts row */}
        <div className="mb-2">
          <ListingCardFacts listing={listing} lang={effectiveLang} maxFacts={maxFacts} />
        </div>

        {/* Dynamic badges */}
        <ListingCardBadges listing={listing} lang={effectiveLang} maxBadges={maxBadges} />

        {/* Price row */}
        <div className={`flex items-center justify-between ${variant === "compact" ? "mt-2" : "mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800"}`}>
          <div>
            {listing.hide_price ? (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {effectiveLang === "ar" ? "السعر عند الاتصال" : effectiveLang === "fr" ? "Prix sur demande" : "Price on request"}
              </span>
            ) : (
              <span className="text-base font-bold text-emerald-700">
                {formatPrice(listing.price, listing.listing_type, effectiveLang)}
              </span>
            )}
          </div>

          {/* Compare button — default variant only */}
          {variant === "default" && onToggleCompare && (
            <button
              onClick={() => onToggleCompare(listing)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors ${
                isCompared
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <Scale className="w-3 h-3" />
              {isCompared
                ? (effectiveLang === "ar" ? "إزالة" : effectiveLang === "fr" ? "Retirer" : "Remove")
                : (effectiveLang === "ar" ? "قارن" : effectiveLang === "fr" ? "Comparer" : "Compare")}
            </button>
          )}

          {/* Owner controls */}
          {variant === "owner" && (
            <div className="flex items-center gap-1.5">
              {onEdit && (
                <button onClick={() => onEdit(listing)} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(listing)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Admin controls */}
          {variant === "admin" && (
            <div className="flex items-center gap-1.5">
              {onApprove && (
                <button onClick={() => onApprove(listing)} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
              {onDecline && (
                <button onClick={() => onDecline(listing)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors" title="Decline">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer — hidden in compact variant */}
        {variant !== "compact" && (
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span className="truncate max-w-[60%]">
              {listing.contact_name || ""}
            </span>
            <span>{relativeDate(listing.active_since || listing.created_date, effectiveLang)}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default ListingCard;