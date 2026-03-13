import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, BedDouble, Bath, Heart, Share2, Phone, Mail,
  ChevronLeft, ChevronRight, Calendar, Layers, CheckCircle, ArrowLeft, MessageCircle, Send, AlertCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLang } from "../components/LanguageContext";
import { formatPrice, PROPERTY_TYPES } from "../components/constants";
import ListingCard from "../components/listing/ListingCard";
import ListingMap from "../components/listing/ListingMap";
import FullscreenGallery from "../components/listing/FullscreenGallery";
import BookingWidget from "../components/booking/BookingWidget";

export default function ListingDetailPage() {
  const { t, lang } = useLang();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [user, setUser] = useState(null);
  const [ownerName, setOwnerName] = useState(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => null); }, []);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  useEffect(() => {
    if (id) {
      setListing(null);
      setImgIndex(0);
      setMsgSent(false);
      setMsgText("");
      setOwnerName(null);
      loadData();
    }
  }, [id]);

  async function loadData() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    const [data, favs] = await Promise.all([
      base44.entities.Listing.filter({ id }),
      me
        ? base44.entities.Favorite.filter({ user_email: me.email }).catch(() => [])
        : Promise.resolve([])
    ]);
    if (data.length > 0) {
      setListing(data[0]);
      // increment views only once per user (unique view tracking via localStorage)
      const viewKey = `dari_viewed_${data[0].id}_${me?.email || 'anon'}`;
      if (!localStorage.getItem(viewKey)) {
        localStorage.setItem(viewKey, '1');
        base44.entities.Listing.update(data[0].id, { views_count: (data[0].views_count || 0) + 1 });
      }
      // load similar
      const sim = await base44.entities.Listing.filter({ property_type: data[0].property_type, status: "active" }, "-created_date", 4);
      setSimilar(sim.filter(l => l.id !== data[0].id).slice(0, 4));
      // fetch owner's real display name
      if (data[0].created_by) {
        base44.entities.User.filter({ email: data[0].created_by }).then(users => {
          if (users.length > 0 && users[0].full_name) setOwnerName(users[0].full_name);
        }).catch(() => {});
      }
    }
    const favIds = favs.map(f => f.listing_id);
    setFavorites(favIds);
    setIsFav(favIds.includes(id));
    setLoading(false);
  }

  async function toggleFav() {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: id, user_email: me?.email });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setIsFav(false);
    } else {
      await base44.entities.Favorite.create({ listing_id: id, user_email: me?.email });
      setIsFav(true);
    }
  }

  function threadId() {
    const emails = [user?.email || "guest", listing.contact_email || listing.created_by || "owner"].sort();
    return [id, ...emails].join("__");
  }

  async function sendMessage() {
    if (!msgText.trim()) return;
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    const sender = user.email;
    const recipient = listing.contact_email || listing.created_by || "";
    await base44.entities.Message.create({
      listing_id: id,
      sender_email: sender,
      recipient_email: recipient,
      content: msgText.trim(),
      thread_id: threadId(),
      is_read: false,
    });
    setMsgSent(true);
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(lang === "ar" ? "تم نسخ الرابط!" : lang === "fr" ? "Lien copié !" : "Link copied!");
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">{t.noResults}</div>
  );

  const isUnavailable = ["reserved", "sold", "rented", "deleted"].includes(listing.status);
  const isOwner = user && (user.email === listing.created_by || user.email === listing.contact_email);

  const images = listing.images?.length > 0
    ? listing.images
    : ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"];

  const propType = PROPERTY_TYPES.find(p => p.value === listing.property_type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="bg-white border-b px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto">
          {canGoBack ? (
            <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500">
              <ArrowLeft className="w-4 h-4" />
              {lang === "ar" ? "رجوع" : lang === "fr" ? "Retour" : "Back"}
            </button>
          ) : (
            <Link to={createPageUrl("Listings")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700 dark:text-gray-400 dark:hover:text-emerald-500">
              <ArrowLeft className="w-4 h-4" />
              {lang === "ar" ? "عودة للنتائج" : lang === "fr" ? "Retour aux résultats" : "Back to results"}
            </Link>
          )}
        </div>
      </div>

      {isUnavailable && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-amber-800 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {listing.status === "sold"
              ? (lang === "ar" ? "تم بيع هذا العقار." : lang === "fr" ? "Ce bien a été vendu." : "This property has been sold.")
              : listing.status === "rented"
              ? (lang === "ar" ? "تم تأجير هذا العقار." : lang === "fr" ? "Ce bien a été loué." : "This property has been rented.")
              : (lang === "ar" ? "هذا الإعلان لم يعد متاحاً." : lang === "fr" ? "Cette annonce n'est plus disponible." : "This listing is no longer available.")}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image Gallery */}
          <div className="relative bg-black rounded-2xl overflow-hidden h-80 md:h-[420px]">
            <img src={images[imgIndex]} alt={listing.title} className="w-full h-full object-cover" />
            {images.length > 1 && (
              <>
                <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setImgIndex(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <div key={i} onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full cursor-pointer ${i === imgIndex ? "bg-white" : "bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className={listing.listing_type === "sale" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                {listing.listing_type === "sale" ? t.sale : t.forRent}
              </Badge>
              {listing.is_featured && <Badge className="bg-amber-500 text-white">{t.featured}</Badge>}
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <img key={i} src={img} onClick={() => setImgIndex(i)} alt="" className={`w-16 h-12 object-cover rounded-lg cursor-pointer flex-shrink-0 ${i === imgIndex ? "ring-2 ring-emerald-500" : "opacity-70"}`} />
              ))}
            </div>
          )}

          {/* Title & Price */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">{listing.title}</h1>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  {listing.commune ? `${listing.commune}, ` : ""}{listing.wilaya}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-700">{formatPrice(listing.price, lang)}</div>
                {listing.listing_type === "rent" && <div className="text-xs text-gray-400">{t.perMonth}</div>}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
              {listing.area && <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4 text-emerald-500" /> {listing.area} m²</span>}
              {listing.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-emerald-500" /> {listing.bedrooms} {t.bedrooms}</span>}
              {listing.bathrooms && <span className="flex items-center gap-1"><Bath className="w-4 h-4 text-emerald-500" /> {listing.bathrooms} {t.bathrooms}</span>}
              {listing.floor != null && <span className="flex items-center gap-1"><Layers className="w-4 h-4 text-emerald-500" /> {t.floor} {listing.floor}</span>}
              {listing.year_built && <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-emerald-500" /> {listing.year_built}</span>}
              {listing.furnished && <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-emerald-500" /> {t.furnished}</span>}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={toggleFav} variant="outline" className={`gap-2 ${isFav ? "text-red-500 border-red-200" : ""}`}>
                <Heart className={`w-4 h-4 ${isFav ? "fill-red-500" : ""}`} />
                {isFav ? t.removeFromFavorites : t.addToFavorites}
              </Button>
              <Button onClick={share} variant="outline" className="gap-2">
                <Share2 className="w-4 h-4" /> {t.share}
              </Button>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3">{t.description}</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Features */}
          {listing.features?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3">{t.features}</h2>
              <div className="flex flex-wrap gap-2">
                {listing.features.map(f => (
                  <span key={f} className="bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-full border border-emerald-100">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <ListingMap latitude={listing.latitude} longitude={listing.longitude} title={listing.title} />

          {/* Similar Listings */}
          {similar.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 mb-4">{t.similarListings}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similar.map(l => (
                  <ListingCard key={l.id} listing={l} isFavorite={favorites.includes(l.id)} onToggleFavorite={async (lst) => {
                    const me2 = await base44.auth.me().catch(() => null);
                    if (!me2) { base44.auth.redirectToLogin(window.location.pathname + window.location.search); return; }
                    const isFav2 = favorites.includes(lst.id);
                    if (isFav2) {
                      const favs = await base44.entities.Favorite.filter({ listing_id: lst.id, user_email: me2.email });
                      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
                      setFavorites(p => p.filter(i => i !== lst.id));
                    } else {
                      await base44.entities.Favorite.create({ listing_id: lst.id, user_email: me2.email });
                      setFavorites(p => [...p, lst.id]);
                    }
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
            {listing.created_by && (
              <Link
                to={createPageUrl(`Profile?email=${listing.created_by}`)}
                className="flex items-center gap-3 px-5 py-4 bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(ownerName || listing.contact_name || listing.created_by)?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{ownerName || listing.contact_name || listing.created_by}</div>
                  <div className="text-xs text-emerald-600">
                    {lang === "ar" ? "عرض الملف الشخصي" : lang === "fr" ? "Voir le profil" : "View profile"}
                  </div>
                </div>
              </Link>
            )}
            <div className="p-5 space-y-3">
              {listing.contact_phone && (
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 font-semibold transition-colors text-sm"
                >
                  <Phone className="w-5 h-5" />
                  {listing.contact_phone}
                </a>
              )}
              {isOwner ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3 text-xs text-emerald-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {lang === "ar" ? "أنت صاحب هذا الإعلان." : lang === "fr" ? "Vous êtes le propriétaire de cette annonce." : "You own this listing."}
                </div>
              ) : isUnavailable ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 text-xs text-amber-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {listing.status === "reserved"
                    ? (lang === "ar" ? "هذا العقار محجوز حالياً." : lang === "fr" ? "Ce bien est actuellement réservé." : "This property is currently reserved.")
                    : listing.status === "sold"
                    ? (lang === "ar" ? "تم بيع هذا العقار." : lang === "fr" ? "Ce bien a été vendu." : "This property has been sold.")
                    : listing.status === "rented"
                    ? (lang === "ar" ? "تم تأجير هذا العقار." : lang === "fr" ? "Ce bien a été loué." : "This property has been rented.")
                    : (lang === "ar" ? "هذا الإعلان لم يعد متاحاً." : lang === "fr" ? "Cette annonce n'est plus disponible." : "This listing is no longer available.")}
                </div>
              ) : msgSent ? (
                <div className="text-center py-5 text-emerald-600 font-medium">
                  <CheckCircle className="w-9 h-9 mx-auto mb-2" />
                  <p className="text-sm">{lang === "ar" ? "تم إرسال رسالتك!" : lang === "fr" ? "Message envoyé !" : "Message sent!"}</p>
                  <button onClick={() => setMsgSent(false)} className="text-xs text-gray-400 underline mt-1">
                    {lang === "ar" ? "إرسال رسالة أخرى" : lang === "fr" ? "Envoyer un autre" : "Send another"}
                  </button>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <Textarea
                    placeholder={lang === "ar" ? "اكتب رسالتك هنا..." : lang === "fr" ? "Écrivez votre message..." : "Write your message..."}
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                  />
                  <Button onClick={sendMessage} disabled={!msgText.trim()} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                    <MessageCircle className="w-4 h-4" />
                    {lang === "ar" ? "إرسال رسالة" : lang === "fr" ? "Envoyer un message" : "Send Message"}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin(window.location.pathname + window.location.search)}
                  className="w-full flex items-center justify-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {lang === "ar" ? "سجّل دخول للتواصل مع البائع" : lang === "fr" ? "Connectez-vous pour contacter le vendeur" : "Sign in to contact the seller"}
                </button>
              )}
              {!isOwner && (
                <BookingWidget
                  listingId={id}
                  agentEmail={listing.contact_email || listing.created_by}
                  listing={listing}
                  user={user}
                />
              )}
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 text-center">
                {listing.views_count || 0} {lang === "ar" ? "مشاهدة" : lang === "fr" ? "vues" : "views"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}