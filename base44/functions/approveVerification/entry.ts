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

    // Send decision email
    const firstName = verReq.user_name?.split(" ")[0] || "there";
    if (isApproved) {
      const approvalHtml = `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);padding:40px 48px;text-align:center;">
          <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" width="52" style="border-radius:12px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"/>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Dar Al Djazair</h1>
          <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">منصة العقار الجزائرية</p>
        </td>
      </tr>
      <tr>
        <td style="padding:48px 48px 32px;">
          <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Congratulations, ${firstName}! 🎉✅</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Your professional account on <strong style="color:#065f46;">Dar Al Djazair</strong> has been <strong style="color:#059669;">officially verified</strong>. You can now post unlimited property listings and reach thousands of buyers and renters across Algeria.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:28px 32px;">
              <p style="margin:0 0 12px;color:#065f46;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">🎓 Free Onboarding Webinar</p>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.7;">We'd love to personally walk you through everything Dar Al Djazair has to offer — listing tools, lead management, analytics, tenant tracking, and more.</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;"><strong>Simply reply to this email</strong> and we'll schedule a 1-on-1 onboarding session at a time that works for you and your team. No preparation needed — we handle everything.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://dari.dz/PostListing" style="display:inline-block;background:linear-gradient(135deg,#065f46,#059669);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">Post Your First Listing →</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
      <tr>
        <td style="padding:24px 48px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#9ca3af;font-size:13px;">With care,</p>
          <p style="margin:0 0 16px;color:#374151;font-size:14px;font-weight:600;">The Dar Al Djazair Team 🇩🇿</p>
          <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 Dar Al Djazair · Algeria's Real Estate Platform</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: verReq.user_email,
        subject: "✅ You're verified on Dar Al Djazair — Welcome to the team!",
        body: approvalHtml,
        from_name: "Dar Al Djazair",
      });
    } else {
      const rejectionHtml = `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);padding:40px 48px;text-align:center;">
          <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" width="52" style="border-radius:12px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"/>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">Dar Al Djazair</h1>
          <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;">منصة العقار الجزائرية</p>
        </td>
      </tr>
      <tr>
        <td style="padding:48px 48px 32px;">
          <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Verification Update, ${firstName}</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">Thank you for submitting your documents to <strong style="color:#065f46;">Dar Al Djazair</strong>. After careful review, we were unfortunately unable to approve your verification request at this time.</p>
          ${admin_note ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 8px;color:#c2410c;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Reason for rejection</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${admin_note}</p>
            </td></tr>
          </table>` : ""}
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 8px;color:#065f46;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">What you can do</p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">Please address the reason above and resubmit your documents from your profile page. If you believe this is an error or need assistance, simply reply to this email — our team will be happy to help.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="https://dari.dz/Profile" style="display:inline-block;background:linear-gradient(135deg,#065f46,#059669);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">Resubmit Documents →</a>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e7eb;"/></td></tr>
      <tr>
        <td style="padding:24px 48px 40px;text-align:center;">
          <p style="margin:0 0 6px;color:#9ca3af;font-size:13px;">With care,</p>
          <p style="margin:0 0 16px;color:#374151;font-size:14px;font-weight:600;">The Dar Al Djazair Team 🇩🇿</p>
          <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 Dar Al Djazair · Algeria's Real Estate Platform</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: verReq.user_email,
        subject: "Your Dar Al Djazair verification — an update from our team",
        body: rejectionHtml,
        from_name: "Dar Al Djazair",
      });
    }

    return Response.json({ ok: true, action, user_email: verReq.user_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});