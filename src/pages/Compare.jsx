import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, CheckCircle, XCircle, MapPin, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "../components/LanguageContext";
import { formatPrice, PROPERTY_TYPES } from "../components/constants";
import { getFieldsForType, getPropertyType } from "@/components/propertyTypes.config";
import { resolveAttributes, formatAttributeValue } from "@/utils/listingAttributes";

// ─── Universal fields always shown ────────────────────────────────────────────
const UNIVERSAL_FIELDS = [
  { key: "price",        label: { en: "Price",        fr: "Prix",          ar: "السعر"        }, format: "price" },
  { key: "listing_type", label: { en: "Listing Type", fr: "Type d'annonce",ar: "نوع العرض"    }, format: "listing_type" },
  { key: "property_type",label: { en: "Property Type",fr: "Type de bien",  ar: "نوع العقار"   }, format: "property_type" },
  { key: "wilaya",       label: { en: "Location",     fr: "Localisation",  ar: "الموقع"       }, format: "location" },
  { key: "is_featured",  label: { en: "Featured",     fr: "En vedette",    ar: "مميز"         }, format: "bool" },
  { key: "views_count",  label: { en: "Views",        fr: "Vues",          ar: "المشاهدات"    }, format: "plain" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
const Row = ({ label, cells, highlight }) => (
  <tr className={`border-b border-gray-100 ${highlight ? "bg-gray-50 dark:bg-gray-800/40" : "bg-white dark:bg-gray-900"}`}>
    <td className="py-3 px-4 text-xs font-medium text-gray-500 w-1/4">{label}</td>
    {cells.map((val, i) => {
      const eq = cells.every(v => String(v ?? "") === String(val ?? ""));
      return (
        <td key={i} className={`py-3 px-4 text-sm text-center ${!eq ? "text-emerald-700 font-semibold" : "text-gray-700 dark:text-gray-300"}`}>
          {val || "—"}
        </td>
      );
    })}
  </tr>
);

const BoolRow = ({ label, cells, highlight }) => (
  <tr className={`border-b border-gray-100 ${highlight ? "bg-gray-50 dark:bg-gray-800/40" : "bg-white dark:bg-gray-900"}`}>
    <td className="py-3 px-4 text-xs font-medium text-gray-500 w-1/4">{label}</td>
    {cells.map((val, i) => (
      <td key={i} className="py-3 px-4 text-center">
        {val ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}
      </td>
    ))}
  </tr>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function ComparePage() {
  const { t, lang } = useLang();
  const params = new URLSearchParams(window.location.search);
  const ids = params.get("ids")?.split(",").filter(Boolean) || [];
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

  // ── Determine which attribute fields to show ────────────────────────────────
  const types = [...new Set(listings.map(l => l.property_type))];
  const allSameType = types.length === 1;
  const mixedTypes = types.length > 1;

  // Same type → all fields for that type
  // Mixed types → intersection of field keys across all types
  let dynamicFieldDefs = [];
  if (allSameType) {
    dynamicFieldDefs = getFieldsForType(types[0]);
  } else {
    const fieldSets = types.map(t => new Set(getFieldsForType(t).map(f => f.key)));
    const sharedKeys = getFieldsForType(types[0])
      .map(f => f.key)
      .filter(k => fieldSets.every(s => s.has(k)));
    // Use the field definitions from the first type for shared keys
    const firstFields = getFieldsForType(types[0]);
    dynamicFieldDefs = firstFields.filter(f => sharedKeys.includes(f.key));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const typeLabel = (v) => {
    const found = PROPERTY_TYPES.find(p => p.value === v);
    return found ? (found.label[lang] || found.label.fr || v) : v;
  };

  const getUniversalCellValue = (listing, field) => {
    if (field.format === "price") return formatPrice(listing.price, lang);
    if (field.format === "listing_type") return listing.listing_type === "sale" ? t.sale : t.forRent;
    if (field.format === "property_type") return typeLabel(listing.property_type);
    if (field.format === "location") return [listing.commune, listing.wilaya].filter(Boolean).join(", ");
    if (field.format === "plain") return listing[field.key];
    return listing[field.key];
  };

  const getAttrCellValue = (listing, fieldDef) => {
    const attrs = resolveAttributes(listing);
    const raw = attrs[fieldDef.key];
    if (raw === null || raw === undefined || raw === "") return null;
    return formatAttributeValue(raw, fieldDef, lang);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-white dark:bg-gray-900 border-b px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to={createPageUrl("Listings")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" />
            {lang === "ar" ? "عودة" : lang === "fr" ? "Retour" : "Back"}
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            {lang === "ar" ? "مقارنة العقارات" : lang === "fr" ? "Comparaison de biens" : "Property Comparison"}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Mixed type warning */}
        {mixedTypes && (
          <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {lang === "ar"
                ? "أنواع عقارات مختلفة — يتم عرض الحقول المشتركة فقط."
                : lang === "fr"
                ? "Types de biens différents — seuls les champs communs sont affichés."
                : "Comparing different property types — only common fields are displayed."}
            </span>
          </div>
        )}

        {/* Header cards */}
        <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `1fr repeat(${listings.length}, 1fr)` }}>
          <div /> {/* label column spacer */}
          {listings.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="relative h-40">
                <img
                  src={listing.images?.[0] || "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80"}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge className={listing.listing_type === "sale" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"}>
                    {listing.listing_type === "sale" ? t.sale : t.forRent}
                  </Badge>
                </div>
              </div>
              <div className="p-3">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-2 mb-1">{listing.title}</h2>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 w-1/4">
                  {lang === "ar" ? "المعيار" : lang === "fr" ? "Critère" : "Criteria"}
                </th>
                {listings.map((_, i) => (
                  <th key={i} className="py-3 px-4 text-center text-xs font-semibold text-emerald-700">
                    {lang === "ar" ? `العقار ${i + 1}` : lang === "fr" ? `Bien ${i + 1}` : `Property ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Universal rows */}
              {UNIVERSAL_FIELDS.map((field, idx) => {
                const cells = listings.map(l => getUniversalCellValue(l, field));
                if (field.format === "bool") {
                  return <BoolRow key={field.key} label={field.label[lang] || field.label.en} cells={cells} highlight={idx % 2 === 0} />;
                }
                return <Row key={field.key} label={field.label[lang] || field.label.en} cells={cells.map(v => v ?? null)} highlight={idx % 2 === 0} />;
              })}

              {/* Separator */}
              {dynamicFieldDefs.length > 0 && (
                <tr className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
                  <td colSpan={1 + listings.length} className="py-2 px-4 text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    {lang === "ar" ? "تفاصيل العقار" : lang === "fr" ? "Détails du bien" : "Property Details"}
                  </td>
                </tr>
              )}

              {/* Dynamic attribute rows */}
              {dynamicFieldDefs.map((fieldDef, idx) => {
                const cells = listings.map(l => getAttrCellValue(l, fieldDef));
                // Skip rows where all cells are empty
                if (cells.every(c => !c)) return null;
                const label = fieldDef.label[lang] || fieldDef.label.fr || fieldDef.key;
                if (fieldDef.type === "boolean") {
                  return <BoolRow key={fieldDef.key} label={label} cells={cells.map(v => v && v !== "✗")} highlight={(UNIVERSAL_FIELDS.length + idx) % 2 === 0} />;
                }
                return <Row key={fieldDef.key} label={label} cells={cells} highlight={(UNIVERSAL_FIELDS.length + idx) % 2 === 0} />;
              })}

              {/* Features */}
              <tr className="border-b border-gray-100 bg-gray-50 dark:bg-gray-800/40">
                <td className="py-3 px-4 text-xs font-medium text-gray-500 align-top">
                  {lang === "ar" ? "المميزات" : lang === "fr" ? "Équipements" : "Features"}
                </td>
                {listings.map((listing, i) => (
                  <td key={i} className="py-3 px-4 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {listing.features?.length > 0
                        ? listing.features.map(f => <span key={f} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-100">✓ {f}</span>)
                        : <span className="text-gray-300 text-sm">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}