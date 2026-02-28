import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle, XCircle, MapPin, Maximize2, BedDouble, Bath, Calendar, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import { formatPrice, PROPERTY_TYPES } from "../components/constants";

const Row = ({ label, val1, val2, highlight }) => {
  const eq = val1 === val2;
  return (
    <tr className={`border-b border-gray-100 ${highlight ? "bg-gray-50" : "bg-white"}`}>
      <td className="py-3 px-4 text-xs font-medium text-gray-500 w-1/4">{label}</td>
      <td className={`py-3 px-4 text-sm text-center ${!eq ? "text-emerald-700 font-semibold" : "text-gray-700"}`}>{val1 || "—"}</td>
      <td className={`py-3 px-4 text-sm text-center ${!eq ? "text-emerald-700 font-semibold" : "text-gray-700"}`}>{val2 || "—"}</td>
    </tr>
  );
};

const BoolRow = ({ label, val1, val2, highlight }) => (
  <tr className={`border-b border-gray-100 ${highlight ? "bg-gray-50" : "bg-white"}`}>
    <td className="py-3 px-4 text-xs font-medium text-gray-500 w-1/4">{label}</td>
    <td className="py-3 px-4 text-center">{val1 ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}</td>
    <td className="py-3 px-4 text-center">{val2 ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}</td>
  </tr>
);

