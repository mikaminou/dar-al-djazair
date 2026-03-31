import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin-only function to approve or reject a verification request.
 * On approval: updates User.is_verified, User.verification_status, and all listings.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { request_id, action, admin_note } = await req.json();
    if (!request_id || !["approve", "reject"].includes(action)) {
      return Response.json({ error: "Invalid params" }, { status: 400 });
    }

    const isApproved = action === "approve";
    const newStatus  = isApproved ? "approved" : "rejected";

    // Update the verification request and wipe the document URI (GDPR cleanup)
    await base44.asServiceRole.entities.VerificationRequest.update(request_id, {
      status:       newStatus,
      admin_note:   admin_note || "",
      document_uri: "",  // delete reference to uploaded doc after decision
    });

    // Find the request to get user_email and type
    const allReqs = await base44.asServiceRole.entities.VerificationRequest.filter({}, null, 1000);
    const verReq  = allReqs.find(r => r.id === request_id);
    if (!verReq) return Response.json({ error: "Request not found" }, { status: 404 });

    // Update the user record
    const users = await base44.asServiceRole.entities.User.filter({ email: verReq.user_email }, null, 1);
    if (users.length > 0) {
      await base44.asServiceRole.entities.User.update(users[0].id, {
        is_verified:         isApproved,
        verification_status: newStatus,
        verification_type:   verReq.type,
      });
    }

    // If approved: update all their listings with owner_is_verified
    if (isApproved) {
      const listings = await base44.asServiceRole.entities.Listing.filter(
        { created_by: verReq.user_email }, null, 500
      );
      await Promise.all(listings.map(l =>
        base44.asServiceRole.entities.Listing.update(l.id, {
          owner_is_verified:    true,
          owner_verification_type: verReq.type,
        })
      ));
    }

    // Notify the user
    const refId = `verification_decision_${request_id}`;
    const existingNotif = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
    if (existingNotif.length === 0) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: verReq.user_email,
        type:       isApproved ? "lead_new" : "lead_high_priority",
        title:      isApproved ? "✅ Compte vérifié !" : "❌ Vérification refusée",
        body:       isApproved
          ? "Votre compte est maintenant vérifié. Un badge apparaît sur votre profil et vos annonces."
          : `Votre demande de vérification a été refusée.${admin_note ? " Note: " + admin_note : ""}`,
        url:        "Profile",
        is_read:    false,
        ref_id:     refId,
      });
    }

    return Response.json({ ok: true, action, user_email: verReq.user_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});