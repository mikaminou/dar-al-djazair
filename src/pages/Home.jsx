import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Search, TrendingUp, Shield, Star, ArrowRight, Building, Home as HomeIcon, Trees, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ListingCard from "../components/listing/ListingCard";
import { useLang } from "../components/LanguageContext";
import { WILAYAS, PROPERTY_TYPES, formatPrice } from "../components/constants";

export default function HomePage() {
  const { t, lang } = useLang();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({ listing_type: "", property_type: "", wilaya: "" });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const me = await base44.auth.me().catch(() => null);
    const [listingsData, favsData] = await Promise.all([
      base44.entities.Listing.filter({ status: "active" }, "-created_date", 8),
      me
        ? base44.entities.Favorite.filter({ user_email: me.email }).catch(() => [])
        : Promise.resolve([])
    ]);
    setListings(listingsData);
    setFavorites(favsData.map(f => f.listing_id));
    setLoading(false);
  }

  async function toggleFavorite(listing) {
    const me = await base44.auth.me().catch(() => null);
    if (!me) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }
    const existing = favorites.includes(listing.id);
    if (existing) {
      const favs = await base44.entities.Favorite.filter({ listing_id: listing.id, user_email: me?.email });
      if (favs.length > 0) await base44.entities.Favorite.delete(favs[0].id);
      setFavorites(prev => prev.filter(id => id !== listing.id));
    } else {
      await base44.entities.Favorite.create({ listing_id: listing.id, user_email: me?.email });
      setFavorites(prev => [...prev, listing.id]);
    }
  }

  function handleSearch() {
    const params = new URLSearchParams();
    if (filters.listing_type) params.set("listing_type", filters.listing_type);
    if (filters.property_type) params.set("property_type", filters.property_type);
    if (filters.wilaya) params.set("wilaya", filters.wilaya);
    window.location.href = createPageUrl(`Listings?${params.toString()}`);
  }

  const featuredListings = listings.filter(l => l.is_featured);
  const recentListings = listings.slice(0, 8);

  const propertyCategories = [
    { icon: HomeIcon, label: { en: "Apartments", fr: "Appartements", ar: "شقق" }, type: "apartment", count: "2,400+" },
    { icon: Building, label: { en: "Villas", fr: "Villas", ar: "فلل" }, type: "villa", count: "850+" },
    { icon: Trees, label: { en: "Land", fr: "Terrain", ar: "أراضي" }, type: "land", count: "1,100+" },
    { icon: Briefcase, label: { en: "Commercial", fr: "Commercial", ar: "تجاري" }, type: "commercial", count: "430+" },
  ];

  const topWilayas = ["Alger", "Oran", "Constantine", "Annaba", "Tizi Ouzou", "Blida"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO */}
      <div
        className="relative bg-cover bg-center py-24 px-4"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-emerald-700/60" />
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm mb-6">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            {lang === "ar" ? "منصة عقارات الجزائر الأولى" : lang === "fr" ? "La 1ère plateforme immobilière d'Algérie" : "Algeria's #1 Real Estate Platform"}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {lang === "ar" ? "دار الجزائر" : "Dar Al Djazair"}
            <span className="block text-amber-400 text-2xl md:text-3xl font-normal mt-2">{t.tagline}</span>
          </h1>

          {/* Search bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 mt-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={filters.listing_type || "all"} onValueChange={v => setFilters(f => ({ ...f, listing_type: v === "all" ? "" : v }))}>
                <SelectTrigger className="border-gray-200 text-gray-700 min-w-[140px]">
                  <SelectValue placeholder={t.listingType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.listingType}</SelectItem>
                  <SelectItem value="sale">{t.sale}</SelectItem>
                  <SelectItem value="rent">{t.forRent}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.property_type || "all"} onValueChange={v => setFilters(f => ({ ...f, property_type: v === "all" ? "" : v }))}>
                <SelectTrigger className="border-gray-200 text-gray-700 min-w-[160px]">
                  <SelectValue placeholder={t.allTypes} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
                  {PROPERTY_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label[lang] || pt.label.fr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.wilaya || "all"} onValueChange={v => setFilters(f => ({ ...f, wilaya: v === "all" ? "" : v }))}>
                <SelectTrigger className="border-gray-200 text-gray-700 flex-1">
                  <SelectValue placeholder={t.allWilayas} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allWilayas}</SelectItem>
                  {WILAYAS.map(w => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 gap-2 font-semibold">
                <Search className="w-4 h-4" />
                {t.search}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-6 text-white/80 text-sm">
            <span>🏘️ {lang === "ar" ? "٥٠٠٠+ إعلان" : lang === "fr" ? "5000+ annonces" : "5000+ listings"}</span>
            <span>🗺️ {lang === "ar" ? "٥٨ ولاية" : "58 wilayas"}</span>
            <span>✅ {lang === "ar" ? "إعلانات موثوقة" : lang === "fr" ? "Annonces vérifiées" : "Verified listings"}</span>
          </div>
        </div>
      </div>

      {/* PROPERTY TYPES */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {lang === "ar" ? "تصفح حسب النوع" : lang === "fr" ? "Parcourir par type" : "Browse by Type"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {propertyCategories.map(cat => (
            <Link
              key={cat.type}
              to={createPageUrl(`Listings?property_type=${cat.type}`)}
              className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                <cat.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{cat.label[lang] || cat.label.fr}</h3>
              <p className="text-xs text-gray-500 mt-1">{cat.count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* FEATURED LISTINGS */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {lang === "ar" ? "الإعلانات المميزة" : lang === "fr" ? "Annonces en vedette" : "Featured Listings"}
          </h2>
          <Link to={createPageUrl("Listings")} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
            {lang === "ar" ? "عرض الكل" : lang === "fr" ? "Voir tout" : "View all"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.noResults}</p>
            <Link to={createPageUrl("PostListing")} className="mt-4 inline-block">
              <Button className="bg-emerald-600 hover:bg-emerald-700 mt-4">{t.postListing}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.includes(listing.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* TOP WILAYAS */}
      <div className="bg-emerald-800 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">
            {lang === "ar" ? "أبرز الولايات" : lang === "fr" ? "Wilayas Populaires" : "Top Wilayas"}
          </h2>
          <div className="flex flex-wrap gap-3">
            {topWilayas.map(w => (
              <Link
                key={w}
                to={createPageUrl(`Listings?wilaya=${w}`)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium transition-colors"
              >
                {w}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* WHY DAR AL DJAZAIR */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
          {lang === "ar" ? "لماذا دار الجزائر؟" : lang === "fr" ? "Pourquoi Dar Al Djazair ?" : "Why Dar Al Djazair?"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Search, title: lang === "ar" ? "بحث متقدم" : lang === "fr" ? "Recherche Avancée" : "Advanced Search", desc: lang === "ar" ? "ابحث بسهولة حسب الولاية والسعر والنوع" : lang === "fr" ? "Filtrez par wilaya, prix et type de bien" : "Filter by wilaya, price, and property type" },
            { icon: Shield, title: lang === "ar" ? "إعلانات موثوقة" : lang === "fr" ? "Annonces Vérifiées" : "Verified Listings", desc: lang === "ar" ? "كل الإعلانات مراجعة وموثوقة" : lang === "fr" ? "Toutes nos annonces sont vérifiées" : "All listings are reviewed and verified" },
            { icon: TrendingUp, title: lang === "ar" ? "أسعار السوق" : lang === "fr" ? "Prix du Marché" : "Market Prices", desc: lang === "ar" ? "اطلع على أسعار السوق الحقيقية" : lang === "fr" ? "Consultez les vrais prix du marché algérien" : "See real market prices across Algeria" },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 py-14">
        <div className="max-w-3xl mx-auto text-center px-4 text-white">
          <h2 className="text-3xl font-bold mb-3">
            {lang === "ar" ? "هل تريد بيع أو تأجير عقارك؟" : lang === "fr" ? "Vous voulez vendre ou louer votre bien ?" : "Want to sell or rent your property?"}
          </h2>
          <p className="text-emerald-100 mb-6">
            {lang === "ar" ? "انشر إعلانك مجاناً وتواصل مع آلاف المشترين" : lang === "fr" ? "Publiez votre annonce gratuitement et touchez des milliers d'acheteurs" : "Post your listing for free and reach thousands of buyers"}
          </p>
          <Link to={createPageUrl("PostListing")}>
            <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3 text-base">
              {t.postListing} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}