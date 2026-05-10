/**
 * resolveExclusivityConflict — admin-only: resolve an exclusivity conflict.
 * Payload: { listing_id: string, action: "approve_both"|"decline_conflict"|"contact_both", admin_note?: string }
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { listing_id, action, admin_note } = body;
    if (!listing_id || !action) {
      return Response.json({ error: "listing_id and action required" }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();
    const ts = new Date().toISOString();

    const { data: newListing } = await sb.from("listings").select("*").eq("id", listing_id).maybeSingle();
    if (!newListing) return Response.json({ error: "Listing not found" }, { status: 404, headers: corsHeaders });

    const conflict_listing_id = newListing.conflict_listing_id;

    async function notify(email: string, title: string, notifBody: string, url: string, refId: string) {
      await sb.from("notifications").insert({
        user_email: email, type: "listing_match", title, body: notifBody,
        url, is_read: false, ref_id: refId,
      }).then(() => {}, () => {});
    }

    async function getOwnerEmail(ownerId: string) {
      const { data } = await sb.from("profiles").select("email").eq("id", ownerId).maybeSingle();
      return data?.email ?? null;
    }

    if (action === "approve_both") {
      const logNew = `[ADMIN:${user.email}] Approved despite conflict. Exclusivity removed from #${conflict_listing_id}. Note: ${admin_note ?? "none"}. (${ts})`;
      await sb.from("listings").update({
        status: "active", exclusivity_conflict: false, active_since: ts,
        audit_log: [...(newListing.audit_log ?? []), logNew],
      }).eq("id", listing_id);

      if (conflict_listing_id) {
        const { data: orig } = await sb.from("listings").select("*").eq("id", conflict_listing_id).maybeSingle();
        if (orig) {
          const logOrig = `[ADMIN:${user.email}] Exclusivity removed — competing listing approved. Note: ${admin_note ?? "none"}. (${ts})`;
          await sb.from("listings").update({
            is_exclusive: false,
            audit_log: [...(orig.audit_log ?? []), logOrig],
          }).eq("id", conflict_listing_id);

          const origEmail = await getOwnerEmail(orig.owner_id);
          if (origEmail) {
            await notify(origEmail, "ℹ️ Exclusivity lifted", `Exclusivity removed from your listing "${orig.title}"`, `ListingDetail?id=${conflict_listing_id}`, `exclusivity_lifted_${conflict_listing_id}_${ts}`);
          }
        }
      }

      const newEmail = await getOwnerEmail(newListing.owner_id);
      if (newEmail) {
        await notify(newEmail, "✅ Listing Approved", `Your listing "${newListing.title}" has been approved.`, `ListingDetail?id=${listing_id}`, `approved_${listing_id}_${ts}`);
      }
      return Response.json({ success: true, action: "approve_both" }, { headers: corsHeaders });

    } else if (action === "decline_conflict") {
      const logNew = `[ADMIN:${user.email}] Declined — exclusivity conflict with #${conflict_listing_id}. Note: ${admin_note ?? "none"}. (${ts})`;
      await sb.from("listings").update({
        status: "declined", admin_note: admin_note ?? null, exclusivity_conflict: false,
        audit_log: [...(newListing.audit_log ?? []), logNew],
      }).eq("id", listing_id);

      const ownerEmail = await getOwnerEmail(newListing.owner_id);
      if (ownerEmail) {
        await notify(ownerEmail, "❌ Listing Declined", `Your listing "${newListing.title}" was declined due to an exclusivity conflict.${admin_note ? " Note: " + admin_note : ""}`, `ListingDetail?id=${listing_id}`, `declined_exclusivity_${listing_id}_${ts}`);
      }
      return Response.json({ success: true, action: "decline_conflict" }, { headers: corsHeaders });

    } else if (action === "contact_both") {
      const { message_to_new, message_to_original } = body;
      const msgNew = message_to_new ?? admin_note ?? "";
      const msgOrig = message_to_original ?? admin_note ?? "";

      if (msgNew) {
        const newEmail = await getOwnerEmail(newListing.owner_id);
        if (newEmail) {
          await notify(newEmail, "📩 Admin Message", msgNew, `ListingDetail?id=${listing_id}`, `admin_contact_new_${listing_id}_${ts}`);
        }
      }
      if (msgOrig && conflict_listing_id) {
        const { data: orig } = await sb.from("listings").select("owner_id").eq("id", conflict_listing_id).maybeSingle();
        if (orig) {
          const origEmail = await getOwnerEmail(orig.owner_id);
          if (origEmail) {
            await notify(origEmail, "📩 Admin Message", msgOrig, `ListingDetail?id=${conflict_listing_id}`, `admin_contact_orig_${conflict_listing_id}_${ts}`);
          }
        }
      }
      return Response.json({ success: true, action: "contact_both" }, { headers: corsHeaders });
    }

    return Response.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
