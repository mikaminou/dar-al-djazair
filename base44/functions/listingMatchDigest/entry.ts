import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

async function getRecipientLang(base44, email) {
  const users = await base44.asServiceRole.entities.User.filter({ email }, null, 1).catch(() => []);
  return users[0]?.lang || "fr";
}

// Calculate the 4-hour window index for deduplication
function getWindowIndex(date = new Date()) {
  const utcHours = Math.floor(date.getTime() / 3600000);
  return Math.floor(utcHours / 4);
}

// Inline price formatting (mirrors price.config.js)
function formatPrice(amount, listingType = 'sale', lang = 'fr') {
  if (amount == null || amount === '') return '';
  const n = Number(amount);
  if (isNaN(n) || n < 0) return '';
  if (listingType === 'rent') return formatRentalDisplay(n, lang);
  return formatSaleDisplay(n, lang);
}

function formatSaleDisplay(n, lang = 'fr') {
  const DA = lang === 'ar' ? 'دج' : 'DA';

  if (n >= 1_000_000_000) {
    const milliards = Math.floor(n / 1_000_000_000);
    const millions  = Math.round((n % 1_000_000_000) / 1_000_000);
    if (millions === 0) {
      if (lang === 'ar') return `${milliards} مليار ${DA}`;
      if (lang === 'en') return `${milliards} billion ${DA}`;
      return `${milliards} milliard${milliards > 1 ? 's' : ''} ${DA}`;
    }
    if (lang === 'ar') {
      return milliards === 1
        ? `مليار و ${millions} مليون ${DA}`
        : `${milliards} مليار و ${millions} مليون ${DA}`;
    }
    if (lang === 'en') return `${milliards}B ${millions}M ${DA}`;
    return `${milliards} milliard${milliards > 1 ? 's' : ''} ${millions} million${millions > 1 ? 's' : ''} ${DA}`;
  }

  if (n >= 1_000_000) {
    const millions = Math.round(n / 1_000_000);
    if (lang === 'ar') return `${millions} مليون ${DA}`;
    if (lang === 'en') return `${millions} million${millions > 1 ? 's' : ''} ${DA}`;
    return `${millions} million${millions > 1 ? 's' : ''} ${DA}`;
  }

  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-GB';
  return `${new Intl.NumberFormat(locale).format(n)} ${DA}`;
}

