import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  // Called from automation (entity event) or directly
  const user_email = body?.data?.user_email || body?.user_email;
  const user_name = body?.data?.user_name || body?.user_name;
  if (!user_email) return Response.json({ error: 'No email' }, { status: 400 });

  const firstName = user_name?.split(" ")[0] || "there";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Dar Al Djazair</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);padding:40px 48px;text-align:center;">
              <img src="https://media.base44.com/images/public/69a1c8600d15067fd757bfc1/3464ffadd_image.png" alt="Dar Al Djazair" width="52" style="border-radius:12px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Dar Al Djazair</h1>
              <p style="margin:6px 0 0;color:#a7f3d0;font-size:14px;letter-spacing:0.5px;">منصة العقار الجزائرية</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">Welcome aboard, ${firstName}! 🎉</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                We're thrilled to have you join <strong style="color:#065f46;">Dar Al Djazair</strong> as a professional. You're now part of Algeria's fastest-growing real estate platform — and we can't wait to help you grow your business.
              </p>

              <!-- Steps card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 18px;color:#065f46;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">What happens next</p>

                    <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#059669;border-radius:50%;text-align:center;line-height:24px;color:#fff;font-size:12px;font-weight:700;">1</span>
                        </td>
                        <td style="color:#374151;font-size:14px;line-height:1.6;padding-left:12px;">
                          <strong>Upload your documents</strong> — head to your profile and submit your professional ID or agency licence for verification.
                        </td>
                      </tr>
                    </table>

                    <table cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#059669;border-radius:50%;text-align:center;line-height:24px;color:#fff;font-size:12px;font-weight:700;">2</span>
                        </td>
                        <td style="color:#374151;font-size:14px;line-height:1.6;padding-left:12px;">
                          <strong>We review within 1 business day</strong> — our team personally verifies every document to maintain platform quality.
                        </td>
                      </tr>
                    </table>

                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;vertical-align:top;padding-top:2px;">
                          <span style="display:inline-block;width:24px;height:24px;background:#059669;border-radius:50%;text-align:center;line-height:24px;color:#fff;font-size:12px;font-weight:700;">3</span>
                        </td>
                        <td style="color:#374151;font-size:14px;line-height:1.6;padding-left:12px;">
                          <strong>Start listing</strong> — once verified, you'll unlock the ability to post unlimited properties and reach thousands of buyers and renters across Algeria.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;color:#6b7280;font-size:14px;line-height:1.7;">
                In the meantime, feel free to explore the platform, browse listings, and get familiar with the tools available to you. If you have any questions, just reply to this email — we're always happy to help.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://dari.dz/Profile" style="display:inline-block;background:linear-gradient(135deg,#065f46,#059669);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                      Upload My Documents →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:13px;">With care,</p>
              <p style="margin:0 0 16px;color:#374151;font-size:14px;font-weight:600;">The Dar Al Djazair Team 🇩🇿</p>
              <p style="margin:0;color:#d1d5db;font-size:12px;">© 2024 Dar Al Djazair · Algeria's Real Estate Platform</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await base44.asServiceRole.integrations.Core.SendEmail({
    to: user_email,
    subject: "Welcome to Dar Al Djazair — Your journey starts here 🏡",
    body: html,
    from_name: "Dar Al Djazair",
  });

  return Response.json({ success: true });
});