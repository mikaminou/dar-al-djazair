import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Triggered on: Lead CREATE → new lead notification
 *               Lead UPDATE → high priority threshold notification
 */

const FINANCIAL_STATE_SCORE = { cash: 3, pre_approved: 2, arranging: 1, unspecified: 0 };

function computeScore(lead, { messageCount = 0, hasAppointment = false, hasFavorite = false }) {
  let score = 0;
  const statusScore = { new: 0, contacted: 1, viewing: 2, won: 4, lost: 0, closed: 0 };
  score += statusScore[lead.status] ?? 0;
  score += Math.min(messageCount, 4);
  if (hasAppointment) score += 2;
  if (hasFavorite)    score += 1;
  const daysSince = (Date.now() - new Date(lead.created_date).getTime()) / 86_400_000;
  if (daysSince <= 7) score += 1;
  const fsKey = lead.search_filters?.financial_state || "unspecified";
  score += FINANCIAL_STATE_SCORE[fsKey] ?? 0;
  return score;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();
    const lead = data;

    if (!lead?.agent_email) return Response.json({ ok: true, skipped: "no_agent_email" });

    // ── TRIGGER 1: New lead created ────────────────────────────────────────
    if (event?.type === "create") {
      const refId = `lead_new_${lead.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) return Response.json({ ok: true, skipped: "duplicate" });

      const seekerName = lead.seeker_email?.split("@")[0] || lead.seeker_email;
      const property   = lead.listing_title || lead.listing_id;

      await base44.asServiceRole.entities.Notification.create({
        user_email: lead.agent_email,
        type:       "lead_new",
        title:      `👤 Nouveau lead — ${seekerName}`,
        body:       `S'intéresse à "${property}"${lead.listing_wilaya ? ` · ${lead.listing_wilaya}` : ""}`,
        url:        "Leads",
        is_read:    false,
        ref_id:     refId,
      });

      return Response.json({ ok: true, action: "new_lead_notification" });
    }

    // ── TRIGGER 2: Lead updated — check high priority ──────────────────────
    if (event?.type === "update") {
      const refId = `lead_high_${lead.id}`;
      const existing = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1);
      if (existing.length > 0) return Response.json({ ok: true, skipped: "duplicate" });

      const [messages, appointments, favorites] = await Promise.all([
        base44.asServiceRole.entities.Message.filter({ sender_email: lead.seeker_email, listing_id: lead.listing_id }, null, 50),
        base44.asServiceRole.entities.Appointment.filter({ buyer_email: lead.seeker_email, listing_id: lead.listing_id }, null, 10),
        base44.asServiceRole.entities.Favorite.filter({ user_email: lead.seeker_email, listing_id: lead.listing_id }, null, 5),
      ]);

      const score = computeScore(lead, {
        messageCount:   messages.length,
        hasAppointment: appointments.length > 0,
        hasFavorite:    favorites.length > 0,
      });

      if (score < 6) return Response.json({ ok: true, skipped: "not_high_priority", score });

      const seekerName = lead.seeker_email?.split("@")[0] || lead.seeker_email;

      await base44.asServiceRole.entities.Notification.create({
        user_email: lead.agent_email,
        type:       "lead_high_priority",
        title:      `⚡ Lead haute priorité — ${seekerName}`,
        body:       `Score ${score} pts · "${lead.listing_title || "Annonce"}" — Agissez maintenant`,
        url:        "Leads",
        is_read:    false,
        ref_id:     refId,
      });

      return Response.json({ ok: true, action: "high_priority_notification", score });
    }

    return Response.json({ ok: true, skipped: "unhandled_event" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});