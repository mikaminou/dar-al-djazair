// One-off connectivity test. Counts rows in a few tables using the
// service role key. Safe to keep — it's admin-only.

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const url = Deno.env.get("supabase_base_url")
    ?.replace(/\/rest\/v1\/?$/, "")
    ?.replace(/\/$/, "");
  const secret = Deno.env.get("supabase_secret_key");

  if (!url || !secret) {
    return Response.json({ error: "config missing" }, { status: 500 });
  }

  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tables = ["profiles", "listings", "notifications", "conversations"];
  const result = {};
  for (const t of tables) {
    const { count, error } = await supabase
      .from(t)
      .select("*", { count: "exact", head: true });
    result[t] = error ? `ERROR: ${error.message}` : count;
  }

  return Response.json({ url, result });
});