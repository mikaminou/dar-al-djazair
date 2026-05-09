/**
 * listingList — public endpoint, no auth required.
 * Queries `listings`, joins per-type tables, resolves owner emails.
 * Payload: { query?, sort?, limit? }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabaseAdmin.ts";

const LISTING_COLUMNS = new Set([
  "title","description","listing_type","property_type","price",
  "wilaya","commune","address","status","is_exclusive",
  "contact_name","contact_phone","contact_email",
  "admin_note","active_since","is_featured","views_count",
  "agent_id","owner_is_verified","owner_verification_type",
  "exclusivity_conflict","conflict_listing_id",
  "hide_price","hide_location","price_period","currency",
  "watermark_status","rejection_reason",
]);

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

function resolveSortColumn(field: string) {
  if (field === "created_date") return "created_at";
  if (field === "updated_date") return "updated_at";
  if (field === "area") return "normalized_area_m2";
  return LISTING_COLUMNS.has(field) || ["created_at","updated_at","normalized_area_m2","price"].includes(field)
    ? field
    : "created_at";
}

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
    const { query = {}, sort = "-created_date", limit = 100 } =
      await req.json().catch(() => ({}));

    const sb = getServiceClient();
    let q: any = sb.from("listings").select("*, listing_photos(url, watermarked_url, position, is_cover)");

    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      if (value === undefined || value === null) continue;
      if (key === "created_by") {
        const { data: prof } = await sb.from("profiles").select("id").eq("email", value).maybeSingle();
        if (!prof) return Response.json([], { headers: corsHeaders });
        q = q.eq("owner_id", prof.id);
      } else if (key === "id") {
        q = q.eq("id", value);
      } else if (key === "area") {
        q = q.eq("area_value", value);
      } else if (LISTING_COLUMNS.has(key)) {
        q = q.eq(key, value);
      }
    }

    const desc = (sort as string).startsWith("-");
    const rawField = desc ? (sort as string).slice(1) : (sort as string);
    q = q.order(resolveSortColumn(rawField), { ascending: !desc, nullsFirst: false });
    q = q.limit(Math.min(limit ?? 100, 500));

    const { data, error } = await q;
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

    const rows: any[] = data ?? [];
    const ownerIds = [...new Set(rows.map((r: any) => r.owner_id).filter(Boolean))];
    let emailById: Record<string, string> = {};
    if (ownerIds.length > 0) {
      const { data: profs } = await sb.from("profiles").select("id, email").in("id", ownerIds);
      emailById = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.email]));
    }

    const idsByType: Record<string, string[]> = {};
    for (const r of rows) {
      if (!TYPE_TABLES[r.property_type]) continue;
      (idsByType[r.property_type] ||= []).push(r.id);
    }
    const typeRowById: Record<string, unknown> = {};
    await Promise.all(Object.entries(idsByType).map(async ([t, ids]) => {
      const { data: trs } = await sb.from(TYPE_TABLES[t]).select("*").in("listing_id", ids);
      for (const tr of (trs ?? []) as any[]) typeRowById[tr.listing_id] = tr;
    }));

    return Response.json(
      rows.map((r: any) => flattenRow(r, typeRowById[r.id] ?? null, emailById[r.owner_id] ?? null)),
      { headers: corsHeaders }
    );
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
