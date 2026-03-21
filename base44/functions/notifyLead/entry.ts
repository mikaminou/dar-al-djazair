import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

const T = {
  newLead:       { fr: "Nouveau lead", en: "New lead", ar: "عميل جديد" },
  interestedIn:  { fr: "S'intéresse à", en: "Interested in", ar: "مهتم بـ" },
  highPriority:  { fr: "Lead haute priorité", en: "High priority lead", ar: "عميل ذو أولوية عالية" },
  actNow:        { fr: "Agissez maintenant", en: "Act now", ar: "تصرف الآن" },
  pts:           { fr: "pts", en: "pts", ar: "نقطة" },
};
const t = (key, lang) => T[key][lang] || T[key].fr;

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

      const lang = await getRecipientLang(base44, lead.agent_email);
      const seekerName = lead.seeker_email?.split("@")[0] || lead.seeker_email;
      const property   = lead.listing_title || lead.listing_id;

      await base44.asServiceRole.entities.Notification.create({
        user_email: lead.agent_email,
        type:       "lead_new",
        title:      `👤 ${t("newLead", lang)} — ${seekerName}`,
        body:       `${t("interestedIn", lang)} "${property}"${lead.listing_wilaya ? ` · ${lead.listing_wilaya}` : ""}`,
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

      const lang = await getRecipientLang(base44, lead.agent_email);
      const seekerName = lead.seeker_email?.split("@")[0] || lead.seeker_email;

      await base44.asServiceRole.entities.Notification.create({
        user_email: lead.agent_email,
        type:       "lead_high_priority",
        title:      `⚡ ${t("highPriority", lang)} — ${seekerName}`,
        body:       `Score ${score} ${t("pts", lang)} · "${lead.listing_title || ""}" — ${t("actNow", lang)}`,
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