export default function ComparePage() {
  const { t, lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const ids = params.get("ids")?.split(",") || [];
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (ids.length < 2) { setLoading(false); return; }
      const results = await Promise.all(ids.map(id => base44.entities.Listing.filter({ id }).then(r => r[0])));
      setListings(results.filter(Boolean));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
    </div>
  );

  if (listings.length < 2) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-400">
      <p>{lang === "ar" ? "يرجى اختيار عقارين للمقارنة" : lang === "fr" ? "Veuillez sélectionner 2 biens à comparer" : "Please select 2 properties to compare"}</p>
      <Link to={createPageUrl("Listings")}><Button>{lang === "ar" ? "تصفح العقارات" : lang === "fr" ? "Parcourir les biens" : "Browse Listings"}</Button></Link>
    </div>
  );

  const [a, b] = listings;

  const imgA = a.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";
  const imgB = b.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80";

  const typeLabel = (v) => PROPERTY_TYPES.find(p => p.value === v)?.label || v;

  const furnishedLabel = (v) => {
    if (!v) return null;
    const map = { furnished: lang === "ar" ? "مفروش" : lang === "fr" ? "Meublé" : "Furnished", semi_furnished: lang === "ar" ? "نصف مفروش" : lang === "fr" ? "Semi-meublé" : "Semi-furnished", unfurnished: lang === "ar" ? "غير مفروش" : lang === "fr" ? "Non meublé" : "Unfurnished" };
    return map[v] || v;
  };

  const labels = {
    price: lang === "ar" ? "السعر" : lang === "fr" ? "Prix" : "Price",
    type: lang === "ar" ? "نوع العرض" : lang === "fr" ? "Type d'annonce" : "Listing Type",
    propertyType: lang === "ar" ? "نوع العقار" : lang === "fr" ? "Type de bien" : "Property Type",
    location: lang === "ar" ? "الموقع" : lang === "fr" ? "Localisation" : "Location",
    area: lang === "ar" ? "المساحة" : lang === "fr" ? "Superficie" : "Area (m²)",
    bedrooms: lang === "ar" ? "غرف النوم" : lang === "fr" ? "Chambres" : "Bedrooms",
    bathrooms: lang === "ar" ? "الحمامات" : lang === "fr" ? "Salles de bain" : "Bathrooms",
    rooms: lang === "ar" ? "الغرف" : lang === "fr" ? "Pièces" : "Rooms",
    floor: lang === "ar" ? "الطابق" : lang === "fr" ? "Étage" : "Floor",
    totalFloors: lang === "ar" ? "إجمالي الطوابق" : lang === "fr" ? "Nb étages" : "Total Floors",
    yearBuilt: lang === "ar" ? "سنة البناء" : lang === "fr" ? "Année de construction" : "Year Built",
    furnished: lang === "ar" ? "الأثاث" : lang === "fr" ? "Meublement" : "Furnished",
    featured: lang === "ar" ? "مميز" : lang === "fr" ? "En vedette" : "Featured",
    views: lang === "ar" ? "المشاهدات" : lang === "fr" ? "Vues" : "Views",
    features: lang === "ar" ? "المميزات" : lang === "fr" ? "Équipements" : "Features",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl("Listings")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" />
            {lang === "ar" ? "عودة" : lang === "fr" ? "Retour" : "Back"}
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-800 text-sm">
            {lang === "ar" ? "مقارنة العقارات" : lang === "fr" ? "Comparaison de biens" : "Property Comparison"}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div /> {/* label column spacer */}
          {[a, b].map((listing, idx) => (
            <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-40">
                <img src={idx === 0 ? imgA : imgB} alt={listing.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2">
                  <Badge className={listing.listing_type === "sale" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                    {listing.listing_type === "sale" ? t.sale : t.forRent}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <h2 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{listing.title}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  {listing.commune ? `${listing.commune}, ` : ""}{listing.wilaya}
                </div>
                <div className="text-lg font-bold text-emerald-700">{formatPrice(listing.price, lang)}</div>
                <Link to={createPageUrl(`ListingDetail?id=${listing.id}`)}>
                  <Button size="sm" variant="outline" className="w-full mt-2 text-xs">
                    {t.viewDetails}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 w-1/4">
                  {lang === "ar" ? "المعيار" : lang === "fr" ? "Critère" : "Criteria"}
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-emerald-700">
                  {lang === "ar" ? "العقار الأول" : lang === "fr" ? "Bien 1" : "Property 1"}
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-emerald-700">
                  {lang === "ar" ? "العقار الثاني" : lang === "fr" ? "Bien 2" : "Property 2"}
                </th>
              </tr>
            </thead>
            <tbody>
              <Row label={labels.price} val1={formatPrice(a.price, lang)} val2={formatPrice(b.price, lang)} highlight />
              <Row label={labels.type} val1={a.listing_type === "sale" ? t.sale : t.forRent} val2={b.listing_type === "sale" ? t.sale : t.forRent} />
              <Row label={labels.propertyType} val1={typeLabel(a.property_type)} val2={typeLabel(b.property_type)} highlight />
              <Row label={labels.location} val1={[a.commune, a.wilaya].filter(Boolean).join(", ")} val2={[b.commune, b.wilaya].filter(Boolean).join(", ")} />
              <Row label={labels.area} val1={a.area ? `${a.area} m²` : null} val2={b.area ? `${b.area} m²` : null} highlight />
              <Row label={labels.rooms} val1={a.rooms} val2={b.rooms} />
              <Row label={labels.bedrooms} val1={a.bedrooms} val2={b.bedrooms} highlight />
              <Row label={labels.bathrooms} val1={a.bathrooms} val2={b.bathrooms} />
              <Row label={labels.floor} val1={a.floor != null ? a.floor : null} val2={b.floor != null ? b.floor : null} highlight />
              <Row label={labels.totalFloors} val1={a.total_floors} val2={b.total_floors} />
              <Row label={labels.yearBuilt} val1={a.year_built} val2={b.year_built} highlight />
              <Row label={labels.furnished} val1={furnishedLabel(a.furnished)} val2={furnishedLabel(b.furnished)} />
              <BoolRow label={labels.featured} val1={a.is_featured} val2={b.is_featured} highlight />
              <Row label={labels.views} val1={a.views_count || 0} val2={b.views_count || 0} />
              {/* Features */}
              <tr className="border-b border-gray-100 bg-gray-50">
                <td className="py-3 px-4 text-xs font-medium text-gray-500 align-top">{labels.features}</td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {a.features?.length > 0
                      ? a.features.map(f => <span key={f} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-100">✓ {f}</span>)
                      : <span className="text-gray-300 text-sm">—</span>}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {b.features?.length > 0
                      ? b.features.map(f => <span key={f} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-100">✓ {f}</span>)
                      : <span className="text-gray-300 text-sm">—</span>}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}