// Returns the Supabase URL and publishable (anon) key so the frontend
// can initialize its Supabase client. The publishable key is safe to
// expose — RLS protects the data. The secret key is NEVER returned.

Deno.serve(async () => {
  const rawUrl = Deno.env.get("supabase_base_url");
  const publishableKey = Deno.env.get("supabase_publishable_key");

  if (!rawUrl || !publishableKey) {
    return Response.json(
      { error: "Supabase config not set" },
      { status: 500 },
    );
  }

  // supabase-js expects the project URL only (no /rest/v1 suffix).
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  return Response.json({
    url,
    publishableKey,
  });
});