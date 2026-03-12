import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Triggered on: AppointmentProposal CREATE → notify the receiving party
 *               AppointmentProposal UPDATE → notify proposer of accepted/declined
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();
    const proposal = data;

    if (!proposal?.proposer_email || !proposal?.other_email) {
      return Response.json({ ok: true, skipped: "missing_fields" });
    }

    // ── New proposal received ──────────────────────────────────────────────
    if (event?.type === "create") {
      const refId = `appt_new_${proposal.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) return Response.json({ ok: true, skipped: "duplicate" });

      const proposerName = proposal.proposer_name || proposal.proposer_email.split("@")[0];
      const dateStr = proposal.proposed_date
        ? new Date(proposal.proposed_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : "";

      await base44.asServiceRole.entities.Notification.create({
        user_email: proposal.other_email,
        type:       "appointment_proposal",
        title:      `📅 Proposition de visite — ${proposerName}`,
        body:       `${proposal.listing_title || "Bien"}${dateStr ? ` · ${dateStr} à ${proposal.proposed_start_time}` : ""}`,
        url:        `Messages?thread=${proposal.listing_id}&contact=${encodeURIComponent(proposal.proposer_email)}`,
        is_read:    false,
        ref_id:     refId,
      });

      return Response.json({ ok: true, action: "proposal_notification" });
    }

    // ── Proposal status changed (accepted / declined) ──────────────────────
    if (event?.type === "update" && ["accepted", "declined"].includes(proposal.status)) {
      const refId = `appt_status_${proposal.id}_${proposal.status}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) return Response.json({ ok: true, skipped: "duplicate" });

      const property  = proposal.listing_title || "Bien";
      const dateStr   = proposal.proposed_date
        ? new Date(proposal.proposed_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : "";

      const titles = {
        accepted: `✅ Visite confirmée — ${property}`,
        declined: `❌ Visite déclinée — ${property}`,
      };

      await base44.asServiceRole.entities.Notification.create({
        user_email: proposal.proposer_email,
        type:       proposal.status === "accepted" ? "appointment_accepted" : "appointment_declined",
        title:      titles[proposal.status],
        body:       dateStr ? `${dateStr} à ${proposal.proposed_start_time}` : "",
        url:        "Appointments",
        is_read:    false,
        ref_id:     refId,
      });

      return Response.json({ ok: true, action: "appointment_status_notification" });
    }

    return Response.json({ ok: true, skipped: "unhandled" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});