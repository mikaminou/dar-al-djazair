/**
 * approveVerification — admin-only: approve or reject a verification request.
 * Payload: { request_id: string, action: "approve"|"reject", admin_note?: string }
 *
 * On approval: updates profile verification_status, all listings, sends notification.
 * SendEmail is best-effort via SMTP env vars (SMTP_HOST etc.) if configured.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403, headers: corsHeaders });
    }

    const { request_id, action, admin_note } = await req.json();
    if (!request_id || !["approve", "reject"].includes(action)) {
      return Response.json({ error: "Invalid params" }, { status: 400, headers: corsHeaders });
    }

    const isApproved = action === "approve";
    const newStatus  = isApproved ? "approved" : "rejected";
    const sb = getServiceClient();

    // Fetch the verification request
    const { data: verReq, error: vrErr } = await sb
      .from("verification_requests")
      .select("*")
      .eq("id", request_id)
      .maybeSingle();
    if (vrErr) throw vrErr;
    if (!verReq) return Response.json({ error: "Request not found" }, { status: 404, headers: corsHeaders });

    // Update the verification request (wipe document_uri for GDPR)
    await sb.from("verification_requests").update({
      status: newStatus,
      admin_note: admin_note ?? "",
      document_uri: "",
    }).eq("id", request_id);

    // Update the user profile
    await sb.from("profiles").update({
      verification_status: newStatus,
      verification_type: verReq.type,
    }).eq("email", verReq.user_email);

    // If approved: update all their listings
    if (isApproved) {
      const { data: ownerProf } = await sb
        .from("profiles").select("id").eq("email", verReq.user_email).maybeSingle();
      if (ownerProf?.id) {
        await sb.from("listings").update({
          owner_is_verified: true,
          owner_verification_type: verReq.type,
        }).eq("owner_id", ownerProf.id);
      }
    }

    // Notify the user
    const refId = `verification_decision_${request_id}`;
    const { data: existing } = await sb
      .from("notifications").select("id").eq("ref_id", refId).maybeSingle();
    if (!existing) {
      await sb.from("notifications").insert({
        user_email: verReq.user_email,
        type: isApproved ? "lead_new" : "lead_high_priority",
        title: isApproved ? "✅ Compte vérifié !" : "❌ Vérification refusée",
        body: isApproved
          ? "Votre compte est maintenant vérifié. Un badge apparaît sur votre profil et vos annonces."
          : `Votre demande de vérification a été refusée.${admin_note ? " Note: " + admin_note : ""}`,
        url: "Profile",
        is_read: false,
        ref_id: refId,
      });
    }

    return Response.json({ ok: true, action, user_email: verReq.user_email }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
