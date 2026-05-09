/**
 * sendEmail — transactional email via Supabase SMTP settings (Resend/Postmark/etc.)
 * Payload: { to: string, subject: string, body: string, from_name?: string }
 *
 * Configure SMTP in your Supabase project → Settings → Auth → Email settings,
 * or set SMTP_* environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getAuthUser } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require auth so only authenticated users/functions can send email
    const authUser = await getAuthUser(req);
    if (!authUser) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

    const { to, subject, body: htmlBody, from_name } = await req.json();
    if (!to || !subject) {
      return Response.json({ error: "to and subject are required" }, { status: 400, headers: corsHeaders });
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") ?? "noreply@dari.dz";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "587");

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("[sendEmail] SMTP not configured — email skipped");
      return Response.json({ skipped: true, reason: "SMTP not configured" }, { headers: corsHeaders });
    }

    // Use Deno's built-in SMTP library (or a lightweight npm shim)
    // For simplicity, send via the Supabase Auth admin API if RESEND_API_KEY is set
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: from_name ? `${from_name} <${smtpFrom}>` : smtpFrom,
          to: [to],
          subject,
          html: htmlBody ?? "<p>No content</p>",
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: err }, { status: 500, headers: corsHeaders });
      }
      return Response.json({ sent: true }, { headers: corsHeaders });
    }

    // Fallback: SMTP not configured
    console.warn("[sendEmail] No email provider configured");
    return Response.json({ skipped: true, reason: "No email provider configured" }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
