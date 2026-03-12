import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Lead Alert Service
 *
 * Handles two triggers via entity automations on the Lead entity:
 *  - "create"  → notifies the agent a new lead has arrived
 *  - "update"  → notifies the agent if the lead has just crossed into High priority
 *
 * Deduplication: the `high_priority_alert_sent` flag on the Lead record prevents
 * repeat High Priority emails for the same lead.
 */

// ── Scoring logic (mirrored from components/leads/leadScoring.js) ──────────
const FINANCIAL_STATE_SCORE = {
  cash: 3, pre_approved: 2, arranging: 1, unspecified: 0,
};

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

function computePriority(lead, activity) {
  const score = computeScore(lead, activity);
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}

function buildScoreTriggers(lead, activity) {
  const triggers = [];
  const statusBonus = { new: 0, contacted: 1, viewing: 2, won: 4, lost: 0, closed: 0 };
  const sBonus = statusBonus[lead.status] ?? 0;
  if (sBonus > 0) triggers.push(`Statut avancé "${lead.status}" (+${sBonus} pt${sBonus > 1 ? "s" : ""})`);
  const msgBonus = Math.min(activity.messageCount, 4);
  if (msgBonus > 0) triggers.push(`${activity.messageCount} message(s) envoyé(s) par l'acheteur (+${msgBonus})`);
  if (activity.hasAppointment) triggers.push("Rendez-vous de visite reservé (+2)");
  if (activity.hasFavorite)    triggers.push("Annonce ajoutée aux favoris (+1)");
  const fsKey = lead.search_filters?.financial_state;
  const fsBonus = FINANCIAL_STATE_SCORE[fsKey] ?? 0;
  const fsLabels = { cash: "Achat comptant", pre_approved: "Crédit pré-approuvé", arranging: "Financement en cours" };
  if (fsBonus > 0) triggers.push(`État financier : ${fsLabels[fsKey] || fsKey} (+${fsBonus})`);
  return triggers;
}

// ── Email helpers ────────────────────────────────────────────────────────────
function newLeadEmailBody(lead, leadsUrl) {
  const seekerDisplay = lead.seeker_email?.split("@")[0] || lead.seeker_email;
  const property = lead.listing_title || `Annonce #${lead.listing_id}`;
  const location = lead.listing_wilaya ? ` — ${lead.listing_wilaya}` : "";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#059669;color:white;padding:28px 24px;">
        <p style="margin:0;font-size:13px;opacity:.8;text-transform:uppercase;letter-spacing:.05em;">Dari.dz — Alerte Lead</p>
        <h2 style="margin:8px 0 0;font-size:22px;">🔔 Nouveau lead reçu</h2>
      </div>
      <div style="padding:24px;background:#f9fafb;">
        <p style="color:#374151;margin:0 0 20px;">Un acheteur potentiel s'intéresse à votre annonce :</p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;width:140px;border-bottom:1px solid #f3f4f6;">Contact</td><td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${lead.seeker_email}</td></tr>
          <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Bien</td><td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${property}${location}</td></tr>
          ${lead.search_name ? `<tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Recherche</td><td style="padding:12px 16px;color:#374151;">"${lead.search_name}"</td></tr>` : ""}
        </table>
        <div style="margin-top:24px;">
          <a href="${leadsUrl}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;">Voir le lead →</a>
        </div>
      </div>
    </div>`;
}

function highPriorityEmailBody(lead, score, triggers, leadsUrl) {
  const property = lead.listing_title || `Annonce #${lead.listing_id}`;
  const location = lead.listing_wilaya ? ` — ${lead.listing_wilaya}` : "";
  const triggerItems = triggers.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join("");
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#dc2626;color:white;padding:28px 24px;">
        <p style="margin:0;font-size:13px;opacity:.8;text-transform:uppercase;letter-spacing:.05em;">Dari.dz — Alerte Lead</p>
        <h2 style="margin:8px 0 4px;font-size:22px;">⚡ Lead Haute Priorité</h2>
        <p style="margin:0;opacity:.85;font-size:14px;">Ce lead a franchi le seuil de priorité élevée</p>
      </div>
      <div style="padding:24px;background:#f9fafb;">
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:20px;">
          <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;width:140px;border-bottom:1px solid #f3f4f6;">Contact</td><td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${lead.seeker_email}</td></tr>
          <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Bien</td><td style="padding:12px 16px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${property}${location}</td></tr>
          <tr><td style="padding:12px 16px;color:#6b7280;font-size:13px;">Score</td><td style="padding:12px 16px;"><span style="background:#fef2f2;color:#dc2626;font-weight:700;padding:3px 10px;border-radius:4px;font-size:14px;">${score} pts — HAUTE PRIORITÉ</span></td></tr>
        </table>
        <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#374151;">Signaux détectés :</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#6b7280;line-height:1.6;">${triggerItems}</ul>
        </div>
        <a href="${leadsUrl}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;">Voir le lead →</a>
      </div>
    </div>`;
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    const appId = Deno.env.get("BASE44_APP_ID") || "";
    const leadsUrl = `https://app.base44.com/apps/${appId}/Leads`;

    // ── TRIGGER 1: New lead created ──────────────────────────────────────────
    if (event?.type === "create") {
      const lead = data;
      if (!lead?.agent_email) {
        return Response.json({ ok: true, skipped: "no agent_email" });
      }

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.agent_email,
        subject: `🔔 Nouveau lead — ${lead.seeker_email?.split("@")[0]} s'intéresse à "${lead.listing_title || lead.listing_id}"`,
        body: newLeadEmailBody(lead, leadsUrl),
      });

      return Response.json({ ok: true, action: "new_lead_alert_sent", to: lead.agent_email });
    }

    // ── TRIGGER 2: Lead updated — check for high priority threshold crossing ─
    if (event?.type === "update") {
      const lead = data;
      if (!lead?.agent_email) {
        return Response.json({ ok: true, skipped: "no agent_email" });
      }

      // Deduplication guard — only ever send once per lead
      if (lead.high_priority_alert_sent === true) {
        return Response.json({ ok: true, skipped: "high_priority_alert_already_sent" });
      }

      // Fetch activity signals in parallel
      const [messages, appointments, favorites] = await Promise.all([
        base44.asServiceRole.entities.Message.filter(
          { sender_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 50
        ),
        base44.asServiceRole.entities.Appointment.filter(
          { buyer_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 10
        ),
        base44.asServiceRole.entities.Favorite.filter(
          { user_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 5
        ),
      ]);

      const activity = {
        messageCount:   messages.length,
        hasAppointment: appointments.length > 0,
        hasFavorite:    favorites.length > 0,
      };

      const priority = computePriority(lead, activity);
      if (priority !== "high") {
        return Response.json({ ok: true, skipped: "not_high_priority", priority });
      }

      const score = computeScore(lead, activity);
      const triggers = buildScoreTriggers(lead, activity);

      // Mark BEFORE sending to prevent race-condition duplicates
      await base44.asServiceRole.entities.Lead.update(lead.id, { high_priority_alert_sent: true });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.agent_email,
        subject: `⚡ Lead haute priorité — ${lead.seeker_email?.split("@")[0]} (score ${score} pts)`,
        body: highPriorityEmailBody(lead, score, triggers, leadsUrl),
      });

      return Response.json({ ok: true, action: "high_priority_alert_sent", to: lead.agent_email, score });
    }

    return Response.json({ ok: true, skipped: "unhandled_event_type" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});