function formatRentalDisplay(n, lang = 'fr') {
  const locale   = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-GB';
  const DA       = lang === 'ar' ? 'دج' : 'DA';
  const perMonth = lang === 'ar' ? '/ شهر' : lang === 'fr' ? '/ mois' : '/ month';
  return `${new Intl.NumberFormat(locale).format(n)} ${DA} ${perMonth}`;
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
            <td style="background:#059669;border-radius:12px 12px 0 0;padding:28px 32px;">
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
                  <td style="border-radius:8px;background:#059669;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
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

function buildDigestEmail(matches, lang) {
  const count = matches.length;
  const BASE_URL = Deno.env.get("BASE_URL") || "https://dar-el-djazair.com";

  const copy = {
    headerLabel: { fr: "Nouvelles correspondances", en: "New matches", ar: "تطابقات جديدة" },
    headline: {
      fr: `${count} ${count === 1 ? "nouveau bien" : "nouveaux biens"} correspondent à vos recherches`,
      en: `${count} new ${count === 1 ? "listing" : "listings"} match your searches`,
      ar: `${count} عقار جديد يطابق بحثك`,
    },
    preheader: {
      fr: `Découvrez ${count} ${count === 1 ? "bien" : "biens"} qui correspond à vos critères`,
      en: `Discover ${count} new ${count === 1 ? "listing" : "listings"} matching your criteria`,
      ar: `اكتشف ${count} عقار جديد يطابق معاييرك`,
    },
    intro: {
      fr: "De nouveaux biens ont été ajoutés et correspondent à vos recherches sauvegardées :",
      en: "New listings have been added and match your saved searches:",
      ar: "تمت إضافة عقارات جديدة تطابق بحثك المحفوظ:",
    },
    labelPrice: { fr: "Prix", en: "Price", ar: "السعر" },
    labelType: { fr: "Type", en: "Type", ar: "نوع" },
    labelSearch: { fr: "Recherche", en: "Search", ar: "البحث" },
    viewListing: { fr: "Voir l'annonce →", en: "View listing →", ar: "عرض الإعلان ←" },
    viewAll: { fr: "Voir tous les résultats →", en: "View all results →", ar: "عرض جميع النتائج ←" },
    footer: {
      fr: "Vous recevez cet email car vous avez des recherches sauvegardées sur Dar El Djazair.",
      en: "You're receiving this because you have saved searches on Dar El Djazair.",
      ar: "تلقيت هذا البريد لأن لديك بحوث محفوظة في دار الجزائر.",
    },
  };
  const t = (k) => copy[k][lang] || copy[k].fr;

  const listingRows = matches
    .map((m) => {
      const priceStr = m.listing?.price ? formatPrice(m.listing.price, m.listing.listing_type, lang) : "—";
      const typeStr = m.listing?.property_type ? m.listing.property_type.replace(/_/g, " ") : "—";
      const listingTypeStr = m.listing?.listing_type === "rent" ? (lang === "ar" ? "إيجار" : lang === "fr" ? "Location" : "Rent") : (lang === "ar" ? "بيع" : lang === "fr" ? "Vente" : "Sale");
      const listingUrl = `${BASE_URL}/ListingDetail?id=${m.listing.id}`;

      return `
        <tr>
          <td colspan="2" style="padding:16px;border-bottom:1px solid #e5e7eb;">
            <div style="margin-bottom:8px;">
              <p style="margin:0;font-weight:700;color:#111827;font-size:15px;">${m.listing?.title || "—"}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${m.listing?.wilaya || "—"}</p>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-top:8px;">
              <tr>
                <td style="color:#6b7280;width:40%;">${t("labelPrice")}</td>
                <td style="color:#111827;font-weight:600;">${priceStr}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;">${t("labelType")}</td>
                <td style="color:#111827;font-weight:600;">${typeStr} · ${listingTypeStr}</td>
              </tr>
              <tr>
                <td style="color:#6b7280;">${t("labelSearch")}</td>
                <td style="color:#111827;">"${m.search_name || "—"}"</td>
              </tr>
            </table>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px;">
              <tr>
                <td style="border-radius:6px;background:#f0fdf4;border:1px solid #bbf7d0;">
                  <a href="${listingUrl}" style="display:inline-block;padding:8px 16px;font-size:12px;font-weight:600;color:#059669;text-decoration:none;">${t("viewListing")}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
    })
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">${t("intro")}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#ffffff;">
      ${listingRows}
    </table>`;

  const searchUrl = `${BASE_URL}/SavedSearches`;

  return emailLayout({
    headerLabel: t("headerLabel"),
    headline: t("headline"),
    preheader: t("preheader"),
    bodyHtml,
    ctaUrl: searchUrl,
    ctaText: t("viewAll"),
    footerNote: t("footer"),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Calculate the 4-hour window
    const window = getWindowIndex();

    // Fetch all listing_match notifications created in the last 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 3600000).toISOString();
    const allMatches = await base44.asServiceRole.entities.Notification.filter(
      { type: "listing_match" },
      "-created_date",
      1000
    ).catch(() => []);

    // Filter to last 4 hours
    const recentMatches = allMatches.filter(n => new Date(n.created_date) >= new Date(fourHoursAgo));

    if (recentMatches.length === 0) {
      return Response.json({ processed: 0, emailsSent: 0, message: "No recent listing matches" });
    }

    // Group by user_email
    const groupedBySeekerEmail = {};
    recentMatches.forEach(notif => {
      if (!groupedBySeekerEmail[notif.user_email]) {
        groupedBySeekerEmail[notif.user_email] = [];
      }
      groupedBySeekerEmail[notif.user_email].push(notif);
    });

    let emailsSent = 0;

    // Process each seeker
    for (const [seekerEmail, notifs] of Object.entries(groupedBySeekerEmail)) {
      // Extract unique listing IDs from notifications
      const listingIds = [...new Set(notifs.map(n => {
        const match = n.url?.match(/id=([^&]+)/);
        return match ? match[1] : null;
      }).filter(Boolean))];

      if (listingIds.length === 0) continue;

      // Fetch all listings for these IDs
      const listings = await Promise.all(
        listingIds.map(id => base44.asServiceRole.entities.Listing.filter({ id }, null, 1).then(r => r[0]).catch(() => null))
      );

      // Build matches array with deduplication check
      const matches = [];
      for (const notif of notifs) {
        const refId = `digest_${seekerEmail}_${notif.id}_${window}`;
        
        // Check if this notification has already been sent in a previous digest
        const existingDigestRef = await base44.asServiceRole.entities.Notification.filter(
          { ref_id: refId },
          null,
          1
        ).catch(() => []);

        if (existingDigestRef.length === 0) {
          // Extract listing ID from the notification URL
          const match = notif.url?.match(/id=([^&]+)/);
          const listingId = match ? match[1] : null;
          const listing = listings.find(l => l?.id === listingId);

          if (listing) {
            matches.push({
              listing,
              search_name: notif.title?.split(" — ")?.[1] || "—",
              notif_id: notif.id,
              ref_id: refId,
            });
          }
        }
      }

      // If no new matches to send (all already sent in previous digest), skip
      if (matches.length === 0) continue;

      // Get seeker's language
      const lang = await getRecipientLang(base44, seekerEmail);

      // Send digest email
      const emailHtml = buildDigestEmail(matches, lang);
      const subjects = {
        fr: `${matches.length} ${matches.length === 1 ? "nouveau bien" : "nouveaux biens"} correspondent à vos recherches`,
        en: `${matches.length} new ${matches.length === 1 ? "listing" : "listings"} match your searches`,
        ar: `${matches.length} عقار جديد يطابق بحثك`,
      };

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: seekerEmail,
        from_name: "Dar El Djazair",
        subject: subjects[lang] || subjects.fr,
        body: emailHtml,
      });

      // Mark all matches as sent by creating digest ref notifications
      for (const match of matches) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: seekerEmail,
          type: "listing_match_digest_sent",
          title: `Digest sent for ${match.listing.title}`,
          ref_id: match.ref_id,
          is_read: true,
        }).catch(() => {});
      }

      emailsSent++;
    }

    // ── CLIENT MATCH DIGEST (grouped by agent, then by client) ───────────────
    const clientMatchNotifs = recentMatches.filter(n => n.ref_id?.startsWith("client_match_"));
    const groupedByAgent = {};
    clientMatchNotifs.forEach(n => {
      if (!groupedByAgent[n.user_email]) groupedByAgent[n.user_email] = [];
      groupedByAgent[n.user_email].push(n);
    });

    for (const [agentEmail, notifs] of Object.entries(groupedByAgent)) {
      const agentMatches = [];
      for (const notif of notifs) {
        const refId = `digest_client_${agentEmail}_${notif.id}_${window}`;
        const existingDigest = await base44.asServiceRole.entities.Notification.filter({ ref_id: refId }, null, 1).catch(() => []);
        if (existingDigest.length > 0) continue;
        const match = notif.url?.match(/id=([^&]+)/);
        const listingId = match ? match[1] : null;
        if (!listingId) continue;
        const listing = await base44.asServiceRole.entities.Listing.filter({ id: listingId }, null, 1).then(r => r[0]).catch(() => null);
        if (!listing) continue;
        // Extract client name from notification title
        const clientNameMatch = notif.title?.match(/client (.+)$|عميلك (.+)$|client (.+)$/);
        const clientName = clientNameMatch ? (clientNameMatch[1] || clientNameMatch[2] || clientNameMatch[3] || "—") : "—";
        agentMatches.push({ listing, search_name: clientName, notif_id: notif.id, ref_id: refId });
      }
      if (agentMatches.length === 0) continue;
      const lang = await getRecipientLang(base44, agentEmail);
      const emailHtml = buildDigestEmail(agentMatches, lang);
      const subjects = {
        fr: `${agentMatches.length} nouveau(x) bien(s) pour vos clients`,
        en: `${agentMatches.length} new listing(s) match your clients`,
        ar: `${agentMatches.length} عقار جديد يطابق بحث عملائك`,
      };
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: agentEmail,
        from_name: "Dar El Djazair",
        subject: subjects[lang] || subjects.fr,
        body: emailHtml,
      }).catch(() => {});
      for (const match of agentMatches) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: agentEmail,
          type: "listing_match_digest_sent",
          title: `Client digest sent for ${match.listing.title}`,
          ref_id: match.ref_id,
          is_read: true,
        }).catch(() => {});
      }
      emailsSent++;
    }

    return Response.json({
      processed: recentMatches.length,
      seekers: Object.keys(groupedBySeekerEmail).length,
      emailsSent,
      window,
    });
  } catch (error) {
    console.error('Error in listingMatchDigest:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});