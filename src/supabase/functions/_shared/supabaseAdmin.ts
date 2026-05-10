import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Verify the Bearer JWT in the request and return the authenticated user.
 * Returns null if the token is missing or invalid.
 */
export async function getAuthUser(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const sb = getServiceClient();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * Fetch the profiles row for a given auth user, merging in auth-level fields.
 */
export async function getAuthUserWithProfile(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser) return null;

  const sb = getServiceClient();
  const { data: profile } = await sb
    .from("profiles")
    .select("*")
    .eq("email", authUser.email!)
    .maybeSingle();

  if (!profile) return null;

  return {
    ...profile,
    id: authUser.id,
    email: authUser.email,
    role: profile.account_type,
  };
}
