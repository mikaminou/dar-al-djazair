import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Admin-only function to generate a temporary signed URL for a private verification document.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { file_uri } = await req.json();
    if (!file_uri) return Response.json({ error: "Missing file_uri" }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 300,
    });

    return Response.json({ signed_url: result.signed_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});