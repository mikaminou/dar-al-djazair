import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

function emailLayout({ bodyHtml, ctaUrl, ctaText, headline, preheader, headerLabel, footerNote = "" }) {
  const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";
  const domain = BASE_URL.replace(/^https?:\/\//, '');
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
            <td style="background:#0f766e;border-radius:12px 12px 0 0;padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.65);">Dar El Djazair &nbsp;·&nbsp; ${headerLabel}</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">${headline}</h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${bodyHtml}

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="border-radius:8px;background:#0f766e;">
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
                <strong style="color:#6b7280;">Dar El Djazair</strong> &nbsp;·&nbsp; <a href="https://${domain}" style="color:#059669;text-decoration:none;">${domain}</a>
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

function renewalEmail(tenant, expiryDateStr, tenantUrl, lang) {
  const copy = {
    headerLabel: { fr: "Gestion locative", en: "Rental management", ar: "إدارة الإيجار" },
    headline:    { fr: "Votre bail expire bientôt", en: "Your tenancy is expiring soon", ar: "عقد إيجارك على وشك الانتهاء" },
    preheader:   { fr: `Accord avec ${tenant.tenant_name} expire le ${expiryDateStr}`, en: `Agreement with ${tenant.tenant_name} expires on ${expiryDateStr}`, ar: `اتفاق مع ${tenant.tenant_name} ينتهي في ${expiryDateStr}` },
    intro:       { fr: "Votre arrangement locatif avec le locataire ci-dessous arrive à expiration. Prenez une action dès maintenant pour éviter toute interruption.", en: "Your rental arrangement with the tenant below is coming to an end. Take action now to avoid any gap.", ar: "اتفاقية الإيجار مع المستأجر أدناه توشك على الانتهاء. تصرف الآن لتجنب أي انقطاع." },
    labelTenant: { fr: "Locataire", en: "Tenant", ar: "المستأجر" },
    labelProp:   { fr: "Bien", en: "Property", ar: "العقار" },
    labelExpiry: { fr: "Date d'expiration", en: "Expiry date", ar: "تاريخ الانتهاء" },
    tip:         { fr: "Vous pouvez enregistrer un nouveau paiement pour prolonger la période, ou remettre le bien sur le marché.", en: "You can log a new payment to extend the arrangement, or relist the property on the marketplace.", ar: "يمكنك تسجيل دفعة جديدة لتمديد الفترة، أو إعادة نشر العقار في السوق." },
    cta:         { fr: "Gérer ce locataire →", en: "Manage this tenant →", ar: "إدارة المستأجر ←" },
    footer:      { fr: "Vous recevez cet email car vous êtes propriétaire sur Dar El Djazair.", en: "You're receiving this because you're a landlord on Dar El Djazair.", ar: "تلقيت هذا البريد لأنك مالك عقار في دار الجزائر." },
  };
  const c = (k) => copy[k][lang] || copy[k].fr;

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${c("intro")}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#f9fafb;margin-bottom:20px;">
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;width:160px;border-bottom:1px solid #e5e7eb;">${c("labelTenant")}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${tenant.tenant_name}${tenant.tenant_phone ? ` · ${tenant.tenant_phone}` : ""}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">${c("labelProp")}</td>
        <td style="padding:12px 16px;font-size:14px;color:#111827;border-bottom:1px solid #e5e7eb;">${tenant.property_address}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;">${c("labelExpiry")}</td>
        <td style="padding:12px 16px;">
          <span style="background:#fef3c7;color:#92400e;font-weight:700;padding:4px 12px;border-radius:6px;font-size:13px;">${expiryDateStr}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">${c("tip")}</p>`;

  return emailLayout({
    headerLabel: c("headerLabel"),
    headline: c("headline"),
    preheader: c("preheader"),
    bodyHtml,
    ctaUrl: tenantUrl,
    ctaText: c("cta"),
    footerNote: c("footer"),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";

    const allTenants = await base44.asServiceRole.entities.Tenant.filter({ status: "active" }, null, 1000);
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

    let notificationCount = 0;

    for (const tenant of allTenants) {
      const expiryDate = new Date(tenant.period_end_date);
      if (expiryDate <= twoMonthsFromNow && expiryDate > today) {
        const refId = `tenant_expiry_${tenant.id}`;
        const existingNotif = await base44.asServiceRole.entities.Notification.filter({
          user_email: tenant.landlord_email,
          ref_id: refId,
        }, null, 1);

        if (existingNotif.length === 0) {
          const lang = await getRecipientLang(base44, tenant.landlord_email);
          const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-GB";
          const expiryDateStr = expiryDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
          const tenantUrl = `${BASE_URL}/TenantManagement?tenant_id=${tenant.id}`;

          // In-app notification
          const notifCopy = {
            title: {
              fr: `Bail expirant — ${tenant.tenant_name}`,
              en: `Expiring tenancy — ${tenant.tenant_name}`,
              ar: `عقد إيجار منتهٍ — ${tenant.tenant_name}`,
            },
            body: {
              fr: `Votre arrangement avec ${tenant.tenant_name} à ${tenant.property_address} expire le ${expiryDateStr}.`,
              en: `Your arrangement with ${tenant.tenant_name} at ${tenant.property_address} expires on ${expiryDateStr}.`,
              ar: `اتفاقك مع ${tenant.tenant_name} في ${tenant.property_address} تنتهي في ${expiryDateStr}.`,
            },
          };

          await base44.asServiceRole.entities.Notification.create({
            user_email: tenant.landlord_email,
            type: "tenant_renewal",
            title: notifCopy.title[lang] || notifCopy.title.fr,
            body: notifCopy.body[lang] || notifCopy.body.fr,
            url: `TenantManagement?tenant_id=${tenant.id}`,
            ref_id: refId,
            is_read: false,
          });

          // Email
          const subjects = {
            fr: `Votre bail avec ${tenant.tenant_name} expire le ${expiryDateStr}`,
            en: `Your tenancy with ${tenant.tenant_name} expires on ${expiryDateStr}`,
            ar: `عقد إيجارك مع ${tenant.tenant_name} ينتهي في ${expiryDateStr}`,
          };

          await base44.asServiceRole.integrations.Core.SendEmail({
            to: tenant.landlord_email,
            from_name: "Dar El Djazair",
            subject: subjects[lang] || subjects.fr,
            body: renewalEmail(tenant, expiryDateStr, tenantUrl, lang),
          });

          notificationCount++;
        }
      }
    }

    return Response.json({ processed: allTenants.length, notificationsSent: notificationCount });
  } catch (error) {
    console.error('Error in tenantRenewalReminder:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});