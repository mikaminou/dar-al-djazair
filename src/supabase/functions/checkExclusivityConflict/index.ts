/**
 * checkExclusivityConflict — check if a listing conflicts with an exclusive listing.
 * Payload: { listing_id: string }
 * Auth: any authenticated user (called after listing creation)
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUser } from "../_shared/supabaseAdmin.ts";

const DUPLICATE_DETECTION_CONFIG: Record<string, Array<{ field: string; tolerance: number | null; source: "listing" | "attr" }>> = {
  apartment: [
    { field: "wilaya", tolerance: null, source: "listing" },
    { field: "commune", tolerance: null, source: "listing" },
    { field: "bedrooms", tolerance: null, source: "attr" },
    { field: "bathrooms", tolerance: null, source: "attr" },
    { field: "price", tolerance: 0.10, source: "listing" },
    { field: "area", tolerance: 0.10, source: "attr" },
  ],
  house:  [{ field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"bedrooms",tolerance:null,source:"attr"},{field:"price",tolerance:0.10,source:"listing"},{field:"area",tolerance:0.10,source:"attr"}],
  villa:  [{ field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"bedrooms",tolerance:null,source:"attr"},{field:"price",tolerance:0.10,source:"listing"},{field:"area",tolerance:0.10,source:"attr"}],
  land:   [{ field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"area",tolerance:0.10,source:"attr"},{field:"frontage_meters",tolerance:0.10,source:"attr"}],
  building:[{field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"total_units",tolerance:0.10,source:"attr"},{field:"total_area",tolerance:0.10,source:"attr"}],
  farm:   [{ field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"total_area",tolerance:0.10,source:"attr"}],
  commercial:[{field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"price",tolerance:0.10,source:"listing"},{field:"area",tolerance:0.10,source:"attr"}],
  office: [{ field:"wilaya",tolerance:null,source:"listing"},{field:"commune",tolerance:null,source:"listing"},{field:"price",tolerance:0.10,source:"listing"},{field:"area",tolerance:0.10,source:"attr"}],
};
const GENERIC_FALLBACK = [
  { field:"wilaya",tolerance:null,source:"listing" as const },
  { field:"commune",tolerance:null,source:"listing" as const },
  { field:"price",tolerance:0.10,source:"listing" as const },
  { field:"area",tolerance:0.10,source:"attr" as const },
];

function withinTolerance(a: unknown, b: unknown, pct: number) {
  const na = Number(a), nb = Number(b);
  if (isNaN(na)||isNaN(nb)||na===0||nb===0) return false;
  return Math.abs(na-nb)/Math.max(na,nb) <= pct;
}

function getAttr(listing: any, key: string) {
  return listing.attributes?.[key] ?? listing[key];
}

function isPotentialDuplicate(ref: any, cand: any) {
  const rules = DUPLICATE_DETECTION_CONFIG[ref.property_type] ?? GENERIC_FALLBACK;
  for (const rule of rules) {
    const rv = rule.source==="listing" ? ref[rule.field]  : getAttr(ref, rule.field);
    const cv = rule.source==="listing" ? cand[rule.field] : getAttr(cand, rule.field);
    if (rule.tolerance===null) {
      if (!rv||!cv) return false;
      if (String(rv).toLowerCase().trim()!==String(cv).toLowerCase().trim()) return false;
    } else {
      if (!withinTolerance(rv, cv, rule.tolerance)) return false;
    }
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { listing_id } = await req.json();
    if (!listing_id) return Response.json({ error: "listing_id required" }, { status: 400, headers: corsHeaders });

    const sb = getServiceClient();

    const { data: newListing } = await sb.from("listings").select("*").eq("id", listing_id).maybeSingle();
    if (!newListing) return Response.json({ error: "Listing not found" }, { status: 404, headers: corsHeaders });

    const { data: candidates } = await sb.from("listings").select("*")
      .eq("wilaya", newListing.wilaya)
      .eq("property_type", newListing.property_type)
      .eq("listing_type", newListing.listing_type)
      .eq("is_exclusive", true)
      .eq("status", "active")
      .limit(100);

    let conflictListing: any = null;
    for (const c of candidates ?? []) {
      if (c.id === listing_id) continue;
      if (isPotentialDuplicate(newListing, c)) { conflictListing = c; break; }
    }

    if (!conflictListing) return Response.json({ conflict: false }, { headers: corsHeaders });

    // Flag the new listing
    const logEntry = `[SYSTEM] Exclusivity conflict detected with listing #${conflictListing.id} on ${new Date().toISOString()}`;
    await sb.from("listings").update({
      exclusivity_conflict: true,
      conflict_listing_id: conflictListing.id,
      audit_log: [...(newListing.audit_log ?? []), logEntry],
    }).eq("id", listing_id);

    // Notify admins
    const { data: admins } = await sb.from("profiles").select("email").eq("account_type", "admin");
    await Promise.all((admins ?? []).map((admin: any) =>
      sb.from("notifications").insert({
        user_email: admin.email,
        type: "listing_match",
        title: "⚠️ Exclusivity Conflict Detected",
        body: `Listing "${newListing.title}" (${newListing.wilaya}) may duplicate an exclusive property.`,
        url: "AdminVerification",
        is_read: false,
        ref_id: `exclusivity_conflict_${listing_id}`,
      }).then(() => {}, () => {})
    ));

    return Response.json({ conflict: true, conflict_listing_id: conflictListing.id }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
