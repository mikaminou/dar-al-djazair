import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Maximize2, BedDouble, Bath, Heart, Share2, Phone, Mail,
  ChevronLeft, ChevronRight, Calendar, Layers, CheckCircle, ArrowLeft, MessageCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLang } from "../components/LanguageContext";
import { formatPrice, PROPERTY_TYPES } from "../components/constants";
import ListingCard from "../components/listing/ListingCard";

export default function ListingDetailPage() {
  const { t, lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isFav, setIsFav] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msgForm, setMsgForm] = useState({ name: "", phone: "", email: "", content: "" });
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [data, favs] = await Promise.all([
      base44.entities.Listing.filter({ id }),
      base44.entities.Favorite.list().catch(() => [])
    ]);
    if (data.length > 0) {
      setListing(data[0]);
      // increment views
      base44.entities.Listing.update(data[0].id, { views_count: (data[0].views_count || 0) + 1 });
      // load similar
      const sim = await base44.entities.Listing.filter({ property_type: data[0].property_type, status: "active" }, "-created_date", 4);
      setSimilar(sim.filter(l => l.id !== data[0].id).slice(0, 4));
    }
    const favIds = favs.map(f => f.listing_id);
    setFavorites(favIds);
    setIsFav(favIds.includes(id));
    setLoading(false);
  }

  async function toggleFav() {
    if (isFav) {
      const favs = await base44.entities.Favorite.filter({ listing_id: id });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setIsFav(false);
    } else {
      await base44.entities.Favorite.create({ listing_id: id });
      setIsFav(true);
    }
  }

  async function sendMessage() {
    await base44.entities.Message.create({
      listing_id: id,
      sender_email: msgForm.email,
      recipient_email: listing.contact_email || listing.created_by,
      content: `${msgForm.name} (${msgForm.phone}): ${msgForm.content}`,
    });
    setMsgSent(true);
  }

  function share() {
    if (navigator.share) {
      navigator.share({ title: listing.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
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

  const images = listing.images?.length > 0
    ? listing.images
    : ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"];

  const propType = PROPERTY_TYPES.find(p => p.value === listing.property_type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <Link to={createPageUrl("Listings")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" />
            {lang === "ar" ? "عودة للنتائج" : lang === "fr" ? "Retour aux résultats" : "Back to results"}
          </Link>
        </div>
      </div>

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

          {/* Similar Listings */}
          {similar.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 mb-4">{t.similarListings}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similar.map(l => (
                  <ListingCard key={l.id} listing={l} isFavorite={favorites.includes(l.id)} onToggleFavorite={async (lst) => {
                    const isFav2 = favorites.includes(lst.id);
                    if (isFav2) {
                      const favs = await base44.entities.Favorite.filter({ listing_id: lst.id });
                      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
                      setFavorites(p => p.filter(i => i !== lst.id));
                    } else {
                      await base44.entities.Favorite.create({ listing_id: lst.id });
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
          {/* Contact Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-4">
            <h2 className="font-bold text-gray-800 mb-4">{t.contactSeller}</h2>

            {listing.contact_phone && (
              <a href={`tel:${listing.contact_phone}`} className="flex items-center gap-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-3 mb-3 font-medium transition-colors">
                <Phone className="w-5 h-5" /> {listing.contact_phone}
              </a>
            )}

            {msgSent ? (
              <div className="text-center py-4 text-emerald-600 font-medium">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                {lang === "ar" ? "تم إرسال رسالتك!" : lang === "fr" ? "Message envoyé !" : "Message sent!"}
              </div>
            ) : (
              <div className="space-y-3">
                <Input placeholder={t.nameLabel} value={msgForm.name} onChange={e => setMsgForm(f => ({ ...f, name: e.target.value }))} className="text-sm" />
                <Input placeholder={t.phoneLabel} value={msgForm.phone} onChange={e => setMsgForm(f => ({ ...f, phone: e.target.value }))} className="text-sm" />
                <Input placeholder={t.emailLabel} value={msgForm.email} onChange={e => setMsgForm(f => ({ ...f, email: e.target.value }))} className="text-sm" />
                <Textarea placeholder={t.messageLabel} value={msgForm.content} onChange={e => setMsgForm(f => ({ ...f, content: e.target.value }))} rows={3} className="text-sm" />
                <Button onClick={sendMessage} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Mail className="w-4 h-4 mr-2" /> {t.sendMessage}
                </Button>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
              {listing.views_count || 0} {lang === "ar" ? "مشاهدة" : lang === "fr" ? "vues" : "views"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}