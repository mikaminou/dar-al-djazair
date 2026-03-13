import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

function fmtDate(dateStr, lang) {
  const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB";
  return new Date(dateStr).toLocaleDateString(locale, { day: "numeric", month: "short" });
}

const T = {
  proposalTitle:  { fr: "Proposition de visite", en: "Visit proposal", ar: "اقتراح زيارة" },
  proposalBody:   { fr: "le", en: "on", ar: "في" },
  at:             { fr: "à", en: "at", ar: "الساعة" },
  acceptedTitle:  { fr: "Visite confirmée", en: "Visit confirmed", ar: "تم تأكيد الزيارة" },
  declinedTitle:  { fr: "Visite déclinée", en: "Visit declined", ar: "تم رفض الزيارة" },
};
const t = (key, lang) => T[key][lang] || T[key].fr;

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

      const lang = await getRecipientLang(base44, proposal.other_email);
      const proposerName = proposal.proposer_name || proposal.proposer_email.split("@")[0];
      const dateStr = proposal.proposed_date ? fmtDate(proposal.proposed_date, lang) : "";

      await base44.asServiceRole.entities.Notification.create({
        user_email: proposal.other_email,
        type:       "appointment_proposal",
        title:      `📅 ${t("proposalTitle", lang)} — ${proposerName}`,
        body:       `${proposal.listing_title || ""}${dateStr ? ` · ${t("proposalBody", lang)} ${dateStr} ${t("at", lang)} ${proposal.proposed_start_time}` : ""}`,
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

      const lang = await getRecipientLang(base44, proposal.proposer_email);
      const property = proposal.listing_title || "";
      const dateStr  = proposal.proposed_date ? fmtDate(proposal.proposed_date, lang) : "";

      const titleKey = proposal.status === "accepted" ? "acceptedTitle" : "declinedTitle";
      const emoji    = proposal.status === "accepted" ? "✅" : "❌";

      await base44.asServiceRole.entities.Notification.create({
        user_email: proposal.proposer_email,
        type:       proposal.status === "accepted" ? "appointment_accepted" : "appointment_declined",
        title:      `${emoji} ${t(titleKey, lang)}${property ? ` — ${property}` : ""}`,
        body:       dateStr ? `${dateStr} ${t("at", lang)} ${proposal.proposed_start_time}` : "",
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