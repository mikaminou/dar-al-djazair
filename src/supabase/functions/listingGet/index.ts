/**
 * listingGet — public endpoint, no auth required.
 * Payload: { id: string }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

const TYPE_TABLES: Record<string, string> = {
  apartment: "listing_apartments",
  house: "listing_houses",
  villa: "listing_villas",
  land: "listing_lands",
  commercial: "listing_commercials",
  building: "listing_buildings",
  office: "listing_offices",
  farm: "listing_farms",
};

const STRIP = new Set(["listing_id","created_at","updated_at"]);

function flattenRow(row: any, typeRow: any, ownerEmail: string | null) {
  const photos = ((row.listing_photos ?? []) as any[])
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

  const typeFields: Record<string, unknown> = {};
  if (typeRow) {
    for (const [k, v] of Object.entries(typeRow)) {
      if (STRIP.has(k)) continue;
      if (v !== null && v !== undefined) typeFields[k] = v;
    }
  }

  return {
    ...row,
    ...typeFields,
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: ownerEmail,
    area: row.area_value,
    images: photos.map((p: any) => p.watermarked_url || p.url),
    features: row.features ?? [],
    audit_log: row.audit_log ?? [],
    attributes: { area: row.area_value, ...typeFields },
    listing_photos: undefined,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { id } = await req.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });

    const sb = getServiceClient();

    const { data: row, error } = await sb
      .from("listings")
      .select("*, listing_photos(url, watermarked_url, position, is_cover)")
      .eq("id", id)
      .maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    if (!row) return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });

    let typeRow = null;
    const childTable = TYPE_TABLES[row.property_type];
    if (childTable) {
      const { data: tr } = await sb.from(childTable).select("*").eq("listing_id", id).maybeSingle();
      typeRow = tr ?? null;
    }

    let ownerEmail = null;
    if (row.owner_id) {
      const { data: p } = await sb.from("profiles").select("email").eq("id", row.owner_id).maybeSingle();
      ownerEmail = p?.email ?? null;
    }

    return Response.json(flattenRow(row, typeRow, ownerEmail), { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
