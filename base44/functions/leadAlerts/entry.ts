import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

function buildScoreTriggers(lead, activity, lang) {
  const triggers = [];
  const statusBonus = { new: 0, contacted: 1, viewing: 2, won: 4, lost: 0, closed: 0 };
  const sBonus = statusBonus[lead.status] ?? 0;

  const labels = {
    statusAdvanced: {
      fr: `Statut avancé "${lead.status}" (+${sBonus} pt${sBonus > 1 ? "s" : ""})`,
      en: `Advanced status "${lead.status}" (+${sBonus} pt${sBonus > 1 ? "s" : ""})`,
      ar: `حالة متقدمة "${lead.status}" (+${sBonus} نقطة)`,
    },
    messages: {
      fr: `${activity.messageCount} message(s) envoyé(s) par l'acheteur (+${Math.min(activity.messageCount, 4)})`,
      en: `${activity.messageCount} message(s) sent by buyer (+${Math.min(activity.messageCount, 4)})`,
      ar: `${activity.messageCount} رسالة من المشتري (+${Math.min(activity.messageCount, 4)})`,
    },
    appointment: {
      fr: "Rendez-vous de visite réservé (+2)",
      en: "Property visit booked (+2)",
      ar: "تم حجز موعد زيارة (+2)",
    },
    favorite: {
      fr: "Annonce ajoutée aux favoris (+1)",
      en: "Listing added to favorites (+1)",
      ar: "تمت إضافة الإعلان إلى المفضلة (+1)",
    },
    financial: {
      cash:         { fr: "Achat comptant (+3)",        en: "Cash purchase (+3)",          ar: "شراء نقدي (+3)" },
      pre_approved: { fr: "Crédit pré-approuvé (+2)",   en: "Pre-approved financing (+2)", ar: "تمويل معتمد مسبقاً (+2)" },
      arranging:    { fr: "Financement en cours (+1)",  en: "Arranging financing (+1)",    ar: "التمويل قيد الترتيب (+1)" },
    },
  };

  if (sBonus > 0) triggers.push(labels.statusAdvanced[lang] || labels.statusAdvanced.fr);
  const msgBonus = Math.min(activity.messageCount, 4);
  if (msgBonus > 0) triggers.push(labels.messages[lang] || labels.messages.fr);
  if (activity.hasAppointment) triggers.push(labels.appointment[lang] || labels.appointment.fr);
  if (activity.hasFavorite)    triggers.push(labels.favorite[lang]    || labels.favorite.fr);
  const fsKey = lead.search_filters?.financial_state;
  if (fsKey && labels.financial[fsKey]) {
    triggers.push(labels.financial[fsKey][lang] || labels.financial[fsKey].fr);
  }
  return triggers;
}

async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

