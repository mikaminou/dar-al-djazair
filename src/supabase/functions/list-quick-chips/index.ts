// Mirror of components/quickFilterChips.config.js — keep in sync.
import { corsHeaders } from "../_shared/cors.ts";

const CHIPS = [
  { id: "studios",  filters: { property_type: "apartment", "attributes.bedrooms": 0 },
    label: { fr: "Studios", ar: "ستوديو", en: "Studios" } },
  { id: "f3_plus",  filters: { property_type: "apartment", "attributes.bedrooms": { gte: 3 } },
    label: { fr: "F3 et +", ar: "F3 وأكثر", en: "F3+" } },
  { id: "with_pool", filters: { "attributes.has_pool": true },
    label: { fr: "Avec piscine", ar: "مع مسبح", en: "With pool" } },
];

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "fr";

  const localized = CHIPS.map((c) => ({
    id: c.id,
    filters: c.filters,
    label: c.label[lang as "fr" | "ar" | "en"] ?? c.label.fr,
  }));

  return new Response(JSON.stringify(localized), {
    headers: {
      ...corsHeaders, "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
});