/**
 * getDocumentUrl — admin-only: generate a signed URL for a private document.
 * Payload: { file_uri: string }  (path inside the `documents` Supabase bucket)
 */
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient, getAuthUserWithProfile } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await getAuthUserWithProfile(req);
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403, headers: corsHeaders });
    }

    const { file_uri } = await req.json();
    if (!file_uri) return Response.json({ error: "Missing file_uri" }, { status: 400, headers: corsHeaders });

    // Legacy base44:// URIs are no longer supported — only Supabase storage paths
    if (file_uri.startsWith("base44://") || file_uri.includes("base44.com")) {
      return Response.json({ error: "Legacy base44 file URIs are no longer supported" }, { status: 400, headers: corsHeaders });
    }

    const sb = getServiceClient();
    const { data, error } = await sb.storage.from("documents").createSignedUrl(file_uri, 300);
    if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
    return Response.json({ signed_url: data.signedUrl }, { headers: corsHeaders });
  } catch (err: unknown) {
    return Response.json({ error: (err as Error).message }, { status: 500, headers: corsHeaders });
  }
});
