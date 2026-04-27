// Mirror of components/propertyTypes.config.js — keep in sync.
import { corsHeaders } from "../_shared/cors.ts";

const CONFIG = {
  property_types: [
    { value: "apartment",  label: { fr: "Appartement",      ar: "شقة",        en: "Apartment" } },
    { value: "house",      label: { fr: "Maison",            ar: "منزل",       en: "House" } },
    { value: "villa",      label: { fr: "Villa",             ar: "فيلا",       en: "Villa" } },
    { value: "land",       label: { fr: "Terrain",           ar: "أرض",        en: "Land" } },
    { value: "commercial", label: { fr: "Local commercial",  ar: "محل تجاري",  en: "Commercial" } },
    { value: "building",   label: { fr: "Immeuble",          ar: "عمارة",      en: "Building" } },
    { value: "office",     label: { fr: "Bureau",            ar: "مكتب",       en: "Office" } },
    { value: "farm",       label: { fr: "Ferme",             ar: "مزرعة",      en: "Farm" } },
  ],
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "fr";

  const localized = {
    property_types: CONFIG.property_types.map((p) => ({
      value: p.value,
      label: p.label[lang as "fr" | "ar" | "en"] ?? p.label.fr,
    })),
  };

  return new Response(JSON.stringify(localized), {
    headers: {
      ...corsHeaders, "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
});