/**
 * entityCrud — generic CRUD router for all non-listing entities.
 *
 * Replaces the 24 individual *Crud Supabase functions (favoriteCrud,
 * messageCrud, leadCrud, …). The frontend sends:
 *   { entity: "Favorite", operation: "list"|"get"|"create"|"update"|"delete",
 *     query?, sort?, limit?, id?, data? }
 *
 * Special handling:
 *   • AgencyOffice  – agent_email is mapped to agency_id FK via profiles
 *   • Project / ProjectLot / ProjectLotType – attributes stored in jsonb `data`
 *   • UpgradeRequest – attributes stored in jsonb `data`
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Entity configuration
// ─────────────────────────────────────────────────────────────────────────────

type EntityConfig = {
  table: string;
  /** Column used as ownership/owner filter */
  ownerField?: string;
  /** Columns that are allowed in create/update payloads */
  fields: string[];
  /** true → attributes live in a jsonb `data` column */
  jsonb?: boolean;
};

const ENTITIES: Record<string, EntityConfig> = {
  Favorite: {
    table: "favorites",
    ownerField: "user_email",
    fields: ["listing_id", "user_email"],
  },
  Message: {
    table: "messages",
    ownerField: "sender_email",
    fields: [
      "listing_id", "sender_email", "recipient_email", "content",
      "is_read", "thread_id", "hidden_for", "conversation_id",
    ],
  },
  Lead: {
    table: "leads",
    fields: [
      "listing_id", "listing_title", "listing_wilaya", "agent_email",
      "seeker_email", "search_name", "search_filters", "status",
      "high_priority_alert_sent",
    ],
  },
  AvailabilitySlot: {
    table: "availability_slots",
    ownerField: "agent_email",
    fields: [
      "listing_id", "agent_email", "mode", "date", "recur_day_of_week",
      "date_range_start", "date_range_end", "start_time", "end_time",
      "capacity", "notes", "is_active",
    ],
  },
  Appointment: {
    table: "appointments",
    ownerField: "buyer_email",
    fields: [
      "slot_id", "listing_id", "listing_title", "agent_email", "buyer_email",
      "buyer_name", "buyer_phone", "date", "start_time", "end_time",
      "status", "notes",
    ],
  },
  AppointmentProposal: {
    table: "appointment_proposals",
    ownerField: "proposer_email",
    fields: [
      "thread_id", "listing_id", "listing_title", "proposer_email",
      "other_email", "proposer_name", "proposed_date", "proposed_start_time",
      "proposed_end_time", "status", "notes",
    ],
  },
  Notification: {
    table: "notifications",
    ownerField: "user_email",
    fields: ["user_email", "type", "title", "body", "url", "is_read", "ref_id"],
  },
  NotificationPreference: {
    table: "notification_preferences",
    ownerField: "user_email",
    fields: ["user_email", "push_enabled", "sound_enabled"],
  },
  PushSubscription: {
    table: "push_subscriptions",
    ownerField: "user_email",
    fields: ["user_email", "endpoint", "keys_p256dh", "keys_auth", "is_active"],
  },
  TypingStatus: {
    table: "typing_status",
    ownerField: "typer_email",
    fields: ["thread_id", "typer_email", "typed_at"],
  },
  UserPresence: {
    table: "user_presence",
    ownerField: "user_email",
    fields: ["user_email", "last_seen"],
  },
  VerificationRequest: {
    table: "verification_requests",
    ownerField: "user_email",
    fields: [
      "user_email", "user_name", "type", "document_uri", "document_url",
      "agency_name", "status", "admin_note",
    ],
  },
  Review: {
    table: "reviews",
    ownerField: "reviewer_email",
    fields: [
      "reviewer_email", "reviewer_name", "reviewed_email", "lead_id",
      "listing_id", "listing_title", "rating", "comment",
    ],
  },
  Tenant: {
    table: "tenants",
    ownerField: "landlord_email",
    fields: [
      "listing_id", "property_address", "tenant_name", "tenant_phone",
      "rent_amount", "period_type", "period_months", "total_paid_upfront",
      "period_start_date", "period_end_date", "special_conditions",
      "status", "landlord_email",
    ],
  },
  TenantPayment: {
    table: "tenant_payments",
    ownerField: "landlord_email",
    fields: [
      "tenant_id", "amount", "payment_date", "period_start_date",
      "period_end_date", "reference_number", "landlord_email",
    ],
  },
  Waitlist: {
    table: "waitlists",
    ownerField: "user_email",
    fields: [
      "listing_id", "listing_title", "listing_wilaya", "owner_email",
      "user_email", "user_name", "position", "joined_at", "status", "notes",
    ],
  },
  Client: {
    table: "clients",
    ownerField: "agent_email",
    fields: ["full_name", "phone", "email", "notes", "agent_email"],
  },
  ClientSearchProfile: {
    table: "client_search_profiles",
    ownerField: "agent_email",
    fields: [
      "client_id", "client_name", "agent_email", "name", "filters",
      "alert_enabled", "last_checked",
    ],
  },
  // AgencyOffice is handled separately (agent_email → agency_id FK)
  AgencyOffice: {
    table: "agency_offices",
    fields: [
      "wilaya", "commune", "address", "phone", "email",
      "office_label", "is_primary", "is_verified", "display_order",
    ],
  },
  SavedSearch: {
    table: "saved_searches",
    ownerField: "user_email",
    fields: [
      "name", "user_email", "filters", "financial_state",
      "alert_enabled", "last_checked",
    ],
  },
  // JSONB-based entities
  Project: {
    table: "projects",
    ownerField: "created_by",
    fields: ["created_by"],
    jsonb: true,
  },
  ProjectLot: {
    table: "project_lots",
    ownerField: "created_by",
    fields: ["project_id", "created_by"],
    jsonb: true,
  },
  ProjectLotType: {
    table: "project_lot_types",
    ownerField: "created_by",
    fields: ["project_id", "created_by"],
    jsonb: true,
  },
  UpgradeRequest: {
    table: "upgrade_requests",
    ownerField: "user_email",
    fields: ["user_email"],
    jsonb: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pickFields(cfg: EntityConfig, data: Record<string, unknown>) {
  if (cfg.jsonb) return data; // pass-through; stored in jsonb data col
  const out: Record<string, unknown> = {};
  for (const k of cfg.fields) {
    if (k in data) out[k] = data[k];
  }
  return out;
}

function mapRow(row: Record<string, unknown>, cfg: EntityConfig) {
  if (!row) return null;
  if (cfg.jsonb) {
    return {
      id: row.id,
      ...((row.data as Record<string, unknown>) ?? {}),
      created_date: row.created_at,
      updated_date: row.updated_at,
      created_by: row.created_by ?? row.user_email,
    };
  }
  return {
    ...row,
    created_date: row.created_at,
    updated_date: row.updated_at,
  };
}

function applySort(q: unknown, sort: string | undefined, cfg: EntityConfig) {
  if (!sort) {
    (q as any).order("created_at", { ascending: false });
    return q;
  }
  const desc = sort.startsWith("-");
  const raw = desc ? sort.slice(1) : sort;
  const col = raw === "created_date" ? "created_at" : raw === "updated_date" ? "updated_at" : raw;
  (q as any).order(col, { ascending: !desc, nullsFirst: false });
  return q;
}

// ─────────────────────────────────────────────────────────────────────────────
// AgencyOffice: email → profile id resolution
// ─────────────────────────────────────────────────────────────────────────────

async function resolveAgencyId(sb: ReturnType<typeof getServiceClient>, email: string) {
  const { data } = await sb.from("profiles").select("id").ilike("email", email).maybeSingle();
  return data?.id ?? null;
}

async function rowsWithAgentEmail(
  sb: ReturnType<typeof getServiceClient>,
  rows: Record<string, unknown>[]
) {
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.agency_id).filter(Boolean))];
  const { data: profs } = ids.length
    ? await sb.from("profiles").select("id,email").in("id", ids)
    : { data: [] };
  const idToEmail = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.email]));
  return rows.map((r) => ({
    ...r,
    agent_email: idToEmail[r.agency_id as string] ?? null,
    created_date: r.created_at,
    updated_date: r.updated_at,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { entity, operation, id, data, query, sort, limit } = body;

    const cfg = ENTITIES[entity];
    if (!cfg) {
      return Response.json({ error: `Unknown entity: ${entity}` }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();

    // ── Special path: AgencyOffice ──────────────────────────────────────────
    if (entity === "AgencyOffice") {
      const TABLE = "agency_offices";

      if (operation === "list") {
        let q = sb.from(TABLE).select("*");
        if (query) {
          for (const [k, v] of Object.entries(query as Record<string, string>)) {
            if (k === "agent_email") {
              const aid = await resolveAgencyId(sb, v);
              if (!aid) return Response.json([], { headers: corsHeaders });
              q = q.eq("agency_id", aid);
            } else {
              q = q.eq(k, v);
            }
          }
        }
        if (sort) {
          const desc = sort.startsWith("-");
          q = (q as any).order(desc ? sort.slice(1) : sort, { ascending: !desc });
        } else {
          q = (q as any)
            .order("is_primary", { ascending: false })
            .order("display_order", { ascending: true });
        }
        if (limit) q = (q as any).limit(limit);
        const { data: rows, error } = await q;
        if (error) throw error;
        return Response.json(await rowsWithAgentEmail(sb, rows ?? []), { headers: corsHeaders });
      }

      if (operation === "get") {
        if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
        const { data: row, error } = await sb.from(TABLE).select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        const [mapped] = await rowsWithAgentEmail(sb, row ? [row] : []);
        return Response.json(mapped ?? null, { headers: corsHeaders });
      }

      if (operation === "create") {
        const agencyEmail = (data as any)?.agent_email || user.email;
        const agencyId = await resolveAgencyId(sb, agencyEmail);
        if (!agencyId) {
          return Response.json({ error: "Agency profile not found" }, { status: 400, headers: corsHeaders });
        }
        const picked = pickFields(cfg, data as any);
        const insert: Record<string, unknown> = { ...picked, agency_id: agencyId };
        const { count } = await (sb.from(TABLE).select("id", { count: "exact", head: true }) as any).eq("agency_id", agencyId);
        if (!count) insert.is_primary = true;
        if (insert.is_primary) {
          await (sb.from(TABLE).update({ is_primary: false }) as any)
            .eq("agency_id", agencyId).eq("is_primary", true);
        }
        const { data: row, error } = await sb.from(TABLE).insert(insert).select().single();
        if (error) throw error;
        const [mapped] = await rowsWithAgentEmail(sb, [row]);
        return Response.json(mapped, { headers: corsHeaders });
      }

      if (operation === "update") {
        if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
        const picked = pickFields(cfg, data as any);
        if ((picked as any).is_primary === true) {
          const { data: existing } = await sb.from(TABLE).select("agency_id").eq("id", id).maybeSingle();
          if (existing?.agency_id) {
            await (sb.from(TABLE).update({ is_primary: false }) as any)
              .eq("agency_id", existing.agency_id).neq("id", id);
          }
        }
        const { data: row, error } = await sb.from(TABLE).update(picked).eq("id", id).select().single();
        if (error) throw error;
        const [mapped] = await rowsWithAgentEmail(sb, [row]);
        return Response.json(mapped, { headers: corsHeaders });
      }

      if (operation === "delete") {
        if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
        const { data: target } = await sb.from(TABLE).select("agency_id,is_primary").eq("id", id).maybeSingle();
        const { error } = await sb.from(TABLE).delete().eq("id", id);
        if (error) throw error;
        if (target?.is_primary && target?.agency_id) {
          const { data: next } = await (sb.from(TABLE).select("id") as any)
            .eq("agency_id", target.agency_id)
            .order("display_order", { ascending: true })
            .limit(1);
          if (next?.[0]?.id) {
            await sb.from(TABLE).update({ is_primary: true }).eq("id", next[0].id);
          }
        }
        return Response.json({ success: true }, { headers: corsHeaders });
      }
    }

    // ── Standard path ───────────────────────────────────────────────────────
    if (operation === "list") {
      let q: any = sb.from(cfg.table).select("*");
      if (query) {
        for (const [k, v] of Object.entries(query as Record<string, unknown>)) {
          if (cfg.jsonb && k !== "created_by" && k !== "id") {
            q = q.eq(`data->>${k}`, String(v));
          } else {
            q = q.eq(k, v);
          }
        }
      }
      applySort(q, sort, cfg);
      if (limit) q = q.limit(limit);
      const { data: rows, error } = await q;
      if (error) throw error;
      return Response.json((rows ?? []).map((r: any) => mapRow(r, cfg)), { headers: corsHeaders });
    }

    if (operation === "get") {
      if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
      const { data: row, error } = await sb.from(cfg.table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return Response.json(mapRow(row, cfg), { headers: corsHeaders });
    }

    if (operation === "create") {
      let insert: Record<string, unknown>;
      if (cfg.jsonb) {
        insert = {
          data: data ?? {},
          created_by: (data as any)?.created_by || user.email,
        };
        if ((data as any)?.project_id) insert.project_id = (data as any).project_id;
        if (cfg.ownerField === "user_email") insert.user_email = user.email;
      } else {
        insert = pickFields(cfg, (data as any) ?? {}) as Record<string, unknown>;
      }
      const { data: row, error } = await sb.from(cfg.table).insert(insert).select().single();
      if (error) throw error;
      return Response.json(mapRow(row, cfg), { headers: corsHeaders });
    }

    if (operation === "update") {
      if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
      let updatePayload: Record<string, unknown>;
      if (cfg.jsonb) {
        const { data: existing } = await sb.from(cfg.table).select("data").eq("id", id).maybeSingle();
        updatePayload = { data: { ...((existing as any)?.data ?? {}), ...(data ?? {}) } };
      } else {
        updatePayload = pickFields(cfg, (data as any) ?? {}) as Record<string, unknown>;
      }
      const { data: row, error } = await sb.from(cfg.table).update(updatePayload).eq("id", id).select().single();
      if (error) throw error;
      return Response.json(mapRow(row, cfg), { headers: corsHeaders });
    }

    if (operation === "delete") {
      if (!id) return Response.json({ error: "id required" }, { status: 400, headers: corsHeaders });
      const { error } = await sb.from(cfg.table).delete().eq("id", id);
      if (error) throw error;
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return Response.json({ error: "Unknown operation" }, { status: 400, headers: corsHeaders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500, headers: corsHeaders });
  }
});