// ── Shared email layout ──────────────────────────────────────────────────────
function emailLayout({ headerColor = "#059669", headerLabel, headline, preheader, bodyHtml, ctaUrl, ctaText, footerNote = "" }) {
  const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">

          <!-- HEADER -->
          <tr>
            <td style="background:${headerColor};border-radius:12px 12px 0 0;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);">Dar El Djazair &nbsp;·&nbsp; ${headerLabel}</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">${headline}</h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${bodyHtml}

              <!-- CTA BUTTON -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:8px;background:${headerColor};">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">
                ${ctaText}: <a href="${ctaUrl}" style="color:#6b7280;">${ctaUrl}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <strong style="color:#6b7280;">Dar El Djazair</strong> &nbsp;·&nbsp; <a href="https://${BASE_URL.replace(/^https?:\/\//, '')}" style="color:#059669;text-decoration:none;">${BASE_URL.replace(/^https?:\/\//, '')}</a>
                ${footerNote ? `<br/><span style="font-size:11px;">${footerNote}</span>` : ""}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Email builders ───────────────────────────────────────────────────────────
function newLeadEmail(lead, leadsUrl, lang) {
  const seekerDisplay = lead.seeker_email?.split("@")[0] || lead.seeker_email;
  const property = lead.listing_title || `#${lead.listing_id}`;
  const location = lead.listing_wilaya ? ` — ${lead.listing_wilaya}` : "";

  const copy = {
    headerLabel: { fr: "Alerte lead", en: "Lead alert", ar: "تنبيه عميل" },
    headline:    { fr: "Nouveau lead reçu", en: "You have a new lead", ar: "وصل عميل جديد" },
    preheader:   { fr: `${seekerDisplay} s'intéresse à ${property}`, en: `${seekerDisplay} is interested in ${property}`, ar: `${seekerDisplay} مهتم بـ ${property}` },
    intro:       { fr: "Un acheteur potentiel s'intéresse à votre annonce :", en: "A potential buyer is interested in your listing:", ar: "عميل محتمل مهتم بإعلانك :" },
    labelContact:{ fr: "Contact", en: "Contact", ar: "التواصل" },
    labelProp:   { fr: "Bien", en: "Listing", ar: "العقار" },
    labelSearch: { fr: "Recherche", en: "Search", ar: "البحث" },
    cta:         { fr: "Voir le lead →", en: "View lead →", ar: "عرض العميل ←" },
    footer:      { fr: "Vous recevez cet email car vous êtes inscrit sur Dar El Djazair.", en: "You're receiving this because you're registered on Dar El Djazair.", ar: "تلقيت هذا البريد لأنك مسجل في دار الجزائر." },
  };
  const c = (k) => copy[k][lang] || copy[k].fr;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${c("intro")}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f9fafb;">
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;width:130px;border-bottom:1px solid #e5e7eb;">${c("labelContact")}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${lead.seeker_email}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:${lead.search_name ? "1px solid #e5e7eb" : "none"};">${c("labelProp")}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:${lead.search_name ? "1px solid #e5e7eb" : "none"};">${property}${location}</td>
      </tr>
      ${lead.search_name ? `<tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">${c("labelSearch")}</td><td style="padding:12px 16px;font-size:14px;color:#374151;">"${lead.search_name}"</td></tr>` : ""}
    </table>`;

  return emailLayout({
    headerColor: "#059669",
    headerLabel: c("headerLabel"),
    headline: c("headline"),
    preheader: c("preheader"),
    bodyHtml,
    ctaUrl: leadsUrl,
    ctaText: c("cta"),
    footerNote: c("footer"),
  });
}

function highPriorityEmail(lead, score, triggers, leadsUrl, lang) {
  const seekerDisplay = lead.seeker_email?.split("@")[0] || lead.seeker_email;
  const property = lead.listing_title || `#${lead.listing_id}`;
  const location = lead.listing_wilaya ? ` — ${lead.listing_wilaya}` : "";

  const copy = {
    headerLabel: { fr: "Alerte priorité haute", en: "High priority alert", ar: "تنبيه أولوية عالية" },
    headline:    { fr: "Lead haute priorité !", en: "High priority lead!", ar: "عميل ذو أولوية عالية!" },
    preheader:   { fr: `${seekerDisplay} — score ${score} pts`, en: `${seekerDisplay} — score ${score} pts`, ar: `${seekerDisplay} — ${score} نقطة` },
    intro:       { fr: "Ce prospect vient de franchir le seuil de priorité élevée. Contactez-le maintenant pour maximiser vos chances.", en: "This lead just crossed the high priority threshold. Reach out now to maximize your chances.", ar: "تجاوز هذا العميل عتبة الأولوية العالية. تواصل معه الآن لزيادة فرصك." },
    labelContact:{ fr: "Contact", en: "Contact", ar: "التواصل" },
    labelProp:   { fr: "Bien", en: "Listing", ar: "العقار" },
    labelScore:  { fr: "Score", en: "Score", ar: "النقاط" },
    signals:     { fr: "Signaux détectés", en: "Signals detected", ar: "الإشارات المرصودة" },
    cta:         { fr: "Voir le lead →", en: "View lead →", ar: "عرض العميل ←" },
    footer:      { fr: "Vous recevez cet email car vous êtes inscrit sur Dar El Djazair.", en: "You're receiving this because you're registered on Dar El Djazair.", ar: "تلقيت هذا البريد لأنك مسجل في دار الجزائر." },
    priority:    { fr: "HAUTE PRIORITÉ", en: "HIGH PRIORITY", ar: "أولوية عالية" },
  };
  const c = (k) => copy[k][lang] || copy[k].fr;

  const triggerItems = triggers.map(t => `<li style="margin-bottom:6px;color:#374151;">${t}</li>`).join("");

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${c("intro")}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f9fafb;margin-bottom:20px;">
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;width:130px;border-bottom:1px solid #e5e7eb;">${c("labelContact")}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${lead.seeker_email}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">${c("labelProp")}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${property}${location}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;">${c("labelScore")}</td>
        <td style="padding:12px 16px;">
          <span style="background:#fef2f2;color:#dc2626;font-weight:700;padding:4px 12px;border-radius:6px;font-size:13px;">${score} pts — ${c("priority")}</span>
        </td>
      </tr>
    </table>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
      <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;">${c("signals")}</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.8;">${triggerItems}</ul>
    </div>`;

  return emailLayout({
    headerColor: "#dc2626",
    headerLabel: c("headerLabel"),
    headline: c("headline"),
    preheader: c("preheader"),
    bodyHtml,
    ctaUrl: leadsUrl,
    ctaText: c("cta"),
    footerNote: c("footer"),
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, data } = payload;

    const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";
    const leadsUrl = `${BASE_URL}/Leads`;

    // ── TRIGGER 1: New lead created ──────────────────────────────────────────
    if (event?.type === "create") {
      const lead = data;
      if (!lead?.agent_email) return Response.json({ ok: true, skipped: "no agent_email" });

      const lang = await getRecipientLang(base44, lead.agent_email);
      const seekerDisplay = lead.seeker_email?.split("@")[0] || lead.seeker_email;
      const property = lead.listing_title || lead.listing_id;

      const subjects = {
        fr: `Nouveau lead — ${seekerDisplay} s'intéresse à "${property}"`,
        en: `New lead — ${seekerDisplay} is interested in "${property}"`,
        ar: `عميل جديد — ${seekerDisplay} مهتم بـ "${property}"`,
      };

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.agent_email,
        from_name: "Dar El Djazair",
        subject: subjects[lang] || subjects.fr,
        body: newLeadEmail(lead, leadsUrl, lang),
      });

      return Response.json({ ok: true, action: "new_lead_alert_sent", to: lead.agent_email });
    }

    // ── TRIGGER 2: Lead updated — check for high priority threshold crossing ─
    if (event?.type === "update") {
      const lead = data;
      if (!lead?.agent_email) return Response.json({ ok: true, skipped: "no agent_email" });
      if (lead.high_priority_alert_sent === true) return Response.json({ ok: true, skipped: "already_sent" });

      const [messages, appointments, favorites] = await Promise.all([
        base44.asServiceRole.entities.Message.filter({ sender_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 50),
        base44.asServiceRole.entities.Appointment.filter({ buyer_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 10),
        base44.asServiceRole.entities.Favorite.filter({ user_email: lead.seeker_email, listing_id: lead.listing_id }, "-created_date", 5),
      ]);

      const activity = { messageCount: messages.length, hasAppointment: appointments.length > 0, hasFavorite: favorites.length > 0 };
      const priority = computePriority(lead, activity);
      if (priority !== "high") return Response.json({ ok: true, skipped: "not_high_priority", priority });

      const lang = await getRecipientLang(base44, lead.agent_email);
      const score = computeScore(lead, activity);
      const triggers = buildScoreTriggers(lead, activity, lang);

      const seekerDisplay = lead.seeker_email?.split("@")[0] || lead.seeker_email;
      const subjects = {
        fr: `Lead haute priorité — ${seekerDisplay} (score ${score} pts)`,
        en: `High priority lead — ${seekerDisplay} (score ${score} pts)`,
        ar: `عميل أولوية عالية — ${seekerDisplay} (${score} نقطة)`,
      };

      await base44.asServiceRole.entities.Lead.update(lead.id, { high_priority_alert_sent: true });

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.agent_email,
        from_name: "Dar El Djazair",
        subject: subjects[lang] || subjects.fr,
        body: highPriorityEmail(lead, score, triggers, leadsUrl, lang),
      });

      return Response.json({ ok: true, action: "high_priority_alert_sent", to: lead.agent_email, score });
    }

    return Response.json({ ok: true, skipped: "unhandled_event_type" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});